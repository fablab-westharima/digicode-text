# Rule: Model Orchestration — Parent-Led Multi-Model Development

> **Origin: Project_Template (2026-08).** Established from the 2026-08-13 orchestration review (plan `local/plans/active/01_orchestration-rules-review.md`): official-capability verification, third-party tool survey, and the cross-model review-asymmetry evidence are recorded there. The environment-prerequisites section is deliberately time-sensitive and user-specific — re-verify it on adoption; the discipline sections above it are transferable.

**Severity:** ★★★★ (a mis-run orchestration multiplies every existing failure mode across lanes: unverified claims get transcribed, scope decisions leak to delegates, and incidents in delegated work never get filed)
**Scope:** common
**Last reviewed:** 2026-08-20 (LaserEditor S034 experimentally PASSED Harness / Worker structure: delegation exclusivity, bounded deliverable review, `DELEGATED_SCOPE_ACTIVE`, packet / RESULT CAPSULE contracts, Codex A/B route, parent-reproduction exceptions, and delegated failure diagnosis; shadow-audit v2 guards the measured transcript boundary. 前 review 2026-08-18: Relay machinery per user directive PT-relay-directive: `SESSION_ROLE` (`PRIMARY` / `REVIEWER`, undeclared = `PRIMARY`) + §Review-report baton (`local/reviews/`, committed; five required sections; 16.md baton row; next-PRIMARY read duty) — verifier/executor/transition-executor separation from the S005 audit applied at session scale; enforced by selftest B30/B31. Same day, earlier: Session-mode machinery per user directive: `PRIMARY_MODEL_MODE` (`T1-solo` / `T1-conserve` / `non-T1`, tier-named, roster-mapped; undeclared = `T1-solo`) + route-line delegation-consideration record for scale-eligible tasks; enforced by selftest B26. 前 review 2026-08-17: Stage 1 of the Orchestrator-Role extension, from the user's rulings and the Stage 0 pilot's measurements: authority split into Human-only / orchestrator / executor / integration owner, `AUTHORITY_MODE` and `INTEGRATION_OWNER` header fields, routes A–D with mechanical escalation triggers, lineage/independence labels, plan-review additions (cannot-distinguish re-audit, data-corpus enumeration), worktree base freshness, and the Route C completion-package contract. Earlier same-day: restructured from delegate execution to **Orchestrated Reasoning** — six named lanes, the plan-review round-trip, disagreement handling, success criteria that are not invocation counts, review asymmetry scoped to defect-finding in code. 前 review 2026-08-13: established from the orchestration review)
**Related cases:** arXiv 2607.21656 (cross-model review asymmetry); multi-agent failure taxonomy (spec/design flaws ≈42% of failures); sibling-project lesson "deferred lessons are never written" (fabcanvas 16 sessions / ouen-plus 15+ sessions: 0 deferred case files ever written)

---

## TL;DR

1. **This is Orchestrated Reasoning, not delegate execution.** The shape is *not* "the parent thinks and the delegate writes". Claude and the different-vendor lane reason **independently**, review each other's plans, hypotheses, evidence and interpretations, and the parent integrates. A standard form where the parent decides everything and hands out code is explicitly **not** the default (§Lanes, §Round-trip).
2. **The delegate has six lanes, and implementation is one of them.** `INVESTIGATION` / `INVESTIGATION_PLANNING` / `DESIGN_REVIEW` / `IMPLEMENTATION` / `VERIFICATION` / `FALSIFICATION`. **Every delegation names its lane**, because the authority and the prohibitions differ per lane — "design decisions are already settled upstream" is an IMPLEMENTATION-lane rule and applying it to the others destroys the point of them.
3. **The parent reviews the delegate's *plan*, not only its output — and sends it back.** When the delegate produces an investigation or experiment plan, the parent checks it against §Plan review before any work runs, and returns it for revision when it fails. Round-trips are driven by quality, never by a quota.
4. **Disagreement is a finding, not a nuisance.** When the lanes reach different conclusions, neither is adopted on the spot and it is never a vote: separate premises from evidence from inference, locate the disagreement point, and decide what measurement would settle it (§Disagreement).
5. **Cross-model review is asymmetric *for defect-finding in code*, and only there.** Different-vendor lane implements → Claude primary-reviews (measured +18.1pt). Claude lane implements → Claude-lineage does primary defect-finding; the different-vendor lane is not the primary bug-hunter on Claude-written code (measured harmful: 91.4%→82.8%). **This scoping is narrow on purpose**: it says nothing about plans, hypotheses, experiment validity, evidence sufficiency, instrumentation or interpretation, where the different-vendor lane is actively wanted (§Review protocol).
6. **wait-for-go gates delegation exactly as it gates the parent's own edits**, and every delegation carries a **delegation packet** — vague specs are the #1 measured cause of multi-agent failure.
7. **Authority separates across four roles, not bundled into "the parent"** (§Roles and authority): the Human owns scope, settled decisions and irreversible GO; an ORCHESTRATOR owns decomposition, lane selection, adopt/reject of delegated work and the draft judgment; an EXECUTOR does the work in one of two authority modes (`DELEGATED` / `HUMAN_DIRECT` — modes, not roles); an INTEGRATION OWNER owns commits, handover, case filing, baseline and releases — and validates the evidence contract plus project-wide close gates before anything lands. Which model may hold which role is roster/config, never rule text. An executor **never adopts its own work** in any mode — observed-result reporting yes, self-adoption no. Throughout this rule, "the parent" = the **Harness / Integration Conductor** session holding both the orchestrator and integration-owner roles (the normal case in this harness); where the roles split, read each parent duty against §Roles and authority. A session-level **`PRIMARY_MODEL_MODE`** (`T1-solo` / `T1-conserve` / `non-T1`, Human-declared at session start; undeclared = `T1-solo`) sets the conductor tier and the default work shape (§Session mode), and a session-level **`SESSION_ROLE`** (`PRIMARY` / `REVIEWER`; undeclared = `PRIMARY`) says whether this session acts or verifies the previous session's acting — sessions relay through the repo, and a PRIMARY never declares acceptance of its own deliverables (§Session role, §Review-report baton).
8. **A delegate's config file (AGENTS.md etc.) is a derived cache generated from rules/**, expressing all six lanes. Rules win on conflict; regenerate in the same commit as the rule change.
9. **Success is not measured in invocations.** Fewer wrong judgments, less rework, better experiment design, hidden assumptions found — and specifically: *is the delegate still being used as a typist?* (§Success criteria).

---

## Why this exists

Recorded evidence from the 2026-08-13 review (details + sources in plan 01):

- **Review asymmetry is measured, not assumed.** arXiv 2607.21656 (Opus 4.7 × GPT-5.5): GPT implements → Claude reviews lifted pass rate 71.6%→89.7%; Claude implements → GPT primary review *dropped* it 91.4%→82.8%; Claude solo as writer sat on the Pareto frontier. Naive "always cross-review" advice is wrong. (Model generations differ from ours — the overlap/detection rates are registered measurement items, not settled facts.)
- **Spec/design vagueness is the largest multi-agent failure category (≈42%).** The delegation packet is the primary defense, not an administrative formality.
- **The delegate cannot read this rules directory.** Codex sees only its own AGENTS.md chain plus what the parent passes through MCP; the parent's MCP servers are not forwarded. Conventions must travel via AGENTS.md (standing) + the delegation packet (per-task) — two layers, both parent-maintained.
- **Third-party orchestration UIs churn; official primitives last.** The category-defining kanban tool's company folded in 2026-04; the durable layer is first-party CLIs (subagents, Workflow, worktree isolation) + `codex mcp-server`. Swarm frameworks with disputed benchmarks are excluded.
- **Same-lineage models share blind spots.** At decision points (stuck 2+, direction change, UI/UX), an independent lineage's perspective measurably changes outcomes — that, not defect-hunting on Claude code, is the different-vendor lane's review value.

---

## When to apply

- A session uses (or plans to use) more than one model lane.
- Before the first delegation of a session (pre-flight).
- Reviewing or accepting any delegated work.
- A safety-classifier flag fires on the parent (see §Classifier-flag handling).
- Editing AGENTS.md or any delegate-side config.
- Changing the model roster (user decision — record in settled decisions).

---

## How to apply

### The shape: Orchestrated Reasoning, not delegate execution

The failure this rule now guards against is not "the delegate did it wrong". It is a *shape* that feels correct and quietly wastes the second intelligence:

```
❌ Delegate Execution            ✅ Orchestrated Reasoning
   Claude investigates              Claude defines the problem, purpose, constraints
   Claude designs                   Delegate investigates independently, forms hypotheses,
   Claude fixes the spec              proposes the investigation plan
   Delegate writes the code         Claude reviews THE PLAN — and returns it if it cannot answer
                                      the question that was actually asked
                                    Delegate revises
                                    Delegate / Claude / subagents run it
                                    Claude evaluates the result independently
                                    Falsification round if the conclusion is load-bearing
                                    Claude integrates → Human
```

Both models start from the problem, not from a finished decision. The parent's value is **not** carrying every step itself; it is composing the best judgment out of more than one intelligence, and then owning the integration. "Claude could probably do this alone" is not, by itself, a reason to skip the other lane — the question is whether a second reasoning system raises the quality of *this* judgment (§When to spend the round-trip).

### Lane definitions — the delegation names its lane

Authority and prohibitions differ per lane. **Every delegation prompt opens with `LANE: <name>`**, and the delegate's config defines what that lane may and may not do. The enumerated form exists because a described one does not fire (§Writing for the reader, principle 2): without a named lane, the delegate defaults to the most familiar shape, which is implementation.

