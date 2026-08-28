# Rule: Data Validation — Catalog-Driven, Source/Sample/Catalog Triangulation, KNOWN_BROKEN Allowlist

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★
**Scope:** common (originally DigiCode-specific in 36.md, generalized here)
**Last reviewed:** 2026-04-26
**Related memory:** `catalog_driven_validation`, `audit_allowlist_pattern`, `regex_extraction_patterns`, `reactive_vs_systematic`
**Related cases:** Round 3 disaster (2026-04-23), BUG-025/027 (audit limitations + scope), BUG-029 (33 dead orphan blocks)

---

## TL;DR

1. **For data systems with derived artifacts (AI catalog, schema registry, generated code): ship the audit script with the FIRST commit, not later.** Bolting it on after the data is corrupted is a 13-bug cleanup.
2. **Triangulate three sources:** source code ↔ sample/test data ↔ generated artifact. All field names, input names, types must match across all three. Run on every prebuild.
3. **`KNOWN_BROKEN` allowlist** for warnings during a planned rebuild. The allowlist is removed atomically with the rebuild commit so it never silently lapses.
4. **regex extraction must enumerate variants up front.** `FieldDropdown([...])` only ≠ all real call sites. Grep `FieldDropdown(` first, list every parenthesized form, then design.

---

## Why this exists

The Round 3 disaster (2026-04-23) demonstrated the cost of skipping audit:
- AI block catalog had 13 distinct integrity bugs
- Field name mismatches between catalog and source (regex skipped variants)
- Sample XML referenced 5 blocks that didn't exist
- AI was learning broken data 100% of the time
- Production was actively misleading users

Root cause: audit script was scoped to FEW_SHOT subset only. Non-FEW_SHOT samples weren't checked, so they accumulated 13 broken references. Fixing took 3 rounds and a 36.md investigation.

After Round 3:
- `audit-ai-catalog.ts`: validates all 14 samples + tutorial XML against catalog
- `audit-data-consistency.ts`: validates `tutorialsI18n` ↔ `tutorials` ↔ catalog id integrity in 4 locales
- Both run as `prebuild` hook — failed audit blocks the build
- `KNOWN_BROKEN_SAMPLES` / `KNOWN_BROKEN_TUTORIALS` allowlist (`memory:audit_allowlist_pattern`) for in-flight rebuilds

Then BUG-029 (33 dead orphan blocks) and BUG-035 (mobile residue) showed the same pattern in other data domains.

---

## When to apply

- Designing any new data system with generated/derived output (catalog, registry, manifest, sitemap, etc.).
- Adding samples / tests / tutorials that consume the data.
- Rebuilding data (sample sets, tutorial library) — use `KNOWN_BROKEN` allowlist.
- Writing regex to extract anything from source code (Field types, decorators, frontmatter).

---

## How to apply

### Audit script must ship with the first commit

When introducing a derived artifact (e.g., `block-catalog.json` generated from `blocks/**/*.ts`):

1. **Same commit** ships:
   - The generator (`scripts/generate-foo.ts`)
   - The audit (`scripts/audit-foo.ts`)
   - A `prebuild` hook running both

2. The audit must validate at least:
   - **Generated artifact ↔ source** — all field names / input names / types match
   - **Generated artifact ↔ consumer (samples/tests/i18n)** — all references exist in the artifact
   - **Generated artifact internal consistency** — no contradictory shape (e.g., `<value>` connector on a non-output block)

3. Wire `prebuild` so the audit blocks the build:

```jsonc
// package.json
"prebuild": "npm run generate:foo && npx tsx scripts/audit-foo.ts"
```

### Triangulation — what to check

For DigiCode's AI catalog:

```
              source (blocks/**/*.ts)
                /                \
              /                    \
         catalog                  samples / tutorials
   (block-catalog.json)        (sampleProjects.ts, tutorials.ts)
              \                    /
                \                /
              consumed by AI / UI
```

Run all 3 directions:

| Check | Detects |
|---|---|
| catalog → source | catalog has fields/inputs the source doesn't define |
| source → catalog | source has fields/inputs the catalog skipped (regex bug) |
| samples → catalog | samples reference blocks not in catalog (broken samples) |

Plus invariants like:
- `<value>` connector implies `hasOutput: true` on the connected block
- Mutation slots match `<mutation>` attrs
- Dropdown values are in the dropdown options list (not free text)

### KNOWN_BROKEN allowlist (managed brokenness)

When a rebuild is planned but not yet shipped:

```typescript
// scripts/audit-foo.ts
const KNOWN_BROKEN = new Set([
  'sample-id-A', 'tutorial-id-B', // resolve in 37.md rebuild
]);

for (const sample of allSamples) {
  if (issues.length > 0) {
    if (KNOWN_BROKEN.has(sample.id)) {
      console.warn(`⚠️  [KNOWN_BROKEN] ${sample.id}: ${issues.join(', ')}`);
    } else {
      hasErrors = true; // build fails for non-allowlisted issues
      console.error(`❌ ${sample.id}: ${issues.join(', ')}`);
    }
  }
}
```

