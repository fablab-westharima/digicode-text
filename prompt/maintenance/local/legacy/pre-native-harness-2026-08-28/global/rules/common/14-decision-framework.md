# Rule: Decision Framework — 4-Axis Lenses + 5-Trap Self-Check (NOT a Checklist)

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★ (judgment quality directly drives release quality; misapplying this rule as a checklist is a documented project-level failure mode)
**Scope:** common
**Last reviewed:** 2026-05-09
**Related memory:** `minimum_passing_grade`, `target_users`, `quality_over_tokens`
**Related cases:** judgment-mistakes-history.md case 18 (axis-and-trap checklist trap), case 14 / 16 / 17 cluster (verification-vs-recall failures)

---

## TL;DR

1. **The 4 axes are thinking lenses, not pass/fail criteria.** Their job is to change how you weight a decision, not to be enumerated and checked off.
2. **Severity-label every finding** (🔴 release blocker / 🟡 design impact / 🟢 informational). Flat-listing without severity is prohibited. The label drives the action priority.
3. **The 5 self-check traps are inputs to re-evaluation, not table entries.** "Trap applicable, mitigation documented" while keeping the same recommendation is the case-18 meta-trap — the most dangerous failure mode.
4. **Anchor every difficult judgment to the project lead's verbatim guidance** (in this project: the "passing grade" / target-user definitions). When the framework yields multiple candidate answers, pick the one closest to the verbatim anchor.

---

## Why this exists

Across multiple sessions this project has produced the same family of judgment errors, with different surface symptoms each time:

- A discovery (e.g., "library X has no Y API") was treated as automatically equivalent to "defer Y to polish phase," without weighing it against the project lead's passing-grade anchor.
- A self-check identified "I am applying the scope-confirmation trap" — and then maintained the recommendation anyway with rationalizations like "reduced effort, so OK."
- Axes 1-4 were enumerated in a table with "applicable / not applicable / mitigation documented" cells, with no resulting change in the planned action.
- A strategy reviewer's analysis was mechanically adopted (or mechanically rejected) without grep / source verification.

The common root: the framework was used to **document** a decision instead of **make** one. Producing a table with the right column headings is not the goal — changing the action plan when evidence changes is.

This rule formalizes the framework so that future judgments use it as a thinking aid rather than as an after-the-fact justification template.

---

## When to apply

- About to plan a non-trivial fix / change.
- About to write a design proposal (per `02-design-principles.md`).
- About to declare a finding "out of scope" or "polish phase". **Read `common/17-no-self-imposed-scope.md` §Core first** — this framework tells you how to weigh a deferral, rule 17 tells you whether the deferral is yours to declare at all (usually it is not). Running the axes on a decision that belongs to the user produces a well-reasoned violation.
- Reviewing a strategy reviewer's analysis that recommends deferral / reduction / postponement.
- Self-check at any stage of design or implementation when an axis or trap surfaces.

---

## How to apply

### The 4 axes — as thinking lenses

| # | Axis | Priority class | What this lens makes you ask |
|---|------|----------------|------------------------------|
| 1 | **System stability** (no breaking change to existing artifacts: saved projects, persisted data, public APIs, downstream tooling) | Hardest / never violate | "Does this break something a user already has?" |
| 2 | **Maintainability** (technical-debt accumulation, future-cleanup cost) | High / ROI judgment | "If we ship this, what does the cleanup cost look like, and do we have a written sunset path?" |
| 3 | **Pre-release timing** (harder-to-fix-later vs harder-to-fix-now) | High / ROI judgment | "If we defer this, will the deferral itself become a release blocker?" |
| 4 | **Framework / dependency independence** (ability to absorb upstream changes without forking) | Soft / informative | "Will an upstream upgrade still let this customization survive a mechanical rename?" |

Usage discipline:

1. **Map the decision to one or more axes.** A given finding may touch several.
2. **Read what each touched axis says about priority.** Axis 1 hits escalate immediately. Axis 4 hits inform but rarely block.
3. **Let the priority change the action plan.** If axis 1 is touched, the plan changes — you don't just annotate "axis 1 applicable, noted."

The right output is a concrete priority shift ("escalate to 🔴, must resolve before commit N starts"), not a checked box.

**Success criterion (2026-08-13, 5-series reframe):** the framework has exactly one deliverable — *the recommendation moved, or survived on new evidence*. Producing the axis/trap table is never the deliverable; free-form reasoning that demonstrably re-weighed the decision is preferred over a filled template that changed nothing. Severity labels (below) remain mandatory regardless of form.

### The 5 traps — self-check inputs

