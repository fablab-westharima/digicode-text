# Rule: Objective Control — PRIMARY_OBJECTIVE, Finding Classification, Stop Responsibility

**Severity:** ★★★★★ (the objective the user gave is the only thing that makes work *work*; an agent that quietly redefines, widens, or outlives it produces defensible-looking effort nobody asked for)
**Scope:** common
**Last reviewed:** 2026-08-25 (Project_Template Phase 4 — established. Origin: a user directive naming five failure modes observed in real implementation work: objective drift after acceptance, RED read as automatic authorization to fix, a harness that never stops while work remains technically possible, adjacent defects self-promoted into current scope, and AI-side decisions taken on scope / acceptance / settled decisions. This repository's own recorded instances: case PT-27, case PT-18, case 42, case 64)
**Related memory:** `wait_for_go`, `minimum_passing_grade`
**Related cases:** `judgment-mistakes-history.md` PT-27 (the user's declared goal was met hours earlier and every report still ended in a GO question), PT-18 (a user-owned gate went red and the conflict was settled alone), PT-9 / PT-8 (rule 17 inverse — the inclusion side), 42 (a GO for investigation self-expanded into a GO for operation), 64 (scope decided unilaterally and disclosed after implementation)

---

## TL;DR

1. **One objective at a time, and the user owns it.** `PRIMARY_OBJECTIVE` is a declared state, not an inference. You do not set it, change it, or replace it with what you believe the user "really" wants.
2. **Acceptance is DONE.** When the acceptance criteria are met, the objective is finished. Additional hardening you thought of is not a continuation — it is a new objective, and it needs the user.
3. **A finding is classified before it is acted on.** BLOCKER / ADJACENT_DEFECT / HARDENING, decided by one question: *does this block acceptance of the current objective?* — never by severity alone.
4. **RED is evidence, not authorization.** A red test, a red gate, a red audit is a finding. Whether it is *this* objective's blocker is a separate judgment.
5. **STOP is a harness duty, not only the user's.** "There is still something technically possible" is not a reason to continue.
6. **Human authority is supreme, and AI consensus is not human approval.** Every lane agreeing that more work is needed changes nothing about who decides.

---

## Why this exists

Two failure directions exist, and this project already had a rule for only one of them.

`common/17-no-self-imposed-scope.md` governs the **narrowing** side: you may not cut parts of the objective the user gave you. It is ★★★★★ because narrowing produces implementations that pass every internal check while leaving the user's actual problem unsolved.

The **widening** side had no rule, and it has been measured here repeatedly:

- **case PT-27** — the user's declared goal was met hours earlier; every subsequent report still ended in a GO question, and the work kept going. Nobody noticed the objective had been satisfied because nothing was watching for satisfaction.
- **case PT-8 / PT-9** — rule 17's inverse, the inclusion side: adjacent material pulled in because it was nearby and defensible, paid for by every future session.
- **case 42** — a GO for investigation expanded on its own into a GO for physical operation. The words the user said were not the words the work assumed.
- **case 64** — a scope decision taken unilaterally and disclosed after implementation. Honest disclosure of a unilateral decision does not convert it into a user decision.
- **case PT-18** — a user-owned gate went red, the conflict with a continue instruction was settled alone instead of returned.

The shape is always the same, and it never feels like drift, because each individual step is defensible: something real was found, fixing it was possible, fixing it was an improvement. What was missing was the question *whose objective is this serving*.

**The two rules meet at one question**, and they must not be read as contradicting each other:

> Does the user's stated objective require this?

**Yes** → rule 17 governs. Cutting it is a violation, whatever it costs.
**No** → this rule governs. Adopting it into the current scope is a violation, however good an idea it is.

**Deferral under this rule is never rule 17's forbidden "out of scope".** Rule 17 forbids scope leaving *invisibly* — a requirement that becomes optional, then absent, with no ruling in between (rule 17 §Step 4.6). Deferral here means **recorded and reported**: a baton row with a status, a trigger and an owner, plus one line in the report to the user. Silence is the violation in both directions.

---

## When to apply

- At the start of any session in which the user states what they want — before planning it.
- The moment any finding appears mid-work (a red test, a defect noticed in passing, an improvement opportunity).
- The moment the acceptance criteria are met.
- Before writing "while I was in there I also…", "since we're here", "this is related, so…".
- Before an attempt on a problem that has already failed once.
- Before opening anything in the handover's settled-decision section.
- When drafting a delegation packet, and when reviewing what comes back (rule 22).

---

## How to apply

### PRIMARY_OBJECTIVE — the contract

The current objective is **current state**, so it has exactly one owner: the project's handover file (`one fact, one canonical owner`). No other document holds a copy — an auto-loaded instruction file may point at it, never restate it.

Its state is one of five, and the set is closed:

```text
PRIMARY_OBJECTIVE states (closed set; the owner is the handover, this rule owns the definitions)
  UNSET     — no objective is current. The user decides what comes next. A valid state, not an error.
  ACTIVE    — an objective is declared and its acceptance criteria are not yet met.
  ACCEPTED  — the acceptance criteria are met. The objective is DONE.
  BLOCKED   — progress requires a decision or an input the session does not hold.
  STOPPED   — work halted for a reason recorded beside the state (budget, repeated no-progress, authority).
```

Who may move it:

| transition | who |
|---|---|
| UNSET → ACTIVE | the **user** (declaring the objective) |
| ACTIVE → ACCEPTED | the **user** (acceptance is a human act; see §Acceptance is DONE) |
| ACTIVE → BLOCKED / STOPPED | the **harness** may set it, and must report it with its reason |
| BLOCKED / STOPPED → ACTIVE | the **user** |
| any → a *different* objective | the **user** |

Three principles hold regardless of state:

1. **One objective.** Subtasks exist; a second top-level objective competing with the first does not.
2. **You do not redefine it.** "The real objective here is probably X" is a question for the user, never a substitution. Restate the objective in the user's own words; if you cannot quote it, you do not yet have it (rule 17 Step 1).
3. **Changing it is a STOP.** Present *reason / impact / proposed new objective* and wait. Do not begin the new one.

### Finding classification

Every finding gets exactly one class, and the class is decided **before** any work on it.

| class | definition | what you may do |
|---|---|---|
| **BLOCKER** | it prevents acceptance of the current objective — an acceptance test fails, the deliverable does not stand up, the current work is unsafe or invalid | address it inside the current scope |
| **ADJACENT_DEFECT** | a genuine problem found during the work that acceptance does not depend on: a neighbouring mechanism's flaw, an unrelated stale statement, an optional cleanup, a defect on a different route, something that will bite later | **record and report.** No promotion into current scope without human GO |
| **HARDENING** | the objective already stands and this would make it stand harder: extra guards, extra mutations, extra parsing, performance, edge cases, "while we're here" | after acceptance: **STOP**. Continue only on an explicit human GO |

### Classification procedure

The first question is not *what is this?* — it is:

> **Does this block acceptance of the PRIMARY_OBJECTIVE?**

1. Read the current objective.
2. Read its acceptance criteria.
3. State the causal link between the finding and those criteria — in a sentence, not a feeling.
4. Classify.
5. Decide the action from the class, not from how interesting the finding is.

**Severity does not classify.** A finding can be 🔴 and still be an ADJACENT_DEFECT: gravity is about consequence, classification is about causal relation to *this* acceptance. Promoting on severity alone is how a two-hour objective becomes a two-day one.

### The ordered decision — the executable form

The sections above define the classes and the duties; **precedence between them lives here and nowhere else**, because an order restated in two places drifts in one of them. The block below is the canonical order, and `scripts/objective-scenarios.py` parses *this file* to evaluate its scenarios — so a clause weakened here goes red in the harness, and a clause weakened only in the harness disagrees with the rule it claims to execute.

```objective-decision
# Ordered decision. The FIRST row whose conditions all hold decides. `*` = any.
# fields: order | conditions (key=value or key>=int, comma-separated) | verdict | authority
1 | conflicts_with_settled_decision=yes                           | STOP_HUMAN_DECISION      | user
2 | objective_state=ACCEPTED, required_by_close_protocol=yes      | ALLOWED_CLOSE_WORK       | harness
3 | objective_state=ACCEPTED                                      | STOP_OBJECTIVE_DONE      | user
4 | no_progress_attempts>=2                                       | SURFACE_NO_PROGRESS      | user
5 | blocks_acceptance=yes, needs_change_outside_current_scope=yes | SCOPE_EXPANSION_GATE     | user
6 | blocks_acceptance=yes                                         | BLOCKER_FIX_IN_SCOPE     | harness
7 | improves_beyond_acceptance=yes                                | HARDENING_STOP_UNLESS_GO | user
8 | *                                                             | ADJACENT_DEFECT_RECORD   | harness
# INVARIANT_KEY: facts that may never appear in any row's conditions, because they may never
# change a verdict. The harness proves this by evaluating each scenario twice, with the fact
# set both ways, and requiring an identical verdict.
INVARIANT_KEY | ai_consensus_for_more_work | agreement among lanes is information, never authority
INVARIANT_KEY | severity                   | gravity creates no causal link to this acceptance
```

Reading the order back in words: a settled-decision conflict stops everything; after acceptance, only the required close work continues; repetition without progress surfaces before more attempts; a blocker that needs to leave the scope is a gate, not an expansion; a blocker inside the scope is fixed; an improvement beyond acceptance waits for a GO; and everything else is an adjacent defect — recorded, reported, not adopted.

### RED is evidence, not authorization

A red test / selftest / audit / verifier result is a **finding**, and it enters the procedure above like any other. Before touching it, answer four questions:

1. Is this red a blocker for the current objective, or a finding beside it?
2. Is the red the *subject's* defect, or the instrument's — a broken fixture, a mutation that never created its condition, a parser that cannot read a correct answer? (cases PT-12, PT-30)
3. Is the fix inside the current scope?
4. Does the fix need a human decision?

"It went red, so I fixed it" is the failure this clause names. The repository's own history contains reds that were correct about a document and wrong about the rule (case PT-29), and reds that were the instrument's fault, not the subject's.

### ATTEMPT_OUTCOME — what an attempt is recorded as

The record of an attempt answers *how did this stand against the objective*, not *what did I do*. One line per major attempt, closed set:

```text
ATTEMPT_OUTCOME: <one of> — <one line>
  advanced             the objective is measurably closer
  satisfied            the acceptance criteria are now met
  blocker              a BLOCKER was found (it is named)
  adjacent             an ADJACENT_DEFECT was found (recorded, not adopted)
  hardening            a HARDENING opportunity was found (not started)
  invalid-measurement  the instrument, not the subject, produced the result
  no-progress          no new evidence and no movement
```

This is not a log format to grow. It exists so that two facts are visible without re-reading the session: **whether the objective moved**, and **how many consecutive attempts produced nothing**.

### Bounded attempts — repetition is a signal, not a strategy

Attempt count, elapsed effort, repeated failures and the consecutive `no-progress` streak are **kept visible**. This rule fixes no hard timeout and no arbitrary numeric budget as a cross-project constant — a threshold nobody derived becomes a correctness gate it was never meant to be.

The soft trigger is the one this project already derived: **2+ failed attempts on the same symptom** is the "直しても直らない" loop (`rules/README.md` decision tree → `reference/whole-system-analysis.md`). At that point:

- stop choosing "try once more" — that is the automatic option, and automatic is what this rule removes;
- switch to whole-system analysis, or surface to the user with what has been tried and what each attempt ruled out.

### Scope expansion gate

When completing the objective genuinely requires going outside the current scope, that is a **STOP with a proposal**, never an expansion you take:

- the proposed expansion, stated concretely;
- **why the current objective cannot be completed without it** — this is the load-bearing part, and it is evidence, not assertion;
- the blocker evidence;
- cost and blast radius;
- the alternative, which is always available: defer, and complete or halt the objective without it;
- your recommended action.

Then wait. Beginning the expanded work before the GO is the same violation as implementing before a GO (rule 12 wait-for-go).

### Stop responsibility

STOP is a duty of the harness / parent agent, not a privilege of the user. Stop and report when **any** of these is true:

- the PRIMARY_OBJECTIVE is ACCEPTED;
- a decision belongs to the user;
- completing the work requires leaving the current scope;
- proceeding requires reopening a settled decision;
- a budget or attempt limit is exceeded;
- attempts repeat with no progress;
- every remaining finding is ADJACENT_DEFECT or HARDENING;
- the phase the user asked for is complete.

> **"There is still something technically possible" is not a reason to continue.** It is always true, in every repository, forever.

### Acceptance is DONE

When the acceptance criteria are met, the objective is finished — at that moment, not after the next improvement.

None of these is a continuation: a mutation you thought of, a guard that could be stronger, an adjacent defect you found, a cleanup, a documentation improvement. Each is a **new** objective. Report, and stop.

**After acceptance:**

| allowed without a new GO | needs an explicit human GO |
|---|---|
| assembling the acceptance evidence | any new feature |
| the regression run the close protocol requires | additional hardening |
| the required commit / push | fixing an unrelated defect |
| the required handover update | further refactoring |
| the formal close itself | an optional extra mutation |
| | a new parser / mechanism |
| | architecture cleanup |

**The close protocol is not scope expansion.** Running the close the project defines — its gates, its regression, its handover rewrite, its commit — is the completion of the accepted objective, not new work bolted onto it. Misclassifying required close work as HARDENING leaves the session unfinished in a different way.

### Human authority

> **Human authority is supreme. AI consensus is not human approval.**

Every lane agreeing — the parent, the delegate, the verifier, a red selftest, a unanimous panel — produces *information*. It never produces authority. A conclusion reached by two models is still a claim submitted to the user.

Reserved to the user, minimally:

- declaring the PRIMARY_OBJECTIVE, and changing it;
- expanding scope;
- changing acceptance criteria;
- accepting the objective;
- making a deferred item current;
- reopening a settled decision;
- any hardening after acceptance;
- moving to the next phase.

### Settled decisions

New evidence that conflicts with a settled decision is a **finding**, not a licence. You do not reopen it alone, and the conflict does not decay into an implicit reopening because the evidence looks strong. Present *conflict / new evidence / the decision impacted / proposed revisit* and STOP.

### Deferral is a baton, and a baton is not a queue

Recording an ADJACENT_DEFECT or HARDENING uses the handover's existing baton grammar — **Status / Trigger / Owner-authority** — and inherits its discipline:

- a baton's existence never authorizes work on it;
- a trigger firing makes an item *actionable*, not *current*; where the owner is the user, the trigger firing still leaves it waiting for them;
- a deferred item that is genuinely required by the current objective was misclassified — re-check it against the classification procedure rather than filing it.

### Harness and worker

This rule is where the parent's non-technical duties come from (rule 22 §Delegation exclusivity). Objective maintenance, scope watch, finding classification, attempt tracking, the STOP judgment and human escalation are **parent duties** — and they are duties *about* the work, which is exactly what makes them different from re-executing the worker's technical scope behind its back. Holding the objective is not shadow execution; running the worker's greps again is.

A worker is not an agent that works indefinitely until a task is complete. It works **inside its delegation packet's scope**. A finding outside that scope is reported back — never adopted, never quietly fixed, never used as grounds to widen the packet from inside.

---

## Anti-patterns

### ❌ The objective was met and the session kept going

```
Bad:
  Acceptance criteria met at 14:00.
  14:10 "while verifying I noticed the neighbouring guard is weaker — strengthening it"
  16:30 "also refactored the fixture loader"
  17:00 "shall I close?"
```

Every step was a real improvement. None of them was the user's objective, and none of them was ever agreed to. (case PT-27.)

### ❌ RED read as an instruction

```
Bad: "selftest went red on B12 → fixing B12" (B12 has nothing to do with the current objective)
Good: "selftest B12 red. Causal link to the current acceptance: none — the check guards a different
       contract. Class: ADJACENT_DEFECT. Recorded as baton #N, not fixed in this session."
```

### ❌ Severity used as a promotion ticket

```
Bad: "🔴 — this is critical, so it is in scope."
```

Severity says how bad it would be. Classification says whether *this* objective's acceptance depends on it. A 🔴 adjacent defect is reported loudly and still not adopted.

### ❌ Consensus laundering

```
Bad: "Both lanes and the verifier agree the extra hardening is necessary → proceeding."
```

Three agreeing claims are one claim with more authors. The user's GO is a different kind of object.

### ❌ Silent deferral

```
Bad: (a defect noticed at 11:00, mentioned to nobody, absent from the handover at close)
```

This is rule 17's failure wearing this rule's clothes. Deferral without a recorded baton and a line in the report is not classification — it is forgetting with extra steps.

### ❌ "We're already in here"

```
Bad: "The file was open anyway, so I also fixed the unrelated stale comment / renamed the variable /
      normalized the table."
```

Proximity is not relevance. The cost of an unrequested change is not the edit — it is the review, the diff noise, and the precedent that the objective's boundary is negotiable by whoever is typing.

---

## Related rules

- `common/17-no-self-imposed-scope.md` — the narrowing side of the same authority. Read both together; the boundary between them is the single question in §Why this exists. Its Step 4.6 (handover mechanics) is what makes deferral under this rule legitimate rather than invisible.
- `common/12-collaboration.md` — wait-for-go, the design-proposal format, and the close blanket-GO exception (a close instruction authorizes the whole close protocol, which is why required close work is not hardening). Its §After-task offers rule — *ending the session is never your offer* — is the mirror image of this rule's STOP duty: when the objective is accepted you say so and stop, and it is still the user who decides what the session does next.
- `common/22-model-orchestration.md` — delegation exclusivity, parent-only duties, packet scope. This rule supplies the objective/scope/stop half of the parent's job.
- `common/14-decision-framework.md` — the 4 axes and the case-18 meta-trap: recognizing "this is scope drift" and continuing anyway is the shape this rule most often fails in.
- `common/04-testing-strategy.md` — §Show the test has detection power and §The instrument must measure the dimension you are judging; both feed the second question in §RED is evidence.
- `common/judgment-mistakes-history.md` — PT-27, PT-18, PT-9, PT-8, 42, 64 are this rule's evidence base; when a new instance is filed, cross-reference it here.
