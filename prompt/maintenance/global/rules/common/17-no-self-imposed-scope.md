# Rule: No Self-Imposed Scope — Always Anchor on the Founding Use Case

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★★ (self-imposed scope is the single most expensive failure pattern in this project's history: it produces implementations that pass all internal checks while leaving the user's actual problem unsolved)
**Scope:** common
**Last reviewed:** 2026-08-16 (Project_Template S004 — added Step 4.6 Handover mechanics, the third variant: scope leaving through the overwritten handover, with no sentence anywhere saying it was cut; origin LaserEditor S021. 前 review 2026-07-30: LaserEditor S004 — appended the post-hoc-disclosure variant, case 64 (LaserEditor の起票番号は 69 — 収穫時に振り直された): deciding scope unilaterally and *disclosing after implementation* is still a rule-17 violation; "実装後でも追加可能です" is the tell. 前 review 2026-05-24: Session 138 — established after Servo Speed Dialog Phase 1-5 delivered four sessions of work that did not solve the founding use case because Humanoid/Wheel/Transform integration was self-scoped out)
**Related memory:** `minimum_passing_grade`, `target_users`, `wait_for_go`
**Related cases:** `judgment-mistakes-history.md` case 18 (axis-and-trap as checklist) and the case 22 candidate (founding-use-case-unmet scope discipline, Session 138)

---

## Core (mandatory read)

> Everything below this section is **conditional** — opened when a trigger below fires, not every session (README §Writing for the reader, principle 5).

### TL;DR

1. **Do not impose scope on your own initiative when planning, fixing, or investigating.** Self-imposed scope hides whether the founding use case is actually being met.
2. **Always ask: what is the essential problem? What is this implementation/fix/investigation FOR?** Address every domain that touches that essential problem, not only the parts that are technically convenient.
3. **Scope is only valid when the user has explicitly set it.** If the user has not specified a scope, the default is "all related domains." Inclusion is the default; exclusion requires a user decision.
4. **Never present scope as a recommended deferral inside the design proposal.** Surface scope as an open decision with the founding use case stated verbatim, so the user can evaluate whether the proposal actually delivers on its purpose.

User verbatim that produced this rule (2026-05-24):

> 「スコープを捨てろ。スコープが害悪にしかなっていない。」
> ("Throw away scope. Scope has become nothing but harmful.")

### Common antecedents (how self-imposed scope sneaks in)

- **"Scope creep avoidance"** used as a reason to exclude a critical adjacent area. Scope creep is real but refers to features outside the founding use case being added because they are technically nearby. It does not refer to areas **inside** the founding use case being added because they are necessary.
- **"Single-commit cleanliness"** used as a reason to defer integration work. A commit boundary is a revertibility tool, not a feature boundary.
- **"This is a separate task"** used to break apart something that needs to ship together to function. If the parts must ship together for the feature to work, they are one task.
- **"Post-release polish" / "v2 feature" / "polish phase"** used as drift bins for inconvenient work that is actually current-release blocking.
- **"Minimum viable"** used as a justification for shipping something that fails the user's actual minimum acceptance test (`memory:minimum_passing_grade`).

---

### When to apply

- Whenever you draft a design proposal.
- Whenever you write "out of scope" / "post-release polish" / "deferred to follow-up" / "separate task" / "v2 feature" / "polish phase" in a recommendation.
- Whenever a sub-task surfaces a related adjacent area not explicitly mentioned by the user but plausibly required by the founding use case.
- Whenever you find yourself ranking options where the highest-scoring option ships less of the founding use case than another option.
- Whenever an implementation milestone passes internal verification — re-check that the founding use case advanced, not just internal metrics.

---

## Why this exists

DigiCode Session 137 implemented a Servo Speed Dialog with the founding use case explicitly stated by the user: protect the gears of a life-size bipedal humanoid robot whose servos move too fast. The humanoid robot is driven by the `Humanoid` Blockly block, which uses the `DigiCodeHumanoid` external library.

The design proposal scoped Humanoid/Wheel/Transform integration **out** as "post-release polish defer" (Q6=a, presented as the recommended choice). Phases 1-5 then delivered:

- Data model (`speedDegPerSec` field in `pinPresetStore`)
- UI dialog (`ServoSpeedDialog` with global + per-pin overrides, 5-lang i18n)
- C++ generator (initially `_servoMoveAt` blocking helper, later redesigned to `_servoStart` non-blocking FreeRTOS task)
- HelpBot prompt awareness
- Compile-rate vitest CI gate (40 cases, release blocker)

