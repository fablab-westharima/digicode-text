# Rule: Dead Code Removal — Pre-grep, Import Chains, Sunset Dates

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★
**Scope:** common
**Last reviewed:** 2026-04-26
**Related cases:** BUG-006/010/013/016/018 (Phase 4 dead-code phase, -347 lines), BUG-022 (OTTO migration sunset 2027-04-21), BUG-029 (33 orphan blocks, -2186 lines), BUG-035 (mobile residue + EditorToolbar.tsx caller-zero, -488 lines)

---

## TL;DR

1. **Before deleting: caller-chain grep to leaf.** Don't trust import statements alone. Confirm the importer is also reached from a real entry point.
2. **Migration / shim code MUST have a sunset date** in the comment when written. No sunset = it lives forever.
3. **`@ts-ignore` → `@ts-expect-error`.** When the underlying issue resolves, the directive becomes an error → forces cleanup.
4. **Cascade deletions are normal.** When you delete a 280-line component, expect 25+ ESLint `no-unused-vars` to follow. Process them in the same commit.
5. **Caller-zero detection** finds dead files: `grep -rn "<name>" src/ | grep -v "<name>\.tsx"`. EditorToolbar.tsx hid for 6 months at 229 lines.

---

## Why this exists

- **BUG-013**: AI client `generate()` method had a comment saying "delete in S3 when AIAssistantPanel migrates" — S3 shipped, comment stayed, method stayed. 10 lines × 2 clients × associated interface = dead surface for weeks.
- **BUG-022**: OTTO localStorage migration code had no removal trigger. Without a sunset date, it would have lived in the codebase forever as residue. Decision: comment with `sunset: 2027-04-21` and a removal procedure.
- **BUG-029**: 33 dead orphan blocks accumulated through BP1–BP7 phases of block additions. Each replacement added a new block but didn't delete the old one. Total residue: ~1000 lines + bundle weight + developer confusion.
- **BUG-035**: Mobile residue from a half-year-old experiment. **EditorToolbar.tsx (229 lines) had caller count = 0** — pure forgotten code. Bug file said "100+ lines"; reality was 488 lines after caller-chain analysis.

Pattern: dead code is rarely visible because each generation thought "someone else needs it." Active audits, not passive vigilance, find it.

---

## When to apply

- Deleting any code (always read this first).
- Adding migration / shim / compat code (always — set sunset date now).
- Reviewing a Phase that includes dead-code cleanup.
- `grep` reveals an unused symbol — before assuming it's needed.

---

## How to apply

### Caller-chain grep (the canonical move)

```bash
# Step 1: direct importers of the symbol
grep -rn "<name>" src/ esp32-blockly-backend/src/ scripts/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "<name>\.tsx"           # exclude the file itself

# Step 2: for each importer file, check if IT is reached
for importer in <list>; do
  grep -rn "from.*$(basename $importer .tsx)" src/
done

# Step 3: continue until you reach App.tsx, index.ts, a test, or a route
```

If the chain terminates without reaching an entry point → the entire chain is dead. Add to deletion scope (with user confirmation per `common/12-collaboration.md`).

### Caller-zero detection (the EditorToolbar.tsx pattern)

```bash
# Find dead React components
for f in $(find variants/ota/frontend/src/components -name "*.tsx"); do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "<$name\b\|from.*$name" variants/ota/frontend/src/ | grep -v "$f" | wc -l)
  [ "$count" = "0" ] && echo "DEAD: $f"
done
```

Add this to your Phase-start grep recipes when working in dead-code-prone areas.

### Cascade deletion (expected, not a bug)

When you delete `MobileToolbarControls` (284 lines), expect ESLint to surface:
- ~10 `lucide-react` icon imports → remove
- ~6 dropdown-menu imports → remove
- ~4 destructured Zustand store fields → remove
- The user / state / dispatcher hooks they used → may also become unused

Process them all in the **same commit**. Don't leave the cascade as "follow-up." (Real case: Phase 4 commit `ad9819b` net -347 lines after a 284-line component delete.)

### Dead code is not evidence that a feature exists

Dead code's second cost is not the bytes — it is that a later session reads it as proof and recommends the wrong thing.

- "It is in the code" is not "it is on the screen". Any claim about what a UI offers must be backed by the rendered artefact (screenshot, live DOM, actual API response), not by a constant or array in the source.
- Before citing an array/constant as evidence, grep its references. **Zero references means it cannot support a conclusion.**
- Delete it in the session you find it. Leaving it "for later" leaves a loaded gun for the next judgment — this is the measured harm, not a hypothetical one.

