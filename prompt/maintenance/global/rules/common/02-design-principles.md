# Rule: Design Principles — Plan Before Code

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★★
**Scope:** common
**Last reviewed:** 2026-05-15 (Session 120 — added §「Maximum-effort hole closure + mechanical exhaustiveness + periodic re-audit at AI capability upgrades」, see DigiCode Session 120 case 19 axis 2 audit where v3 → v4 → v5 grep classifier iteration found 30 → 39 → 34 sites)
**Related memory:** `wait_for_go`, `quality_over_tokens`, `reactive_vs_systematic`
**Related cases:** old-rule-32 (2026-04-14 incident), Phase B Part 2 (Phase C Step 5/5.5/6 incidents), DigiCode Session 117-120 (4-session 連続「cluster 完成」誤報 trauma → 機械的網羅性担保 protocol 確立)

---

## TL;DR

1. **Never start coding with "the skeleton is settled, I'll figure out the details while implementing."** That phrase is forbidden.
2. Complete a 10-step pre-implementation checklist (below). Submit a design proposal. Wait for the user's explicit "go ahead." Then code.
3. Don't add features, refactor surrounding code, or build for hypothetical futures. **Three similar lines beats a premature abstraction.** No half-finished implementations.
4. Don't add error handling / fallbacks for cases that can't happen. Trust internal code and framework guarantees. Validate only at system boundaries (user input, external APIs).
5. **Close holes at the highest capability your routing profile authorises for that target, at each checkpoint; don't release until all holes are closed.** Going above that target's baseline is an authorised escalation with evidence, never a habit (rule 22 §Routing decision). Manual eyeball review is insufficient — adversaries also use AI to find holes, so the defender must establish mechanical-exhaustiveness guarantees (grep classifier + post-fix re-run = 0 residual). Re-audit periodically as AI capabilities upgrade (each new Claude model generation, new tooling).

---

## Why this exists

Multiple historical breakages from "implement-while-thinking":
- **2025-12-28 cache-system overhaul:** plan revised **6 times** during execution because dependency analysis was deferred. → Rules 27/28.
- **Phase B Part 2 (2026-04-11):** proposed backend auth proxy without reading existing code; investigation later revealed `compile-usage.ts` plan-judgment bug. Plan completely re-scoped.
- **Phase C Step 5 (2026-04-12):** spec said "student download flow"; Claude declared "complete" without implementing the student side. Discovered 2 days later, fixed as Step 5.5.
- **Phase C Step 6:** added a button to `DesktopToolbarControls` — but `LinearToolbar` was the actual rendered component. Dead-code masquerade.

Common root cause: starting code without the 10-step checklist. → Rule 32 (2026-04-14).
- **45.md Phase 1 (2026-04-29):** Docker image for compile server built without a build-time warmup primer → first container compile exceeded COMPILE_TIMEOUT_MS (PIO framework lazy DL ~600 MB + lib tarballs DL ~200 MB + initial compile > 180 s). Fixed by adding `warmup-pio.ts` as a `RUN` step in Dockerfile. Lesson: any Docker image that relies on large runtime downloads must include a build-time primer to pre-populate caches. The primer's compile success is irrelevant — the download step is what matters.

---

## When to apply

Always, before writing or editing code:
- New features
- Existing feature changes
- DB schema changes
- Refactors
- UI changes (yes — including button placement)
- Phase kickoffs

---

## How to apply: design-proposal evidence requirements ("the 10-step", outcome form)

> **2026-08-13 reframe (5-series review, plan 01):** these ten items are **outcomes the design proposal must demonstrate with evidence**, not a sequence to execute in order. Choose your own path through them; skip nothing silently. Each item is either demonstrated (file:line cites, grep output, schema reads, a table) or explicitly labeled `[未確認]` with a reason the user can veto. The historical "Step N" numbering is kept because other rules cross-reference it. What has NOT loosened: the gate at the end — submit the proposal, **then** wait for "implementation start" from the user.

### Step 1 — Read every line of files you'll change
- No skimming. Use `offset/limit` to cover whole file.
- Record exact function signatures, type definitions.

### Step 2 — Read all source/reference files (copy origins)
- New code should mostly be derived from existing patterns.
- Identify line numbers of patterns you're following.
- For deviations, document why.

### Step 3 — Verify DB schema directly
- Read migration SQL.
- Confirm production state of D1 / ML30 (run `wrangler d1 execute` if needed).
- Check existing columns / indexes / FK / NULL constraints.
- Decide: migration needed or not?

### Step 4 — Trace authorization paths
- For each endpoint touched: what does `c.get('user')` return?
- Middleware order, what `c.set` puts in context.
- Scope of `requirePlan` / `adminMiddleware`.
- Decide which middleware applies to new routes.
- Honor old-rule-J (do not put `requirePlan` on submissions routes).

