# Rule: Testing Strategy — Static, Unit, Integration, Step-by-Step UAT

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★
**Scope:** common
**Last reviewed:** 2026-08-25 (Project_Template Phase 7 case promotion — eight clauses absorbed here rather than into new rules: §Before writing a predicate, read one real instance of what it must match (cases 114 / 124 / 130 + PT-33); §A measurement is a statement about the moment it ran (PT-36 + PT-24 — this closes the trigger gap baton #34 recorded, the FINAL-tree clause having existed only under close.md's close trigger); aggregate-is-not-a-member and measured-tree-vs-shipped-artifact under §instrument dimension (cases 107 / 108); container-existence under §invariant reported as one number (case 126); permitted-side-control-with-content under §absence (PT-34); live-value-coverage-decays under §detection power (PT-35); entry-point / lifecycle-order under §Coverage (case 127); success-message-is-a-proposition under §verification label (PT-23 / PT-32). 前 review 2026-08-20 (LaserEditor S034 Harness / Worker evidence system: E1 worker raw evidence, E2 independent Codex verification, E3 exception-only parent reproduction; routine parent per-claim reproduction abolished while no-trust-and-skip and integration-owner global close gates remain. 前 review 2026-08-17: Project_Template S005 Stage 1 — added §Denominators, access breadth, and event order in usage measurement: three defects that each produced a plausible wrong rate on the Stage 0 pilot's first live measurements; §Delegated verification claims extended to every non-integrating actor, external orchestrators included. 前 review 2026-08-16: Project_Template S004 — added §A gauge reports its unit (origin PT-10/PT-11, the harness's own read budget measuring lines while being quoted as load); then, harvesting LaserEditor S021: prove the mutation mutated + gap vs equivalent mutant (case 106 + PT-12), "did not measure" is not "measured empty" (`dd113bd`), and sibling implementations / cross-runtime instruments (cases 103/104). Prior 2026-07-21: Nagaoka-Clay3DP S013–S014→S015 harvest — added instrument verification: synthetic round-trip + negative controls; clay_phase/vp_phase_check origin. Prior 2026-07-20: added verification-type labeling duty (static/synthetic/API-smoke/real-fire; no "all passed" while real-fire un-run) and measured-at-write-time reporting; origin S012 CAL stage-2 + case 21/S013 count drift))
**Related memory:** `step_by_step_acceptance_test`, `local_vs_prod_testing_policy`, `deploy_verify` (Origin: DigiCode)
**Related cases:** Origin: DigiCode — BUG-021 (lockout caught only in prod), BUG-031 (3 Scenario UAT), BUG-038 (4 Scenario UAT for pre-existing), C Phase 9-Step verification

---

## TL;DR

1. **The test ladder is: static gate → unit → integration → UAT.** Climb it in order; passing a lower rung never substitutes for the rung above it.
2. **Static gate + unit tests are mandatory before every commit.** `{{TYPECHECK_CMD}}` (every compilation unit), `{{LINT_CMD}}`, `{{UNIT_TEST_CMD}}`, `{{AUDIT_CMD}}` (project consistency audits). Zero failures required.
3. **Local ≠ production.** Verification on the deployed target (`{{PROD_URL}}`) is mandatory after every deploy; local success is never a completion signal.
4. **Risky changes (auth, crypto, billing, runtime constraints) require a pre-deploy integration test in a production-like local runtime** (`{{LOCAL_RUNTIME_CMD}}`).
5. **UAT involving the user (API keys, hardware, real data): one scenario at a time.** Don't dump 9 scenarios at once — sequence them so each isolates exactly one variable.
6. **Baselines are measured, never transcribed.** Record only numbers you observed by running the check yourself (test counts, timings, response shapes). Copying a value asserted in a doc, report, or handover is forbidden.
7. **「実装済み ≠ 動作する」— every pass report labels each verification by TYPE (static / synthetic / API-smoke / visual / real-fire), and a feature whose real-fire rung has never run may NOT be summarized as "全合格 / all passed". A change to a rendered surface additionally needs its `visual` rung — existence-checking instruments cannot see appearance (§The instrument must measure the dimension you are judging).** (2026-07-20 user directive; origin: Nagaoka S012 — CAL stage-2 was reported "all passed" on static + synthetic + API smoke while the ramp had never actually fired, and was dead under real conditions.)
8. **Reported numbers are measured at write time.** Any count written into a report (verification items, pass counts) must be the value you measured at the moment of writing — never an intended, remembered, or "should-be" number. (Origin: case 21 inferred-claim drift; recurrence Nagaoka S013 — "54 items" written when the measured count was 52.)

---

## Why this exists

Every incident below is real, from the origin project (DigiCode). The full environment detail — commands, URLs, commit hashes — is preserved in the Origin worked example section.

- **BUG-021 production lockout (DigiCode):** Local tests passed (Node.js `crypto.pbkdf2Sync`). Production crashed (the Workers runtime caps PBKDF2 at 100k iterations; the request was 600k). 3-5 min lockout for all 2FA users. Local-only verification was insufficient for runtime-constraint-sensitive code.
- **BUG-038 pre-existing bug (DigiCode):** Found during Phase 9 production verification. 4-Scenario step-by-step UAT (fresh / setup-loop / reload / login) isolated it to **Scenario 3 (login)**. Hypothesis E (`languageChangeSavedRef.current` stuck after duplicate event) confirmed by single-variable diff between scenarios.
- **C Phase 9-Step verification (DigiCode):** Surfaced 3 pre-existing bugs (BUG-039/040/041) that wouldn't have been caught by static checks alone. Step-by-step user verification revealed them in production context.
- **35.md S5 Phase 2 (DigiCode):** User asked for one-at-a-time verification: "It's confusing when you list 9 scenarios; let's do step-by-step and squash small bugs as we go." Memory `step_by_step_acceptance_test` was born here.

---

## When to apply

- Before every commit: static gate + unit tests.
- Before every production deploy: re-run static gate + unit tests.
- After every deploy: production verification (golden path).
- When a change touches: auth, crypto, billing, runtime API, large refactor → pre-deploy local integration test.
- When verification needs the user (UI, API keys, hardware, real data): step-by-step UAT.

---

## How to apply

### Static gate + unit tests (mandatory before commit)

```bash
{{TYPECHECK_CMD}}        # 0 errors — run for every compilation unit (frontend, backend, ...)
{{LINT_CMD}}             # 0 errors / 0 warnings
{{UNIT_TEST_CMD}}        # all pass — record the actual observed count, not a remembered one
{{AUDIT_CMD}}            # project consistency audits (codegen, data, i18n, ...), all pass
```

If any check fails, **don't commit**. Fix or push back on scope.

### Risk-tier triage (decides whether a pre-deploy local integration test is needed)

| Tier | Examples | Test policy |
|---|---|---|
| **High risk** | DB migration (schema change), auth/permission change, payment flow, large state migration (persisted-state shape change), backend behavior writing to production data | Pre-deploy local integration test required (`{{LOCAL_RUNTIME_CMD}}` + scripted scenarios). Document scenarios in the plan. |
| **Low risk** | Dead code removal (caller-zero confirmed), type-equivalent refactor, constant change (call shape unchanged), docs only, UI text through an audited pipeline | Static gate → commit + push → production verification. Local dev server not required. |

(Origin memory `local_vs_prod_testing_policy` codified this trade-off.)

### Pre-deploy local integration test (high-risk only)

```bash
# Run the service in a runtime that emulates production constraints
{{LOCAL_RUNTIME_CMD}}

# Drive the scenarios with a scripted client
curl -X POST http://localhost:{{PORT}}/{{ENDPOINT}} -H "Content-Type: application/json" -d '...'
# Verify response shape, status, headers

# Cleanup
{{LOCAL_RUNTIME_CLEANUP_CMD}}
```

Two policies from the origin project's `local_vs_prod_testing_policy` apply to any project:

- **"I made it work locally" is a forbidden completion signal.**
- Outside the high-risk tier, prefer the shortest path to a production-context check (commit + push → auto-deploy → verify at `{{PROD_URL}}`) over long local dev-server sessions.

### Production verification (after every deploy)

```bash
# Health checks against every deployed surface
curl -s {{PROD_URL}} | head -1
curl -s {{HEALTH_URL_1}}
curl -s {{HEALTH_URL_2}}

# Then: golden path manual verification (login → key feature → logout)
```

Report the verification result back to the user before marking the task done.

### Step-by-step UAT (user-driven)

When the user has to participate (API keys, hardware, real production data):

1. **Plan the scenarios first.** List 3–9 short scenarios, each isolating one variable.
2. **Submit the plan; wait for go-ahead.** Don't proceed without it.
3. **Run Scenario 1 only.** Wait for the user's report (success / what failure looked like).
4. **If failure:** ask the user for observable evidence (e.g. Network-tab HTTP status + response body) — never ask them to hand over secrets such as API keys. Locate the cause. Ship the fix as a standalone commit. Wait for the deploy to complete. Retry the same scenario.
5. **Continue Scenario 2, 3, ...** Same pattern.

Design the sequence as a controlled diff: each scenario differs from the previous one by exactly one variable, so a failing scenario immediately names the suspect. (See the BUG-038 diff-isolation table in the Origin worked example.)

### Baseline measurement (no transcription)

Whenever a plan or report needs a baseline — unit-test pass count, endpoint latency, bundle size, behavior before a change — **run the measurement yourself and record what you observed, with the command you ran**. Transcribing a value asserted in a handover doc, an earlier report, or a comment is forbidden: stale claims are exactly how "all N tests pass" survives sessions after the suite changed.

### Verification-type labeling duty (実装済み≠動作する — 2026-07-20)

Every "passed" claim in a report carries the TYPE of verification that produced it:

- **static** — typecheck / lint / structural audits / classifier scripts
- **synthetic** — unit tests / crafted-data harnesses (the code path ran, on invented inputs)
- **API-smoke** — the deployed surface answered (wiring exists; behavior unproven)
- **visual** — the rendered artifact was actually looked at (screenshot / headless render / printed output), in every state that matters
- **real-fire / real-run** — the feature did its real job under real conditions (実発火・実走)

Rules:

1. A summary like "全合格 / all passed" is **forbidden** when any feature in the summarized set has never had its real-fire rung executed. Say instead: "static+synthetic all passed; real-fire NOT yet verified for X, Y."
2. The ladder principle (TL;DR 1) applies per feature: passing lower rungs never substitutes for the rung above. The origin incident: a ramp feature scored 39 static + synthetic + API-smoke greens and was reported "all passed" — it had never once fired for real, and under real conditions it produced zero output (Nagaoka S012, plan §6-16; third occurrence of the same pattern after origin cases 33/38).
3. The un-run rungs go on the pending-verification list (same list as the observation-to-measurement items, rule 12) and into the next real-environment session's declaration.

### Completion words are state transitions, not prose (2026-08-17)

"完成 / 完了 / complete / COMPLETE / done" in a headline, close report, or handover row is
permitted only when EVERY acceptance criterion of the thing named is met and verified this
session. Anything less uses split-state wording: "criteria PASS / acceptance OPEN / gate red".
A completion word issued early is not loose prose — it acts as a control signal: downstream
steps (deploy, carry, close) proceed on it as if the state were reached. (Measured: S005's
"受入確定" headline carried a red receiver gate through push and close; the split-state form
would have stopped the pipeline at the land/hold question.)

### The instrument must measure the dimension you are judging (2026-08-14)

(Origin: LaserEditor S015, case 87.) grep, diff, id counts, endpoint-set comparison, class reconciliation and API smoke are all instruments for **"does it exist"**. Layout, legibility, colour semantics and how a state reads are the dimension **"how does it look"** — no amount of the first kind measures the second. A rebuild can pass a 26-row inventory walk, an endpoint diff in both directions, a confirm-gate diff across eighteen functions and a full-diff read, and still ship rows bursting out of their card.

Rules:

1. **A change to a rendered surface is not accepted until someone has looked at it rendered.** For a UI that means a screenshot or headless render; for generated documents, output, or fabrication data, the equivalent artifact. Reviewing the source diff is not looking at it.
2. **Capture the states that carry the risk**, not only the default one: empty / one item / many items / expanded / error. Most layout failures live in the states the happy path never shows.
3. **Build the viewing harness without adding dependencies** where possible (a locally installed browser in headless screenshot mode beats a new toolchain). If the harness bypasses an auth gate or seeds fixture state, delete the seed after each capture and confirm zero residue (`git status`).
4. **Walk the path yourself before asking another person to walk it.** (Case 88: a UAT server was handed to the user with an admin token the front-end's own gate rejected — the API had been curl-verified at 200, but the route a human actually takes had never been walked once. An API answering is not evidence that the entrance opens.) If your harness skips the entrance, walk the entrance separately.

5. **An aggregate is not a member.** A count, rate or status computed over a set answers a question about the set. When the judgment is about one member — *did this file go ready, did this request succeed* — the instrument has to name the member and print its own destination, or a neighbour's behaviour is read as the subject's. (Origin: LaserEditor case 107 — a directory-wide `ready` count was read as "the growing specimen went ready"; what had gone ready was an already-ingested stable file sitting next to it, and its destination was never printed. One step from reporting a product defect that did not exist.)
6. **The tree you measured is not necessarily the artifact that ships.** A probe run against a development checkout, or against an image with the working copy mounted over it, is measuring the code — not the distribution. Both produce the same green. State which of the two a green refers to, and for anything that ships, obtain it from the built artifact. (Origin: LaserEditor case 108 — an in-image probe scored 23/23 with the repo's `backend/` overlaid onto the image; the published image contained **none** of the new code, and handing that over would have sent the user chasing a nonexistent platform-specific bug. The build-path checklist for the same failure on the product side is `21-installer-experience.md`, case 92 — that rule owns the path; this one owns the instrument.)

The wider trap this belongs to: **a gate that cannot fail in the dimension that matters reports success in a dimension nobody asked about.** Same family as a pipe hiding an exit code (case 82), a mock written from assumption rather than measurement (case 83), and asserting cleanup at the instant a terminal state is observed (case 85). When a verification never fails, suspect the instrument before trusting the green.

### A gauge reports its unit, and the gap between that unit and what it stands for (2026-08-15)

The section above is about instruments aimed at the wrong dimension. This one is about instruments aimed at the right dimension through a **proxy** — and then quoted as if the proxy were the thing. A proxy is not a defect; forgetting which one you are holding is.

Rules:

1. **Before quoting any numeric gate — a budget, a threshold, a quota, a "remaining N" — state its unit and, once, how that unit diverges from the quantity you are actually judging.** "残り N" with no unit is not a report.
2. **A number and its unit travel together, or the unit gets restated from memory.** Emit the unit from the measuring command and have consumers render what they were given; do not write the unit into the consumer. (A row that says `行` while the generator switched to tokens is wrong *and* silent.)
3. **When only a proxy is measurable, write the DIRECTION of the divergence into the gate**, because the direction is what decides whether a judgment flips. A proxy that is merely imprecise costs accuracy; one that moves opposite to the real quantity costs the decision.
4. **This applies to the harness's own gauges.** That is where it was missed: the discipline existed for product instruments and had never been turned on the tools that police the discipline.

(Origin: Project_Template case PT-10, measured S004 2026-08-15.) A mandatory-read budget counted **lines** with `wc -l`, and every consumer quoted it as 「読み込み負荷」 and 「残り N 行」 — in the template and in a consumer project. What the budget protects is context, whose unit is tokens. Measured on the same corpus: per-line token cost ranged 23.6 to 78.4 — a **3.32× spread**, so the gate mis-priced its own set by that factor, and the single most expensive item (a case index at 25.1% of the real cost) presented as one of the cheapest at 6.7% of the lines. Worse than imprecise, the proxy was **blind in the direction that mattered**: translating that index changes the line count by 0 and the token count by about −28%, and a scope decision had already been argued on the metric's behaviour rather than on the quantity. The gap between "the gauge is fine" and "the gauge is measuring what I am deciding on" was three sessions wide, and the person who built the gauge never once checked its unit.

A second, quieter form: **a premise check that verifies the instruction rather than the behaviour.** The same script checked that the cold-start list *said* "read only §Core" — it could not check that the reader *stopped* there, and the session that wrote this rule read a file in full because nothing told it where §Core ended. Measured cost: +23.6% over the whole budgeted set, invisible to the gauge. When a check validates a document about behaviour, name what it does not observe (case PT-11).

### Denominators, access breadth, and event order in usage measurement (2026-08-17)

Three defects that each produced a plausible wrong rate on first live use, all in one measurement
pilot (origin evidence: Project_Template Stage 0 pilot, 2026-08-17 — measurement record retained
in the originating repository); any one of them alone would have misdirected the policy the
numbers were feeding:

1. **Condition the denominator on existence.** A subject cannot fire before it exists: the
   denominator is sessions/events **after the clause, tool, or artifact was born** (and while
   measurement was possible). Measured: a "fires 4/28" rate became **4/4** once the sessions
   predating the tool were removed — the dead-clause verdict inverted; a second signature's 25/25
   was an artifact of counting sessions older than the clause it claimed to measure.
2. **A containment match is not a consultation.** Distinguish **broad access** (one result
   spanning many items — a full-file read, a bulk grep) from **targeted lookup** (a result
   touching few). Measured: 22 of 41 "opened" items rested solely on results containing ≥10
   items at once; the usage rate was mostly maintenance sweeps, not lookups.
3. **When a correlation implies a direction, measure the order.** Trigger→action claims need the
   trigger's event position before the action's. Measured: 71 of 95 "trigger-then-open" pairs had
   the open BEFORE the first trigger mention — the mention was a *result* of reading; the true
   forward rate was ~15%, not 60.5%.

These are measurement-design duties, not post-hoc fixes: a packet commissioning a usage
measurement names all three (rule 22 §Plan review), and a report that cannot condition or order
says so as an explicit limit rather than shipping the unconditioned rate.

### Fix the scale before reading the screenshot, and reproduce before saying "fixed"

- A screenshot carries a **scale factor** (Retina 2×, browser zoom, a resized paste). Establish it before asserting any dimension from the image; an unscaled eyeball is not a measurement.
- **"Fixed" requires: reproduce the symptom yourself under the same conditions, apply the change, watch it disappear.** Confirming the served bytes with `curl` proves delivery, not repair.
- **A second fix aimed at the same hypothesis is the signal to change hypothesis.** After one miss, list rival causes instead of hardening the first story.

(Origin: LaserEditor case 77 — a wrapped-text symptom was diagnosed as a CSS cache, then as an HTML cache, and "fixed" was reported twice with no change. The misreading came from a 2× screenshot read as if it were 1×, plus never once opening the page at desktop width. The real cause was a three-column grid inside a 480 px container — a regression from two sessions earlier, invisible on mobile.)

### Coverage is a question about classes and paths, not a count of passes

A suite can execute every planned item and still never touch what the feature is for.

- **Input classes.** Enumerate the input classes the founding use case actually names, and run **at least one real sample per class** before reporting a pass. Synthetic samples of one class do not license a claim about the others. (Origin: LaserEditor case 67 — a photo pipeline whose founding use case said "colour photographs" was verified end to end on white-background synthetic images, 31 checks green; the user's first real photo failed immediately.)
- **Sibling implementations and platforms.** When a defect is found in one of two implementations of the same thing, the sibling is **not** cleared by the fact that it passes — read it for the same defect, because a forgiving environment hides a bug rather than fixing it. The mirror of this: **an instrument that is a different implementation of the target cannot judge the target.** Parsing with one runtime, verifying against one shell, exercising through one adapter each answer a question about that one. (Origin: LaserEditor S021 cases 103/104 — the second was the same mistake again, filed *after* the first, which is why this is a rule and not a caution.)
- **Degraded and fallback paths.** A failover, retry or fallback route is not a "spare route" until it has been **run at least once with the primary deliberately disabled**. Existing configuration is not evidence. If it cannot be exercised, write `[未verify]` on that line of the spec. (Origin: LaserEditor case 80 — a Cloudflare-tunnel fallback shipped through v2.3 and had never worked at all: the default urllib User-Agent was being blocked with 403. A chance failover in a restart window produced the single log line that exposed it.)
- **Entry point.** A test that reaches the behaviour by calling an internal helper has measured the helper, not the path production takes. Where the claim is about a **lifecycle** — created → claimed → consumed → reconciled → retired — the test walks that order through the same entry point the running system uses; a shortcut into the middle passes while the real sequence is broken. And **a test that passes alone and fails inside the full suite is not evidence either way** until you know which of the two runs is lying: state that, rather than choosing the green one. (Origin: LaserEditor case 127 — a cleanup test called `_finish_..._and_cleanup()` directly, went green, and the real machine failed; the repaired test then read "the source was unlinked" as cleanup completion and became order-dependent, green in isolation and red in the suite.)

### A verification label attaches to the proposition measured, not to the sentence it sits in

"Measured" / "確認済み" is scoped to the exact claim the experiment settled. Writing it next to a second claim in the same sentence silently launders the second one.

- Before writing up one experiment, list the propositions it actually settled, then label each separately.
- Numbers copied from an older screen, doc, or UI are **transcriptions, not measurements** — re-measure once before republishing them somewhere new, or carry `[未verify]`.
- **A check's own success message is one of these propositions.** When you add a guard, a skip or an early return that narrows what the check covers, the message narrows with it in the same edit — otherwise the green keeps asserting the coverage the guard just removed, and the assertion is now inside the instrument, where nobody reads it as a claim. Give **every** branch its own wording, and start with the branch the healthy repository actually takes: that is the one that gets left generic, because it is the one you see every run and stop reading. (Origin: Project_Template PT-23 — a green line claimed a coverage its own new guard had switched off; and PT-32 an hour later, where the only unlabelled branch was the ok-string the healthy tree emits.)
- (Origin: LaserEditor cases 72 / 73 / 78 — an API's visibility was asserted from a closed bug title and admin-side code while the public endpoint returned the secret in plaintext; a rotation-direction measurement was written up as also confirming which face goes up, and the manual shipped the wrong one; a "~3 min" figure copied into a new participant-facing UI measured ~10 min in practice.)

### When a test fails, the harness is a suspect too

Hold two hypotheses — the implementation is wrong, and the test is wrong — and say which one the evidence supports.

- For concurrency/process tests, first prove every worker is looking at the **same** resource.
- **The same failure reproducing after a fix is a strong signal to inspect the harness**, not to fix the implementation a second time.
- **This is dense, not rare.** One session hit it four separate times. Verification code — throwaway scripts, one-line judgement pipelines, ad-hoc probes — gets written with less care than product code precisely because it is disposable, while carrying more authority, because its output is what you *judge* by. Give the instrument the same reading you would give the implementation before you believe what it says.
- If a claim written into a comment, report, or case turns out to rest on a faulty instrument, correct the record in the same session. (Origin: LaserEditor case 74 — a `spawn`-based test re-imported its module so each process got its own temp directory; "8 processes all won the lock" was diagnosed as a real exclusion bug, and the implementation was changed on that false evidence.)

### An invariant reported as one number cannot distinguish "no violations" from "nothing measured"

`VIOLATIONS=0` is the shape of a pass. It is also the shape of a loop that never ran, a pipeline whose input was empty, and a command the shell aborted before it started. Nothing measured and everything correct produce identical output, and only one of them is true.

1. **Never report "0 violations" without the denominator.** Emit the number of things actually scanned alongside it. `ENTRIES=0` is not a pass; it is a failed measurement wearing a pass's clothes.
2. **Report invariants as a set of numbers that must agree**, not one. `ENTRIES=7 / DISTINCT=7 / IN_MULTIPLE_STATES=0` cross-checks itself — if the scan silently collapsed, the first two go to zero and the break is visible. A lone `0` has nothing to contradict it.
3. **Suspect any run that produces a clean sweep in either direction.** All-pass and all-fail are both what a broken instrument looks like.
4. **The same distinction applies to a single value, not just a count: "did not measure" is not "measured empty".** A probe that errored, exited non-zero, printed nothing, or indexed into a null result must yield a *distinct* value — `null`, `unset`, a raised error — never the empty string a real-but-blank answer would give. Otherwise the absence flows into the comparison and satisfies it, in whichever direction the test happens to need: an unset value matches "does not contain", is empty, and is unequal to the expected one, all at once. **These fail open** — a verdict reads VERIFIED off a value nobody obtained. Wrap the acquisition so "no measurement" is representable and make the verdict reject it. (Measured the same day on two projects independently: a consumer's acceptance verdicts passing on values its tooling had visibly failed to produce, and this harness's own row-coverage check passing because its `awk` exited without printing.)

5. **Establish that the container exists before reading how much is in it.** Item 4 covers an acquisition that failed; this is the case where the acquisition succeeded and the *subject* was absent. `ls -1A "$p" | wc -l` returns `0` for an empty directory and `0` for a path that is not there — EMPTY and MISSING are different findings and one of them means the setup is wrong. Assert existence (`[ -d "$p" ]`, a stat, an explicit `openapi`/registry lookup) first, then read the count, and report the two states separately. **Then ask the same question of the product**: an instrument's blind spot is usually a blind spot in the thing it inspects, because both were written from the same mental model. (Origin: LaserEditor case 126 — "the standard inbox is empty, ready to accept" was reported to a human while the folder did not exist; the product's own status endpoint had the identical hole, answering `folder_visible: true` because it could not tell a stale mount from an empty directory.)

(Origin: LaserEditor case 96. A `for x in <glob>` over an empty directory aborted under zsh, its consumer read zero lines, and the invariant printed `SHA_IN_MULTIPLE_STATES=0` — exactly the intended pass. It was caught only because a *neighbouring* count was also 0 and that was implausible. The same session then hit a fourth instance **after filing the case**: an acceptance check written as a zsh function failed to resolve `shasum`, and five byte-identical files were reported as five mismatches. Filing the case did not prevent the recurrence; that is why the defense here is an output shape rather than a caution. The statically-decidable members of this family are enforced by selftest B7.)

### Before writing a predicate, read one real instance of what it must match

A predicate is a claim about the shape of data. Written from the general shape of the file — from memory, from a sibling format, from what the format *ought* to be — it silently matches nothing, or matches the wrong thing, and the run that follows looks like a measurement.

- **Open one real record of the exact kind the predicate has to match, and write the predicate against that.** Not the file's usual shape; the specific record. And make the anchor incapable of matching a prefix: an anchor that can also land on a parent or a sibling element returns a plausibly wrong fragment, which is worse than returning nothing. Assert that what you extracted is the thing you named — the expected heading is inside it, the tag closes — before using it. (Origin: LaserEditor case 114 — a window-end predicate looked for a JSON-quoted `"completed"` while the real record was `<status>completed</status>`, so every window silently ran to EOF and 19 phantom hits were multi-counted; and case 130, where `'<div class="card'` matched `<div class="card-head"`, and the depth count then closed correctly around the wrong element.)
- **Declare which axes compare by identity and which by tolerance, before writing the comparator.** A single `a == b` applied across every field will reject a correct artefact on a float: identifiers and enums are exact, physical quantities carry a unit and a tolerance, timestamps carry a window. Write the axis split down first; it is the part that gets skipped because the comparator "obviously" just compares. (Origin: LaserEditor case 124 — `47.99999999999998` vs `48` was reported as a mismatch in the most important row of a verification table; the real difference was 2.1e-14 mm and the generator had been right.)
- **A verifier must not reuse the transformation's own parser.** Where a move, migration or rewrite used splitter *X*, the proof that nothing was lost uses an independently written *Y* — otherwise the green is a statement about *X*'s self-consistency, not about the data. Any "N/N preserved" claim also gets a negative control: assert a string never in the corpus is reported absent, and assert at least one deliberately damaged item is reported missing. And when a structural check flags one row for an unrelated reason, treat the anomaly as a parsing hazard for **every** tool reading those rows, not as one row to patch. (Origin: Project_Template PT-33 — a relocation of 81 table rows and its own losslessness proof both split on `|`, so five rows truncated at an escaped `\|` compared equal to their truncated copies and reported 81/81 preserved. An independently written splitter reported 0/5 for exactly those rows.)

### Show the test has detection power — break the code on purpose and watch it fail

A passing suite proves the tests ran. It does not prove they would notice. Two cheap moves settle that, and both are worth doing before you report a green:

- **Mutation.** Change the implementation in the specific way the test claims to guard against — flip the cap, invert the gate, drop the filter — and confirm *which named test* fails. Restore, re-run, confirm the count returns. Run one mutation per behaviour the suite claims, not one in total, and **if any mutant survives, strengthen the check and repeat until none do — a suite with one survivor has not earned the words "detection power"**, because the survivor is exactly the defect it will meet in production.
- **Prove the mutation mutated before you read the result.** A mutant that changed nothing produces the same "no test failed" as a check with no detection power, and the second reading is the flattering one. Confirm the edit landed — diff the file, or have the harness fail loudly when its anchor does not match and when a replace returns the text unchanged — *then* interpret. And when a mutant genuinely survives, decide which of two things it is before writing either down: a **gap** (the check cannot see a real defect → strengthen it) or an **equivalent mutation** (the behaviour is unchanged because something else already rejects it → prove that with a test and keep the code as stated intent). Measured the same day on two projects independently — an anchor that never matched and a `replace()` returning the file untouched, read as "no detection power" when one of the three was an equivalent mutation (LaserEditor case 106); and here, a mutation whose condition never existed because the matcher was a prefix match. **A mutation that did not mutate is evidence about your harness, not about your test.**
- **A check written over source text answers "is this name mentioned", not "is this done".** Assert on the shape of the call (`name(arg)`, as a statement) rather than the presence of the identifier; bound the search to the target function's body; and if the same name appears at more than one site, make the mutation target unique before mutating, or a surviving twin keeps the check green. (Origin: LaserEditor case 102 — five regression checks described as "structural rather than string-grep" let **3 of 6 mutants through**: a `typeof obj.clearFontCache === 'function'` guard clause satisfied the existence check for the very call that had been deleted; a scope that ran past the helper caught another function's mention of the symbol; and a second restore-path call kept the text present after the first was broken. Without the mutation pass, all five would have been committed under a written claim of detection power.)
- **A green mutation run is evidence about the tree it ran on, and detection power can be lost with nothing edited.** Where a check compares a declared set, enum, roster or contract against **one currently-held value**, its coverage is a function of data nobody thinks of as an input: a membership test vouches only for the member it is handed, so exactly one element of the closed set is covered and *which* one moves with the project. Cross-check the set against a **second enumeration of the same set** — a definition list against a transition or usage table, both directions, naming the direction each disagreement was seen from — and keep the live-value test as well, because it answers a different question. When a mutation targets a set, ask which member it exercises and add the mirror. And **treat a survivor whose mutation once killed as a coverage question before a code question**: reproduce on the untouched tree first, to establish whether the guard changed or the data did. (Origin: Project_Template PT-35 — a mutation renaming a state was killed 13/13 at one close and survived one commit later; the commit was the human's acceptance moving the handover's own state value. No edit to the guard, no edit to the guarded contract, no diff anyone would review.)
- **Negative control / liveness.** When the expected result is "nothing happened", "nothing happened" and "the mechanism is dead" produce the same observation. Include a control that would have produced something, so a silent result means the silence, not the death of the watcher.
- **Write the test that fails first.** For a race or an ordering bug, reproduce it deterministically and see the new test go red on the *current* code before you fix anything. Then the green afterwards means something.

(Origin: LaserEditor S018 — three mutations were each caught by the intended test; a "no re-send" assertion was paired with a liveness control because a dead watcher looks identical; and a race test was landed red before the fix. This is the executable form of the question in `judgment-mistakes-history.md` case PT-2: *when this is green, what is still free to be broken?*)

### A measurement is a statement about the moment it ran, so pin the subject before starting

Every number carries an implicit "as of". When the subject moves between the check and the claim, nothing in the output says so — the number is real, measured, and about a state that no longer exists.

- **Before launching any measurement whose runtime exceeds the edit cadence, declare the subject final** — the same way a commit does. Full suites, mutation harnesses, corpus sweeps, remote CI, an agent working in a worktree. If more edits are coming, the measurement waits; if it has already started and an edit becomes necessary, the run is **void**, not "probably still fine". **A stopped run is reported as stopped** — saying nothing because the second run agreed leaves the discipline with no evidence it ever fired.
- **A check and the action it gates never share a batch.** The check's answer is about the tree as it was before the batch; composing the write in the same breath means acting on an answer that the write itself may have invalidated. Take the check's result, read it, *then* compose the action. (This is the general form of the gate/push separation in `.claude/commands/close.md` step 7 and case 110 — that step owns the commit instance; the proposition is the same one. Origin of the general case: Project_Template PT-24 — a free-slot inventory and the write it gated ran in one batch, and the new label collided with a legacy one.)
- **Where a discipline is written under one trigger word — "at close", "before commit" — ask what the same failure looks like away from that word.** The trigger, not the sentence, decides whether a rule exists in practice. (Origin: Project_Template PT-36 — a 16-minute mutation run was launched over a tree still being edited. The repository already carried "the evidence is the FINAL tree, not an earlier green", and its only trigger was the close boundary, so the sentence sat in context, correct and unfired. Nothing was mis-reported only because the author happened to notice, and a defense that depends on noticing is not a defense.)

### When the acceptance criterion is an absence, prove the setup did not cause the absence

"Zero external requests", "no writes outside the sandbox", "nothing leaked" — an absence is satisfied just as completely by a subject that never ran. Isolation harnesses fail toward the passing answer, because the same switch that blocks the traffic you are excluding also tends to block the traffic the subject needs to exist at all. So an absence criterion needs **a pair of controls, and the positive one is checked first**:

- **Positive control — the subject actually came up under the isolation.** Assert on the thing having happened, not on the count being zero: the page's own title / a known element / a nonzero body length / a log line only the real subject emits. Read that *before* reading the count. (Origin: LaserEditor case 100 — a browser was launched with all name resolution mapped to NOTFOUND, which also killed `127.0.0.1`, so the app never loaded and the browser's own error page was measured instead. External requests = 0, exactly the acceptance criterion, from a subject that was never there.)
- **Negative control — the same instrument, pointed at something it must flag.** Run it against the pre-fix build, the unguarded config, the known-bad artefact, and require a nonzero result. Without this, "0" has never been shown to be a number this setup can fail to produce.

**When the absence is a prohibition — a boundary guard, a policy audit, a "this never happens" scan — the negative control has to contain the *permitted* shape, with content.** A prohibition reports success by absence, so a subject that never performs the permitted action satisfies it perfectly, and a fixture whose only in-window action is the one hard-coded exemption tests nothing while carrying the name "false-positive control". Three consequences:

- **For every forbidden shape in the fixture set, name the nearest permitted shape and put it in the same fixture.** Print both denominators — `must-flag` / `must-not-flag`. A run reporting one direction has measured one direction.
- **Classify, do not count.** Where the governing text distinguishes classes of action, the instrument enumerates those classes and assigns one. "Everything except a hard-coded list" is a count wearing a classification's clothes, and its exemption list is where the false positives live. Derive the surface it watches from the project's own roster document, not from the one channel in use the day it was written; and where the classification needs a fact the input does not carry, **refuse** — a guess produces a number, and a number is indistinguishable from a measurement once printed.
- **The second-order cost is the part worth remembering: an instrument that reddens on the duties it exists to protect cannot be held green by doing the right thing.** The cheapest green becomes *stop doing the duty*, so a guard written to defend a boundary turns into pressure to abandon the work on the correct side of it. If a guard goes red while you were complying, that is a finding about the guard.

(Origin: Project_Template PT-34 — a delegation-boundary auditor was green for five days and wrong in **both** directions: a status poll and a read of the handover, both duties assigned to the parent by name, produced `FAIL`, while a delegation on a channel the instrument did not watch opened no window at all and a parent editing the worker's files scored zero. The permitted-side fixture existed and contained no permitted action.)

The generalization, which reaches past isolation harnesses: **an assertion that cannot return false is not evidence.** Before quoting an API or a helper as proof, run it against a control where the property is known to be absent and confirm it says so. (Origin: LaserEditor case 101 — `document.fonts.check(...)` returned `true` on a build where every font request had failed, because the API answers "can this be drawn", falling back if needed, not "did the intended face load". A check whose name suggests the question you have is still answering the question its spec defines; confirm which, on a control, rather than inferring it from the name.)

### Instrument verification: synthetic round-trip + negative controls

(2026-07-21 user-approved harvest; origin: Nagaoka-Clay3DP S013–S014.)

Before trusting any verifier / measuring instrument you built (analyzer, phase checker, report generator, log classifier), prove the instrument itself on both sides — a "green" from an unproven instrument is not evidence, it is the instrument's untested happy path:

1. **Synthetic round-trip** — synthesize input with known ground truth, run it through the REAL pipeline (the same code path production data takes, not a reimplementation), and require zero deviations. Vary the conditions that matter (sample rates, densities, event spacing).
2. **Negative controls** — inject known defects and require the instrument to detect every one (e.g. 3/3). An instrument that has never been shown a defect it must catch has an unmeasured false-negative rate; "no findings" from it means nothing.
3. **Real-data proof where available** — if a known-bad run exists, require full detection on it AND zero false positives on known-good runs (both-sides proof).

Side benefit: building the negative controls teaches the instrument's failure signatures (origin example: dense-island misfires also surface as a rise-incomplete 🟡 class — learned from negative synthesis, then used to interpret real runs).

Origin: Nagaoka-Clay3DP — clay_phase 装置証明 (S013: known-bad run detected 8/8 + 5 healthy runs zero false positives) and vp_phase_check (S014: synthetic multi-rate zero deviations + negative 3/3). The instrument then caught 2 real bugs in production use the same night.

### Reported numbers: measured at write time

Extends "Baselines are measured": the transcription ban also covers **your own intended numbers**. When a report needs a count (verification items, pass counts, file counts), run the measurement in the same session-moment you write the sentence. "I just added 2, so it's 54" is a computation, not a measurement — the origin recurrence wrote "54 items" when the measured count was 52 (Nagaoka S013). If the number matters enough to write, it matters enough to measure.

### Delegated verification claims (orchestration — revised 2026-08-20)

When work ran on a delegated lane, **the delegate's "tests pass" is a claim, not permission to trust
and skip verification.** The same holds for every non-integrating actor: external orchestrator,
`HUMAN_DIRECT` executor, or subagent. No-trust-and-skip remains forbidden. Routine parent per-claim
reproduction is forbidden too. The evidence system is:

- **E1 — worker raw evidence:** exact command, RC, observed output, artifact, test count, and
  hash/path where applicable, with each proposition labeled static / synthetic / API-smoke /
  visual / real-fire. The RESULT CAPSULE indexes these artifacts; it does not replace them.
- **E2 — independent Codex verification:** a separate-thread `VERIFICATION` or `FALSIFICATION`
  pass. This is the normal source of independent technical reproduction and negative-path review.
- **E3 — parent reproduction:** exception-only under rule 22's five recorded triggers. The parent
  records trigger / scope / necessity before running it; "just in case" is not a trigger.

The parent verifies the **evidence contract**, not the underlying technical work again: inspect E1
for exactness, completeness, internal consistency, detection power, and named unrun rungs; require
or evaluate E2 where the route calls for independence; use E3 only on its exception path. Missing,
contradictory, damaged, or unlabeled evidence does not become green — it is returned to a worker or
routes through the recorded exception.

The integration owner may independently run project-wide close gates — full suite, selftest,
read-load, diff-check, and other baseline gates. Those are global repository-state measurements,
explicitly distinct from routine reproduction of the delegate's per-claim technical work. A
real-fire rung unavailable inside the worker sandbox remains pending and is reported as such.

### Diagnostic revert cycle (for pre-existing bug isolation)

When verifying a phase reveals what *might* be a regression:

1. `git revert <phase commit>` → push → wait for deploy.
2. Test in production again.
3. If the symptom persists → the phase is **not the cause**; it's pre-existing. Revert the revert (`git revert <revert>`) → reapply.
4. Commit history will show phase → revert → reapply. That's expected; document it in the BUG file.

(Real case: BUG-038 confirmed pre-existing during Phase 9 — commit hashes in the Origin worked example.)

---

## Anti-patterns

### ❌ "Local build passed → ship it"

```
Bad:  {{BUILD_CMD}} → success → deploy → done.
Good: static gate all green → commit + push → wait for deploy → verify {{PROD_URL}} → report back.
```

### ❌ Dumping 9 scenarios on the user at once

```
Bad:  "Please verify these 9 scenarios: [long list]. Get back to me."
Good: "Scenario 1: [single concrete action with expected outcome]. Please run this and report what you see."
```

### ❌ Skipping the production-like runtime for runtime-constraint-sensitive changes

If the change touches crypto, platform storage/binding APIs, or anything where the production runtime is known (or suspected) to differ from the local one → run `{{LOCAL_RUNTIME_CMD}}` first. The origin project's PBKDF2 lockout (BUG-021, below) is the canonical avoidable incident.

### ❌ "It's been 5 minutes, prod must be deployed"

Deploy pipelines can take longer (build queues). Don't assume — verify with `curl {{PROD_URL}}`. If the old bundle is still served, check the hosting provider's deployment dashboard.

### ❌ Transcribing a claimed baseline

```
Bad:  handover says "all 52 tests pass" → write "baseline: 52/52" into the plan.
Good: run {{UNIT_TEST_CMD}} now → record the count the run actually printed.
```

---

## Origin worked example (DigiCode)

The origin project was a Blockly/ESP32 education platform: React frontend on Cloudflare Pages (auto-deploy on push, ~3 min), backends on Cloudflare Workers. Its concrete test ladder is preserved here as a worked instantiation of every placeholder above.

### Static gate + unit tests, as instantiated

```bash
# Frontend
cd variants/ota/frontend
npx tsc --noEmit                        # 0 errors
npx eslint src/                         # 0 errors / 0 warnings
npx vitest run                          # all pass (52/52 at the time of writing)
npm run prebuild                        # generate-ai-catalog → audit-ai-catalog → audit-data-consistency, all pass

# Backend
cd esp32-blockly-backend
npm run typecheck                       # 0 errors

# i18n (anywhere)
node scripts/audit-i18n.js              # Keys missing 0, dvMismatch 0
```

### Risk tiers and pre-deploy local test, as instantiated

High-risk examples: D1 schema migration, auth/permission change, payment flow, localStorage shape migration, Workers backend writes to prod DB. Low-risk example: UI text via i18n with `audit-i18n` passing.

```bash
# Backend, with miniflare emulating the Workers runtime
cd esp32-blockly-backend
npx wrangler dev --local

# Run scenarios with curl
curl -X POST http://localhost:8787/api/auth/login -H "Content-Type: application/json" -d '...'
# Verify response shape, status, headers

# Cleanup
lsof -ti:8787 | xargs kill -9
```

Origin policy detail: don't run the frontend dev server unless required — for frontend changes, prefer `commit + push → CF Pages auto-deploy → production URL verification`.

### Production verification, as instantiated

```bash
curl -s https://code.fablab-westharima.jp | head -1
curl -s https://esp32-blockly-backend.kazunari-takeda.workers.dev/health
curl -s https://api-compile.digital-fab.jp/health
curl -s https://class.digital-fab.jp/health
```

If the old bundle was still served after ~5 min: Cloudflare Dashboard → Pages → Deployments (build-queue delays were real).

### BUG-021 — the canonical local ≠ production incident

Local tests passed: Node.js `crypto.pbkdf2Sync` handled 600,000 iterations. Production crashed: Cloudflare Workers `crypto.subtle` caps PBKDF2 at 100,000 iterations. Result: 3-5 min lockout for all 2FA users. From then on, anything touching `crypto.subtle`, KV, Durable Objects, R2, or other Workers APIs with known cap differences vs. Node.js required `wrangler dev` before deploy.

### BUG-038 — diff-isolation UAT, as instantiated

```
Scenario 1   (fresh, single block)         ✅ generated correctly
Scenario 1-b (fresh + setup/loop nested)   ✅ generated correctly
Scenario 2   (after F5 reload, guest)       blocks vanish (out-of-scope: localStorage persistence)
Scenario 3   (after login, same blocks)     ❌ "no code to compile" alert ← reproduced!
                                            → only difference vs. 1-b: login state
                                            → hypothesize: i18n preferred_lang re-fire on login
                                            → confirmed: setState bailout + flag stuck
```

Hypothesis E (`languageChangeSavedRef.current` stuck after a duplicate event) was confirmed purely by the single-variable diff between Scenario 1-b and Scenario 3. During the same phase, the diagnostic revert cycle ran for real: `0ef15eb` Phase → `4749246` revert → `af577a2` reapply — the symptom persisted under the revert, proving BUG-038 pre-existing.

### C Phase 9-Step verification

A 9-step user-driven production walkthrough surfaced BUG-039/040/041 — all pre-existing, all invisible to the static gate.

### Where step-by-step UAT came from

35.md S5 Phase 2, user request: "It's confusing when you list 9 scenarios; let's do step-by-step and squash small bugs as we go." Memory `step_by_step_acceptance_test` was created from this exchange.

---

## Real-fire acceptance gate for new features (origin: LaserEditor S011-S012)

**Every new feature's acceptance criteria include at least one real-fire run** — the actual external system (real CLI, real service, real hardware, real network path), not the mock. Schedule it in the test plan at design time, not as an afterthought.

Evidence (LaserEditor): case 80 shipped a failover path that had never run once (it could never work — a UA block); S012's wizard passed 96 mocked tests while the real CLI's blocking behavior, CWD writes, and permission model hid three defects. All were caught before distribution *only because the verification plan had real-fire steps built in* — six times in one day the real run caught what green tests missed.

Corollary (case 83): mocks/shims for external commands are written from at least one captured real transcript (actual output, exit code, blocking behavior). A shim encoding unmeasured assumptions gets an explicit [未verify: 実挙動] label and a registered real-fire item.

## Related rules

- `common/05-commit-workflow.md` — commits before deploy
- `common/22-model-orchestration.md` §AGENTS.md maintenance — §Delegated verification claims above **feeds AGENTS.md**: changing it obliges regenerating the generator template and every instance, in the same commit
- `common/09-runtime-research.md` — when "local runtime ≠ production runtime" applies
- `common/12-collaboration.md` — step-by-step UAT protocol
- `digicode/05-deploy.md` — origin-project deploy commands and URLs (DigiCode only)
- `digicode/11-workers-constraints.md` — origin-project known runtime caps to test against (DigiCode only)