| Lane | Question it answers | Delegate may | Delegate may not |
|---|---|---|---|
| `INVESTIGATION` | What is actually true here? | Read the repo, architecture, dependencies, failure evidence, platform differences, specs. Form **competing** hypotheses, name unconfirmed items, say where evidence is missing | Treat the upstream hypothesis as given. Change files |
| `INVESTIGATION_PLANNING` | What would we have to measure to know? | Propose measurements, ordering, controls (positive / negative), falsification conditions, failure criteria, acceptance criteria, needed logs and probes; say which hypotheses the experiment **cannot** separate, and name plausible confounders | Skip the "what this cannot distinguish" part — that section is the deliverable, not a caveat |
| `DESIGN_REVIEW` | Where does this proposal break? | Attack a Claude-produced design or plan: weaknesses, hidden assumptions, failure modes, alternative designs, insufficient evidence, irreversible steps | Return an approval. **Agreement is not the product** — if there is genuinely nothing, say what would have to be true for the design to fail, and how you checked |
| `IMPLEMENTATION` | Build exactly this | Implement the settled scope; survey existing code first; run the named acceptance tests; report observed results with mutation / detection-power evidence | Decide design, widen scope, commit, touch production, report green from assumption |
| `VERIFICATION` | Does the evidence support the claim? | Independently check tests, acceptance criteria, reproducers, regressions, mutation results, measurement validity, instrumentation validity, and the interpretation of results | Act as a "tests passed" confirmer. **The test itself is in scope for doubt** |
| `FALSIFICATION` | How is this wrong? | Attack a load-bearing conclusion: find the explanation, measurement or alternative hypothesis that breaks it | Gather support for the hypothesis. Agreement is a failed falsification round, not a successful one |

**The IMPLEMENTATION lane's premise — "design decisions are already settled upstream" — belongs to that lane only.** Carrying it into INVESTIGATION, INVESTIGATION_PLANNING, DESIGN_REVIEW or FALSIFICATION converts an independent intelligence back into a typist, which is the exact defect this section exists to prevent. *Enforced: selftest B15/B16.*

Claude subagents are lanes too, not a fixed division of labour. "Investigation = subagent, implementation = delegate" is **not** the split; both can investigate. Subagents are best where the value is parallel breadth and a clean context — parallel survey, document sweeps, a second opinion from within the Claude lineage, large-volume organisation. What a subagent cannot supply is a *different* reasoning lineage, which is the whole reason the other vendor's lane exists (§Why this exists).

### Round-trip: the parent reviews the delegate's plan, then sends it back

When a delegation returns a plan — an investigation plan, an experiment design, a proposed acceptance set — **the parent does not adopt it as delivered.**

```
delegate proposal → parent review (§Plan review) → feedback → revised proposal → …
```

Run as many rounds as the quality needs and no more. **A round count is never a target**; one good round beats three ritual ones, and "we did two rounds" is not evidence of anything. Stop when the plan can answer the question that was actually asked, or when the remaining disagreement is the finding (§Disagreement).

### Plan review — what the parent checks before any work runs

Run this against a delegate-produced plan *and* against your own. It is the same list either way, which is the point: a plan the parent wrote gets no discount.

- Does it answer the **user's actual question**, or an adjacent easier one?
- Is the **thing being measured** the thing being judged, or a proxy? If a proxy, in which direction does it diverge? (rule 04 §A gauge reports its unit)
- Can a **conclusion** be drawn from the possible results — including the results nobody wants?
- **Hidden assumptions**: what must be true for this plan to mean anything?
- **Confirmation bias**: is it built to confirm a hypothesis rather than to test it?
- Is there a **control**? A positive control, where "the subject ran at all" is in question? (rule 04 §absence criteria)
- Can it separate **false positive from false negative**?
- Does it avoid reading **"not measured" as "no problem"**? (rule 04 §invariant reporting)
- Is the **failure condition** stated, before the run?
- Is the **comparison** fair — same conditions, same inputs, right baseline?
- For a practicality judgment: are **real usage conditions** present, or only a synthetic path?
- Does it avoid treating **"it started"** as success?
- Can it **rule out the alternative hypothesis**, or only fail to see it?
- Does the packet **enumerate the data actually available** (corpora, logs, repos, time ranges)? An externally-briefed reasoner scopes to what it is told exists — measured: a plan silently halved its corpus because the brief never listed the second one, and the reasoner correctly refused to invent it.
- **Re-audit the "cannot distinguish" list — the returned one too.** A declared impossibility is a claim like any other. Measured twice in one pilot: an ordering question declared indistinguishable was measured in thirty lines from event positions, and a cost-vs-savings question on the list was a two-measurement multiplication.

A plan that fails several of these goes back with the failures named. A plan that fails one may be worth running with that limit written into the acceptance criteria.

### Parallel investigation and disagreement

Where a judgment is expensive to get wrong, give the **same question** to both lineages independently — not the same *task*, the same *question*, with neither told the other's answer.

**When they agree**, confidence rises but is not established: two systems can share a blind spot, and same-lineage agreement (parent + subagent) barely raises it at all.

**When they disagree, that is a signal, not a defect.** Neither answer is adopted on the spot, and it is never settled by majority:

1. List each side's **premises**.
2. Separate **evidence** from **inference** on both sides.
3. Locate the **disagreement point** — usually one premise or one unmeasured fact.
4. Decide whether a **measurement** would settle it.
5. Run it if so; if not, say so and record the fork.
6. The parent **integrates** — and reports the disagreement to the user rather than presenting a smoothed-over answer.

The value of a disagreement is that it usually marks an assumption nobody had written down.

### When to spend the round-trip

Orchestration does not mean running every task through every lane. Do it alone for a typo, an obvious one-line fix, a mechanical change.

Spend the round-trip where **the cost of being wrong is high**: expensive judgments, large rework if wrong, high uncertainty, anything needing an experiment, architecture, multi-platform behaviour, performance evaluation, failure of unknown cause, security or release boundaries, migrations, complex refactors, acceptance design, and "are we sure this conclusion is right?".

### Conductor switching — only the parent role ever moves

| State | Conductor (parent) | Implementation | Test / review / PR | Survey / inventory |
|---|---|---|---|---|
| Normal | primary parent model | different-vendor lane / Claude implementer subagent | parent + fixed-role reviews (below) | Claude surveyor subagent |
| Primary-model budget tight | Human-selected session conductor or route — no automatic fallback | unchanged | unchanged | unchanged |

Only the conductor row ever changes. `fallbackModel` does NOT cover this (it fires on overload/unavailability, not on rate limits or budget) — the switch is manual, and belongs at a task boundary (a mid-session switch re-reads the full history uncached, the one expense you least want while conserving).

#### Reading the budget: two bars, not one (measured 2026-08-14)

Where the plan meters a top-tier model separately, the weekly budget is **nested, not disjoint**: an inner bar for that model and an outer bar for all models. The top-tier model draws down both; other models draw down only the outer one. Measured instance (2026-08-14): inner (top-tier) 87% / outer (all models) 46%.

- **Inner bar high, outer bar slack** → surface the budget state and let the Human choose the session's conductor or route (a manually selected fallback conductor, a Route B/C shape, or stopping). **This rule prescribes no automatic fallback** (the former hard-coded next-in-lineage switch is withdrawn, 2026-08-17). Effort stays where it was.
- **Outer bar high** → this is the state where reasoning effort matters; lower it, and push more work off-platform (the different-vendor lane bills elsewhere).
- **Either bar near its limit** → do not start a delegation round you cannot finish. Where usage credits are capped at zero, the limit is a hard stop, so an over-long round strands a diff mid-review. Size the rounds to end cleanly.
- The single unambiguous saving is the different-vendor lane (separate billing entirely). Moving work between Claude-side lanes reshuffles the same outer bar; moving it off-platform does not. In the budget-tight state, verify at pre-flight that implementation is actually going there and has not quietly fallen back to a Claude subagent.

#### Switching the parent — the delegate lane survives it

Verified 2026-08-14 on this harness's own session: it began on one model, was switched with `/model`, and carried on with everything intact — file edits, commits and pushes across two repositories, a background monitor armed *after* the switch and still delivering, deferred-tool loading. The transcript records the model changing from one turn to the next with no other discontinuity.

