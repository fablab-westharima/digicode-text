# Rule: Investigation — Bug-file is a Lower Bound

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★★ (read on every fix Phase)
**Scope:** common
**Last reviewed:** 2026-04-26
**Related memory:** `investigation_incomplete_assumption`, `quality_over_tokens`, `reactive_vs_systematic`, `regex_extraction_patterns`
**Related cases:** BUG-006/007/009/009b/012/022/029/033/035/039 (10 of 42); Phase 6–B all triggered this rule

---

## TL;DR

1. **Treat every bug file as a lower bound.** Run full-codebase grep before believing the listed `related_files`.
2. **Enumerate all call sites** before designing a fix — never trust 1 reference.
3. **If a single observed bug suggests a pattern, audit the whole pattern** before fixing one instance.
4. After running grep, **report findings in the same Phase**, not as "future work."
5. **A completeness claim is only as good as its denominator** — and a denominator obtained by string-grep is systematically short. See Step 3b.

---

## Why this exists

P4 had 14 fix Phases for 42 bugs. 9 were *secondary discoveries* during the fix itself (Phase 7/8/9/D/C/A/B all hit this). Three concrete examples:

- **BUG-007**: bug file said "`function(block: any)` is the dominant pattern". Reality: 95% were `(Blockly.Msg as any).KEY`. The bug file's hypothesis was completely wrong.
- **BUG-035**: bug file said "100+ lines to delete". Reality: **488 lines** — `EditorToolbar.tsx` (229 lines, **caller count = 0**, half-year-old forgotten residue) was found by grep, not in the bug file at all.
- **BUG-039**: bug file said "minor 1-3 line fix". Reality: **2,235 translations** across 3 languages. The 5-language value comparison revealed `same-as-en = untranslated` for 749 strings/lang.

The pattern: original P0–P2.6 audits (2026-04-23) stopped at "bug exists" without confirming "scope of impact". That confirmation was deferred to fix Phases — and exploded.

User explicitly flagged this on Phase 6 launch: "Stop relying on the handover doc. Pull evidence from public docs / Web yourself." Memory `investigation_incomplete_assumption` was created on the spot.

---

## When to apply

Always, when:
- Starting a Phase or fix task
- Reviewing a `bug-file` with `related_files`
- About to delete code based on grep result
- Touching a state machine, i18n, or shared store
- Upgrading a dependency

Specifically: **before writing the design proposal**, not after.

---

## How to apply

### Step 1 — Read the bug file completely

Don't skim. The "推定原因" (probable cause) and "対処案" (proposed fixes) sections often contain hypotheses that turn out wrong. Mark assumptions you'll need to verify.

### Step 2 — Run codebase-wide grep on all symbols mentioned

Not just `related_files`. Examples of what to grep for:

```bash
# Variable / function / class name
grep -rn "<symbol>" src/ esp32-blockly-backend/src/ scripts/ --include="*.ts" --include="*.tsx"

# i18n key
grep -rn "['\"]<key>['\"]" src/ public/

# Component (find all callers)
grep -rn "<ComponentName>" src/ | grep -v "<ComponentName>\.tsx"

# `as any` / `: any` / `@ts-ignore` cleanup
grep -rn "<pattern>" src/

# Discriminated-union triggers (TS error sources)
grep -rn "c\.json\(.*,.*\)" esp32-blockly-backend/src/ | head -50
```

### Step 3 — Enumerate all matches into a table

| File | Line | Context | Action |
|---|---|---|---|
| ... | ... | ... | modify / delete / leave |

**Don't compress.** All lines should appear before you decide what to fix. If a match looks unrelated, justify in writing.

### Step 3b — The denominator is built, not grepped

Whenever you are about to claim coverage — "all endpoints preserved", "every call site updated", "this already exists", "no references remain" — the number you are comparing against is a *set you constructed*, and constructing it by string search fails in two specific ways. Both were measured; neither announces itself, because a short denominator produces a confident green.

**Indirection hides members of the set.** Calls routed through a helper, wrapper, facade or dispatch table do not contain the string you are grepping for. (Origin: LaserEditor S015 — an old-vs-new endpoint diff came out empty only after the 12 `api.js` helper functions were expanded into the set; a plain string grep silently dropped `API.setPin` and its siblings.) Method: enumerate the indirection layer first, expand each entry to what it actually calls, then union that with the direct hits. If a project has an indirection layer, grepping *through* it is the whole job, not a refinement of it.

**Substring matches invent members of the set.** `grep "README.md"` matches `rules/README.md`; `grep ".toggle"` matches `.toggleClass`. When the question is "does X already exist / is X already covered", a substring hit is not an answer — it is the most common way a false "already handled" reaches a design or a delegation packet. Match the whole token: `grep -w`, `\b` anchors, a full path, or the identifier with its call parens. (Measured twice in Project_Template S002: `grep "README.md"` reported a governance doc as reachable when it was not, and a manual orphan check reported zero orphans when three existed — both inside the session whose subject was reachability.)

**Report the denominator, not just the verdict.** "50 = 50, both directions, set built from 12 helpers + direct hits" is checkable; "all endpoints preserved" is not.

### Step 4 — Check for caller-zero dead files

A common discovery: a file is `import`-ed in some other file, but *that* file is also unused. Run the chain:

```bash
# Step a: find direct importers
grep -rn "from.*ComponentName" src/

# Step b: each importer — is *it* used?
grep -rn "from.*ImporterName" src/
# Repeat until you reach App.tsx / index.ts / a route entry / a test
```

If the chain ends in nothing, **the entire chain is dead code**. Add to deletion scope (with user confirmation).

### Step 5 — Compare bug-file's `related_files` against your findings