| # | Trap | What violation looks like | Defense question |
|---|------|---------------------------|------------------|
| 1 | **Axis absolutization** | Using one axis as the sole reason for a decision, ignoring the others | "Am I treating this single axis as if the others are zero-weight?" |
| 2 | **"Should-be" vs "passing grade" confusion** | Treating ideal architecture as the minimum acceptable bar | "What does *passing grade for the actual users* look like, and is my proposal far above or far below it?" |
| 3 | **Time-axis blindness** | Not considering pre-release vs post-release fix difficulty | "Is this strictly harder to fix after release than before? If yes, why am I deferring?" |
| 4 | **Framework-axis blindness** | Ignoring upstream coupling risks entirely | "If the framework / library is renamed / upgraded next year, what breaks here?" |
| 5 | **Soft-axis absolutization** | Using "framework independence" or "clean architecture" to reject a working solution | "Am I blocking a working answer because it isn't *architecturally pretty*?" |

Each trap maps to a specific defense question. The intent is to surface the bias and re-evaluate, not to file the trap as "noted, mitigated."

### Severity labels — mandatory

Every TQ, finding, risk, or judgment-relevant discovery gets one of:

- 🔴 **Release blocker / commit blocker candidate** — must resolve before the relevant commit starts.
- 🟡 **Design impact** — can resolve during implementation but must be addressed.
- 🟢 **Informational** — no impact on the current commit; record for context.

Flat-listing all findings without these labels is prohibited. The label is what distinguishes "interesting observation" from "stop everything until this is settled."

### Case 18 — the meta-trap of trap recognition without action

This is the single most dangerous failure mode because it looks diligent.

**Pattern:**

1. Self-check identifies "scope-confirmation trap applicable."
2. Author writes "mitigation: applied" in the table.
3. Author keeps the same recommendation and adds: "Reduced scope, so OK." or "Conclusion unchanged, so OK." or "Effort dropped, so OK."

That is not mitigation. Recognition of a trap requires one of:

- **Change the recommendation.** OR
- **Provide new evidence not previously considered** that shows the recommendation survives despite the recognized trap.

What does **not** count as new evidence:

- "Effort estimate decreased."
- "Scope was reduced."
- "Conclusion didn't change."
- "Compliant with rule X."

Those are symptoms of the trap, not its disproof. Real new evidence looks like:

- A grep / source read of code or docs not previously consulted that materially changes the picture.
- A user verbatim statement (the project-lead anchor) that re-anchors the decision.
- Cross-verification by a second independent path (different tool, different agent, different model).

If you cannot produce that kind of evidence, change the recommendation.

### Before iterating on something judged good, write down *what* was good — then treat it as a constraint

Iteration without a preserved definition of the win is the local-fix trap applied to whole-system qualities (visual design, tone, ergonomics). Each round answers the latest note and quietly rebuilds everything else, so quality falls while every individual round looks responsive.

- Name the qualities that made the chosen version work (palette gradation, spacing rhythm, the scarcity of an accent) and pin them as **absolute constraints** in the spec before round 2.
- **Match the size of a correction to the size of the fault.** "Too dark" asks for a middle value, not the opposite extreme; swinging to the far end produces two rejects instead of one.
- **Two consecutive rounds that come back worse mean the method is wrong, not the increment.** Stop iterating and change the method (cross-critique, return to the original).

