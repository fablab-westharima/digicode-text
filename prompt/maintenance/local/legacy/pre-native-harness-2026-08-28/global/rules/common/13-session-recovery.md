# Rule: Session Recovery — Cold-Start Protocol After Crash / Context Loss

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★★ (a botched recovery silently re-introduces every trap the project has previously learned to avoid)
**Scope:** common
**Last reviewed:** 2026-08-25 (Project_Template Phase 3.5 — Step 2 item 3 rewritten: session history is a CONDITIONAL read, never the opening read, and never current authority. The prior wording told every cold start to open the latest session entry, which re-instated the unconditional obligation the same day a user ruling withdrew it. 前 review 2026-07-08: added Step 4 file-inventory reconciliation + [未読] listing — origin: Nagaoka-Clay3DP S001 case 26. 前 review 2026-05-11: Session 100 — added rule 15 to Step 1 critical-rule list; added Step 4 discipline-violation flagging; added rule 15 to Related rules)
**Related memory:** `wait_for_go`, `quality_over_tokens`, `investigation_incomplete_assumption`, `handover_baseline_actual_measurement`
**Related cases:** Sessions 92-96 (HA-strengthening 6-session continuity), case 16 (lib license), case 17 (handover secret re-intro), case 18 (axis-as-checklist), Session 100 (BUG-080 = handover baseline drift = handover claim "0 errors" vs actual 4 errors)

---

## TL;DR

1. **Re-read the rules and handover from disk every cold start.** Memory of "I read this last session" is gone. Treat every session as if you've never seen the codebase.
2. **Never start work until rules + handover + relevant code are re-read.** No "I'll figure it out as I go." That's the trap that produced cases 14 / 16 / 17 / 18.
3. **Do a sanity-check report before any implementation.** State current understanding, list 🔴/🟡/🟢 findings, ask for verification. Wait for user / strategy reviewer to confirm.
4. **Distinguish strategy review from implementation.** When a parallel reviewer (different agent / different model / human) examines your work, do not mechanically adopt or mechanically reject. Verify with grep / source read, then decide on evidence.

---

## Why this exists

Session-to-session continuity is the failure mode that drives the most expensive incidents in this project's history:

- **Cross-session decision drift.** A decision settled in session N gets re-litigated in session N+1 because the new session's recall is fragmentary. Wasted time + scope creep + risk of overturning a sound prior decision on weaker grounds.
- **Recall-as-verification.** "I remember this is fine" replaces actual file reads. The remembered version is often the pre-fix version (case 12 / "Phase 4-4 stale stderr" pattern). The codebase moved on; the memory didn't.
- **Mechanical agreement with prior agents.** When a different reviewer hands over a recommendation, the new session adopts it without independent verification. Several rounds of mechanical adoption cluster the project against a single reviewer's blind spots.
- **Re-introducing already-redacted secrets.** Case 17 happened on a freshly-armed rule 14 day: doc drafting referenced earlier-redacted secret values. Pre-commit scan caught it. Without rule 14, world-visible re-leak.

The cost of a careful cold start is ~30-60 minutes of reading. The cost of a botched cold start is anywhere from "discovers a bug already fixed" to "ships a regression of a prior fix" to "re-leaks a secret to a public repo."

---

## When to apply

- New conversation starts after any kind of interruption (planned handover, crash, context-window exhaustion, model switch, agent handoff).
- The conversation feels like it might be missing context ("did we already decide this?" / "I think the prior session…").
- A parallel reviewer (another agent, another model run, a human) hands you analysis of your own prior work.

---

## How to apply

### Step 1 — Rules read (mandatory, no exceptions)

Open the rules index and the rules called out by the decision tree, plus the project's critical-rule list:

```
prompt/maintenance/rules/README.md  (or equivalent index)
```

Read the README's decision tree to identify task-relevant rules, then read those rules **plus** the project-wide critical list (typically including):