Internal verification passed: typecheck clean, 1517/1517 vitest, 5 audits 0 warnings, R1 invariant preserved, two-servo parallel motion verified in user smoke. **The founding use case was still not met**, because none of the Humanoid block's motion paths route through the new helper — those servos are controlled inside the library via `Oscillator::refresh()`, which bypasses the entire ServoSpeedDialog mechanism.

Four sessions of work, eight commits, full backend rebuild — and the gear-protection problem the feature was named after was still surface-level untouched. The user had to flag this in production after smoke.

The scope decision was the failure. Every other discipline (test, audit, security scan, commit hygiene, design-proposal format) worked correctly. The proposal itself excluded the only target that mattered, and presented that exclusion as the recommended path.

This rule is the structural defense.

---

## How to apply

### Step 1 — Identify the essential problem (verbatim)

Restate the founding use case in the user's own words, quoted verbatim from the original request. No paraphrase. If you cannot quote it, you do not yet understand the task — ask the user to clarify before doing any scoping work.

A paraphrase like "the user wants servo speed control" is not sufficient. The verbatim from the Session 137 origin was specifically about a life-size bipedal humanoid robot whose gears were stripping — the paraphrase "servo speed control" is what allowed the Humanoid block to be excluded.

### Step 2 — Map all related domains

Enumerate every code area, library, dialog, generator, test, sample, and documentation file that touches the founding use case. Do not pre-judge whether each one needs work; that is the next step. The map is exhaustive by default.

For the Session 137 case the map would have included:
- `servoBlocks.ts` `servo_write` generator
- `humanoidBlocks.ts` + `DigiCodeHumanoid` library
- `transformBlocks.ts` + `DigiCodeTransform` library
- `wheelBlocks.ts` + `DigiCodeWheel` library (continuous-rotation servo mode at minimum)
- `motorBlocks.ts` + `stepperBlocks.ts` (related actuator families)
- `pinPresetStore.ts` data model
- `ServoSpeedDialog.tsx` UI

### Step 3 — Justify inclusion or exclusion by user verbatim only

Every mapped domain is included by default unless:

- The user has **explicitly** told you to exclude it ("only X, not Y"), **or**
- It is provably orthogonal to the founding use case, verified by reading code (not by assumption or convenience).

"It would be a lot of work" is not a valid exclusion reason. "It involves an external repo" is not a valid exclusion reason. "It would inflate the commit" is not a valid exclusion reason. Cost-benefit framing is reserved for the user; your job is to surface what would be required for each option, not to pre-select the lower-cost option as a recommendation.

### Step 4 — Surface scope decisions for user approval (not as fait accompli)

Never pre-decide scope and present it as a recommended option in the Decisions table. Instead, present scope as an open question with the founding use case stated:

> "Founding use case (user verbatim): <quote>.
>
> Related domains identified: A, B, C, D.
> - A is in scope (directly stated by the user).
> - B, C, D each have implementation cost + reach-of-founding-use-case implications: <list each>.
>
> Which of B, C, D do you want included? Excluding any of them means the founding use case is met by <degree> only."

This is structurally different from:

> "Q6: B/C/D integration — (a) post-release polish defer / (b) include now / ... — recommend (a)"

In the first form the user can see the founding-use-case-coverage trade-off. In the second form they cannot, because the recommended option (a) is framed as the default and the founding-use-case impact is hidden.

### Step 4.5 — Delegation carries this rule (orchestration, 2026-08-13)

Delegates in every lane (different-vendor lane, Claude subagents — reasoning lanes included: narrowing the *question* is self-scoping too) are bound by this rule but cannot read it. Two duties, both the parent's:

1. **The delegation packet includes the founding use case verbatim** plus the instruction "decisions not covered by this packet are returned as questions, never decided" (rule 22 §Delegation packet). A delegate that quietly narrows scope ("skipped X, seemed out of scope", "can be added later") has produced a rule-17 violation the parent must catch.
2. **Acceptance review checks for silent scope reduction**, not just correctness: diff the returned work against the packet's target list; any dropped item is surfaced to the user as an open decision — the delegate's omission is not a decision, and the parent accepting it silently converts it into a self-imposed scope (the case-69 post-hoc-disclosure variant, one hop removed).

### Step 4.6 — Handover mechanics: the form of the row decides the scope (2026-08-16)

The rule above governs what you *write in a proposal*. Scope also leaves a project through a document nobody experiences as a scope decision: the handover, which is **overwritten** at every close.

**Two prohibitions, both about the shape of a row rather than its content:**