| In bug file | Found by grep | Status |
|---|---|---|
| ... | ✓ | listed correctly |
| — | new finding | **scope expansion**, log it |
| ... | not found | bug file stale, verify with file Read |

### Step 3c — If the classification depends on callers, reading the definition is not enough

An inventory is only as good as the question its axis asks. When that axis is a property of *how something is used* — is the exception caught, is the return value checked, is the flag ever read — the answer is not in the definition. It is at every call site, and a survey that reads only definitions produces a confident table that is wrong in a way nobody can see from the table.

- **Enumerate the call sites and read each one** before assigning a class. The count you report is the count of sites examined, not of definitions.
- **Say which axis you used**, so the reader can tell whether it needed caller context.
- **A wrong classification is worse than an incomplete one when the user rules on it.** Scope decisions get made from your table; an error there is laundered into a decision. (Origin: LaserEditor case 98 — an 18-call-site inventory classified one entry as "no catch, therefore class D" from the function body alone. Both of its callers caught it, making it class B. The user had already ruled "fix the D cases first", so the ruling had been asked for on a wrong denominator.)

### Step 5b — Before rejecting the user's own proposal, measure the premise you are rejecting it on

A "that cannot work" verdict against the user's idea has to rest on a measurement, because the cost of being wrong is that you then build a detour they never wanted.

- **Reachability claims are measurable in seconds** — `nc`, `ping`, `tailscale status`, a `curl`. "Different networks, so it cannot reach" is an untested hypothesis in an era of VPNs and tunnels, not a conclusion. Check the infrastructure the project already documents before asserting absence.
- When you return to an area where a user proposal was previously rejected, **re-verify that the rejection still holds** before designing an alternative.
- **Confirm where you are executing from** before planning remote access at all: hostname, the machine's own VPN entry, the working directory's host. (Origin: LaserEditor case 79 — three machines were measured as SSH-unreachable and the user was asked to enable remote login and register keys; the session was running *on* the target machine, so no SSH was needed. Case 70 is the same shape one level up: a Samba proposal was dropped as "unreachable", two detour designs were built, and the user asked "both boxes are on the Tailscale VPN — you didn't know?" It worked on the first try and needed almost no staff setup.)

### Step 6 — Report scope expansion to user before designing fix

If your grep found additional sites, ask the user explicitly:

> "Bug file says scope = X. Grep found Y additional sites: [list]. Proposed Phase scope: A) include all Y / B) defer some to next Phase / C) split into separate BUG. Recommend (A) because [reason]."

This is `wait-for-go` (`common/12-collaboration.md`). Get explicit approval before code changes.

---

## Anti-patterns

### ❌ "The bug file says X, so X is the scope."

```
Bad: bug file says 75 lines → fix 75 lines → done.
Good: bug file says 75 lines → grep all symbols → report 59 callsites + 3 state-machine matches + 3 local function dupes → user confirms → fix all 65 sites + refactor.
```
(Real case: BUG-009b)

### ❌ "I see one occurrence; it must be unique."

```
Bad: grep found 1 cast site → fix it → ship.
Good: grep found 1 cast site → check pattern (`as unknown as Field`) → grep more broadly → find 17 more in other files → fix all in one Phase.
```
(Real case: BUG-007 P-FieldDropdown 17 sites)

### ❌ "The handover doc / CHANGELOG / public spec must be right."

```
Bad: Cloudflare docs don't mention iteration cap → use OWASP-recommended 600,000 → deploy → 2FA users locked out for 5 min.
Good: Before deploying crypto code → search Cloudflare community / GitHub issues → find iteration cap = 100,000 → adjust + verify locally → deploy safely.
```
(Real case: BUG-021 hotfix)

### ❌ "I'll re-grep next Phase."

The user explicitly rejects this. Re-audit during the *current* Phase. The structural cause of P4's 14-Phase explosion was deferring scope confirmation. Don't repeat.

---

## Concrete grep recipes (for DigiCode specifically)

```bash
# Find all i18n hardcoded JP strings
node scripts/audit-i18n.js  # or grep for [ぁ-んァ-ヶー一-龠]

# Find all `c: any` in backend
grep -rn "c: any\b" esp32-blockly-backend/src/

# Find all `as any` cast sites
grep -rn "as any\b" variants/ota/frontend/src/ esp32-blockly-backend/src/

# Find all `@ts-ignore`
grep -rn "@ts-ignore" variants/ota/frontend/src/ esp32-blockly-backend/src/

# Find dead orphan blocks (in any /blocks/**/ but not in toolbox or catalog)
cd variants/ota/frontend && npx tsx scripts/audit-ai-catalog.ts

# Find caller-zero React components
for f in $(ls variants/ota/frontend/src/components/**/*.tsx); do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "<$name\b\|from.*$name" variants/ota/frontend/src/ | grep -v "$f" | wc -l)
  [ "$count" = "0" ] && echo "DEAD: $f"
done
```

---

## Related rules

- `common/02-design-principles.md` — plan before code (Step 6 belongs here)
- `common/06-dead-code-removal.md` — Step 4 expanded
- `common/11-dependency-upgrade.md` — Step 3 specialized for SDK upgrades
- `common/12-collaboration.md` — Step 6's report-back protocol
- `common/19-reference-implementation-survey.md` — same exhaustiveness discipline aimed at a *reference implementation*: survey every same-class item before designing, not every call site before fixing
- `common/18-setting-hw-reflection-integrity.md` — same discipline aimed at a *setting domain*: when one write path is added, audit every other path in that domain
- `digicode/03-block-workflow.md` — DigiCode-specific grep recipes (block catalog)