**The delegate lane is structurally unaffected.** The MCP server is a session-scoped subprocess established at startup, so the connection, the conversation id (held in the parent's context, which the switch preserves), and the subagent definitions (pinned in their own files) all survive. Only the conductor row of the lane table changes — exactly what the table claims.

Two consequences worth operating on:

- **Switch early.** The switch re-reads the current context uncached, so it costs whatever the context weighs at that moment: negligible in the opening turns, expensive at 300k. Confirming model and effort right after startup — before the first delegation — is both the cheapest moment and the one where pre-flight then validates the post-switch state. A mid-session switch is legitimate but should land on a task boundary.
- **`/model` persists its choice as the new-session default** (measured: it rewrote `settings.json`'s `model` key). Harmless when the model is confirmed at every session start; a slow drift when it is not, because the default silently becomes whatever was last chosen for an unrelated reason. The launch flags `--model` / `--effort` ("for the current session") change nothing on disk if you want a one-off. Editing `settings.json` back mid-session does **not** disturb the running session (also verified) — the active model is in-memory state.

Choosing which model conducts is the user's call and may vary per session; this rule does not prescribe a starting model. What it does require is that the choice be *confirmed*, not inherited by accident.

### Delegation packet (mandatory, every delegation)

Start from `global/templates/delegation-packet-template.md`; that template is the packet contract,
not an optional example. It carries `LANE_SEQUENCE`, `AUTO_ADVANCE`, `CONFLICT_SURFACE`, `STOP_IF`,
`KNOWN_SANDBOX_NOISE`, and `RESULT_CAPSULE_FORMAT`. `AUTO_ADVANCE: YES` is invalid unless
`CONFLICT_SURFACE: MANDATORY`. Critical stop conditions (including project R1–R6 where applicable)
are inherited **verbatim**, never AI-summarized. Project-specific sandbox noise is injected through
the template slot and never promoted into this common rule.

0. **`LANE: <name>`**, first line, and **`AUTHORITY_MODE:` + `INTEGRATION_OWNER:`** beside it (§Authority modes). Without a lane the delegate defaults to implementation and the other five lanes never happen; without a mode it must assume `DELEGATED`. Items 2 and 3 below are shaped by the lane: an `IMPLEMENTATION` packet carries a settled design and acceptance tests; an `INVESTIGATION` or `INVESTIGATION_PLANNING` packet carries the **question and the decision it feeds**, and deliberately does *not* carry a hypothesis to confirm; a `FALSIFICATION` packet carries the conclusion to be attacked and says so plainly.
1. **Target**: files / area, with paths.
2. **Approach**: for `IMPLEMENTATION`, the design decision already made (that lane does not make design decisions). **For the reasoning lanes, this field is the problem statement, the constraints and what decision the answer feeds — not an answer to validate.** Handing a reasoning lane a finished conclusion converts it into an approval ritual (§Anti-patterns).
3. **Acceptance criteria**: the tests that must pass, verbatim commands where possible — **and the criteria must cover the dimension the change actually lives in.** "Write it as a runnable command" biases toward existence checks (grep, diffs, counts, exit codes); a change to a rendered surface also needs its `visual` rung, and the parent owes that rung itself before handing anything to the user (rule 04 §The instrument must measure the dimension you are judging). Mechanically rigorous criteria that cannot see the failure mode are the more dangerous kind, because they produce a confident green.
3b. **Standing questions**: for any change that removes or reshapes existing surface, require the delegate to ask before deleting. A working mock is a specification of layout, not of what operations depend on — dummy data cannot show why a refresh affordance, a count, an elapsed time or a caution note is load-bearing, so "it isn't in the mock" is never on its own a reason to drop something (case 86). Name the specific items you suspect are at risk.
4. **Founding use case, user-verbatim** (rule 17): so the delegate cannot silently optimize it away.
5. **Relevant rule TL;DRs**: at minimum rule 03 (coding conventions) for implementation work; add domain rules (07 i18n, 10 state-machine, …) as the task touches them.
6. **Escalation instruction**: "if a decision is not covered by this packet, stop and return the question — do not decide."

### Delegation exclusivity: the worker owns the technical scope

From dispatch until that delegation closes as `PASS`, `HOLD`, `ESCALATE`, or `ERROR`, the delegate
is the technical execution owner for its scope. The parent — the **Harness / Integration Conductor**
— does not duplicate same-scope investigation, grep, source exploration, repo survey, diagnosis,
implementation, test execution, reproduction, verification, or falsification to check the result.
Delegate wait time does not authorize shadow execution.

At dispatch, create this mandatory working state and keep it visible until the result is received and
the delegation is explicitly closed; do not rely on start-of-session memory or salience:

```text
DELEGATED_SCOPE_ACTIVE:
- id: <packet or dispatch id>
- scope: <enumerated technical scope>
- owner: <worker/thread>
- parent_shadow_execution: FORBIDDEN
```

While that state is active the parent owns user communication, Human-GO interpretation, scope and
settled-decision management, route/lane selection, packet construction, STOP/authority management,
evidence-contract review, bounded deliverable review, worker-conflict handling, adopt/reject,
commit/integration, and case/handover/baseline/final reporting. Adopt/reject ownership does not make
the parent responsible for re-executing the underlying technical work.

Parent same-scope technical reproduction is permitted only when one of these triggers exists:

1. Independent workers' results materially conflict.
2. Evidence is missing, contradictory, or damaged.
3. The question crosses a Human-only or parent-only authority boundary.
4. After `HOLD` or `ESCALATE`, a bounded investigation is needed solely to choose the next route.
5. The user explicitly requests parent independent verification.

Before using an exception, record its **trigger / scope / necessity**. "Just in case" is not a
trigger. Additional technical investigation otherwise returns to a worker, normally Codex.

### Bounded deliverable review is not shadow execution

The parent may review only what the delegate explicitly submitted: the RESULT CAPSULE, report,
explicit diff, changed-file list, and the exact path:line or artifact directly referenced by a claim.
This preserves cross-lineage Harness review without duplicate execution. It does **not** authorize a
new grep, surrounding-source exploration, call-site survey, test, or same-scope diagnosis. If the
bounded material exposes a question that needs technical investigation, delegate that question.

### Delegation action classification — the ordered decision

The two sections above state the boundary in prose. Prose was not enough here, for a measured
reason: the runtime instrument that enforced them treated **every** parent tool call inside a
delegation window as a violation, except one hard-coded command. Measured 2026-08-25
(Project_Template Phase 5): a status poll on the running worker, plus a read of the handover to
check `PRIMARY_OBJECTIVE`, produced `verdict: FAIL`. Both are duties this rule and rule 24 assign to
the parent by name. A boundary that reddens on the parent's own duties is not a stricter boundary —
it is an instrument nobody can hold green, and the cheapest way to hold it green is to stop doing
the duties. In the same measurement the reverse hole was open: a delegation dispatched to a subagent
opened no window at all, so a parent running the worker's tests, grepping the worker's file and
editing it in parallel scored `parent_same_scope_exec: 0`.

So the boundary is **classified**, and the classification is executed rather than asserted. The
discriminator is never *did the parent use a tool*. It is: **whose technical scope is this action
inside, and what is it for.**

| verdict | what it is |
|---|---|
| `HARNESS_GOVERNANCE` | a parent duty *about* the work — objective, scope, worker status, attempt and elapsed watch, evidence-contract review, STOP judgment, human escalation, route and verifier dispatch. Rule 24 §Harness and worker is where these duties come from, and it is why holding the objective is not shadow execution |
| `BOUNDED_REVIEW` | reading what the worker actually submitted — the capsule, the report, the explicit diff, the changed-file list, the exact path:line a claim references (§Bounded deliverable review) |
| `INDEPENDENT_VERIFICATION` | an explicitly dispatched verifier lane working under its own bounded packet. It is a declared lane with an owner, not a parent action taken quietly |
| `EXCEPTION_REPRODUCTION` | one of the five triggers in §Delegation exclusivity fired **and was recorded** with trigger / scope / necessity |
| `OUT_OF_DELEGATED_SCOPE` | parent work that does not touch the delegated scope at all. Exclusivity has nothing to say about it — whether it belongs to the objective is rule 24's question, not this one |
| `ALLOWED_CLOSE_WORK` | the close protocol the project defines, run after the delegation closed (rule 24 §Acceptance is DONE) |
| `RETURN_BLOCKER` / `RETURN_OUT_OF_SCOPE_FINDING` | what a **worker** does with a finding outside its packet: return it. The class of the finding itself is rule 24's, never this rule's |
| `SHADOW_EXECUTION` | forbidden — the parent re-running the delegated technical work behind the worker |

The block below is the canonical order, and `scripts/delegation-scenarios.py` parses **this file** to
evaluate its scenarios: a clause weakened here goes red in the harness, and a clause weakened only in
the harness disagrees with the rule it claims to execute (the shape rule 24's decision block uses).

```delegation-decision
# Ordered decision. The FIRST row whose conditions all hold decides. `*` = any.
# The default row is SHADOW_EXECUTION on purpose: a prohibition table fails closed, so an action
# that is not affirmatively one of the permitted classes is a violation, never a permission.
# fields: order | conditions (key=value or key>=int, comma-separated) | verdict | authority
1 | actor=worker, finding_outside_packet_scope=yes, blocks_delegated_acceptance=yes | RETURN_BLOCKER              | harness
2 | actor=worker, finding_outside_packet_scope=yes                                  | RETURN_OUT_OF_SCOPE_FINDING | harness
3 | actor=verifier, dispatched_verifier_lane=yes                                    | INDEPENDENT_VERIFICATION    | harness
4 | delegation_state=CLOSED, required_by_close_protocol=yes                         | ALLOWED_CLOSE_WORK          | harness
5 | purpose=governance, overlaps_delegated_scope=no                                 | HARNESS_GOVERNANCE          | harness
6 | overlaps_delegated_scope=no                                                     | OUT_OF_DELEGATED_SCOPE      | harness
7 | purpose=review, material_is_submitted_deliverable=yes                           | BOUNDED_REVIEW              | harness
8 | exception_trigger_recorded=yes                                                  | EXCEPTION_REPRODUCTION      | harness
9 | *                                                                               | SHADOW_EXECUTION            | forbidden
# INVARIANT_KEY: facts that may never appear in any row's conditions, because they may never change
# a verdict. The harness proves this by evaluating every scenario with the fact set both ways and
# requiring an identical verdict.
INVARIANT_KEY | parent_used_a_tool        | tool use is not the discriminator; the instrument that made it one reddened on the parent's own duties
INVARIANT_KEY | worker_is_waiting         | delegate wait time does not authorize shadow execution
INVARIANT_KEY | action_is_cheap           | "the answer is one grep away" — cheapness does not change technical ownership
INVARIANT_KEY | substitutes_worker_output | a duplicate run that would not have been adopted anyway is still a duplicate run
```

Reading the order back in words: a worker returns an out-of-packet finding and never adopts it, with
a blocker returned first; a dispatched verifier is a lane, not a shadow; required close work after
the delegation closed is allowed; a parent duty that stays outside the delegated scope is governance;
anything else outside that scope is simply not this rule's business; review is review only of what
was submitted; a recorded exception trigger is the one way back into the scope; and everything
remaining is shadow execution.

Two of the four invariants deserve their reason in full, because both are rationalizations this rule
has already met. **`substitutes_worker_output`** is a real axis — it is what makes duplicate
execution harmful — but it is deliberately *not* a condition: as a condition it becomes the escape
hatch "my parallel run would not have been used anyway, so it was not really duplication". It
defines the classes; it may not excuse an action. **`action_is_cheap`** is the §Test-failure
handling stress case in one word, and it is invariant for the same reason.

### Verifier lane vs shadow execution

An independent verifier is not a weaker form of the prohibition; it is the sanctioned way to satisfy
a doubt that would otherwise be satisfied by shadow execution. The difference is entirely in whether
it is declared:

| | verifier lane | shadow execution |
|---|---|---|
| dispatch | an explicit packet, with a lane name and an owner | none — the parent simply starts working |
| scope | bounded by its own packet, and it may not widen it from inside | whatever the parent finds interesting |
| output | evidence submitted back as a claim | a private conclusion the parent already holds |
| ownership | it is not the implementation owner | it competes with the implementation owner |

When the parent doubts a delegated result, the move is to **dispatch a verifier**, not to check it
quietly. "I do not trust the result" is a reason to open a lane; it is never on its own one of the
five §Delegation exclusivity triggers, and it never authorizes standing parallel implementation.

### Recording an exception trigger so it is visible

§Delegation exclusivity requires an exception's trigger / scope / necessity to be recorded. Record it
where the audit can see it, in the working state's own grammar, before the action:

```text
EXCEPTION_TRIGGER:
- trigger: <one of the five, quoted>
- scope: <the bounded scope this authorizes, not the whole packet>
- necessity: <why the question cannot go back to a worker>
```

An exception that is taken without this block is `SHADOW_EXECUTION` by the ordered decision above —
which is the intended answer, because an unrecorded exception is indistinguishable from not having
one.

### Worker completion and return states

A delegation ends in exactly one of the RESULT CAPSULE's four verdicts — `PASS`, `HOLD`, `ESCALATE`,
`ERROR` — and no parallel state machine is added beside them. What Phase 5 fixes is the *reason*
carried with the last three, because "HOLD" alone does not say whether the Harness may re-dispatch,
must decide, or must go to the Human:

| capsule verdict | reason field | what the Harness does |
|---|---|---|
| `PASS` | — | bounded review, then adopt / reject |
| `HOLD` | `BLOCKED` | the worker cannot proceed; Harness decides retry / re-delegate / Human surface — it does not take over the implementation by default |
| `HOLD` | `NEEDS_DECISION` | a decision outside the packet; Harness decides, or surfaces it if it is user-owned |
| `ESCALATE` | `OUT_OF_SCOPE_FINDING` | classified per rule 24, reported, not adopted |
| `ERROR` | `INVALID_MEASUREMENT` | the instrument produced the result, not the subject (rule 24 §RED is evidence) — re-run or repair the instrument before reading anything into it |

**A `HOLD: BLOCKED` is not a hand-back of the technical work.** The parent's first move is the
judgment, not the keyboard: read the blocker and the evidence, decide whether the scope is still the
right one, then choose retry / re-delegate / surface. Parent implementation of the blocked scope
needs one of the five recorded triggers exactly as it would have before the block.

### A finding outside the packet — for whoever finds it

Rule 24 owns the classification and this rule does not restate it: `BLOCKER` / `ADJACENT_DEFECT` /
`HARDENING`, decided by *does this block acceptance*, never by severity. What this rule adds is that
**the classification does not change with who found it.** A worker reports an out-of-packet finding
and never adopts it, never quietly fixes it, never uses it to widen the packet from inside. A
verifier does the same, from its own bounded packet. And the **parent** does the same: being the
parent is not an authority to move an adjacent defect into the current scope — that authority is the
user's (rule 24 §Human authority).

### RESULT CAPSULE and Codex A/B route

Every delegated result ends with the literal RESULT CAPSULE contract from
`global/templates/delegation-packet-template.md`: `VERDICT`, `REPORT`, `COMMIT_CANDIDATE`,
`TEST_CMD`, `TEST_RC`, `TESTS`, `SELFTEST`, `MUTATION`, `CHANGED_FILES`, `CLAIMS`,
`CONFLICT_SURFACE`, `HUMAN_DECISION_REQUIRED`, and `NEXT_RECOMMENDED_LANE`. `CLAIMS` is an
index of report sections, path:line references, artifacts, command/RC evidence, and hashes — not a
free-prose summary.

Codex A is the primary technical worker: investigation, implementation, correction, tests, and
evidence. Codex B is an independent technical reviewer in a separate thread: verification,
falsification, negative paths, caller-side effects, and mutation review. The normal route includes
`A PASS → B RED → A correction → B RED 0`; a RED is the review layer working, not orchestration
failure. Keep correction in the same A thread where possible; keep independent review in a separate
B thread.

### Review protocol — the asymmetry is about code defects, and only about code defects

**What was measured** (arXiv 2607.21656): *primary defect-finding on written code*, in both directions. Different-vendor implements → Claude primary-reviews: +18.1pt. Claude implements → different-vendor primary-reviews: **−8.6pt**, i.e. actively harmful. That is the whole of the finding.

**What was not measured, and is therefore not restricted:** plans, hypotheses, experiment validity, evidence sufficiency, instrumentation, alternative designs, interpretation of results, irreversibility. In all of those the different-vendor lane is *wanted*, on Claude-produced work, precisely because it reasons differently (§Why this exists).

| Object being reviewed | Primary reviewer | Different-vendor lane's role | Adoption |
|---|---|---|---|
| Code written by the different-vendor lane | Parent (Claude), bounded to the submitted deliverable | Implementer explains "why this way / what alternatives existed" | Parent |
| Code written by a Claude lane | Claude-lineage reviewer (reviewer subagent, or the parent if the subagent implemented) | **Not the primary bug-hunter here** — instead `DESIGN_REVIEW`: alternatives, hidden assumptions, failure modes, irreversible steps | Parent |
| A **plan, hypothesis, experiment or acceptance set** — whoever wrote it | Both lineages, independently | `INVESTIGATION_PLANNING` / `DESIGN_REVIEW` — full participation, no asymmetry | Parent |
| The **verification apparatus** — tests, instruments, measurements, interpretation | Both lineages, independently | `VERIFICATION` — and the test itself is in scope for doubt | Parent |
| A **load-bearing conclusion** | — | `FALSIFICATION` — asked to break it, not to confirm it | Parent |

- Test cases: both lanes propose independently; discard overlapping ones; parent picks the union.
- PR: parent drafts → different-vendor lane draft-reviews → parent finalizes.
- **Adoption splits with the roles**: adoption of delegated *reasoning* is the orchestrator's evidence-based draft judgment; repository *integration* remains the integration owner's evidence-contract and global-gate decision within already-authorized scope. Per-claim technical verification follows rule 04's E1/E2/E3 system; routine parent reproduction is forbidden. Neither role changes settled project decisions. Never majority vote.
- **An "LGTM" from a review lane is a failed round**, not a passed one. Send back the question "what would have to be true for this to fail, and how did you check that it isn't?".

### Test-failure handling (delegated diagnosis; revised 2026-08-20)

**Superseded context (2026-08-13):** this section previously required the parent to investigate the
cause first, directly fix a clear local failure, and return broad work with a parent-written
diagnosis. Its rationale was to prevent a diagnosis-free "fix your bug" bounce. S034 showed that
placing the diagnosis in the parent also recreates the delegated technical scope.

During an active delegated scope, failure diagnosis belongs to the Codex worker. Needed independent
verification goes to a separate Codex thread. The parent evaluates the failure evidence, worker
conflict, authority boundary, and next route; it does not diagnose or fix the same scope unless one
of §Delegation exclusivity's recorded exception triggers applies. A return to the implementer still
carries the observed failure evidence and the bounded question — never a diagnosis-free accusation.

**Worked judgment stress case:** Codex is running and the answer is one grep away. Correct: wait for
the worker, or delegate the bounded question to another Codex thread. Wrong: run a parent grep "just
in case." Cheapness does not change technical ownership, waiting is not an exception trigger, and
"just in case" is not one of the five recorded triggers.

### Independent-perspective triggers (mandatory consult before deciding)

Consult the different-vendor lane before concluding when: (a) stuck 2+ times on the same problem, (b) considering a direction change, (c) deciding UI/UX design direction. Do not close these decisions inside one model lineage.

### Classifier-flag handling (parent safety fallback)

- Set `switchModelsOnFlag` OFF (Claude Code `/config`; syncs with claude.ai settings). A flag then pauses for a choice instead of silently degrading the session.
- On flag: route that work chunk to the different-vendor lane rather than degrading to a lower Claude tier; recover the parent with `/model`; make `/status` checks habitual (a degraded session does not restore itself).
- To isolate the trigger: `claude --safe-mode` (disables CLAUDE.md / skills / MCP / hooks; git status + directory names remain).

### AGENTS.md maintenance (derived cache, parent-maintained)

- **AGENTS.md is per-project and is never inherited.** It names *this* repo's structure, test commands, gates and forbidden actions — so a copy carried into another project instructs a delegate about somewhere else, and nothing about it looks wrong on the page. The generator (`global/templates/AGENTS-template.md`) is what travels between projects; the instance is not. **Generate the instance at bootstrap, before the first delegation**, and treat an instance that arrived with a fork of the template as a defect, not as a starting point. *Enforced: selftest B13 — the name in the instance's heading must match this repo (or CLAUDE.md's own project heading), so an inherited file is red on the first run rather than a thing someone has to notice.*
- **Update it as the project moves, not only when a rule changes.** Two trigger sets, both enumerated because a described trigger does not fire (§Writing for the reader, principle 2): a **feeder rule** changes (table below), **or** any of these project facts change — the test command or how it is invoked, a new area that is off-limits to a delegate, a directory that moves or is added to the structure map, the language policy, a new lane in the roster. Editing any of those closes with "does the delegate's copy still describe reality?"
- Generate from `global/templates/AGENTS-template.md`; keep it **minimal** (conventions, forbidden actions, escalation — the delegate's instruction budget is finite).
- Source of truth is rules/. On conflict, rules win (same doctrine as rule 15's memory sync).
- **When a rule that feeds AGENTS.md changes, regenerate AGENTS.md in the same commit.** "Same commit" is only the *timing*; the part that actually fails is the *trigger*, because a session editing rule 04 has no reason to think about a delegate config file. So the feeder list is written down:

  | AGENTS.md section | Fed by |
  |---|---|
  | Your role — escalation, standing questions | 22 §Delegation packet (3b), 17 (delegates cannot self-scope) |
  | Your role — completion-report contents | 04 §Delegated verification claims (type labels) |
  | Language policy | 07 |
  | Coding conventions | 03 |
  | Forbidden | 05 (parent owns commits) + project-specific rules |

  Editing any rule in the right-hand column is the trigger. Check the list before closing the edit, not at the next pre-flight.
- **The generator is a hop, not just the instances.** `global/templates/AGENTS-template.md` produces every future AGENTS.md; a rule change that reaches one project's instance but not the template is missing from every file generated afterwards, in every project — a silent defect that only surfaces at the next bootstrap. Update generator and instances together. (Measured 2026-08-14: the rule 04/22 changes of that day reached neither, and the template's own generator had drifted from its own rules.)
- Do not point the delegate at CLAUDE.md via filename fallback — CLAUDE.md is a Claude-harness index full of instructions the delegate cannot execute.
- Pre-flight checks freshness; hand-edited or stale AGENTS.md = drift finding.

### Pre-flight check (before first delegation each session)

1. `/status` — the parent is running the model and effort **this session's work calls for**, confirmed rather than inherited: not a stale default from an unrelated session, not a silent classifier degradation. If the session was switched at startup, this is the check that validates the post-switch state.
2. `claude mcp list` — delegate MCP server connected. In the budget-tight state this check is load-bearing: a silent fallback to a Claude subagent moves the cost back onto the bar you are trying to protect.
3. Auth failure → isolate: run the MCP server standalone in a terminal; if auth is the cause, ask the user to run the login (interactive — e.g. `! codex login`).
4. Lane down and work must proceed → **declare the lane stop and the fallback** (Claude implementer subagent) to the user before delegating.
5. AGENTS.md freshness — last rules change vs. AGENTS.md update are in sync; mismatch is reported as drift. Judge on content, not on the dates alone: a file older than the last rules change is not automatically stale.
5b. **Worktree base freshness, before any worktree-isolated implementation.** An isolated agent builds on whatever commit its worktree branched from, and that is not necessarily HEAD — measured: a worktree based itself on the session-start commit, nine commits behind HEAD at launch, so a late-session implementer would have diffed against stale code. Check the agent's actual base (`git worktree list`, or have the agent report `git rev-parse HEAD`) against the intended base before accepting its diff.
6. **The delegate's own configuration**, not just the connection to it: which model it is actually set to run — and **read that from the delegate's own logs, never by asking the delegate**. For a Codex lane the rollout journal carries it:

   ```bash
   find ~/.codex/sessions -type f -newermt "$(date +%Y-%m-%d)" | xargs grep -ohE '"model":"[^"]+"' | sort -u
   ```

   Asking is the cheapest route and is therefore the one that gets taken — which is why the command is written here rather than the instruction "verify". **A rule that says "verify X" and does not carry the command for X has not asked for a measurement; it has asked for a feeling.** (Origin: LaserEditor S018 case 93 — three delegations in one session self-reported three different model names, none of them the real one, and the roster, which was correct, was one step from being "corrected" to match the delegate's claim. When a self-report and the roster disagree, the roster is not the first thing to doubt.) **A self-report is a claim about identity, subject to exactly the discipline a self-reported "tests pass" is** — see `04-testing-strategy.md` §Delegated verification claims. Also confirm its approval policy and sandbox permissions (a delegation that cannot write files or run tests cannot satisfy any acceptance criterion), and whether a **global** instruction file exists upstream of the repo one. The delegate reads global-then-repo, so a stale global file dilutes or overrides the conventions you think you are sending.

### Roles and authority — four roles

"The parent" bundled five kinds of authority. They separate cleanly across FOUR roles — Human,
orchestrator, executor, integration owner — and separating them is what lets a non-default model
hold a primary role without weakening any boundary. `DELEGATED` / `HUMAN_DIRECT` are the
executor's authority MODES, not additional roles. Which MODEL may hold which ROLE is a
roster/config decision (CLAUDE.md §Team structure + §Environment prerequisites here) — rule text
speaks only in role terms.

**No residual authority**: authority not explicitly granted by this rule or a user GO does not
exist for the orchestrator or the integration owner — a state transition (stage completion,
gate-red acceptance, close) in unassigned territory is not executable; it goes to the Human
(2026-08-17 ruling).

| Authority | Human | Orchestrator | Executor (any lane; both modes) | Integration owner |
|---|---|---|---|---|
| Scope / settled-decision changes | ✅ only | ✗ (may argue) | ✗ | ✗ |
| GO for irreversible / production / credential operations | ✅ only | ✗ | ✗ | ✗ |
| Task decomposition, lane selection | — | ✅ | `HUMAN_DIRECT`: ✅ within its own task. `DELEGATED`: ✗ | ✗ |
| Adopt / reject | ✅ | ✅ delegated work only | **✗ its own work — never, in either mode** | ✗ conclusions — ✅ integrate only work already authorized with its evidence contract satisfied |
| User-facing report | — | ✅ draft judgment, labeled draft | `HUMAN_DIRECT`: ✅ observed results only (shape below). `DELEGATED`: ✗ — reports to the orchestrator | ✅ integration results |
| Working-tree changes | — | via lanes | ✅ (IMPLEMENTATION lane) | ✅ |
| Commit / push / handover / case filing / baseline / release / deploy | ✗ (may, but normally defers) | ✗ | ✗ | ✅ |

- **Observed-result reporting, defined by shape** (not by a banned-phrase list): it states only
  actions taken, measurements and outputs, limits, and unresolved findings. It must NOT state
  that the change is accepted, sufficient, complete, mergeable, deployable, or the project's
  chosen conclusion — those judgments remain pending until the integration owner validates the
  evidence contract and an authorized actor adopts them.
- **Integration owner, made operable**: it may determine only whether evidence and repository
  gates permit an **already-authorized** change to be committed or handed over. It may not
  choose among unsettled alternatives, change scope or settled decisions, or turn a candidate
  conclusion into project policy — if integration would require any such choice, stop and return
  it. It validates the E1/E2/E3 evidence contract that integration rests on (a non-integrating
  actor's report is a claim — rule 04 §Delegated verification claims, external orchestrators
  included); it does not routinely reproduce per-claim technical work, redo the reasoning, or
  transcribe. Project-wide close gates remain its own measurements. Where the enforcement machinery (hooks,
  pre-commit gates, selftest, transcript audit trail, commit attribution) is physically bound to
  one harness, the integration owner is a session of that harness — abstract the binding only
  when a real need to swap it appears, not pre-emptively.
- **Case filing stays with the integration owner, same session** (sibling projects proved
  deferred lessons are never written). Incidents in delegated work included.
- Note the shape, unchanged from before the split: reasoning roles gain **authority over
  analysis** and none over **state**. Any actor may argue the project out of a conclusion; none
  but the Human may change what the project is committed to.

### Authority modes — the header says who you answer to

Every delegation/execution prompt opens with, alongside `LANE:`:

```
AUTHORITY_MODE: DELEGATED | HUMAN_DIRECT
INTEGRATION_OWNER: <who integrates — normally the harness session>
```

`DELEGATED` = an orchestrator decomposed the task and receives the report. `HUMAN_DIRECT` = the
Human invoked the executor directly; the executor may sequence its own lanes (investigate →
implement → verify) inside the settled scope and reports observed results directly to the Human.
**The mode changes only the report target and lane sequencing. It never changes the Forbidden
set, never grants self-adoption, and never moves integration.** Without a mode header the actor
must assume `DELEGATED`. *(Measured: the header survives file indirection, and its escalation and
reporting boundaries held on first live use.)*

A `HUMAN_DIRECT` completion returns an **integration-ready package**: the diff (if any), files
touched, typed evidence per claim, rungs NOT run, candidate case/handover notes, and the list of
claims the integration owner must validate through the evidence contract. Integration is not a
stamp: E1 is inspected, E2 supplies routine independent technical verification, and E3 is reserved
for the recorded parent-reproduction exceptions.

### Session mode — `PRIMARY_MODEL_MODE` (declared by the Human at session start)

The session-level counterpart of the per-delegation headers: it names which conductor tier is
running and what the session's default work shape is. **Undeclared = `T1-solo`.** Mode names
reference roster tiers, never model names — `T1` = the roster's **highest-trust orchestrator
tier**, and the tier→model mapping lives only in the roster (CLAUDE.md §Team structure /
§Environment prerequisites here), so the mode vocabulary survives a roster change unedited.

| Mode | Conductor | Default work shape and boundaries |
|---|---|---|
| `T1-solo` | highest-trust tier | The normal state: solo execution is the sanctioned default; delegation per §Routes and §When to spend the round-trip. All other machinery unchanged |
| `T1-conserve` | highest-trust tier, budget-tight | **Delegation is the default**: work any lane can carry goes to a lane; the conductor spends its own tokens on decomposition, plan review and integration. Solo execution of non-mechanical work states its 1-line reason in the route line |
| `non-T1` | a conductor below the highest-trust tier (Human-selected — §Conductor switching) | **A non-T1 conductor's primary work is never solo-adopted**: its load-bearing conclusions and implementations pass a verification layer (a different-lineage lane, or a highest-trust-tier review at the next opportunity) before adoption. The escalation floor (§Routes mechanical triggers) and integration-owner evidence-contract/global-gate duties are unchanged |

The mode changes default work shape and adoption requirements **only** — it never changes the
Forbidden set, the four-role authority split, gate-red HOLD precedence, or wait-for-go. The
session's mode (declared or default) is recorded with the close mix, and mode-boundary
violations are close-report findings (close.md step 1). (2026-08-18 user directive.)

### Session role — `SESSION_ROLE` (`PRIMARY` / `REVIEWER`, declared at session start)

Sessions relay through the repository: the role header lets the Human swap acting and evaluating
models per session (a non-top-tier PRIMARY checked by a top-tier REVIEWER, or the reverse)
with no harness change. **The relay's only interface is the repo** (commits, handover, review
report) — direct session-to-session dialogue or message-passing is never an interface. Declared
in the session's opening route declaration alongside `PRIMARY_MODEL_MODE`; **undeclared =
`PRIMARY`** (backward compatible). This is the S005-audit separation of verifier, executor and
transition-executor applied at session scale.

| Role | Is | Does | May not |
|---|---|---|---|
| `PRIMARY` | the conventional parent: orchestrator + integration owner | implement, delegate, integrate, commit | **declare acceptance of its own deliverables.** It carries work to "criteria PASS" and stops there in split-state wording; the acceptance judgment belongs to a REVIEWER session or the Human ("an executor never adopts its own work", session-scale) |
| `REVIEWER` | a verification session over the immediately preceding PRIMARY session's output | (a) verify **every** claim of the target session against the artifact (file:line real read, not sampling), (b) independently re-run the gates — selftest / tests / read-load and the like — and record its own numbers, (c) write the findings list severity-labeled and in state-separated wording | **modify or commit repo-body files** (rules, scripts, hooks, code, templates, configs). Its only writes are the review report + the 16.md §2 baton row + close artifacts (session file, 改定log line), and its close commit carries only those. Out-of-scope findings are listed as **裁定候補 (adjudication candidates)** — never implemented |

R1–R6 — gate-red HOLD precedence, close pre-entry reconcile, the completion-word condition,
the state-claim artifact duty, authority citation, no residual authority — bind **every session
identically, whatever model holds the role**: the role changes what a session may write, never
which gates bind it. Recommended, not mandatory (2026-08-18 user ruling): where the roster
allows, choose a REVIEWER from a different reasoning lineage than the PRIMARY it reviews.
Which sandbox / write / commit permissions a non-top-tier PRIMARY runs under is user-environment
configuration, not rule text — the one-paragraph setup procedure lives in `OPERATIONS.md` §7.

### Review-report baton — the relay's hand-off format

- **Location: `local/reviews/` — committed.** Review records are audit records and are never left
  volatile (2026-08-18 user ruling). Filename: `YYYY-MM-DD_review-{reviewed-session-id}.md`
  (e.g. `2026-08-20_review-S009.md`).
- **Required sections** (template: `global/templates/review-report-template.md`): ① target commit
  range ② claim-verify table (claim / verify method / result) ③ findings, severity-labeled, in
  state-separated wording ④ adjudication candidates (out of scope — listed, never implemented)
  ⑤ independent re-measurements (command + observed value).
- **At close the REVIEWER adds one 16.md §2 baton row** in this shape:
  `| n | **Review complete — fixes pending** (report: local/reviews/<file>; findings 🔴x/🟡y/🟢z) | next PRIMARY | report read at start | 🔴 |`
- **The next PRIMARY (fix) session reads the newest report under `local/reviews/` with
  §0-mandatory-read standing** before any fix work, presents adopt/reject per finding in
  state-separated wording, and implements only after the Human's GO.

### Routes — who leads, chosen per task

| Route | Shape | For |
|---|---|---|
| A | Highest-trust orchestrator leads; lanes under it; it integrates reasoning | Architecture, settled-decision-adjacent work, security/release boundaries, migrations, irreversible operations, **protected paths (below)** |
| B | Alternative orchestrator (roster Tier B) leads reasoning; verification layer + integration owner unchanged; highest-trust model reviews at critical points | Requirement analysis, investigation orchestration, design comparison, delegate decomposition — where being wrong is recoverable at integration |
| C | Bounded `HUMAN_DIRECT` executor completes investigate→implement→verify inside a settled scope; integration-ready package back | Clear-scope implementation, investigation, tests, refactors, docs inside settled architecture |
| D | Escalation: B/C hand the task up to the highest-trust orchestrator | Fired triggers (below) |

Select by: risk → uncertainty → required authority → context availability → independent-lineage
value → cost, **in that order. Never cheapest-first** — a route chosen by price is the
anti-pattern this table exists to prevent. Route choice is stated in one line before work starts
("solo because X" is a valid route and gets the same one line — the silent default is what is
forbidden, not working alone).

**When the task matches §When to spend the round-trip's scale criteria** (the
expensive-to-get-wrong classes enumerated there), the route line additionally records the
delegation consideration: **`delegate (lane: <name>)` or `no delegation (<reason, 1 line>)`**. A
scale-eligible task whose route line carries neither has skipped the consideration, not made it —
the close-time mix can only show that no delegation happened, never whether the option was weighed
at the moment it mattered. (2026-08-18 user directive.)

**Escalation triggers.** Self-reported: architecture impact, settled-decision conflict, high
uncertainty, conflicting evidence, model disagreement. **Mechanical (because "insufficient
context" — and often "architecture impact" — cannot detect itself):**

- missing or schema-mismatched brief → do not start;
- present, schema-valid brief carrying `STATUS: INCOMPLETE` → startable **only if no NOT-OBTAINED
  section is load-bearing for the task**, and the route line states that judgment; otherwise obtain
  the section or move to a repo-aware route. A baseline delivered via rule 13 path ② (handover §5
  rows, values at last close, labeled as claims) is an *obtained claim*, not a NOT OBTAINED —
  fail-closed guards absence, not epistemic status;
- brief HEAD ≠ current HEAD → regenerate; **a dirty tree is not cured by regenerating a
  HEAD-only brief** — either the brief explicitly includes the relevant diff and records its
  digest, or the task moves to a repo-aware route;
- **changes touching protected paths are Route A automatically.** The protected list is
  project config — explicit repo-relative prefixes in `scripts/protected-paths.txt` (the harness
  ships its own: rules/, hooks/, commands/, scripts/), checked by comparing planned and actual
  changed-path sets against it. Semantic release/security impact stays a self-reported trigger
  and is not called mechanical;
- packet-side mechanical events: an unsettled-question marker returned; a missing acceptance
  criterion discovered; needing to touch a file, API or decision the packet does not cover;
  planned vs actual changed paths diverging; a required evidence rung being unrunnable;
  any resubmission after the integration owner overturned a claim;
- verification failures are counted, not re-judged each time;
- **a user-owned gate turning red overrides continuation orders.** When a measured user-owned
  gate (a budget, a threshold, an approved acceptance condition) goes red mid-sequence, the red
  takes precedence over any standing continuation or ordering instruction ("proceed to the end",
  "close the session", a numbered execution order included). Default state on detection = **HOLD**:
  one line to the user (gate name, measured value, options: land / hold / adjust), and the
  sequence counts as stopped until the user answers. Green paths are untouched. (Origin: S005 —
  a +31-token budget red was self-waived under a standing "proceed" order; the violation was the
  unilateral resolution of the conflict, not the size of the breach.);
- **cite your authority before leaving the enumerated scope.** A change outside the file/task set
  the user enumerated is executed only after quoting, in the route line, the settled decision or
  GO sentence that mandates it. No quotable sentence → do not execute: HOLD and ask in one line.
  Technical desirability, test-greenness, and inferred consent are not authority sources.
  (Origin: S005 11:28 — four out-of-scope fixes were genuinely mandated by same-day settled
  rulings but executed without citing them; the citation is what separates settled-scope
  execution from self-authorization.)

### Routing decision — the ordered decision

Choosing **which target a delegation goes to, and at what reasoning effort, is a decision** — not a
setting that happens to be in effect. Left implicit it is invisible: nothing records who chose it,
on what evidence, or whether anyone was allowed to. This section makes that choice explicit and
auditable. It answers four questions and nothing else: **who decides the route, on what evidence an
effort may move, which routes need Human authority, and what a dispatch must state and record.**

**It introduces no new role.** The roles are still the four of §Roles and authority and the lanes
are still the six of §Lane definitions. What routing adds is the **dispatch target**: a
consumer-named handle that says *which of the existing roles acts, over which lanes, under what
status and authority, at what effort*. One model may hold several targets; a target's mapping to a
model differs per consumer and is never written here.

**Values live in one file, and it is not this one.** The role→model→effort→authority mapping is
owned by the project's routing profile (`global/templates/routing-profile-template.md` gives the
grammar; the consumer's copy under `local/` holds the values). This rule owns the **policy and the
grammar**; the profile owns **every value**. `CLAUDE.md`, AGENTS.md, delegation packets and this
rule must not carry a second copy of a mapping — a duplicated mapping drifts, and the drift is
silent because both copies keep reading as authoritative (§Single source of truth, ruling N-6).

**Absent profile fails closed.** The profile is deliberately *not* a mandatory cold-start read — a
session that never dispatches never opens it. But a session that does dispatch and finds no
profile, or an unparseable one, does not proceed on a default: that is `INSTRUMENT_ERROR`, never
"no routing constraints" (2026-08-25 user ruling).

#### Baseline effort, and what moving off it means

A target that has an effort control declares, in the profile, the values that transport actually
supports — **ascending, and named by the consumer** — plus which of them is its baseline. This rule
fixes no set of effort values and no scale length: naming one here would make a constant nobody
derived into a correctness gate, which is case PT-10's shape. A target with no effort concept
declares the scale `NONE`, and escalation simply does not exist for it.

**Baseline is the authorised state. Anything else is a routing decision that must be authorised.**
That runs in both directions:

- **Above baseline** needs a reason from the closed set below **and evidence tied to the current
  task**. "It looks hard", "just to be safe", "higher quality would be nice" are not reasons. This
  is §No autonomous self-upgrade, stated as a gate rather than as advice.
- **Below baseline** is equally forbidden without authority. Routing discipline is not only a limit
  on raising cost; a target silently downgraded to save budget delivers work nobody authorised at a
  capability nobody chose.
- **`effort_fixed` targets** move in neither direction without a Human GO.

The escalation reasons are a closed set, and each one is **grounded in a definition this repository
already owns** rather than a new one:

| reason | grounded in | what the evidence must reference |
|---|---|---|
| `BASELINE` | — | nothing; the dispatch is at baseline and states so explicitly rather than by omission |
| `BLOCKER_DIAGNOSIS` | rule 24 §Finding classification — a `BLOCKER`, decided by whether it blocks acceptance of the current objective, never by severity | the blocking finding: its path:line, the failing command and RC, or the packet it blocks |
| `BASELINE_ATTEMPT_FAILED` | rule 24 §ATTEMPT_OUTCOME and §Bounded attempts — the existing "2+ failed attempts on the same symptom" edge, not a new threshold | the recorded attempts and their outcomes |
| `FALSIFICATION_RISK` | §Lane definitions `FALSIFICATION` — a load-bearing conclusion being attacked | the conclusion under attack and the lane dispatched to attack it |
| `HUMAN_EXPLICIT` | §Roles and authority — the Human is the only source of scope authority | the Human's GO, quoted |

**Evidence, not just a reason.** A reason names a category; evidence is what makes the category a
fact about *this* task. Evidence that only refers to the dispatch itself ("this packet is an
escalation") satisfies nothing.

#### Human-only routing

A profile may mark a target `HUMAN_GO_REQUIRED`. The AI then never selects it: not automatically,
not because quota happens to be available, not because it looks like the higher-quality option, and
not by an escalation sliding into it. The move is to **STOP and present** — why it is needed, the
scope, the expected benefit, and the expected return route — and dispatch only after the Human's
explicit GO, with that GO referenced in the packet.

Which targets are Human-only is a consumer decision. This rule fixes none, and a template that
shipped one would be prescribing a roster.

#### Per-dispatch override is a decision; a global default is a state

A transport that permits per-dispatch model or effort selection may be used that way — that is the
point of the packet's routing fields. What the packet must not do is reach for the **global**
configuration instead: rewriting a session-wide default to serve one dispatch leaves the default
changed for every later, unrelated one (§Switching the parent records this exact drift for `/model`).
Global default and per-dispatch decision are different things with different owners.

#### Transport capability is not policy compliance

That an API, CLI or MCP endpoint **accepted** a value proves the transport supports it. It does not
prove the policy authorised it, and the converse fails too: a policy-authorised value against a
transport that does not support it is not a routing decision, it is a capability mismatch. The
routing validator judges **policy compliance only** and reads supported values from the profile; a
transport capability probe is a different instrument and answers a different question. Merging them
produces a green that means neither thing.

#### The harness's own effort is not routed

The conductor's model and reasoning effort are Human-declared per session (§Conductor switching,
§Session mode, pre-flight step 1). The conductor is not a dispatch target, no routing decision
outputs its settings, and **a worker's escalation never moves them** — that is why
`worker_effort_escalated` is an INVARIANT_KEY below and why a routing evaluation whose subject is
the harness itself returns `HUMAN_OWNED_ROUTE`.

#### Routing is subordinate to the objective

A routing decision never widens scope. "A more capable target may work outside the objective" is
rule 24's `HARDENING` / `ADJACENT_DEFECT` question wearing a routing costume, and rule 24 answers it
unchanged. Effort is not a substitute for a GO.

#### What the consumer owns, and what this rule owns

| this rule (common) | the consumer's profile |
|---|---|
| the ordered decision and its verdict set · the role / lane / status / authority / reason vocabularies · the evidence duty · the STOP behaviour · fail-closed defaults · the invariants · the profile grammar | model mapping · supported model list · effort scale values and their order · baseline effort · which targets are Human-only · which are experimental or disabled · transport capability · cost and quota |

#### Decision order, before any dispatch

1. the objective and the delegated scope (rule 24, §Delegation packet) → 2. the lane the work needs
(§Lane definitions) → 3. the dispatch target → 4. its status and dispatchability → 5. its authority
requirement → 6. the profile mapping → 7. baseline effort → 8. whether an escalation is needed →
9. the reason and its evidence → 10. transport support → dispatch, with the decision recorded in the
packet's routing fields.

#### The block

`scripts/routing-scenarios.py` parses **this file** for the decision and the vocabularies, and the
profile for the values. A clause weakened here goes red in the harness; a clause weakened only in
the harness disagrees with the rule it claims to execute.

```routing-decision
# Ordered decision. The FIRST row whose conditions all hold decides. `*` = any.
# The default row is REJECT_UNROUTED on purpose: a routing table fails closed, so a dispatch whose
# route cannot be resolved is refused, never waved through at whatever the environment happened to
# be set to.
# fields: order | conditions (key=value or key>=int, comma-separated) | verdict | authority
#
# Facts are RESOLVED FROM THE PROFILE, not asserted by the caller: target_known, target_status,
# dispatchable, authority, effort_supported, effort_relation and effort_fixed are all derived by
# looking the packet's ROUTE_TARGET and ROUTE_EFFORT up in the profile. The packet supplies only
# what it is entitled to assert: which target, which effort, the reason, the evidence, whether the
# selection was explicit, and the Human GO reference.
ROLE_VOCABULARY      | human | orchestrator | executor | integration-owner
STATUS_VOCABULARY    | ACTIVE | EXPERIMENTAL | DISABLED
AUTHORITY_VOCABULARY | NONE | HUMAN_GO_REQUIRED
REASON_VOCABULARY    | BASELINE | BLOCKER_DIAGNOSIS | BASELINE_ATTEMPT_FAILED | FALSIFICATION_RISK | HUMAN_EXPLICIT
LANE_VOCABULARY      | INVESTIGATION | INVESTIGATION_PLANNING | DESIGN_REVIEW | IMPLEMENTATION | VERIFICATION | FALSIFICATION
#
 1 | subject=harness_self                                             | HUMAN_OWNED_ROUTE                 | human
 2 | target_known=no                                                  | REJECT_UNKNOWN_TARGET             | forbidden
 3 | target_status=DISABLED                                           | REJECT_NOT_DISPATCHABLE           | forbidden
 4 | dispatchable=no                                                  | REJECT_NOT_DISPATCHABLE           | forbidden
 5 | target_status=EXPERIMENTAL, selection=DEFAULT                    | REJECT_EXPERIMENTAL_DEFAULT       | forbidden
 6 | authority=HUMAN_GO_REQUIRED, human_go_reference=no               | HUMAN_GO_REQUIRED                 | human
 7 | effort_supported=no                                              | REJECT_UNSUPPORTED_EFFORT         | forbidden
 8 | effort_fixed=yes, effort_relation=ABOVE                          | REJECT_FIXED_ROUTE_DEVIATION      | human
 9 | effort_fixed=yes, effort_relation=BELOW                          | REJECT_FIXED_ROUTE_DEVIATION      | human
10 | effort_relation=BELOW                                            | REJECT_UNAUTHORIZED_DOWNGRADE     | human
11 | effort_relation=ABOVE, reason_valid=no                           | REJECT_ESCALATION_REASON_INVALID  | forbidden
12 | effort_relation=ABOVE, evidence_present=no                       | REJECT_ESCALATION_WITHOUT_EVIDENCE| forbidden
13 | effort_relation=ABOVE, reason_valid=yes, evidence_present=yes    | DISPATCH_ALLOWED                  | harness
14 | effort_relation=BASELINE                                         | DISPATCH_ALLOWED                  | harness
15 | *                                                                | REJECT_UNROUTED                   | forbidden
# INVARIANT_KEY: facts that may never appear in any row's conditions, because they may never change
# a verdict. The harness proves this by evaluating every scenario with the fact set both ways and
# requiring an identical verdict. Each one is a rationalisation this rule has already met.
INVARIANT_KEY | task_is_short              | a short task does not make an unauthorised route authorised
INVARIANT_KEY | quota_available            | spare budget is not a reason; it is only an absence of one constraint
INVARIANT_KEY | expensive_target_available | availability is not authority
INVARIANT_KEY | cheaper_target_available   | a cheaper route being available is not authority to downgrade
INVARIANT_KEY | worker_is_slow             | slowness is a schedule fact, not an escalation reason
INVARIANT_KEY | ai_prefers_it              | "this would be better" is the judgment the Human reserved
INVARIANT_KEY | transport_accepted         | the transport taking the value is capability, never compliance
INVARIANT_KEY | worker_effort_escalated    | a worker escalation never moves the harness's own settings
```

Reading the order back in words: the harness's own route is the Human's, never the table's; an
unresolvable target is refused; a retired or non-dispatchable target is refused; an experimental one
may not be reached by default; a Human-only target without a quoted GO stops; an effort the
transport does not support is a capability mismatch; a fixed route may not move in either direction;
an unauthorised downgrade is refused as firmly as an unauthorised upgrade; an escalation needs a
valid reason **and** evidence; baseline dispatches proceed; and anything whose route did not resolve
is refused rather than defaulted.

#### The packet's routing fields

Every delegation packet carries the decision it made — `ROUTE_TARGET`, `ROUTE_EFFORT`,
`EFFORT_REASON`, `EFFORT_EVIDENCE`, `ROUTE_AUTHORITY_REF` (contract:
`global/templates/delegation-packet-template.md`). A baseline dispatch writes `EFFORT_REASON:
BASELINE` and `EFFORT_EVIDENCE: NONE` **explicitly**: made optional, "the author forgot" and "the
author decided baseline" become the same record, and the second is the one the audit needs.

The field names are deliberately `ROUTE_*` and not `WORKER_ROLE`: **`role` is already taken** by
§Roles and authority, where it names an authority bundle rather than a dispatch destination. Reusing
it would have made one word mean two things in one packet.

#### LIMITS

A green routing run proves: the packet's routing fields are present and well-formed; the target
resolves in the profile; its status, dispatchability and authority permit this dispatch; the
requested effort is one the profile says the transport supports; the baseline relation is classified
correctly; an escalation carries a reason from the closed set and a non-empty, task-referencing
evidence field; and none of the eight invariants can move a verdict.

It proves none of: that the chosen model is the right one for the task; that a higher effort
produces better work; remaining quota, price, or performance; **that the evidence is true** — format
validation is not truth validation, exactly as a delegate's "tests pass" is a claim and not a
measurement (rule 04 §Delegated verification claims); or that the transport will behave as the
profile says. The reference implementation this discipline was generalised from carries its own
limit and it is not carried over: its routing mechanism was measured at **one session, one real
dispatch, zero real escalations** (2026-08-24 audit §G) — which is why the clauses, the validator
and the scenarios were adopted and its role names, model names and effort values were not.

### Lineage and independence

- Same-lineage agreement (an orchestrator and an executor from one vendor family) is labeled
  `independent-context, same-lineage` and **never counts as different-lineage verification**.
- A report's independence claims name their attributes: context independence, evidence-source
  independence, whether the reviewer was blinded before first judgment. (Measured: convergence
  under a shared brief is weaker than it looks — two lineages fed the same framing share its
  blind spots; the independent measurements are what resolve it.)
- Load-bearing conclusions reached inside one lineage get a cross-lineage check when any
  escalation trigger fires. A sampling audit by the highest-trust model (rate = a per-project
  user decision) is a **measurement instrument, not a quota** — and an audit layer that never
  catches anything is either unnecessary or not looking; treat a long silence as a finding about
  the audit, not only as reassurance.

### Success criteria — what a working orchestration looks like

Not the number of delegations. Never that. What to look at instead, and what to record when the measurement window closes:

- Did **wrong judgments** go down — decisions later reversed, conclusions later found false?
- Did **rework** go down?
- Did **investigation quality** rise — competing hypotheses considered, unconfirmed items named?
- Did **experiment design** improve after a plan-review round-trip, in a way you can point at?
- Were **hidden assumptions** found that a single lineage had not surfaced?
- Were **verification gaps** found — a test that could not fail, an instrument that could not see?
- Did **architecture judgments** get stronger under an independent alternative?
- Did genuinely **independent perspective** enter, or did both lanes converge because one was shown the other's answer first?
- **Has the delegate drifted back into being a typist?** If every delegation this month was `LANE: IMPLEMENTATION`, the orchestration has quietly reverted to delegate execution, whatever the rule says.
- **Did the verification layer catch anything?** Measured on the first Harness/Worker pilot: Codex B overturned A's PASS with a real RED, then verified RED 0 after A corrected it. A quiet verification layer is a prompt to check the *eligible-task denominator* — how many tasks could have produced catches — before reading the silence as either health or blindness. Count "requested model ≠ observed model" events and mode-boundary violations (a `HUMAN_DIRECT` report that asserts acceptance/completeness rather than observed results) as findings here.
- Route/mode/lane records are **diagnostic context, never targets**: no proportion is a goal, and a period with zero Route C (or zero delegation) is normal when no eligible task arose — judge against the eligible-task denominator, not the raw mix.

---

## Environment prerequisites (user-specific, time-sensitive — re-verify on adoption)

**Roster: this rule carries no mapping.** Which model holds which role — and what a target's
supported effort values, baseline and authority are — lives in exactly one place, the project's
routing profile (§Routing decision; grammar in `global/templates/routing-profile-template.md`, values
in the consumer's copy under `local/`). Until 2026-08-25 this section held a second copy of that
mapping and `CLAUDE.md` §7 a third; both are now pointers, because a mapping written in three places
drifts silently while all three keep reading as authoritative (ruling N-6, one fact one owner).

What stays here is the part that is *not* a mapping: the roles are trust tiers rather than fixed
wiring (user decisions 2026-08-13 / 2026-08-17), the budget-tight conductor fallback is **chosen by
the user per session with no automatic next-in-lineage** (the former hard-coded lineage switch was
withdrawn 2026-08-17), and **model and effort are confirmed at every session start**, which is what
keeps the persisted default from drifting.

**Same-lineage pinning (measured 2026-08-14):** when the conductor and the Claude-side implementer / reviewer subagents are pinned to the same lineage, implementing via a subagent makes every lane one model, and review independence then rests on context separation alone. That is the state where routing implementation to the different-vendor lane matters most, not least. Whether it currently holds is a profile question, not a rule-text one (§Routing decision).

**Harness configuration (`~/.claude/settings.json`).** The concrete key values — which model is
the startup default, which is the `fallbackModel`, and the env overrides — are **values, and their
owner is the routing profile** (§Routing decision). What belongs here is the behaviour, which does
not change with the roster:

- the top-level `model` key is the **startup default only**; budget switches use the `--model` launch
  flag so this key stays put.
- **A variant suffix on a model id is a live selector — do not strip it as cosmetic.** A 2026-08-13
  doc-based check concluded one such suffix was obsolete and it was stripped on that basis; observed
  CLI behaviour contradicted it (the `/model` picker wrote the suffix itself and labelled the entry
  with the larger context window), so stripping it may silently downgrade the context window.
  Restored 2026-08-14, and still `[未verify]`: what the bare form resolves to — the startup banner
  names the variant, so read it once and settle this.
- Shell note: `[` and `]` are glob characters — quote a model id containing them when passing it on
  a command line, or zsh fails with "no matches found".
- `fallbackModel`: array, max 3; fires on overload/unavailability only — **NOT** on rate limit,
  billing or auth. It therefore does not cover the budget-tight conductor switch (§Conductor
  switching).
- `[未verify]`: whether a top-level `model` key disables auto-switching; `CLAUDE_CODE_SUBAGENT_MODEL=inherit`
  semantics.

**Subagents** (`~/.claude/agents/` — user-scope, all projects; the `/agents` wizard was removed in
v2.1.198, so edit the files directly). Each definition pins a model and a reasoning effort — **those
values are profile-owned**, and the definition file is where the profile's decision is applied, not
a second place to decide it. What is rule-level is the shape: a spec-faithful implementer that makes
no design decisions and returns questions; a surveyor restricted to read tools that reports facts and
file:line only; a reviewer restricted to read tools that returns severity-ranked findings. A subagent
that can edit needs `permissionMode` and worktree isolation set deliberately (§Pre-flight 5b).

**Codex MCP:** `claude mcp add --transport stdio --scope user codex -- codex mcp-server` → tools `codex()` / `codex-reply()`. Known pitfalls: default 60s timeout is too short for build/test delegations (use 300s+); a lost `conversation_id` = permanently lost session; the parent's MCP servers are NOT forwarded to Codex; the server mode is experimental — re-verify the connection after Codex CLI updates. Codex-side config: `~/.codex/config.toml`, `~/.codex/AGENTS.md` (global) + repo-root `AGENTS.md`.

**Measurement items (1 month from adoption; decision anchor: Plus fees + credits > Pro → pin to Pro):** classifier-fallback count / Claude-side quota consumption / ChatGPT-side quota consumption / parallel-review overlap rate / round-trips per delegated task / diagnosis-quality of bounces / post-loosening case-recurrence + drift-detection counts / **the lane mix — how many delegations ran in each of the six lanes.** That last one answers §Success criteria's first question and cannot be reconstructed later, so the session that delegates records it at close (`.claude/commands/close.md` step 1). A month of `IMPLEMENTATION`-only is the decay this rule exists to catch, and it is invisible without the count.

---

## Anti-patterns

### ❌ Diagnosis-free bounce
"Tests fail, please fix" back to the implementer. The worker diagnoses delegated failures; every return carries the observed failure evidence and bounded question. Needed independence comes from a separate Codex thread, not parent shadow diagnosis.

### ❌ Acceptance criteria that cannot see the failure mode
Grep-and-diff criteria on a visual change: every check passes, the parent reports defects found and fixed, and the user's first screenshot shows the layout broken. Match the instrument to the dimension, and own the `visual` rung before handing over (rule 04).

### ❌ Blaming the delegate for the packet's defects
A faithful delegate implements the packet's mistakes exactly. When a wrong instruction, a mis-grepped "this already exists", or a misplaced control reaches production, the origin is the packet — i.e. the parent. Review the returned work against the *intent*, not against the packet you wrote, or packet errors become invisible by construction.

### ❌ Transcribing a delegate's verification claim
"Codex says all tests pass → baseline: all pass." A delegate's pass report is a claim. Require E1 type-labeled raw evidence and, where needed, E2 independent Codex verification. Parent reproduction is E3 exception-only (rule 04).

### ❌ Symmetric cross-review assumption
"Cross-review always helps, direction doesn't matter." Measured false **for defect-finding in code** — the Claude-implements→different-vendor-primary-review direction degraded results. Roles are fixed by the table above.

### ❌ Over-generalising that asymmetry into "don't let the other lane review Claude's work"
The opposite error, and the more expensive one, because it looks like discipline. The measurement covered *bugs in written code*. Reading it as "the other lane must not examine anything of ours" removes the independent lineage from plans, experiments, evidence and interpretation — the places it is most valuable — and leaves the harness running on one reasoning system with a rule to feel good about.

### ❌ Invocation quotas
"Call the delegate at least once per task." "Use two agents minimum." "N round-trips before accepting." Every one of these becomes ritual: the call happens, the box is ticked, and nothing is examined. Spend the round-trip where being wrong is expensive (§When to spend the round-trip), and nowhere else.

### ❌ The approval ritual
`Claude's plan → delegate says "looks fine" → done.` This is not independent verification; it is a signature. A review lane that returns agreement has either not been asked a real question or has not done the work — send back "what would have to be true for this to fail, and how did you check?".

### ❌ Implementation-only delegate as the standard form
Claude investigates, Claude hypothesises, Claude designs, Claude settles the spec, and the delegate types. It produces working code and wastes the entire reason for having a second reasoning system. The tell is in the packets: if every `LANE:` this month says `IMPLEMENTATION`, this is what is happening.

### ❌ Dumping the whole problem on the delegate
The mirror failure: hand over the problem entire, take the answer back whole, ship it. That is not orchestration either — nothing was independently reasoned on this side, so there is nothing to compare against and no basis on which the parent can integrate anything.

### ❌ Showing one lane the other's answer before asking
"Here's what Claude concluded — do you agree?" collapses the parallel investigation into an agreement check, and the agreement is worth nothing because it was primed. Give both the same *question*, not each other's answers.

### ❌ Silently continuing on a degraded model
A classifier flag or quota event switched the parent; the session keeps going without noticing. `/status` at pre-flight and after any flag event.

### ❌ Inheriting the model instead of choosing it
Starting work on whatever `/model` last persisted — a choice made days ago for an unrelated budget state — and never checking. The defence is the startup confirmation, not the mechanism used to switch.

### ❌ Hand-editing the delegate's config out of band
AGENTS.md edited directly "just this once" → drifts from rules/ → the delegate follows stale conventions for weeks. Regenerate from rules in the same commit, every time.

### ❌ Delegating the lesson pipeline
"The implementer should write up the incident it caused." It never will (measured: two sibling projects, 15+ sessions each, zero deferred case files written). Parent files cases, same session.

### ❌ Lane sprawl
Adding a popular orchestration UI / swarm framework as a dependency. The category churns (company shutdowns, disputed benchmarks); stay on official primitives + MCP unless the user decides otherwise.

---

## Related rules

- `common/02-design-principles.md` — the design the delegation packet carries is produced here first.
- `common/03-coding.md` — conventions layer of AGENTS.md + delegation packets.
- `common/04-testing-strategy.md` §Delegated verification claims — evidence requirements for delegate reports.
- `common/05-commit-workflow.md` — attribution of delegated work; parent commits.
- `common/12-collaboration.md` §Model operation — wait-for-go's application to delegation; pointer here.
- `common/13-session-recovery.md` §Dual-check architecture — evidence-based adoption of any second agent's output.
- `common/17-no-self-imposed-scope.md` §Delegation — delegates cannot self-scope; packet carries the founding use case.
- `common/judgment-mistakes-history.md` — case filing stays with the parent.