1. **Never restate a settled requirement as a question whose default is exclusion.** A row reading *"include Windows / Linux / Pi / Companion? (default: no)"* has already decided. The default does the deciding and nobody has to sign it — which is the precise inversion of TL;DR 3 (*inclusion is the default; exclusion requires a user decision*). If a requirement genuinely needs a user ruling, the row states the requirement, names who must rule, and **defaults to inclusion**.
2. **A row may not leave §2/§3 unaccounted.** When you overwrite the handover, run `scripts/handover-diff.sh` and classify every removed entry as **done** (name the commit), **dropped by the user** (name the ruling), or **lost** (put it back). Deleting a row is an act; it gets a reason like any other.

**The measured incident (a consumer project, 2026-08-16).** A requirement the user had supplied verbatim left the handover as the question row quoted above; the audit that set the blocker list then ran under the narrowed definition; at the next close the work row was gone. **Nothing in git records a user decision for the exclusion — and the same commit that dropped the row recorded the user's ruling that the excluded targets were official.** Three sessions later a read-only reconciliation had to reconstruct it.

**Why the existing anti-patterns did not catch it.** Every anti-pattern below describes a *sentence somebody writes* — "out of scope", "post-release polish", "v2". Here no such sentence exists at any point. Step 1 is a question, which looks like the opposite of deciding; step 2 is an overwrite, which looks like maintenance. **The tell is not a phrase, it is a shape**: a requirement that becomes optional, then becomes absent, with no ruling in between. Rule 17 lived in a document whose own form permitted the thing rule 17 forbids.

*Enforced: `scripts/handover-diff.sh` + `.claude/commands/close.md` step 3.*

### Step 5 — Re-check at each implementation milestone

After each commit/push/phase, re-verify that the founding use case is **closer to being met**, not just that internal metrics passed. If the milestone advanced typecheck/test/audit/build cleanliness but did not advance the founding use case, surface this gap to the user before continuing.

The Session 137 milestone signal that should have triggered this re-check: Phase 1-5 internal metrics all green, but `humanoid_walk` block's emitted C++ still routes through library-internal `Oscillator::refresh()` which bypasses the new helper. That gap was visible to anyone who read the Humanoid library's `.cpp`, and was the moment to escalate, not to commit.

---

## Anti-patterns

### ❌ Self-deciding "out of scope" and presenting it as the recommended Decisions choice

```
Bad:
  Q6: Humanoid/Wheel/Transform integration —
    (a) post-release polish defer
    (b) include in this redesign
    — recommend (a)
```

The recommendation (a) is the self-imposed scope. The user "confirming" it is not a real decision — they cannot evaluate the founding-use-case impact when the deferral is framed as the recommended choice.

```
Good:
  Q6: This proposal covers servo_write only. The user-stated founding use case
      (humanoid gear protection) is driven through the Humanoid block, which
      does NOT route through servo_write. The proposal as drafted will pass
      all internal verification while leaving the founding use case unsolved.

      Options:
       (a) Expand to cover Humanoid + Transform + Wheel libraries (≈3-4 h
           additional, lib + docker + monorepo phases). Founding use case
           solved.
       (b) Ship servo_write-only first as a deliberate intermediate step.
           Founding use case unsolved until a follow-up.

      Which do you want?
```

### ❌ "Single-commit cleanliness" as a scope-reduction reason

```
Bad:
  "Keeping this as a single atomic commit means we should defer X to follow-up."
```

A commit boundary is not a feature boundary. The shape of the commit graph is a tool for revertibility, not a design constraint. Multi-file, multi-repo commits are valid when the work is one logical change.

If the change spans Phase A (lib) + Phase B (docker) + Phase C (monorepo), all three are part of the feature. Don't ship Phase A only and call it "scope discipline" — that is incomplete shipping, not discipline.

### ❌ "Polish phase" / "post-release" / "v2 feature" as drift bins

These tags are valid tools when the work genuinely belongs to a different release cadence. They become a drift bin when used to push out work that the current release's founding use case requires.

Decision rule: **if the user would call the current release unfit-for-purpose because the work was deferred, the work is part of the current release**, not polish.

Project-lead anchor (`memory:minimum_passing_grade`): "ヘビーユーザーにとって及第点と思えるレベルで実装したい." If a heavy user of the integration would call the deferred state "unusable" or "doesn't actually solve my problem," the deferral is a polish-tag misuse.

### ❌ Letting "scope creep avoidance" override founding-use-case alignment

"Scope creep" refers to features outside the founding use case being added because they are technically nearby. It does not refer to areas **inside** the founding use case being added because they are necessary.

Defense question:

> "Is this area necessary to make the founding use case work?"

If yes, it is not scope creep, it **is** the actual scope. Resisting it is the failure mode.

### ❌ Internal metrics standing in for founding-use-case verification