(Origin: LaserEditor case 84 — a mock was iterated a→b→c, each round faithful to the user's note, and the verdict was "further solo iteration will not evolve this; of all the versions the original candidate is still the best". The sidebar went from "too dark navy" straight to white. The recovery was a cross-critique round that produced a written set of preservation constraints first.)

### Scope and effort estimates are guidelines, not constraints

Estimates exist to plan, not to constrain quality:

- Do **not** skip a verification step because the estimate predicts overrun.
- Do **not** defer necessary work because it falls "outside the planned scope."
- Standard checkpoint triggers (e.g., 1.5x effort overrun) mean **report to user for re-planning**, not **automatically reduce work**.
- When in doubt, ask the user before cutting.

This rule reinforces but does not replace the project's `02-design-principles.md` discipline of "complete the scope or push back on the scope" — never half-finish silently to fit a budget.

### Project-lead anchor — judgment backstop

When the framework yields more than one candidate answer, anchor on the project lead's verbatim guidance for the relevant decision class. In this project:

> **「ヘビーユーザーにとって及第点と思えるレベルで実装したい」**
> — minimum cost for power-users of the integration to say "this is usable." Not perfect. Not minimal. Usable by experts.

Two failure tests against this anchor:

- If a decision makes power-users say "this is unusable" → wrong decision.
- If a decision costs ~10x more than needed for "usable" → also wrong decision.

Other projects will have their own verbatim anchors (target-user definition, "must-have" feature list, regulatory floor, etc.). The pattern generalizes: when in doubt, return to the source-of-truth statement; the framework is a tool to apply that statement, not to replace it.

---

## Anti-patterns

### ❌ The "axis-and-trap" checklist disguise

```
Decision review:
| Axis 1 (stability):       applicable     mitigation: documented
| Axis 2 (maintainability): applicable     mitigation: documented
| Axis 3 (timing):          applicable     mitigation: documented
| Axis 4 (framework iso):   not applicable
| Trap 1 (axis absolute):   not applicable
| Trap 2 (perfection):      not applicable
| Trap 3 (timing blind):    applicable     mitigation: noted
| Trap 4 (framework blind): not applicable
| Trap 5 (soft absolute):   not applicable
✅ all axes / traps reviewed.
Recommendation: unchanged from initial proposal.
```

The recommendation didn't move. The axes and traps did no work. Defense: don't write the table at all unless it changes the recommendation. If it doesn't, surface why ("evidence X confirmed initial proposal survives axis 1 + trap 3 because Y").

### ❌ Flat-list findings without severity

```
Findings from review:
- API X is missing.
- File Y references stale comment.
- Tests Z need refresh.
- Database migration is pending.
- Translation for Spanish is missing.
```

Five findings, no priority guidance. The implementer can't tell which to handle now and which can wait. Defense:

```
- 🔴 API X missing — blocks commit N implementation, must resolve first.
- 🟡 File Y stale comment — fix during commit N+1's natural touch.
- 🟢 Tests Z refresh — informational, not on critical path.
- 🔴 DB migration pending — blocks deploy of any commit touching that table.
- 🟡 Spanish translation — covered by 5-language same-commit invariant in commit N.
```

### ❌ "Reduced scope, so original recommendation OK" (case 18)

```
Initial: "Defer Y to polish phase."
Self-check: "Am I in the scope-confirmation trap? Yes."
Mitigation: "Reduce scope from full Y to minimum-viable Y."
Recommendation: "Defer minimum-viable Y to polish phase."
```

The trap was renamed, not addressed. Defense: re-evaluate against the anchor. "Does deferring even minimum-viable Y leave power-users at 'unusable'? If yes, find a workaround that lands minimum-viable Y in the release."

### ❌ Mechanical adoption of strategy reviewer's verdict

```
Strategy reviewer: "Recommend Phase 2 only, defer Phase 1."
Implementation cold-start: "Adopting strategy reviewer's recommendation."
[No grep, no source read, no own evaluation.]
Two cycles later: user surfaces verbatim direction overruling the deferral.
```

Defense: the strategy reviewer's persistent memory is an asset, but the final judgment requires source-level verification. See `13-session-recovery.md` "Dual-check architecture" for the protocol.

### ❌ Treating a "polish phase" tag as automatic justification

(And before any of the below: a passing framework run is not authority to defer. `common/17-no-self-imposed-scope.md` — surface it as an open decision with the founding use case verbatim, never as the recommended choice.)

```
"This requires N hours, exceeds budget. Tag: polish phase. Done."
```

Polish-phase deferral is a real and useful tool, but only after running the framework. Specifically: did axis 1 (stability), axis 3 (pre vs post-release fix cost), and the project-lead anchor all support the deferral? If not, the polish-phase tag is just a label hiding a case-18 instance.

---

## Related rules

- `judgment-mistakes-history.md` case 18 — the original record of "axis-and-trap as checklist" failure pattern this rule systematizes. Update both this file and case 18 when one changes.
- `13-session-recovery.md` — Step 4 (sanity-check report) feeds severity labels from this rule.
- `02-design-principles.md` — the 10-step pre-implementation checklist where this framework is applied.
- `12-collaboration.md` — design-proposal format includes the `Self-check (judgment-mistakes-history)` section that this rule's 5 traps populate.
- `digicode/13-framework-isolation.md` (this project) — concrete instantiation of axis 4 (framework independence) with project-specific decision rules.

### Sync protocol with project memory

The project-lead anchor section duplicates the verbatim content of `memory:minimum_passing_grade` (and references the target-user statement in `memory:target_users`). The duplication is intentional — this rule is intended to be readable stand-alone. The trade-off is that **when the memory entries are updated, this rule must be updated in the same change**, and vice versa. Reviewers of either file should check the other.

When in doubt about which is the source of truth: rules win (per `rules/README.md`'s "Memory vs Rules" section). The memory entry should be updated to match the rule, not the other way around.