- `judgment-mistakes-history.md` — every prior judgment failure pattern (numbered cases). Internalize, do not just scan.
- `12-collaboration.md` — wait-for-go protocol and design-proposal format.
- `02-design-principles.md` — the 10-step pre-implementation checklist.
- `14-decision-framework.md` — 4-axis lenses + 5-trap self-check + severity labels (🔴/🟡/🟢) + project-lead anchor.
- `15-docs-organization.md` — meta-docs 2-layer structure (`global/` + `local/`) + root-forbidden discipline. Required reading before creating any new file in the meta-docs area.
- `19-reference-implementation-survey.md` — when modifying a feature with a reference implementation, survey ALL same-class items before designing (no GO before the comparison table). (Session 160 case 25.)
- `20-deploy-batching.md` — batch all changes to a deploy target into one deploy; no per-fix deploy loop. (Session 160 case 25.)
- The project's pre-commit security rule (gitleaks + trufflehog or equivalent).
- The project's library-adoption rule (license / API / maintenance / dependency verification).

"Read" means full read with attention, not skim. The judgment-mistakes-history file in particular needs internalization: future-you reading it is the defense, not the existence of the file.

### Step 2 — Handover docs read

In the order most useful for the project (typically):

1. The top-level project instruction file (e.g., `CLAUDE.md`) — current state overview.
2. The detailed handover doc maintained at session boundaries — what was just done, what's pending, settled decisions.
3. **Session history is conditional, not part of the opening read.** Where a project keeps per-session records, they are *historical evidence* — they say why the current state is what it is, and they are never current authority: whatever a past session says about "next", the owner of that fact is the handover. Open the **relevant** entry (which is often not the latest) when the handover plus its settled-decision grounds cannot settle a question about a past decision, a number's provenance, or the premise a mechanism was built under — or when the user asks about a past session. **"Read the latest one just in case" is not a trigger.** Measured on the template repo (13/13 session files, 2026-08-25): reading the latest unconditionally cost between 341 and 10,294 tokens with the variation decided by nothing but how long the previous author wrote, and every current-state fact a cold start acts on was restorable from the handover alone. If your project's handover cannot yet do that, fix the handover — do not pay the session file every session to cover for it.
4. Any spec doc the handover points to — single source of truth for the next task's requirements.

If the handover references a prior reviewer's analysis (e.g., from a different agent), read that too — but treat it as one input, not as a verdict.

### Step 3 — Codebase re-familiarization

Do not rely on remembered structure. Re-read:

- Every file you intend to modify, **fully**, before proposing changes. Not grep hits — full file via `Read` / equivalent.
- Files implementing patterns you'll mirror (so the new code follows current conventions, not last session's).
- Tests / fixtures that exercise the area you're changing.

`grep` for an existing block / function / symbol before proposing to add one with that name. The project has accumulated patterns the previous session may have learned; the new session has not.

"I already read this last session" is not a valid reason to skip. The session's contents are gone. Read it again.

### Step 4 — Sanity-check report

Before any implementation, surface understanding for verification:

1. **Current state recap.** "Done so far: A, B, C. Pending: D. Settled decisions: …"
2. **Baseline static-check actuals (mandatory, not copied from handover).** Run `bash scripts/baseline.sh` where the project has one — it emits the whole §5 table, so measuring costs one call and transcribing costs more. Where it does not, each §5 row must carry its own command instead, and adopting a generator is worth proposing (the generator is adapted per project, not copied: its gates differ). **A row whose number you did not obtain from a command you ran is a claim, not a baseline.** Where the project has gates the generator does not cover, run typecheck / unit-test / build-audit / pre-commit-security yourself and report exit codes + counts (capture the exit code independently — `RC=$?` on its own line, never through a pipe, which reports the pipe's status instead; case 82). Do not transcribe the prior session's numbers — handover claims drift (Session 100 BUG-080: handover claimed "typecheck FE 0 errors" but actual was 4 errors / exit 2, pre-existing for ~6 weeks). When the actual diverges from the handover claim, flag the divergence as a finding (see `handover_baseline_actual_measurement`).
   - **Measure typecheck cache-independently.** An incremental typecheck (`tsc -b` writing `.tsbuildinfo`) can report a stale exit 0 — a *false green* — when the cache predates an error-introducing change. Session 164 found FE typecheck reporting "0 errors" for ~15 sessions while a forced rebuild surfaced 6 real errors (continuous since Session 148). Always run the cache-busting form for the baseline (`tsc -b --force`, or a non-incremental `tsc --noEmit` where the project graph has no references). If a project's `typecheck` script is plain `tsc -b`, treat its 0 as unverified until you re-run with `--force`. The same caution applies to any incrementally-cached check; a cache that only ever produces greens is the tell.
   - **Reconcile the file inventory, not just static checks (origin: Nagaoka-Clay3DP S001 case 26).** Count the actual files in state folders (plans/active, bugs/active, and equivalents) and reconcile against the handover/index claims. When multiple dated generations of a document exist, read the newest first and verify "settled decisions" against it before seeding or citing them. Any file that appears in a listing you obtained but was not read must be reported as **[未読]** — do not claim consistency from the subset you read. (Case 26: a bootstrap seeded settled decisions from a week-old doc while the current plan sat unread in plans/active/; the handover recorded "plans 0" although the file was visible in the session's own `find` output. Four stale "settled" values survived a full bootstrap until the user caught them.)
   - **The command in a baseline row has to be one you just ran, in the shell you actually run.** A row can carry a command, satisfy every check, and still have measured nothing: `ls tsconfig.json eslint.config.* package.json` aborts under zsh with "no matches found" before listing anything, so the row's conclusion rested on empty evidence. Prefer `find . -maxdepth 1 -name '…'` over `ls` with a glob, quote patterns you pass to other commands, and capture `RC=$?` on its own line. (Origin: LaserEditor S018 finding F-3; the static half is mechanised as selftest B7, which catches unquoted globs and explicitly does not catch "the command ran but measured the wrong thing".)
   - **Run the harness selftest here too, where the project has one** (`bash scripts/selftest.sh`, `RC=$?` on its own line). Its checks guard the harness a cold start is about to rely on, and until 2026-08-14 its only trigger was "you changed the harness" — which a cold start never does, so the checks fired only for whoever happened to edit them. Report `N passed / M failed` as a baseline row like any other. (Origin: LaserEditor S016 — the selftest arrived by sync and its one FAIL was found at the next cold start, producing a permanent fix; had the run waited for someone to edit the harness, the FAIL would have sat unseen.)
3. **Findings, severity-labeled.**
   - 🔴 release-blocker / commit-blocker candidate (must resolve before relevant work starts)
   - 🟡 design impact (resolve during implementation)
   - 🟢 informational (no impact, just record)
4. **Discrepancies between handover docs and the actual codebase.** State them explicitly — these are the highest-value findings of a cold start.
5. **Discipline violations (rule 15).** If any files appear at the meta-docs root that violate `15-docs-organization.md` (root-forbidden), flag them for relocation, not as new state to absorb. List them with proposed target subfolders. This is a separate finding class from "discrepancies" because the root file may be perfectly valid content placed in the wrong location — the issue is location discipline, not content correctness.
6. **Self-assessment of readiness.** "Healthy signs (independent verifications passed): …. Warning signs (still relying on recall): …."

Wait for user / strategy reviewer to verify before proceeding.

### Step 4.5 — An instruction handed to a cold start is a claim about state, not a description of it

A cold start has no memory, so an instruction block arriving in an authoritative form is read as *work to do*. But whether it has already been done is recorded in the **repository**, never in the instruction. Any status the instruction asserts about itself — "not yet delivered", "not started", "still pending" — is a claim, and gets the same treatment as a handover's baseline numbers: **measure it.**

- Before executing, reconcile each item against `git log`, the file contents, and the plan's progress rows. Present the mapping (*item → the commit that already satisfies it*) and then execute only the remainder.
- **When a destructive reading (re-implement / overwrite / re-create) and a non-destructive one both fit the words, the non-destructive one is the default**, and say which you took.
- Finding "it is all already done" does not end the check — the same block usually also contains items nobody recorded.

(Origin: LaserEditor S016 case 89 — a four-item block arrived marked "not delivered in the previous session"; all four had shipped, and a literal reading would have re-implemented finished commits. Reconciliation avoided that *and* surfaced three genuinely unrecorded items in the same block.)

### Step 4.6 — The mirror of this rule: hand off *before* the window closes

This rule covers waking up. The other half is not letting the landing be unplanned: **write load-bearing state to disk as it is produced, not at close**, because a compaction happens at a moment nobody chose and keeps a lossy summary of what it judged salient. A compaction inside a live session puts you in a cold start — re-read, re-measure, do not report from the summary you woke up holding. Full procedure and rationale: `reference/context-handoff.md`.

### Step 5 — Design review → implementation gate

For each commit / PR:

1. Produce a design review per the project's `design-principles` rule (typically a 10-step checklist) and the `collaboration` rule's design-proposal format.
2. Submit and wait for explicit go-ahead. ("Implementation start" / "GO" / "進めて" — not "looks reasonable", not silence.)
3. Implement → verify (typecheck / tests / audits) → run pre-commit security scan → atomic commit → report.

### Dual-check architecture — when a parallel reviewer is involved

This protocol applies unchanged to **any** second agent's output — a strategy reviewer, a Claude subagent, or a different-vendor lane (any of the six rule-22 lanes): verify with evidence, adopt or reject on that evidence, report disagreements honestly.

Some projects run a two-agent / two-model setup where one role does strategy and design review across sessions, and another role does implementation per session. The implementation role's cold-start protocol when the strategy reviewer hands over an analysis:

- **Do not mechanically adopt.** A reviewer with persistent memory may have caught real issues you'd miss, or may be over-fitting to last week's blind spot.
- **Do not mechanically reject.** A reviewer's persistent memory is exactly the asset cold-start lacks.
- **Verify each suggestion** with grep / source read / test run, then make an evidence-based judgment.
- **Report disagreements honestly.** "Reviewer suggested X. Verified by reading file Y at line N: actually Z. Recommend not adopting suggestion." This is not insubordination — it's the cross-check the dual system was designed for.

### Sanity-check evaluation criteria (for the verifying party)

When a user or strategy reviewer evaluates the implementation role's cold-start report, look for these signals (qualitative, not a metric):

**Healthy signs:**

- Finds at least one error or staleness in handover docs through independent code reading.
- Labels every finding with severity (🔴/🟡/🟢).
- Says "not yet verified" or "未verify" instead of asserting from recall.
- Modifies a recommendation when new evidence surfaces, rather than maintaining it with rationalizations.
- Runs the static-check tools and reports the actual numbers; flags divergence from handover-claimed baselines.
- Flags any meta-docs root files that violate rule 15, proposing relocation rather than treating them as new state.

**Warning signs:**

- Reports `grep` hit counts but did not read the implementation details.
- Flat-lists findings with no severity differentiation.
- Says "I trust prior session / prior reviewer / spec doc, so skipping verification" for any item.
- Recognizes "I am applying the scope-confirmation trap" in a self-check, then maintains the same recommendation anyway.
- Transcribes the handover's static-check numbers (typecheck "0 errors", test counts, etc.) without running the tools.
- Treats new files at the meta-docs root as "the prior session created these, must be intentional" without checking against rule 15.

When healthy signs dominate, implementation is safe to start with normal review cadence. When warning signs are present in plurality, additional rounds of focused re-reading or clarifying questions are needed before implementation.

### Pre-commit security reinforcement (post-Public-repo era)

For projects whose repository is publicly visible (or will be at any near-term horizon), the pre-commit / pre-push gitleaks + trufflehog scan is **mandatory on every commit**, including:

- Documentation-only commits.
- "Trivial" formatting changes.
- The very commit that introduces the security rule itself.
- Handover / change-log commits.

History from this project: on the day this discipline was introduced, the doc-drafting commit nearly re-introduced previously-redacted secret types (CI tokens × 9 + an internal-service UUID × 1). Pre-commit scan caught it. Without that scan, world-visible re-leak.

"My grep found nothing" is not acceptable. Run the industry tools. Every time. No self-exceptions.

---

## Anti-patterns (drawn from this project's session history)

### ❌ Target-user / scope misidentification on cold start

```
Cold-start session reads handover, sees "educational tool", assumes
   educational = simplified for children = reduce functionality.
Actual target user (per memory + handover, if read carefully): adult
   technical-school students, vocational engineers, university students,
   FabAcademy participants. All of them are heavy users of the integration
   the project supports. Reducing functionality is the wrong direction.
```

Defense: the handover and project memory have a target-user statement and a "passing-grade" definition. Read both before starting. If you find yourself thinking "let's simplify for the educational scope", check those sources first.

### ❌ Scope self-confirmation after an "API is missing" finding

```
Cold session: "Library X has no setFoo API."
Mechanical conclusion: "Defer Foo support to polish phase."
Better conclusion: evaluate against the project's passing-grade anchor,
   consider workarounds (retain-publish override, fork, vendored patch),
   present options with severity labels for user decision.
```

Defense: a missing API is not automatically a defer. The judgment is "given this constraint, what minimum implementation reaches the passing-grade definition?" Workarounds are a legitimate first-class answer.

### ❌ Trap recognition without action (the case-18 meta-trap)

```
Self-check: "I am applying the scope-confirmation trap. ✅ noted."
Recommendation kept identical: "But effort dropped, so OK."
```

This is the most dangerous failure mode because it looks like compliance. Defense: if a self-check identifies a trap as "applicable", you must either change the recommendation or surface new evidence (not previously considered) for why the recommendation survives. "Reduced effort" / "scope reduced" / "conclusion unchanged" do not count as new evidence — they are symptoms of the trap, not solutions.

### ❌ Checklist mentality for axes / traps

```
Decision review table:
  axis 1 (system stability): applicable / mitigation: documented
  axis 2 (maintainability):  applicable / mitigation: documented
  axis 3 (release timing):   applicable / mitigation: documented
  axis 4 (framework iso):    not applicable
✅ all axes addressed.
```

This tells the user nothing about whether the action priority changed. Axes are thinking lenses, not pass/fail criteria. When axis 1 is touched, escalate to 🔴 immediately and re-evaluate the action plan, not just write "documented."

### ❌ Mechanical adoption of strategy reviewer's suggestion

```
Strategy reviewer (different agent, persistent memory):
   "Recommend deferring Phase 1 to next release."
Cold session: "Adopting." [no grep, no source read]
Two sessions later: user verbatim direction surfaces, deferral overturned.
```

Defense: the strategy reviewer's memory is an asset; their conclusion is one input. Verify with grep / source read / test run, then decide on evidence.

### ❌ Re-introducing already-redacted material in handover docs

```
Doc drafting: "for completeness, recording the secret values that history-rewrite removed: <values>"
Pre-commit scan: trufflehog unverified 0 → 10. Abort.
Fix: redact in doc, re-scan, then commit.
```

Defense: handover docs do not need the secret values. Type + count + sanitized placeholder is sufficient (`[REDACTED] × 9 commits cleaned via filter-repo`). If you find yourself wanting to "preserve historical accuracy", run the pre-commit scan first to see what your accuracy just leaked.

---

## Related rules

- `02-design-principles.md` — the 10-step pre-implementation checklist this rule's Step 5 invokes.
- `12-collaboration.md` — wait-for-go and design-proposal format Step 5 follows.
- `judgment-mistakes-history.md` — the running record of past judgment failures Step 1 internalizes.
- The project's pre-commit security rule — invoked at Step 5's commit gate (this project: `digicode/14-security-pre-commit.md`).
- The project's library-adoption rule — relevant when cold-start work touches dependencies (this project: `digicode/15-lib-adoption-protocol.md`).
- `14-decision-framework.md` — the 4-axis / 5-trap framework Step 4's severity labels feed into.
- `15-docs-organization.md` — meta-docs 2-layer structure; Step 1 reads this rule, Step 4 flags root-level violations as a separate finding class.
- `01-investigation.md` — Step 3's "re-read fully, don't trust grep hit counts" expands here.