### Step 5 — Trace dependencies to the leaf (`common/01-investigation.md`)
- `grep` real usage.
- Don't trust import statements alone.
- Don't be fooled by unused code (the DesktopToolbarControls trap).
- For UI: check what is actually rendered.

### Step 6 — Build a change-order dependency graph
- List file changes leaf → root.
- Order to avoid build/type errors at intermediate states.
- Include deploy order (e.g., ML30 first → Workers → frontend).

### Step 7 — Cross-check against decisions in docs
- Compare to spec docs (15.md, 35.md, etc.).
- Don't be pulled by code structure (old-lesson F).
- Don't shortcut "DB has the column → put it in UI."

### Step 8 — Document risks and mitigations
- Failure modes per change.
- Auth bugs / info-leak potential.
- Regressions in adjacent features.
- ML30 down-time impact.
- Mitigations designed up front.

### Step 9 — Write production-acceptance scenarios
- Test items defined before implementation.
- Happy path + failure path + boundary (other-user access, etc.).
- old-lesson M: production verification is mandatory; local build success ≠ done.

### Step 10 — Submit design proposal
- Compress steps 1–9 into a review document.
- Include concrete SQL / function signatures / diff sketch.
- Get user agreement.
- Wait for "implementation start" — explicit go-ahead.

---

## Maximum-effort hole closure + mechanical exhaustiveness + periodic re-audit

