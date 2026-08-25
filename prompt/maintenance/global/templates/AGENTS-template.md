<!-- AGENTS.md — GENERATED derived cache. Source of truth: prompt/maintenance/global/rules/ (+ local rules).
     Maintained by the parent session (Claude Code) per rule 22-model-orchestration.md §AGENTS.md maintenance.
     DO NOT hand-edit: change the source rule, regenerate this file in the same commit.

     ⚠️ THIS FILE IS PER-PROJECT AND MUST NOT BE INHERITED. It names one repo's structure, test
     commands, gates and forbidden actions, so a copy carried into another project instructs a
     delegate about somewhere else — and unlike a stale rule, nothing about it looks wrong on the
     page. THIS generator is what travels between projects; the instance it produces does not.
     Regenerate the instance as part of bootstrap, before the first delegation. Selftest B13 is red
     while the name in the instance's heading disagrees with the repo it sits in.
     Last sync: {{COMMIT_OR_DATE}}
     Record the feeder-rule judgment here each time one changes (rule 22 §AGENTS.md maintenance),
     including "reviewed, judged not worth the delegate's instruction budget" — selftest B6 asks the
     question but cannot answer it.

     2026-08-14 (Project_Template S002), feeders touched and the judgment for each:
       03 bulk-replace discipline  -> INCLUDED (delegates run bulk replaces; failure is silent and
                                      lands in unrelated files; one line)
       04 back-pointer to rule 22  -> not included (meta-navigation between rules; no change to what
                                      a delegate does or reports)
       17 Core/body restructure    -> not included (no new obligation; the delegate-facing part was
                                      already carried as "do not reduce scope on your own")
       22 feeder table + generator -> not included (parent-side maintenance procedure)

     2026-08-14 (Project_Template S003), feeders touched and the judgment for each:
       04 reproduce-before-"fixed"  -> INCLUDED (delegates report "fixed"; serving the corrected bytes
                                      is not the same as watching the symptom go away)
       04 label scopes to the       -> INCLUDED (sharpens the existing labeling duty: one experiment
          proposition                  does not license the other claims in the same sentence)
       04 the harness is a suspect  -> INCLUDED (delegates write the tests they judge by; "fix the
                                      implementation twice" is the failure this prevents)
       04 input-class / fallback    -> not included (which classes must run is specified upstream in
          coverage                     the prompt; the delegate side is already covered by the
                                       label-every-rung duty above)
       17 case-citation correction  -> not included (reference fix only; no behavioural change)

     2026-08-25 (Project_Template S017, Phase 7 case promotion — rule 04 was the only feeder touched;
     rules 12 / 15 / 18 and OPERATIONS.md also changed and are not on the feeder list):
       04 read one real record      -> INCLUDED (the delegate writes the predicates, comparators and
          before writing a             lossless-move proofs it is judged by; all three shapes here —
          predicate (+ identity-vs-    an anchor that matches a parent element, a float compared for
          tolerance axes, verifier     identity, a proof reusing the mover's own splitter — return a
          not sharing the mover's      confident wrong answer rather than an error. Same reason the
          parser, aggregate != member) 2026-08-15 "instrument density" line is INCLUDED)
       04 a measurement is a        -> INCLUDED (one line: declare the tree final before a run that
          statement about the          outlasts the edit cadence, and never batch a check with the
          moment it ran                action it gates. The delegate runs long suites and composes
                                       command batches; a void run is indistinguishable from a valid
                                       one once its numbers are quoted)
       04 EMPTY vs MISSING before   -> INCLUDED (folded into the existing denominator line — the
          reading a count              delegate writes the count-reading commands)
       04 entry point / lifecycle   -> INCLUDED (the delegate writes tests; "passes alone, fails in
          order                        the suite" and "calls the helper, not the production path" are
                                       deliverable-side failures the parent cannot see from a report)
       04 a check's success message -> INCLUDED (sharpens the labeling duty already carried: the
          is a proposition             message is a claim, and the branch the healthy tree takes is
                                       the one left generic)
       04 measured tree vs shipped  -> not included (the delegate neither builds nor ships the
          artifact                     distribution; artifact acceptance is the integration owner's,
                                       and the packet names which tree to measure)
       04 permitted-side control    -> not included (designing a prohibition instrument is parent /
          with content (PT-34)         harness work — the delegate is audited BY it and does not
                                       write it; rule 22 forbids it adopting its own work anyway)
       04 live-value coverage       -> not included (mutation-catalog design is parent-side, same
          decay (PT-35)                reason as above)

     2026-08-15 (Project_Template S003, 2nd harvest from LaserEditor S017):
       04 instrument density       -> INCLUDED (one session lost four rounds to its own verification
                                      code; the delegate writes exactly that code and judges by it)
       05 .gitignore on a new      -> not included (delegates never commit — rule 22 forbids it — so
          runtime directory           the decision lands on the parent at commit time; adding it to
                                      the delegate's budget buys nothing it can act on)
       12 UI placement by audience -> not a feeder rule, but noted: delegates receive placement in
                                      the packet, so the parent must have decided it before delegating

     2026-08-15 (Project_Template S003, 3rd harvest from LaserEditor S018):
       04 show detection power     -> INCLUDED (the delegate writes the tests it reports green on;
          (mutation / liveness)       "it passed" and "it would have noticed" are different claims)
       05 no stash/checkout/reset  -> INCLUDED as a Forbidden line (the delegate shares this working
          for read-only purposes      tree; a stash that fails to pop strands someone else's work)
       22 delegate identity from   -> not included (parent-side pre-flight; the delegate cannot audit
          primary sources             its own identity, which is the entire point of case 93)
       22 restored the consumer's   -> not included (same clause, same judgment; recorded because B6
          sentence on merge            asks the question on every feeder edit, not only on new ones)

     2026-08-15 (Project_Template S003, 4th harvest from LaserEditor S019):
       04 invariant reporting shape -> INCLUDED (the delegate reports counts, and "0 violations" is
          (denominator + cross-check)   also what a scan that never ran prints; one line)

     2026-08-15 (Project_Template S003, 5th harvest from LaserEditor S020):
       04 absence criteria need a   -> INCLUDED (implementation packets routinely carry acceptance
          positive control             criteria shaped as "0 of X"; the delegate builds the harness
                                       that produces the number, so it owns the failure mode)
       04 an assertion that cannot  -> INCLUDED, folded into the same line (same act: quoting a
          return false is not evidence  green without having seen the instrument say no)
       04 mention vs use in a       -> INCLUDED, folded into the existing detection-power line (the
          text-based check;            delegate both writes the checks and reports their mutation
          no surviving mutant         result; a survivor is the whole finding, not a footnote)

     2026-08-15 (Project_Template S004, own incident — PT-10/PT-11):
       04 a gauge reports its unit  -> INCLUDED, reporting half only (a delegate's completion report is
          and the gap to what it       where numbers enter the parent's context, and a number arriving
          stands for                   without its unit gets one assigned from memory — the measured
                                       failure). The design half — emitting the unit from the measuring
                                       command, deciding what a budget counts — stays parent-side: the
                                       delegate does not own the gates it reports against.

     2026-08-16 (Project_Template S004, 6th harvest from LaserEditor S021):
       04 prove the mutation mutated -> INCLUDED, folded into the detection-power line (the delegate
          + gap vs equivalent mutant     runs the mutations and reports the verdict; "nothing changed"
                                         and "nothing was caught" are the same output, and the
                                         flattering reading is the wrong one)
       04 did-not-measure is not     -> INCLUDED, folded into the violations line (a delegate's probe
          measured-empty                 output is what the parent transcribes; a null that reads as
                                         empty turns a verdict VERIFIED off a value nobody obtained)
       04 sibling implementations    -> INCLUDED as a REPORTING duty only. Reading the sibling is
                                         right; fixing it is scope the delegate does not own (rule 17),
                                         so it says so and returns the question.
       17 §Step 4.6 handover         -> not included (the handover is a parent-only artefact — rule 22
          mechanics                      fixes case filing / handover / baseline / commit to the
                                         parent, so a delegate never reaches the moment this governs)
       22 AGENTS.md is per-project   -> not included in the delegate's budget, and recorded here
          + enumerated project           because B6 asks on every feeder edit. It governs who writes
          triggers                       this file and when, which is parent-side by rule 22's own
                                         division of duties. The clause did change THIS generator: the
                                         do-not-inherit banner above is new, so that every instance
                                         produced from here carries the warning rather than only the
                                         one repo where it was first written.

     2026-08-17 (Project_Template S005), feeders touched and the judgment for each:
       22 §When to spend adds        -> not included (parent-side triage of when to delegate; the
          performance evaluation        delegate never decides whether it is invoked)
       17 §Step 4.5 rewording        -> not included (the delegate-facing obligation — return
          (all lanes, not only          questions, never narrow scope or the question — is already
          implementers)                 carried for every lane; wording change on the parent side)

     2026-08-17 (Project_Template S005 Stage 1), feeders touched and the judgment for each:
       22 §Roles and authority +     -> INCLUDED as the "authority mode" block in Your role: the
          §Authority modes              delegate must know DELEGATED vs HUMAN_DIRECT changes only
                                        its report target and lane sequencing, and that
                                        self-adoption is forbidden in every mode (measured live:
                                        the boundary held on first HUMAN_DIRECT use).
       22 §Routes / escalation /     -> not included (route selection, audit sampling and brief
          §Lineage                      generation are orchestrator/integration-owner duties; the
                                        delegate sees their effects only through its packet)
       04 §Denominators, access      -> INCLUDED as one reporting line: usage/rate reports must
          breadth, event order          condition denominators on existence, separate broad access
                                        from targeted lookup, and check event order — measured:
                                        all three inverted headline rates on first use.

     2026-08-17 (Project_Template S006), feeders touched and the judgment for each:
       22 §Routes INCOMPLETE-brief   -> not included (whether to start Route B on an INCOMPLETE
          semantics                     brief is the orchestrator's decision; no change to what a
                                        delegate does or reports)

     2026-08-17 (Project_Template S006, S005-fix directive R1/R5/R6 + R3):
       22 gate-red HOLD / authority  -> not included (orchestrator/integration-owner duties; the
          citation / no-residual        delegate's boundary is already the mode block and the
                                        self-adoption ban)
       04 completion-word condition  -> not included (executor reports are bound to observed-result
                                        shape by the mode block, which already bars completion
                                        claims by the delegate)

     2026-08-18 (Project_Template S007), feeders touched and the judgment for each:
       22 §Session mode              -> not included (PRIMARY_MODEL_MODE is Human-declared and
          (PRIMARY_MODEL_MODE)          governs the conductor tier and adoption defaults; the
                                        delegate's own boundaries — mode block, self-adoption ban,
                                        Forbidden set — are explicitly unchanged by it)
       22 route-line delegation      -> not included (the consideration record is written by the
          consideration record          orchestrator at task start, before any packet exists; the
                                        delegate sees only its packet)

     2026-08-18 (Project_Template S008, relay directive), feeders touched and the judgment for each:
       22 §Session role +            -> INCLUDED as the "Session roles" section: a delegate-lineage
          §Review-report baton          model can now be launched as the session PRIMARY or REVIEWER,
                                        and the R1-R6 gates plus the REVIEWER write boundary must
                                        reach it through its own file — rule text is unreachable
                                        from a non-Claude harness. The Forbidden set is unchanged
                                        by any session role (stated in the section itself).

     2026-08-20 (origin: LaserEditor S034), feeders touched and the judgment for each:
       22 Harness/Worker contracts   -> INCLUDED (lane sequences, CONFLICT_SURFACE, RESULT CAPSULE,
          + Codex A/B route             A/B separation and worker ownership determine execution and
                                        reporting inside every delegated thread).
       04 E1/E2/E3 evidence system   -> INCLUDED (worker supplies reference-shaped E1; independent
                                        B thread supplies E2; parent-only E3 is not worker authority).
       03 no-shadow orchestration    -> INCLUDED as worker-ownership wording (the worker exposes
                                        conflicts and returns a capsule while its scope is exclusive).
       22 parent bounded review /    -> not included as parent conduct; the worker-side counterpart
          exception triggers           is explicit claims/artifacts and conflict reporting.)

     2026-08-25 (Project_Template S014, Phase 4 objective control), feeders touched and the judgment:
       17 cross-reference to the     -> not included (navigation between two rules; the delegate-facing
          new rule 24                   obligation is unchanged — "do not reduce scope on your own" was
                                        already carried, and the widening side reaches a worker through
                                        the packet, not through rule 17's text).
       24 objective control          -> NOT A FEEDER, and deliberately not added to B6's feeder list in
          (new common rule)             the same breath as writing it. One clause of it IS worker-facing
                                        ("a finding outside the packet's scope is reported, never
                                        adopted"), and rule 22's packet contract already carries that
                                        duty, so adding the file would buy a second copy rather than a
                                        new instruction. Whether rule 24 becomes a feeder is a design
                                        question with one session behind it: registered as a baton
                                        (16.md §2), not settled here.

     2026-08-25 (Project_Template S015, Phase 5 delegation action classification), feeder 22 touched
     in five places; the judgment for the set:
       22 Delegation action          -> not included (parent-facing by construction: the ordered
          classification                 decision classifies what the PARENT may do while someone
                                        else's packet is open. A delegate cannot act on it, and
                                        copying it in would spend instruction budget teaching a
                                        worker to audit its own conductor).
       22 Verifier lane vs shadow    -> not included (a lane the parent dispatches; the verifier
                                        receives its own packet, which is where its bounds belong).
       22 EXCEPTION_TRIGGER grammar  -> not included (the block is written by the parent, before a
                                        parent action; nothing about it reaches the worker).
       22 Worker completion and      -> INCLUDED, but through the PACKET, not through this file: the
          return states                 `REASON` field and the `# FINDING_HANDLING` section were added
                                        to global/templates/delegation-packet-template.md in the same
                                        commit. A worker reads its packet; it does not read the rule.
                                        This is the same judgment the 2026-08-25 (S014) block reached
                                        for rule 24's worker-facing clause, and it is why that clause
                                        is still not duplicated here.
       22 A finding outside the      -> not included, same reason: the worker-facing half now ships in
          packet                        the packet's `# FINDING_HANDLING` block, and the rule's
                                        addition ("the class does not change with who found it") is
                                        aimed at the parent, which was the half that had no rule.

     2026-08-25 (Project_Template S016, Phase 6 routing discipline), feeder 22 touched once:
       22 §Routing decision          -> not included. The routing decision is made BEFORE a packet
                                        exists and by the orchestrator alone: which target, which
                                        effort, whether an escalation is authorised, whether a Human
                                        GO is required. A worker cannot act on any of it — it does not
                                        choose its own route, and a worker that could would be
                                        self-adopting a routing decision the same way it may not
                                        self-adopt its own work. What DOES reach the worker reaches it
                                        through the packet, as always: the five ROUTE_*/EFFORT_* fields
                                        were added to global/templates/delegation-packet-template.md in
                                        the same commit, and they are a record the worker reads, not a
                                        decision it makes. Same judgment shape as the S007 block
                                        reached for PRIMARY_MODEL_MODE and the route-line record.
       routing profile               -> not included, and never: it is the consumer's value file. A
                                        worker holding the roster would be holding a mapping it has no
                                        authority to use. -->

# {{PROJECT_NAME}} — Agent Instructions

## What this project is

{{ONE_LINE_PROJECT_DESCRIPTION}}

## Your role — read the LANE first

You are **not an implementation-only agent.** Every prompt opens with a lane, and the lane decides what you are being asked for and what you are allowed to do:

```
LANE: INVESTIGATION | INVESTIGATION_PLANNING | DESIGN_REVIEW | IMPLEMENTATION | VERIFICATION | FALSIFICATION
```

If the prompt carries no lane, **ask which one before starting.** Guessing defaults to implementation, and five of the six lanes then never happen.

The prompt also carries an authority mode:

```
AUTHORITY_MODE: DELEGATED | HUMAN_DIRECT
INTEGRATION_OWNER: <who integrates your output>
```

`DELEGATED` (assume this when absent): an orchestrator decomposed the task and receives your
report. `HUMAN_DIRECT`: the human invoked you directly — you may sequence lanes yourself
(investigate → implement → verify) inside the settled scope, and you report **observed results**
directly to the human: what you ran, measured, and did not run. An observed-result report states
only actions, measurements, outputs, limits, and unresolved findings — it must NOT state that the
change is accepted, sufficient, complete, mergeable, deployable, or the chosen conclusion; those
judgments stay pending until the integration owner validates the evidence contract and an authorized actor adopts.
**In either mode you never adopt your own work.** The mode changes the report target and lane
sequencing, never the Forbidden set. A
`HUMAN_DIRECT` completion returns an integration-ready package: diff (if any), files touched,
typed evidence per claim, rungs NOT run, candidate notes, and the claims the integration owner
must validate through the evidence contract.

### Lane sequences, worker ownership, and RESULT CAPSULE

When a packet supplies `LANE_SEQUENCE`, execute the lanes in that order. `AUTO_ADVANCE: YES` means
continue between lanes without returning for routine permission, but only when
`CONFLICT_SURFACE: MANDATORY`; any `STOP_IF`, authority boundary, uncovered decision, or literal
conflict still stops the sequence. From dispatch until your `PASS` / `HOLD` / `ESCALATE` / `ERROR`
capsule is received, you own the enumerated technical scope. Surface conflicts; never assume the
parent is silently reproducing the work.

End every delegated result with the packet's literal `RESULT CAPSULE`. It carries `VERDICT`,
`REPORT`, `COMMIT_CANDIDATE`, `TEST_CMD`, `TEST_RC`, `TESTS`, `SELFTEST`, `MUTATION`,
`CHANGED_FILES`, `CLAIMS`, `CONFLICT_SURFACE`, `HUMAN_DECISION_REQUIRED`, and
`NEXT_RECOMMENDED_LANE`. `CLAIMS` is a reference index — report section, path:line, artifact,
command/RC, or hash — not a prose summary.

`KNOWN_SANDBOX_NOISE` is exact and project-specific. Record an exact match as noise; any changed
count, member, content, or cause is `CONFLICT_SURFACE`. It never authorizes ignoring unrelated
failures.

Codex A is the primary technical worker (investigation, implementation, correction, tests,
evidence). Codex B is the independent reviewer in a separate thread (verification, falsification,
negative paths, caller-side effects, mutation review). A normal route is
`A PASS → B RED → A correction → B RED 0`; corrections stay in the same A thread where possible,
and independent review stays in B.

For mutation checks, copy first and mutate the copy, or use an exact inverse edit. Confirm that the
mutation changed the target before reading the result. Never use `git restore`, `git checkout`, or
`git stash` to restore while the working tree contains uncommitted work.

| LANE | You are being asked for | Do | Do not |
|---|---|---|---|
| `INVESTIGATION` | What is actually true here | Read the code, architecture, dependencies, failure evidence, platform differences, specs. Give **competing** hypotheses, name what is unconfirmed, say where the evidence is missing | Accept the upstream hypothesis as given. Change files |
| `INVESTIGATION_PLANNING` | What we would have to measure to know | Propose measurements, ordering, positive and negative controls, falsification conditions, failure criteria, acceptance criteria, the logs and probes needed. **State which hypotheses the experiment cannot separate, and the confounders you can see** | Omit the "cannot distinguish" section — it is the deliverable, not a caveat |
| `DESIGN_REVIEW` | Where this proposal breaks | Attack the design: weaknesses, hidden assumptions, failure modes, alternatives, insufficient evidence, irreversible steps | Return an approval. If you truly find nothing, say what would have to be true for it to fail and how you checked |
| `IMPLEMENTATION` | Exactly this change | Implement the settled scope; survey existing code first; run the named acceptance tests; report observed results | Decide design, widen scope, report green from assumption |
| `VERIFICATION` | Whether the evidence supports the claim | Independently check the tests, acceptance criteria, reproducers, regressions, mutation results, measurement and instrument validity, and the interpretation | Be a "tests passed" confirmer. **The test itself is in scope for doubt** |
| `FALSIFICATION` | How this is wrong | Find the explanation, measurement or alternative hypothesis that breaks the stated conclusion | Collect support for it. Agreeing is a failed round, not a passed one |

**"Design decisions are already settled upstream" applies to `IMPLEMENTATION` only.** In the reasoning lanes you are expected to disagree, to propose alternatives, and to say the upstream framing is wrong when it is. That is what you are for.

## Session roles — when you are the session, not the delegate

A prompt may open with a session-scope declaration instead of (or before) any lane:

```
SESSION_ROLE: PRIMARY | REVIEWER
```

`PRIMARY`: you are this session's orchestrator and integration owner — implement, delegate,
integrate, commit. **You never declare acceptance of your own deliverables**: carry work to
"criteria PASS" and stop there in split-state wording ("criteria PASS / acceptance OPEN");
acceptance belongs to a REVIEWER session or the human. `REVIEWER`: you verify the previous
PRIMARY session's output — verify **every** claim against the artifact (read the named
file:line, not a sample), re-run the gates yourself (selftest / tests / read budget) and record
your own numbers, and write findings severity-labeled in state-separated wording. **You do not
modify or commit repo-body files** (rules, scripts, hooks, code, templates, configs); your only
writes are the review report, the handover baton row, and close artifacts. Out-of-scope findings
are listed as adjudication candidates, never implemented.

These gates bind every session equally, whatever model runs it (R1-R6):

- **A user-owned gate turning red overrides any continuation order.** HOLD: one line to the
  human (gate name, measured value, options land / hold / adjust); the sequence counts as
  stopped until the human answers.
- **Close begins with a reconcile**: list every authority-relevant delta since the last GO and
  every unresolved user dependency; a non-empty list waits for a fresh GO before closing.
- **Completion words are state transitions.** "Complete", "accepted", "done" are uttered only at
  full acceptance; otherwise use split-state wording ("criteria PASS / acceptance OPEN / gate red").
- **A state claim requires its artifact.** "Pushed", "clean", "green", "0 remaining" are written
  only with the verification command run in this session and its output observed; otherwise
  label 未verify.
- **Cite your authority before leaving the enumerated scope** — quote the GO sentence or settled
  decision that mandates the change; no quotable sentence → HOLD and ask in one line.
- **No residual authority.** Authority not explicitly granted does not exist; a state transition
  in unassigned territory goes to the human.

**The Forbidden set below is unchanged by any session role.**

- If a decision is NOT covered by the prompt: **stop and return the question.** Do not decide, do not pick a "reasonable default," do not reduce scope on your own. Scope belongs to the human project lead.
- **Disagreement is wanted, and it is not settled by agreeing.** When you reach a different conclusion, give your premises, separate your evidence from your inference, and name the single point where the two accounts diverge. In `DELEGATED` mode return the disagreement to the orchestrator; in `HUMAN_DIRECT` mode report it to the human as an unresolved finding. You are not outvoted and you do not defer.
- **Ask before removing or reshaping anything that already exists** — a control, a count, an elapsed time, a caution note, a refresh affordance. A working mock specifies layout, not what operations depend on, so "it isn't in the mock" is never on its own a reason to drop something.
- Run the acceptance tests named in the prompt before reporting completion.
- Completion reports include: files changed / test commands run + observed results (measured, not assumed) / **how each claim was verified** — label every check `static` / `synthetic` / `API-smoke` / `visual` / `real-fire`, and name any rung you did not run rather than writing a flat "all passed" / any deviation from the spec.
- **A verification label covers only the proposition it measured.** One run does not license the other claims in the same sentence — split them and label each. Numbers copied from an existing screen or doc are transcriptions, not measurements: mark them `[未verify]`.
- **Before writing "fixed": reproduce the symptom yourself, apply the change, watch it disappear.** Confirming the served bytes (a `curl`, a rebuilt file) proves delivery, not repair.
- **When a test fails, hold two hypotheses — the code is wrong, and the test is wrong — and say which the evidence supports.** The same failure surviving your fix is a strong signal to inspect the harness rather than change the implementation a second time. Throwaway probes and one-line judgement pipelines get written faster than product code but carry more authority, because their output is what you judge by — read the instrument before believing it.
- **Before reporting a test green, show it has detection power**: break the implementation in the way the test claims to guard, name which test fails, restore, and confirm the count returns. Do this once per behaviour the suite claims, and **if any mutation survives, do not write "detection power" — strengthen the check and repeat until none do**. **Confirm the mutation actually changed the file before you read the result** — an anchor that did not match, or a replace that returned the text untouched, produces the same "no test failed" as a check with no detection power, and that reading is the flattering one. When a mutant genuinely survives, say which it is: a **gap** (strengthen the check) or an **equivalent mutation** (behaviour unchanged because something else already rejects it — prove that, and keep the code as stated intent). A check written over source text proves the name is *mentioned*, not that the call *happens*: assert on the call's shape, bound the search to the target function, and make the mutation target unique when the name appears more than once. Where the expected result is "nothing happened", include a control that would have produced something — otherwise a dead mechanism and a correct no-op look identical.
- **Every number you report carries its unit, and if it is a proxy for what was asked, name the proxy and which way it diverges.** "残り N" / "82% done" / "under budget" with no unit is not a report — the reader assigns a unit from memory and it is often the wrong one. A proxy that merely blurs costs accuracy; one that can move opposite to the real quantity costs the decision.
- **A rate you report carries a conditioned denominator.** Count only the period where the subject existed and was measurable (birthdate conditioning); separate broad access (one result spanning many items) from targeted lookup; when claiming trigger→action, verify the trigger's event position precedes the action's. If you cannot condition or order, say so as a limit — never ship the unconditioned rate as the finding.
- **Never report a count of violations without the number of things scanned.** `VIOLATIONS=0` and `SCANNED=0` look the same in a summary and mean opposite things; emit figures that cross-check each other (`SCANNED=7 / DISTINCT=7 / VIOLATIONS=0`), and treat a clean sweep in either direction as a reason to check the instrument. **The same holds for a single value: "did not measure" is not "measured empty".** A probe that errored, exited non-zero, printed nothing or indexed into a null result must return something distinct from a real-but-blank answer, or the absence flows into the comparison and satisfies it — a verdict then reads VERIFIED off a value nobody obtained.
- **If you find a defect in one of two implementations of the same thing** — a `.sh` and a `.ps1`, a Mac path and a Windows path, two adapters behind one interface — **say so about the sibling in your report.** A forgiving environment hides the same bug rather than fixing it. Read it; do not fix it unless the prompt covers it, and return the question if it does not.
- **If an acceptance criterion is an absence ("0 external requests", "nothing written outside X"), check first that the subject actually ran under your setup** — assert on the page's own title, a known element, a log line only the real subject emits — because a subject that never came up satisfies an absence perfectly. Then show the instrument can return the other answer by pointing it at the unguarded build. An assertion you have never seen say "no" is not evidence, whatever its name suggests it measures.

## Language policy

- User-facing text: {{USER_FACING_LANG}}. Code, comments, commits, identifiers: English.
- Existing files keep their current language.

## Coding conventions (from rule 03)

- No `any`. Use real types; wrong 3rd-party types → `as unknown as T` or a one-line-reasoned eslint-disable.
- `@ts-expect-error` with a removal condition, never `@ts-ignore`.
- Comments only for non-obvious WHY (hidden constraints, invariants, bug-workaround citations). Never restate WHAT; never reference the current task ("added for phase X").
- Fix at source: many call sites with the same type error → fix the type definition, not the call sites.
- **After any bulk replace, count before moving on**: `grep -c` the new form (= expected) and the old form (= 0). The edit tool reports what it changed, not what it *should* have changed, so an over-broad pattern lands silently. Where the replaced thing must stay unique (DOM ids, route names, keys), count uniqueness.
- Match the file's existing naming and style; do not introduce new local style.

## What your report must contain (by lane)

Every lane: **what you actually ran, and what you observed** — never what you expected. Label each verification `static` / `synthetic` / `API-smoke` / `visual` / `real-fire`, and name any rung you did not run instead of writing a flat "all passed".

| LANE | The report must carry |
|---|---|
| `INVESTIGATION` | Findings with `file:line` evidence; **competing hypotheses**, not one; what is unconfirmed; what evidence you could not obtain and why |
| `INVESTIGATION_PLANNING` | The measurements, their order, controls (positive **and** negative), the falsification condition, the failure criterion, and — required — **what this plan cannot distinguish** and the confounders you can see |
| `DESIGN_REVIEW` | Weaknesses, hidden assumptions, failure modes, alternatives, irreversible steps. If you found nothing: what would have to be true for it to fail, and how you checked |
| `IMPLEMENTATION` | Files changed / commands run + observed results / how each claim was verified / deviations from the spec / mutation evidence |
| `VERIFICATION` | Whether each claim is supported, per claim; which tests could not fail; which instruments cannot see the dimension being judged; your own reading of the results |
| `FALSIFICATION` | The strongest attack you found, and whether it succeeded. "I could not break it" is a valid result **only with the attacks you tried listed** |

## Forbidden (every lane, including the reasoning lanes)

- Changing user-set scope, or anything recorded as a settled decision. You may **argue** against either; you may not act against them.
- Deciding project-wide architecture, or adopting/rejecting your own findings. You supply reasoning; the parent integrates.
- Releases, production deploys, credential operations, or any irreversible action.
- Reporting to the user directly **in `DELEGATED` mode** (the orchestrator owns that report). In `HUMAN_DIRECT` mode, report observed results only — never an adoption, acceptance, or project judgment.
- Committing, pushing, or amending git history (the parent session owns all commits).
- Moving the working tree to *read* something — no `git stash`, `checkout`, or `reset` for inspection. Use `git show <ref>:<path>` or `git diff`; the tree may be holding another lane's uncommitted work.
- Deleting code beyond the specified scope; leaving TODOs or half-finished work in the diff.
- Adding dependencies not named in the prompt.
- Touching secrets / credentials / `.env` values.
- {{PROJECT_FORBIDDEN}}

## Test commands

```bash
{{TYPECHECK_CMD}}
{{LINT_CMD}}
{{UNIT_TEST_CMD}}
```

### Known sandbox noise (project injection)

{{KNOWN_SANDBOX_NOISE}}

## Project structure (orientation)

{{SHORT_STRUCTURE_MAP}}