(Origin: LaserEditor case 75 — a recommendation to skip adding shapes rested on a `BASIC_STAMPS` array of circle/triangle/square. The array's own comment said it was a deprecated compatibility dummy with zero references; the live UI built its shapes from a directory scan and showed something else entirely. A user screenshot refuted it.)

### Sunset-dated migrations

Every migration / shim / compat code gets a sunset comment:

```typescript
// Bad: bare migration
if ('ottoLeftLeg' in pins) {
  pins.humanoidLeftLeg = pins.ottoLeftLeg;
  delete pins.ottoLeftLeg;
}

// Good: sunset-dated
// sunset: 2027-04-21 (1 year after OTTO elimination 2026-04-21).
//   At sunset: delete this version-8 block, bump version to 9, treat unmigrated state as fresh.
//   Reasoning: 1 year is enough for all active users to open the app at least once.
if (version < 8) {
  if ('ottoLeftLeg' in pins) {
    pins.humanoidLeftLeg = pins.ottoLeftLeg;
    delete pins.ottoLeftLeg;
  }
  // ...
}
```

Record sunset dates in `reference/migration-history.md` so the cleanup gets discovered when the date arrives.

### `@ts-ignore` → `@ts-expect-error`

Always prefer `@ts-expect-error` for transient suppressions:

```typescript
// Bad: silent rot
// @ts-ignore - Chrome 138 PNA
fetch(url, { targetAddressSpace: 'local' });

// Good: self-cleaning
// @ts-expect-error -- Chrome 138+ PNA. Remove when TypeScript adds targetAddressSpace to RequestInit.
fetch(url, { targetAddressSpace: 'local' });
```

When the underlying type ships, `@ts-expect-error` becomes an error, forcing cleanup.

### Pre-deletion checklist

Before `git rm` or removing a function/variable:

- [ ] Caller-chain grep done (see above)
- [ ] No comments / docs / tests reference the symbol meaningfully
- [ ] If it had an i18n key: removed from all 5 locale files
- [ ] If it had a route: removed from router config
- [ ] If it had a Zustand `persist` field: handled by `partialize` (no orphan field)
- [ ] If it had a CSS class: still used elsewhere or removed
- [ ] User confirmed (`common/12-collaboration.md`)
- [ ] Cascade impact estimated (expect more deletions)

---

## Anti-patterns

### ❌ "Import statement says it's used"

```
Bad: file A imports from file B → "B is alive."
Good: B is reachable from a real entry point (App.tsx / route / test / index.ts).
```

(Real case: SerialConnection.tsx imported `useDeviceStore` → grep said "used" → but SerialConnection itself was never imported anywhere. Old-rule-27.)

### ❌ Migration code without sunset

```typescript
// Bad
// localStorage migration for old prop names
if ('oldName' in obj) { ... }

// Good — has sunset + procedure
// sunset: 2027-04-21. Remove at sunset; bump version, treat old state as fresh.
if ('oldName' in obj) { ... }
```

### ❌ "Half-deleted" — code gone, comments stay

```
Bad:
  // OTTO_COLOR was used here, removed in Phase 2
  const HUMANOID_COLOR = '#FFA500';
Good:
  const HUMANOID_COLOR = '#FFA500';
```

The historical reference is the git log, not stale comments.

### ❌ Re-export shims / `// removed` markers

```typescript
// Bad: kept "for backward compatibility"
// types/old.ts
export type { User } from './user';

// Good: delete the shim, fix all import paths to point to ./user.
```

### ❌ "I'll clean up the cascade next Phase"

```
Bad: 284-line delete → 25 ESLint errors → "noted, will fix next time."
Good: 284-line delete + 25 cascade fixes → all in one commit.
```

The user explicitly rejects deferral (memory `investigation_incomplete_assumption`'s precursor).

---

## Concrete grep recipes for DigiCode

```bash
# All Zustand stores' partialize lists
grep -nE "partialize:" variants/ota/frontend/src/stores/*.ts

# All `as any` cast sites
grep -rn "as any\b" variants/ota/frontend/src/ esp32-blockly-backend/src/

# All `@ts-ignore` (should be `@ts-expect-error` per BUG-010)
grep -rn "@ts-ignore" variants/ota/frontend/src/ esp32-blockly-backend/src/

# Orphan i18n keys (in JSON but not in code)
# (currently no audit script; BUG-045 pending)

# Dead orphan blocks
cd variants/ota/frontend && npx tsx scripts/audit-ai-catalog.ts

# OTTO residue (must be 0 outside archive/)
grep -rn "otto\|OTTO\|Otto" \
  --exclude-dir=node_modules \
  --exclude-dir=archive \
  --exclude-dir=maintenance \
  variants/ esp32-blockly-backend/
```

---

## Related rules

- `common/01-investigation.md` — Step 4 expanded (caller-zero detection)
- `common/03-coding.md` — `@ts-expect-error` rationale
- `common/05-commit-workflow.md` — process cascade in same commit
- `digicode/02-brand-terms.md` — OTTO residue is a special-case dead code
- `reference/migration-history.md` — sunset date registry