This section formalizes the discipline that emerged from repeated "claim of completeness disproven in the next session" incidents (DigiCode Sessions 115-120: five consecutive `cluster 完成` claims, each disproven by the next session's cold-start re-audit). The defense is structural, not motivational — relying on the next session's reviewer to catch the previous session's miss is unsustainable.

### Principle

**At each checkpoint during implementation, run audits at the highest capability the project's routing profile authorises for that target — never below it, and above baseline only as an authorised escalation (rule 22 §Routing decision). Do not release until all known-class holes are mechanically verified as closed.** Manual eyeball review of grep output is insufficient — adversaries also use AI to enumerate weaknesses, so the defender must operate at parity-or-above. Periodic re-audit as AI capability upgrades (model version bumps, new tooling) is mandatory because the bar moves on both sides.

### When to apply

- Before any commit that is part of a release-pre milestone (audit cluster, security-class fix, anti-enum cluster, etc.).
- Whenever the work touches a cluster that has previously had "completion claims disproven" (case 19 axis 1/2 in DigiCode is the canonical example).
- After every meaningful Claude model generation change — re-audit the same code with the new model to find what the old model missed.
- When the project hits a quiet period (no active feature work) — use the idle window for a fresh re-audit, not for adding speculative features.

### How to apply

1. **A release-blocking audit is an escalation candidate — and it is routed like one.** Running such an audit above the baseline reasoning effort is legitimate, and it is a **routing decision**, not a habit: it needs an authorised reason (`FALSIFICATION_RISK` — the audit exists to attack a completeness claim) plus evidence tied to this audit, and the target's profile decides whether its effort may move at all (`rule 22 §Routing decision`). **This rule names no effort value.** It used to name one, which made a consumer's setting into a common-layer constant and told every session to self-upgrade without authority — the exact shape §No autonomous self-upgrade forbids. Record the effort actually used in the audit's commit message, so a later session can see whether it was silently downgraded.

2. **Mechanical exhaustiveness, not eyeball coverage.** For any "find all instances of pattern X" task:
   - Build a programmatic classifier (grep + AST parser + statement-boundary aware tokenizer) that enumerates all candidate sites.
   - Iterate the classifier until known-true-positive sites are all captured and known-false-positive sites are all excluded. Document the iteration trail (DigiCode Session 120 case 19 axis 2: v3 30 sites → v4 39 sites (5 false positives) → v5 34 sites confirmed; the iteration trail itself is the audit evidence).
   - **Post-fix re-run**: after applying fixes, run the same classifier against the new state and confirm zero residuals. This is the mechanical proof of closure — claim-of-completeness without the post-fix re-run is not closure.

3. **Don't release until all holes are closed.** "Release-pre polish defer" is a legitimate category **whose boundary the user draws, not you** (`common/17-no-self-imposed-scope.md` §Core — inclusion is the default; exclusion requires a user decision). Where the boundary is genuinely yours to defend, defend it adversarially: would an attacker with current AI tooling find the deferred item? If yes, it is not polish.

4. **Periodic re-audit at AI capability upgrades.** When a new model release lands (or a new audit tool ships):
   - Re-run the same cluster classifiers against the new model's outputs.
   - Compare the new model's findings against the prior-model baseline. Differences are findings of either (a) prior-model misses or (b) new-model hallucinations — both warrant investigation.
   - Treat this re-audit cadence as part of the project's normal maintenance, not an optional polish. The adversary side does this automatically (new AI = new attack surface enumeration); the defender must match the cadence.

5. **Save the classifier as a project artifact.** Mechanical classifiers built for one audit are reusable for future re-audits. Persist them in the project (script + intermediate TSV / JSON outputs) so the next session can diff against the baseline without rebuilding from scratch.

### Anti-pattern — completion-claim without mechanical proof

```
Bad pattern (DigiCode Sessions 115-119, 5 consecutive iterations):

  Session N audit: "Found 4 sites of pattern X in cluster C. Fixed all 4.
                   Cluster C is complete."
  Session N+1 cold-start re-audit: "Found 14 additional sites of pattern X
                   in cluster C. Session N claim was inaccurate."

Why bad:
  Session N's "complete" was based on manual eyeball review of grep output
  ("I looked at the grep, looks like 4 sites"). The next session ran a
  more rigorous classifier and found 14 more sites. The previous claim
  was not lied — it was structurally unsustainable.

Good pattern (DigiCode Session 120):
  Session 120 audit: "Built v5 grep classifier (statement-boundary aware
                      tokenizer in Python). Mechanical enumeration: 749
                      total assignments, 34 literal-key UNGUARDED + value
                      field-dep. Applied first-wins guard to all 34. Re-
                      ran classifier post-fix: 0 residuals. Cluster has
                      mechanical proof of closure for this pattern class.

                      Other pattern classes (67 fieldDep-key, post-release
                      polish) remain out of scope and are explicitly
                      labeled — not claimed as 'complete'."
```

### Anti-pattern — "this model can't have missed it"

```
Bad: "I used max effort on the current model, so the audit is complete.
      No need to re-run when the next model generation lands."

Why bad:
  Each model generation finds different classes of holes. The adversary side
  upgrades automatically; the defender must too. Tying audit-completeness
  to a frozen model generation creates a slow-rotting defense.

Good: "The current model's max audit found 34 sites in this cluster. When
       the next generation lands, re-run the same classifier and compare.
       Diff investigation is normal maintenance, not a sign the prior model
       was 'wrong'."
```

### Sync with rule 16

This section's principle overlaps with `rule 16-attacker-perspective-defense.md` from the implementation-discipline side. The two rules cross-reference each other:

- **Rule 02 (this rule)**: "How to build/audit/release without leaving exploitable holes" — process discipline.
- **Rule 16**: "Why minimizing disclosure / surface is the defense, even when transparency feels professional" — content discipline.

When the work touches a release-pre security-class cluster, read both rules.

---

## Anti-patterns

### ❌ Forbidden phrases (these get pushed back)

- "The skeleton is settled, I'll figure out details while implementing."
- "Should be fine."
- "Probably it's used somewhere."
- "Let me skip the read to save tokens."
- "I confirmed it works locally" (without commit + production check).
- "It built successfully" (= done).

### ❌ Building for hypothetical futures (YAGNI)

```typescript
// Bad: future-proofing nobody asked for
interface UserPreferences {
  theme: 'light' | 'dark';
  // future: timezone, locale, notification preferences
  preferences?: Record<string, unknown>; // open-ended for "future expansion"
}

// Good: only what's needed now
interface UserPreferences {
  theme: 'light' | 'dark';
}
```

### ❌ Defensive code for impossible inputs

```typescript
// Bad: validating an internal call site
function setUserPlan(userId: number, plan: PlanType) {
  if (!userId || userId < 0) throw new Error('invalid userId');  // can't happen — TypeScript guarantees
  if (!plan) throw new Error('plan required');                    // can't happen
  ...
}

// Good: trust the type system
function setUserPlan(userId: number, plan: PlanType) {
  ...
}
```

Validate only at boundaries: user input, external API responses.

### ❌ Premature abstraction

```typescript
// Bad: 3 similar lines → extract a helper
const formatA = (x) => `[${x.id}] ${x.name}`;
const formatB = (x) => `[${x.id}] ${x.label}`;
const formatC = (x) => `[${x.id}] ${x.title}`;
// → 0 reuse, just adds indirection
function formatItem<T>(item: T, getLabel: (t: T) => string): string {
  return `[${(item as any).id}] ${getLabel(item)}`;
}

// Good: keep the 3 lines as-is until a 4th case actually arrives
```

### ❌ Half-finished work

Don't leave TODOs in shipped code. Don't merge "the rest comes next Phase" unless explicitly negotiated and tracked. Either complete the scope or push back on the scope.

---

## Related rules

- `common/01-investigation.md` (Step 5 expanded)
- `common/05-commit-workflow.md` (atomic-ness preserves "complete or not")
- `common/12-collaboration.md` (the `wait-for-go` part)
- `common/11-dependency-upgrade.md` (Step 3 specialized for SDK upgrades)
- `common/16-attacker-perspective-defense.md` (content side of the same defense — minimize what gets published; both rules together cover the audit + release discipline against AI-equipped adversaries)
- `common/judgment-mistakes-history.md` case 18 / case 19 cluster (concrete failure history that motivated the mechanical-exhaustiveness + periodic-re-audit discipline)