**Rules for allowlist:**

1. **Rebuild commit removes the allowlist atomically.** No "I'll clean it up next Phase" — remove in same commit so unmissed-rebuild bugs auto-fail.
2. **Each allowlist entry has a tracker** — link to the rebuild plan ID in the comment.
3. **Allowlist growth is a signal.** If you find yourself adding entries, the rebuild is overdue. Re-evaluate.
4. **Document in `修正済みバグ/index.md`'s "next periodic cleanup" section** so allowlist removal isn't forgotten.

(Real case: B Phase commit `e4860ae` removed `KNOWN_BROKEN_SAMPLES` and `KNOWN_BROKEN_TUTORIALS` along with the rebuilds in one commit.)

### Regex extraction — enumerate variants up front

Before writing a regex to extract patterns from source:

```bash
# Find every call to the API you're extracting
grep -rn "FieldDropdown(" variants/ota/frontend/src/blocks/

# List every parenthesized form
# - FieldDropdown([['label', 'value'], ...])
# - FieldDropdown(funcRef)
# - FieldDropdown(CONSTANT_REF)
# - FieldDropdown(opts as any)
# - FieldDropdown([...]) with multi-line array
```

Build a coverage table:

| Variant | Sample | Regex handles it? |
|---|---|---|
| inline array | `[['A','a']]` | ✅ |
| function ref | `getEyeOptions` | ❌ → 11 fields skipped |
| constant ref | `EYE_OPTIONS` | ❌ |
| `as any` cast | `[...] as any` | ❌ |
| multi-line | `[\n  [...],\n]` | ❌ |

(Real case: Round 3 regex caught only the inline array form; 9 blocks / 11 fields were silently dropped from the catalog. Caused BUG-014/BUG-026.)

Implement the regex with the broadest match first, then narrow internally:

```typescript
// Greedy outer capture, narrow inner
const dropdownRegex = /FieldDropdown\((.+?)\)(?:\s+as\s+[^,]+)?/g;
// Then dispatch on the captured form (array vs identifier vs cast vs ...)
```

After implementing, audit-test with `hits == known_call_sites`:

```bash
expected=$(grep -c "FieldDropdown(" variants/ota/frontend/src/blocks/**/*.ts | awk -F: '{sum += $2} END {print sum}')
actual=$(node scripts/audit-foo.ts | grep "FieldDropdown matched" | wc -l)
[ "$expected" = "$actual" ] || echo "FAIL: regex missed $((expected - actual)) sites"
```

(Phase 9 副次発見: existing catalog regex didn't handle `as unknown as Field` — 1 dropdown silently dropped. Same regex pattern applied to `audit-ai-catalog.ts` had to be widened with `(?:\s+as\s+[^,]+?)?` in the same Phase.)

---

## Anti-patterns

### ❌ "Looks reasonable, ship it" without audit

```
Bad: generated catalog passes the eye test → ship.
Good: generated catalog passes triangulation audit (source ↔ samples ↔ artifact) → ship.
```

### ❌ Audit scoped to subset

```
Bad: validate FEW_SHOT samples only (7 of 14).
Good: validate ALL samples; warn on any with `KNOWN_BROKEN` allowlist; error on others.
```

(Round 3 mistake — caused BUG-026.)

### ❌ Allowlist without removal trigger

```
Bad: KNOWN_BROKEN entries grow over time, no one removes them, "warning" rate creeps up.
Good: each entry tagged with rebuild plan ID; rebuild commit deletes the entry atomically.
```

### ❌ Regex without variant enumeration

```
Bad: write regex for the obvious form, ship; later discover 9 blocks missing.
Good: grep all call sites, enumerate variants in a table, design regex per variant, audit `hits == sites`.
```

---

## Concrete tools available in DigiCode

```bash
# AI block catalog audit
cd variants/ota/frontend && npx tsx scripts/audit-ai-catalog.ts
# Validates: 410 blocks × source/catalog field names; FEW_SHOT + all samples + tutorials

# Data consistency audit
cd variants/ota/frontend && npx tsx scripts/audit-data-consistency.ts
# Validates: tutorialsI18n / sampleProjectsI18n id integrity in 4 locales

# i18n audit
cd /Users/ohahiso/github_project/DigiCode && node scripts/audit-i18n.js
# Validates: 5 locale key parity, dvMismatch, hardcoded JP detection

# All gated by prebuild hook (variants/ota/frontend/package.json):
# "prebuild": "npm run generate:ai-catalog && npx tsx scripts/audit-ai-catalog.ts && npx tsx scripts/audit-data-consistency.ts"
```

---

## Related rules

- `common/01-investigation.md` — Step 3 (full enumeration)
- `common/06-dead-code-removal.md` — orphan block detection is a special case
- `digicode/03-block-workflow.md` — block-add workflow includes audit run
- `digicode/10-frontend-state.md` — DigiCode-specific data quality patterns
- `reference/known-pitfalls.md` — regex variant traps from Round 3