```
Bad:
  "Phase 5 verification: typecheck 0, vitest 1517/1517, 5 audits 0 warnings,
   R1 invariant verified, two-servo parallel motion confirmed in smoke.
   ✅ Phase 5 complete."
```

Every metric passed, the founding use case was still untouched. Internal metrics measure implementation discipline, not feature-purpose delivery. Add an explicit "founding use case advanced by this milestone?" question to every milestone gate.

```
Good:
  "Phase 5 internal verification: <metrics>. ✅
   Founding use case (humanoid gear protection) status:
     - Humanoid block's emitted C++ routes through library-internal
       Oscillator::refresh(), which does NOT call _servoStart.
     - Therefore Phase 5 does NOT advance the founding use case.
     - Surfacing to user before continuing."
```

---

## Related rules

- `common/24-objective-control.md` — the mirror of this rule. This one forbids **narrowing** the objective the user gave; that one forbids **widening** it — adopting an adjacent defect, continuing after acceptance, or letting a finding promote itself into current scope. Both answer to the same question ("does the user's stated objective require this?") and to the same owner. Deferral that is *recorded and reported* under rule 24 is not the invisible narrowing this rule forbids; silent deferral is, in both directions.
- `common/02-design-principles.md` — the 10-step pre-implementation checklist. Step 8 (risks) and Step 9 (test plan) and Step 10 (design proposal submission) should be re-read with this rule in mind; "scope" defaults that hide in those steps are the most common entry points for self-imposed scope.
- `common/12-collaboration.md` — the design-proposal format's `Decisions for user` table is the most common location where self-imposed scope is laundered into a "user confirmation." See the Anti-patterns above.
- `common/14-decision-framework.md` — case 18 (the meta-trap of axis recognition without action). Self-imposed scope is the most common case-18 instance: you recognize "this excludes the founding use case" as a trap, then maintain the recommendation anyway with cost-framing rationalizations.
- `common/judgment-mistakes-history.md` — Sessions 137-138 case 22 candidate is the source incident for this rule. When case 22 is formalized, this rule and that case must remain in sync.

### Sync protocol with `judgment-mistakes-history.md`

This rule's `Why this exists` section narrates the Session 137-138 incident from the rule-discipline angle. `judgment-mistakes-history.md` case 22 (when formalized) will narrate the same incident from the pattern-recurrence angle. Reviewers of either file should check the other and update both in the same commit when either changes.

---

## Appended incident — LaserEditor S004 (2026-07-30): post-hoc disclosure is NOT a user decision (case 64; LaserEditor 側番号 69)

> Preserved verbatim as a reference lesson, per the origin-case convention at the top of this file. Deployed to all harness projects + Project_Template by explicit user order the same day.

**What happened.** While adding a second AI engine (GPT/codex) to an image-preprocessing feature, Claude decided on its own that the handwriting recipe would be *excluded* from the new engine ("generative redraw contradicts fidelity of a child's own drawing"), implemented that exclusion across backend + 3 UI surfaces, and only then disclosed it in a progress report:

> 「※仕様上の判断 1 件を明示しておきます: 手書きレシピは GPT エンジン対象外にしました(…)。異論があれば実装後でも追加可能です。」

User verbatim response:

> 「私が指示したわけでもないのに、こういう勝手な判断はするべきではない。即刻グローバルルールに明記し、プロジェクトテンプレートほか、全プロジェクトに展開。即修正！」

**Why this is a distinct variant.** The Session 137-138 origin incident laundered self-imposed scope through a *recommended option* in a Decisions table (the user at least saw a choice, framed misleadingly). This variant is heavier: the decision was implemented first and disclosed after, so the user never had a choice at all — a fait accompli wearing a transparency costume. Honest disclosure of a unilateral decision does not convert it into a user decision.

**The three failure components (each independently sufficient to catch):**

1. **A correct technical concern was treated as authority to decide.** The fidelity concern was real — and irrelevant to who owns the decision. Technical concerns are information to attach to options, not grounds to remove options.
2. **"実装後でも追加可能です" / "reversible later" used as an absolution formula.** If you find yourself writing this phrase, you have already located the moment where you should have asked *before* implementing. Treat the phrase itself as a hard stop-and-ask trigger.
3. **Feature-matrix gaps are scope.** Any hole in the capability matrix (engine × recipe, input class × pipeline, entry point × feature) is a scope decision belonging to the user, exactly like the domain map in Step 2-4 above. "This cell of the matrix stays empty" must appear in the pre-implementation Decisions, never only in a completion report.

**Resolution.** The exclusion was removed the same session (the new engine got a non-generative code-execution workflow for handwriting — which also resolved the original fidelity concern, proving the "blocking" concern was attachable information, not a blocker).
