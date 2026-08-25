# Rules — Index & Decision Tree

> **Origin: DigiCode (2024–2026).** This rules system was battle-tested on a real project. Incident references (BUG-XXX / Session NNN / case N) inside the rules are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. Substitute origin-specific paths/commands/stacks with your project's equivalents; append your own cases; never delete the originals.

**Audience:** Claude (working on digicode-text). This is your runtime reference. The user trusts you to manage these — optimize for your own consumption.

**Last reviewed:** 2026-07-07 (template edition, extracted from DigiCode at Session 166 state)

---

## Core (mandatory read)

> Everything below this section is **conditional**: opened when a trigger row points at it, not every session. Keep this section navigational — see §Writing for the reader, principle 5.

### How to use this directory

1. **Every new session, read this Core section** (how-to-use + decision tree). It routes you to everything else.
2. When you start a task, check the decision tree → pick the relevant rules. Read them fully (quality over tokens).
3. Rules are in **English** because it's denser for token consumption and less ambiguous for Claude. Project content (i18n strings, comments, user-facing docs) stays in its original language.
4. **Memory vs. rules:** memory = point-in-time observations (decay). Rules = durable. **When they conflict, rules win.** Update memory if it's stale.

---

### Decision tree (find the right rule fast)

Common rows (transferable, keep). Add project-specific rows as your `local/rules/digicode-text/` grows — see the origin example at the bottom of this table.

| Trigger | Read |
|---|---|
| **The session is getting long — many tool calls, big outputs, hours elapsed — or you are about to start a build / real-fire / delegation, or a fact just became load-bearing** | **`reference/context-handoff.md` (★★★★★ — write the state to disk NOW, not at close. Compaction is a lossy summary taken at a moment nobody chose, and it drops exactly what reads as "detail": a measured number, the wording of a ruling, the path already ruled out. After a compaction, treat yourself as a cold start)** |
| **New session start / cold start after crash / context-window exhaustion / agent handoff** | **`common/13-session-recovery.md` (★★★★★ — read first, every cold start); §5 actuals come from `scripts/baseline.sh` — a project without one either adopts it (its PROJECT block must name *that* project's gates, so it is adapted, never copied) or carries the command inside each baseline row. Never from the handover's previous numbers** |
| **Creating any new file under `prompt/maintenance/` (meta-docs)** | **`common/15-docs-organization.md` (★★★★ — root-forbidden, 2-layer global/+local/ decision tree)** |
| **Drafting legal docs / public APIs / security disclosures / anything user-facing about internals** | **`common/16-attacker-perspective-defense.md` (★★★★ — minimize attack surface, no self-declared limits, no law-section recitation)** |
| **About to write "out of scope" / "post-release polish" / "deferred to follow-up" in any plan or recommendation** | **`common/17-no-self-imposed-scope.md` (★★★★★ — do not self-impose scope; the user owns scope decisions; founding use case is the anchor)** |
| **User voices doubt / 違和感 about real-machine or production behavior** | **`common/12-collaboration.md` §Observation-to-measurement (★★★★★ — never close the reply with a design-rationale explanation; convert it to a registered measurement item; acceptance does not waive it; case 43)** |
| **Adding a settings dialog / persisted store field / any config that must reach a final effector (HW, API, output)** | **`common/18-setting-hw-reflection-integrity.md` (★★★★★ — end-to-end reflection verify, orphan storage forbidden, domain-wide vertical scan)** |
| **Modifying a feature that has a reference implementation (upstream lib / working sibling)** | **`common/19-reference-implementation-survey.md` (★★★★ — survey ALL same-class items + comparison table before GO)** |
| **Packaging a proven feature for installers/operators (setup wizard, install script, handbook, admin UI)** | **`common/21-installer-experience.md` (★★★★ — write out the installer's actual steps first; lightest-burden method wins; walk your own document)** |
| **About to deploy / after real-environment testing finds problems** | **`common/20-deploy-batching.md` (★★★★ — batch all fixes into one deploy)** |
| **About to START any non-mechanical implementation / investigation / experiment (the moment of choosing who does the work) — also: writing a delegation prompt, a returned plan/conclusion, lane disagreement, an expensive-to-get-wrong judgment, classifier flag, editing AGENTS.md, bootstrapping, or changing test command / structure map / language policy / delegate limits** | **`common/22-model-orchestration.md` (★★★★ — Orchestrated Reasoning. Before starting, state the route/lane decision in ONE line — "solo because X" is valid; the silent default is forbidden (§Routes). Delegation activates `DELEGATED_SCOPE_ACTIVE`: worker-exclusive technical scope, parent bounded-deliverable review only (§Delegation exclusivity / §Bounded review). What the parent may still do while it runs is not a judgment call — §Delegation action classification carries the ordered decision, executed by `scripts/delegation-scenarios.py`, and the discriminator is never "did the parent use a tool" (the instrument that made it one reddened on a status poll and a read of the handover). Packets use the global contract; authority = Human / orchestrator / executor / integration-owner. Disagreement is a finding, never a vote. AGENTS.md is per-project, never inherited — B13/B15-B17)** |
| **Adopting a metered API (per-token / per-second / per-execution), making the first paid call, or quoting a per-run or per-month cost to the user** | **`common/23-metered-api-cost.md` (★★★★ — price the *heaviest real* input class, never the lightest; client disconnect does not stop server-side work or billing; pin `timeout`/`max_retries`; surface balance and spend cap to the user first)** |
| **Adding or moving a UI control, menu entry, link, tab, or download — at the moment you pick where it goes, not at review** | **`common/12-collaboration.md` §UI placement signaling (★★★★ — name the cluster it belongs to, place it adjacent to that cluster, and justify the cluster in the plan. Placement is a claim about relatedness and the user reads it as one; the rule existed with no trigger reaching this moment, and a consumer project shipped a download link into the wrong section — "こんなことするから UI が荒れる")** |
| **About to add a rule, a check, a script or any new mechanism — or to say what to work on next** | **`CLAUDE.md` §4 Strategic axis (★★★★★ — state in one line which observation produced this. A mechanism you cannot trace to an observation is work that *looks* good rather than work the project asked for, and it is the shape drift takes: it never feels like drift, because each piece is defensible. If you cannot name the observation, it is a proposal for the user, not a task. *Armed by selftest B14* — §4 left as placeholders is red, because an anchor that is empty still reads as present)** |
| **A finding appears mid-work (a red test, a defect noticed in passing, an improvement you could make) — or the acceptance criteria of what the user asked for have just been met** | **`common/24-objective-control.md` (★★★★★ — classify before acting: BLOCKER / ADJACENT_DEFECT / HARDENING, decided by *does this block acceptance of the current objective*, never by severity. RED is evidence, not authorization. Acceptance is DONE — after it only the required close work continues and everything else needs a human GO. STOP is the harness's own duty: "there is still something technically possible" is true in every repository forever and is never a reason to continue. This is rule 17's mirror — 17 forbids narrowing the objective, 24 forbids widening it. Executed, not asserted: `scripts/objective-scenarios.py`)** |
| **About to dispatch — choosing which target the work goes to, or moving a reasoning effort off its baseline in either direction** | **`common/22-model-orchestration.md` §Routing decision (★★★★ — the route is a decision, not a setting. Values (model mapping, effort scale, baseline, which target is Human-only) live in ONE file, the project's routing profile; the rule owns the policy and the grammar. Above baseline needs an authorised reason AND evidence tied to this task; below baseline is refused just as firmly; a `HUMAN_GO_REQUIRED` target STOPs and asks. A transport accepting a value is capability, never compliance. Executed: `python3 scripts/routing-scenarios.py`)** |
| About to draft a design proposal / Decisions-for-user table | `common/17-no-self-imposed-scope.md` + `common/02-design-principles.md` + `common/12-collaboration.md` |
| About to make a non-trivial judgment (defer vs ship / scope cut vs full implementation / workaround vs polish) | `common/14-decision-framework.md` (4-axis lenses + 5-trap self-check + project-lead anchor) + `common/17-no-self-imposed-scope.md`; first time or when the axes feel like a checklist → `reference/four-axis-essence.md` |
| Repeated fixes that don't stick ("直しても直らない" loop, 2+ failed attempts on the same symptom) | `reference/whole-system-analysis.md` (局所修正の罠 — stop patching, investigate the whole) + `common/01-investigation.md` |
| About to plan a fix / change | `common/02-design-principles.md`, `common/12-collaboration.md`, `common/judgment-mistakes-history.md` (self-check mandatory), `common/14-decision-framework.md` |
| About to state "fix complete" / "root cause confirmed" / "handled" | `common/judgment-mistakes-history.md` **Part 1** (★★★★★ — taxonomy + self-check + case index; open Part 2 case bodies only on a pattern match) |
| Planning a multi-phase fix sprint / choosing commit shape for a batch of fixes | `reference/phase-patterns.md` (5 commit-shape patterns + lessons from a 14-phase sprint) |
| Interpreting smoke / test / log output | `common/judgment-mistakes-history.md` (beware truncation / head-or-tail-only judgment) |
| **About to write "全合格 / all passed" / "検出力を示した" or any verification summary** | **`common/04-testing-strategy.md` §Verification-type labeling + §Show the test has detection power (★★★★★ — label each pass static/synthetic/API-smoke/visual/real-fire; no "all passed" while real-fire un-run; one mutation per claimed behaviour and no surviving mutant; counts measured at write time)** |
| **Accepting a change to anything rendered (UI, generated document, output artifact) / about to hand a verification procedure to another person** | **`common/04-testing-strategy.md` §The instrument must measure the dimension you are judging (★★★★★ — existence checks cannot see appearance; render and look, in every state; walk the path before asking someone else to)** |
| **An acceptance criterion is an absence ("0 external requests", "nothing written outside X", "no leak") / launching a subject with the network, DNS, or filesystem cut off / about to quote an API's boolean as proof** | **`common/04-testing-strategy.md` §When the acceptance criterion is an absence (★★★★★ — a subject that never ran satisfies an absence perfectly; check the positive control before the count, and show the instrument can return false)** |
| **About to quote a numeric gate — a budget, threshold, quota, cost estimate, "残り N" / "N left" / "under budget" — or to set one** | **`common/04-testing-strategy.md` §A gauge reports its unit (★★★★★ — say the unit and, once, how it diverges from what you are judging; emit the unit from the measuring command so consumers cannot restate it from memory. A proxy that is merely imprecise costs accuracy; one that moves opposite to the real quantity costs the decision. Measured on this harness: its own read budget counted lines while being quoted as "読み込み負荷 / 残り N", mis-pricing the set 3.32× — PT-10)** |
| Investigating a bug, even if a bug-file exists | `common/01-investigation.md` (★★★★★ — read every time) |
| Writing or reviewing code | `common/03-coding.md` |
| Removing code (any kind) | `common/06-dead-code-removal.md` |
| Touching i18n / translations | `common/07-i18n.md` |
| About to commit / push — **or creating a directory that will hold generated / runtime data (uploads, ingest queues, caches, exports, logs, harness results)** | `common/05-commit-workflow.md` (+ your project's pre-commit security rule if the repo is public). The `.gitignore` decision belongs in the commit that creates the directory, not in the `git status` that later notices it |
| Verifying static checks / pre-deploy | `common/04-testing-strategy.md` |
| Touching state machines / effects / flags | `common/10-state-machine.md` |
| Adopting a new library / dependency | `common/11-dependency-upgrade.md` (+ your project's lib-adoption rule if you have one) |
| Upgrading a dependency / SDK | `common/11-dependency-upgrade.md` |
| Using runtime-constrained APIs (edge runtime, embedded, sandbox) | `common/09-runtime-research.md` |
| Working with generated/derived artifacts (catalogs, codegen, schemas) | `common/08-data-validation.md` |
| Done with a task that has follow-ups | `common/12-collaboration.md` |
| **Before** adopting or upgrading a library / runtime on the list — and also when one of them fails inexplicably | `reference/known-pitfalls.md` (its own Audience line puts the primary moment *before* adoption, alongside `common/11-dependency-upgrade.md`; the post-failure lookup is the secondary use) |
| Wondering whether a persistent-memory entry exists for this topic, or about to write one | `reference/memory-index.md` |
| Adding migration / compat code, or wondering whether an old shim may be removed | `reference/migration-history.md` (sunset-date registry) |
| **Changing how rules travel between projects / about to commit into another project's repo / harvesting back into the template** | **`OPERATIONS.md` §1 (★★★★ — the model is fork + harvest, *not* sync; the sync exception is bounded and carries obligations). Template repo only.** |
| **Added or edited a guard check in `scripts/selftest.sh` — or about to write "this check has detection power"** | **`scripts/mutation-harness.py` (★★★★ — run it. It breaks the guarded contract on a COPY of the repo and requires the check to go green→red; survival 0 with printed denominators, `M=0` refuses to pass. **A catalog entry whose target file this repository does not have is `NOT_APPLICABLE` (`A`), never `INVALID` and never a kill** — a consumer legitimately drops template-repo-only files, and conflating the two once took a whole run down before it printed a single verdict (`--control missing-target` reproduces that condition here, where it cannot otherwise occur). Measured S012: 84 of 100 guard predicates rested on a single line and 5 stayed green while the obligation they name was demoted into a superseded section or dropped from its contract block. A check that has only ever run against a healthy repo is unverified — case PT-4)** |
| Changed hooks, `settings.json`, templates, or any harness structure — **and at every cold start, as part of rule 13 Step 4** | `scripts/selftest.sh` — run it; RC captured independently, never through a pipe. Until 2026-08-14 this row was the file's *only* inbound edge, and it matches nothing a cold start does: the harness checks then fire only when someone happens to edit the harness |
| **Current state answers *what*, and 16.md §3's rejected-option grounds answer *why it stands* — and you still cannot settle a question about a past decision, a number's provenance, or the premise a mechanism was built under; or the user asks about a past session** | **the relevant `local/handover/sessions/S{NNN}_*.md` (★★★★ — historical evidence, never current authority). Find it by what it is about, not by recency: 16.md §1 "Where the rest lives" names the file for the fact you are chasing, and `改定log.md` indexes every session in one line each. The newest file is the right one only when the question is about the newest work. Session history is a CONDITIONAL read (`CLAUDE.md` §0, ruling N-α 2026-08-25) — "just in case" is not a trigger, and the unconditional version cost 341–10,294 tok decided by nothing but the previous author's word count (13/13 measured)** |
| **A cold start finds differences in `global/rules/` it cannot explain / asks which template snapshot this project is on** | **`prompt/maintenance/local/docs/RULES_SNAPSHOT` (receiver-side only; written by the syncing side — `OPERATIONS.md` §1 obligation 2, which owns the path and the reason it is under `local/`). Measured 2026-08-14: LaserEditor touched this filename twice — in a sync-commit file list and in a rule-15 root scan — never opened it, and reconstructed the snapshot by hand with `git diff --name-only`. Appearing in a git diff is not an edge either** |
| **Overwriting 16.md at close — or writing a §2/§3 row that asks whether to *include* something** | **`common/17-no-self-imposed-scope.md` §Step 4.6 Handover mechanics (★★★★★ — a settled requirement restated as a question whose default is "no" has already been cut, and no row may leave §2/§3 unaccounted. Run `scripts/handover-diff.sh` and classify every removal as done / dropped-by-user / lost. Measured on a consumer project: a canonical requirement became such a question at one close, its work row was gone at the next, and git records no user decision — while the same commit recorded the opposite ruling)** |
| **Handing project context to an actor without repo access (Route B primary) — never hand-assemble from memory** | `scripts/context-brief.sh` (allowlisted, HEAD-stamped, fail-closed — the only sanctioned export surface; rule 22 §Routes) |
| **The session opens with `SESSION_ROLE: REVIEWER`, or 16.md §2 carries a "Review complete — fixes pending" baton row** | **`common/22-model-orchestration.md` §Session role + §Review-report baton (★★★★ — REVIEWER never modifies or commits repo-body files; a fix-session PRIMARY reads the newest `local/reviews/` report with §0 standing before any fix work)** |
| Closing a session | `.claude/commands/close.md` (`/close`) — its step 1 runs `scripts/usage-report.sh` (AI USAGE REPORT: per-actor tokens/calls, coverage limits in its own footer) |
| Creating a file under `local/`, or naming a bug / plan / session file | `prompt/maintenance/local/README.md` |
| **About to write a new rule, restructure one, or decide what belongs in the mandatory-read set** | **§Writing for the reader below (★★★★ — the reader is a model, not a person)** |

**Origin example — project-specific rows (DigiCode).** These rows lived in this same table alongside the common ones; write yours in the same style and register the rule files under `local/rules/digicode-text/`:

| Trigger (origin example) | Read |
|---|---|
| Adding a new Blockly block | `digicode/03-block-workflow.md` + `digicode/02-brand-terms.md` |
| About to commit (repo went Public) | `digicode/14-security-pre-commit.md` (★★★★★ — gitleaks + trufflehog mandatory) |
| Looking at the user's secrets / tokens | `digicode/06-secrets.md` (★★★★★ — never violate) |
| About to use `text-gray-*` / `bg-red-50` | STOP — `digicode/08-ui-theme.md` |

---

## File layout (2-layer: global/ + local/)

```
prompt/maintenance/
├── global/                         <- cross-project transferable. Came from the template; evolves slowly.
│   ├── rules/
│   │   ├── README.md               <- you are here
│   │   ├── common/                 <- 24 transferable rules (01-23 + judgment-mistakes-history)
│   │   │   ├── 01-investigation.md         ★★★★★ Full-codebase grep, bug-file = lower bound
│   │   │   ├── 02-design-principles.md     ★★★★★ Plan before code, scope discipline, no-half-baked
│   │   │   ├── 03-coding.md                ★★★★   Type safety, naming, comment policy, fix-at-source
│   │   │   ├── 04-testing-strategy.md      ★★★★   Static + unit + integration + step-by-step UAT
│   │   │   ├── 05-commit-workflow.md       ★★★★★ Atomic, plan/atomic/post-commit-docs, diagnostic revert cycle
│   │   │   ├── 06-dead-code-removal.md     ★★★★   Pre-grep, import chains, sunset dates required
│   │   │   ├── 07-i18n.md                  ★★★★   Canonical source, labels injection, all-langs same-commit
│   │   │   ├── 08-data-validation.md       ★★★★   Catalog-driven, triangulation, KNOWN_BROKEN allowlist
│   │   │   ├── 09-runtime-research.md      ★★★★★ Pre-deploy spec verification, runtime ≠ local
│   │   │   ├── 10-state-machine.md         ★★★★   Flag base over string match, setState bailout antipattern
│   │   │   ├── 11-dependency-upgrade.md    ★★★★   CHANGELOG first, API rename full-grep
│   │   │   ├── 12-collaboration.md         ★★★★★ wait-for-go, plan review, step-by-step UAT, self-check
│   │   │   ├── 13-session-recovery.md      ★★★★★ Cold-start protocol + baseline-actuals + violation flagging
│   │   │   ├── 14-decision-framework.md    ★★★★   4-axis thinking lenses + 5-trap self-check + severity labels
│   │   │   ├── 15-docs-organization.md     ★★★★   Meta-docs 2-layer (global/+local/) + root-forbidden + decision tree
│   │   │   ├── 16-attacker-perspective-defense.md ★★★★ Minimize attack surface in docs/terms/design; default-to-omit
│   │   │   ├── 17-no-self-imposed-scope.md ★★★★★ Do not self-impose scope; founding use case is the anchor
│   │   │   ├── 18-setting-hw-reflection-integrity.md ★★★★★ Settings must reach their final effector end-to-end
│   │   │   ├── 19-reference-implementation-survey.md ★★★★ Survey ALL same-class items before designing
│   │   │   ├── 20-deploy-batching.md       ★★★★   Batch all changes to a deploy target into one deploy
│   │   │   ├── 21-installer-experience.md  ★★★★  Installer/operator UX: walk the steps, pick the lightest path
│   │   │   ├── 22-model-orchestration.md   ★★★★   Parent-led multi-model lanes, delegation packet, review asymmetry, AGENTS.md sync
│   │   │   ├── 23-metered-api-cost.md      ★★★★   Price the heaviest real class; disconnect ≠ stop; pin timeout/max_retries
│   │   │   ├── 24-objective-control.md    ★★★★★ PRIMARY_OBJECTIVE, finding classification, acceptance is DONE, STOP duty
│   │   │   └── judgment-mistakes-history.md ★★★★★ Past-mistake patterns; mandatory self-check pre-design-review
│   │   └── reference/              <- lookup tables + educational deep-dives (origin content preserved; append your own)
│   │       ├── memory-index.md             memory file → when to consult (rebuild for your project)
│   │       ├── phase-patterns.md           commit-shape patterns + lessons (origin: DigiCode P4)
│   │       ├── known-pitfalls.md           library-specific traps (append your stack's)
│   │       ├── migration-history.md        sunset dates registry (start yours empty, keep the format)
│   │       ├── four-axis-essence.md        rule 14 companion: 4-axis / 5-trap の本質理解 (checklist 化の誤解潰し)
│   │       └── whole-system-analysis.md    rule 14 companion: 局所修正の罠(モグラ叩き)と全体視点の回復
│   ├── templates/                  <- file templates
│   │   ├── bug-template.md
│   │   ├── plan-template.md
│   │   ├── investigation-template.md
│   │   └── rule-template.md
│   └── {bugs,handover,plans,investigations,docs,legacy}/  <- empty skeleton (.gitkeep), structure mirror
│
└── local/                          <- THIS project only. Never copied to other projects.
    ├── README.md                   <- local layer operating standard (naming, lifecycle)
    ├── rules/digicode-text/     <- project-specific rules, numbered 01-…, same format spec
    ├── docs/                       <- system overview, deploy procedures, troubleshooting (00- numbered)
    ├── handover/                   <- 16_… (現在地・上書き) / sessions/ (履歴・1 session = 1 不変file) / 改定log.md (索引) / maintenance_index.md (地図)
    ├── bugs/active/                <- open bugs + index.md      (close = move file to closed/)
    ├── bugs/closed/                <- closed bugs + index.md
    ├── plans/active/               <- plans in flight (NN_slug.md; big plans get a subdir)
    ├── plans/completed/            <- finished plans (move on completion)
    ├── investigations/             <- audits & investigation records (YYYY-MM-DD_slug.md)
    └── legacy/                     <- superseded docs kept for archeology (header points to successor)
```

**Decision tree for placing new files**: see `common/15-docs-organization.md`. Cross-project transferable → global/, project-specific → local/, unsure → local/ by default. Creating files directly under `prompt/maintenance/` root is **forbidden** (rule 15).

---

## File format spec

Every rule file follows this structure (template: `global/templates/rule-template.md`):

```markdown
# Rule: <short name>

**Severity:** ★★★★★ / ★★★★ / ★★★ (frequency × pain if violated)
**Scope:** common | digicode-text
**Last reviewed:** YYYY-MM-DD
**Related memory:** <memory file names, if any>
**Related cases:** BUG-XXX, Phase X, kaitei-log #Y

## TL;DR
1-3 lines, copy-pasteable rule statement. Read this first when scanning.

## Why this exists
Past failure cases. Be specific (BUG IDs, commits).

## When to apply
Trigger conditions. Be concrete — list grep commands, file patterns, etc.

## How to apply
Step-by-step. Code examples / commands preferred over prose.

## Anti-patterns
What violations look like, with bad/good code pairs.

## Related rules
Cross-refs to other files in this directory.
```

---

## Writing for the reader (the reader is a model)

**Established 2026-08-14 by user direction:** 「このプロジェクトルールは私が読んで作業するというよりは、Fable や Opus が主に読んで作業するので、Fable や Opus 目線でどう構築されていれば、より機能するかを優先する」

Not style preferences. Each is a failure measured on this harness, paired with the mechanism that now catches it.

**1. A model follows edges; it does not browse.** A document with no inbound trigger row is operationally absent. `OPERATIONS.md` — which defines how rule changes travel between projects — had zero references from the decision tree and zero from CLAUDE.md; a session then spent an evening changing exactly that subject without opening it once. Appearing in a directory diagram is not an edge. *Enforced: selftest B1/B2.*

  **Measured four times in one day (2026-08-14), all the same shape — the guidance existed, in full, and no edge reached the moment it was needed.** `OPERATIONS.md` (zero inbound rows; a session changed its subject without opening it) → `scripts/selftest.sh` (one row, "you changed the harness", which no cold start matches, so the checks fired only for whoever edited them) → `RULES_SNAPSHOT` (a consumer session touched the filename twice, in a sync-commit file list and a rule-15 scan, opened it neither time, and hand-reconstructed the snapshot with `git diff`) → `12-collaboration.md` §UI placement signaling (a complete procedure, reachable only from rule 12's own body, whose triggers are "user voices doubt" / "drafting a design proposal" — none of which fire while you are choosing where to put a download link; the consumer shipped it into the wrong section and the user's word for the result was 「UI が荒れる」). **Being correct and being reachable are independent properties. Audit for the second one by asking, of each rule, "what is the reader doing in the second before they need this?" — and put a row on exactly that.** Appearing inside another rule's body is not an edge either.

**2. Triggers must be enumerated, not described.** "When a rule that feeds AGENTS.md changes, regenerate it" was read in full and still not applied — because "a rule that feeds AGENTS.md" is a description the reader must first evaluate, and evaluating it requires already knowing the answer. The same obligation as a closed list (*editing 03 / 04 / 05 / 07 / 17 / 22 → regenerate*) fires. Prefer file numbers, path globs and literal strings over categories. *Shape: rule 22 §AGENTS.md maintenance.*

**3. Make the correct action the cheapest one.** Under token pressure a model takes the cheapest path, and exhortation does not change relative cost. A baseline row reading "実測。申告値の転記禁止" gets transcribed anyway, because measuring first requires inventing a command. The same row carrying its command — ``case index 36(`^### case [0-9]` で数える)`` — gets measured, because measuring is now the cheap path. Ban-and-exhort is the weakest instrument available here; cost inversion is the strongest. *Enforced: selftest B5.*

**4. Tables for what and when; prose for why.** Anything consulted mid-task — indexes, triggers, rosters, severity — should be a table: scanned, matched, exited. Prose earns its place only where the reader must be *persuaded*, i.e. where the failure mode is rationalization rather than ignorance. Rule 17's incident narratives are prose for exactly that reason: a model that knows the rule still talks itself out of it (case 18).

**5. Unconditional cost is paid every session; conditional cost is paid on match.** The mandatory set must therefore be navigational — indexes, triggers, self-check questions — with narrative behind a match. `judgment-mistakes-history.md` proved the shape: 1,049 lines of which 129 are mandatory, case bodies opened only on a suspected match. A rule needing both a large body and a place in the mandatory set declares `## Core (mandatory read)`; only that section counts against the budget. **Never solve read-load by deleting incidents** — the two sibling projects that abandoned this system did so at 700+ lines of *undifferentiated* mandatory reading, not because the incidents existed (and §設計方針 settles that real cases are never deleted). *Enforced: selftest B4.*

**Corollary — verify with the whole token, not a substring.** A model's own checks are subject to principle 2. `grep "README.md"` matched `rules/README.md` and reported `local/README.md` as reachable when it was not, producing two confident false greens inside the very session that was auditing reachability. When a check answers "does X already exist / is X already covered", match the whole path or identifier.

---

## Severity scale

- **★★★★★** — read on every relevant task; violation = production incident or hard-to-recover state
- **★★★★** — read when the task touches the area; violation = significant rework or technical debt
- **★★★** — read at session start as context; violation = minor friction

---

## Rule pruning & consolidation (anti-bloat protocol)

Rules only ever get added; without pruning, the mandatory-read volume grows until it stops being read (observed: two 2nd-generation projects inherited 700+ lines of cases and appended zero of their own in 15+ sessions each). Waste in this system concentrates not in rule *content* but in the *same content living in multiple places*. Protocol:

- **Trigger**: every ~10 sessions, or whenever `common/` exceeds 25 files, run one consolidation review.
- **Merge** rules whose TL;DRs overlap heavily — keep the older number, fold the newer in, leave a tombstone file pointing to the survivor.
- **Orphan check**: every file under `rules/` and `reference/` must be reachable from at least one decision-tree row. Unreachable = dead weight — add a row or demote to `local/legacy/`.
- **Single source of truth — one fact, one canonical owner** *(2026-08-25 user ruling; the prior form was "current-state lives in 16.md only", which named one file but not the rule that makes it work)*. Every fact has exactly one file that owns it; every other appearance is a reference, and a reference never restates the fact's content. Four classes, and the boundary between them is what actually does the work:
  - **CURRENT STATE** — what is true now. Exactly one canonical owner (this template ships a single one: `local/handover/16_…md`). Objective, GO/STOP boundary, batons, settled decisions, baseline, generation.
  - **ROUTING / INDEX** — points at an owner, carries no fact of its own: `CLAUDE.md` §0/§2/§3, `改定log.md`, `maintenance_index.md`, the SessionStart hook.
  - **HISTORICAL EVIDENCE** — `sessions/S{NNN}`, `investigations/`, `reviews/`, past commits. Records what was true then. **History is not current state**: a session file saying "next task = X" is not an instruction, whatever it says, once the current owner has moved on. Historical files are **immutable** — never edit one to agree with the present; that destroys the evidence and still leaves two owners.
  - **SETTLED / SUPERSEDED DECISION** — a user ruling. A later ruling may legally **supersede** an earlier one: the current owner records the new decision *and names the condition it replaced*, and the historical source stays untouched. Without that move the only available acts are "reopen a settled decision" (forbidden) and "delete it quietly" (undetectable) — measured here at the 2026-08-24 close, where a settled row survived only because `handover-diff.sh` reported it GONE.
  - **Splitting the current owner by topic is an OPTIONAL CAPABILITY**, not the default — see `local/README.md` §handover. A project with one authority domain that splits anyway pays reconciliation duties for nothing, and gains a new failure mode: separate files stay internally consistent while a fact goes missing between them.

  Rules live here only (memory / external syncs are caches that decay — when they drift, rules win; prefer deleting the sync over maintaining it).
  - **Corollary — never write a measured count into prose, anywhere.** Name the command instead. A number in a sentence has no owner and no update trigger, so it drifts silently and is then read as fact. Measured three times on this harness: `case index 45` sat in CLAUDE.md §2 for three sessions while the actual was 48 (fixed by pointerising the table); "Part 1 … ~100行" in CLAUDE.md §0 understated a mandatory read by ~40% (148 here, 159 in the consumer project); and the consumer's repair of that same line **wrote the newly measured 159 back into the prose** — which the next case filing invalidates, because that index grows by one line per case. Correct shape: `Part 1(4分類+Self-check+case index)` + "the number comes from `scripts/read-load.sh`".
  - **Corollary 2 — the command must emit the unit alongside the number, and consumers must render what they were given.** Naming the command fixes drift in the *value*; it does nothing for the *unit*, which then lives in whatever prose surrounds the call. Measured 2026-08-15: `read-load.sh` counted lines while three consumers — a selftest line, a baseline row, and a handover in another repo — each independently spelled it 「行」/「読み込み負荷」, so changing the unit would have left all three silently asserting the old one. The number now arrives as `<total> <budget> <unit>` and no consumer writes a unit of its own (selftest B10; rule 04 §A gauge reports its unit).
- **Emphasis budget**: prose-emphasis 🔴 in CLAUDE.md ≤5 simultaneous (table severity labels don't count). Adding a 6th demotes one.
- **Overlap watchlist — reviewed 2026-08-14, reclassified. None of the three pairs was duplication.** Each was measured on the passages themselves plus cross-reference counts in *both* directions:
  - **17 ↔ 14 ↔ 02** — complementary, not overlapping: 14 tells you how to weigh a deferral, 17 tells you whether the deferral is yours to declare. The real defect was one-directional edges (14→17 = 0 references, 02→17 = 0, while 17 pointed at both), so a session about to defer something never learned that the ★★★★★ rule forbidding it existed. Reciprocal pointers added.
  - **19 ↔ 01** and **18 ↔ 01** — the same exhaustiveness discipline aimed at different objects (reference family / setting domain / call sites). Cross-references were **0 in both directions** in both pairs. Reciprocal pointers added. **Correction (2026-08-14, measured):** this passage previously claimed the watchlist's "18 §D5.1" named a section that does not exist. It does exist — `### Discipline 5.1 — Audit scope must be a domain-wide vertical scan` — and `git show` confirms it was present in the initial template commit and in the commit that wrote the claim. The sentence warning against carrying identifiers forward without opening the file was itself written without opening the file (case PT-7).
  - **Lesson recorded instead of a merge:** what read as "the same content in three places" was three *missing edges*. Before proposing any merge, read the passages and count cross-references both ways — hit counts alone mis-classify (§Writing for the reader, corollary). Consolidation removes text; this corpus's measured failure mode is text that cannot be reached.

---

## Memory vs. Rules

| | Memory (`~/.claude/.../memory/`) | Rules (this directory) |
|---|---|---|
| Lifespan | Session-to-session, decays | Durable, explicitly updated |
| Source of truth when conflict | — | **Wins** |
| Format | Frontmatter + freeform | Strict (see file format spec) |
| Scope | Project-only | common + project-specific |
| Update trigger | Observed behavior | Reflective decision after Phase / incident |

When you find a memory entry contradicts a rule:
1. Trust the rule
2. Verify the rule still applies (check `Last reviewed` date)
3. If the rule is the one that's stale → update the rule, log the change
4. Update or delete the contradicting memory

### Cross-project live observation — runs only on an individual user directive

(Established 2026-08-14 by user direction, after it produced five rule changes in one evening. **Scoped 2026-08-19 by user ruling: observation fires only when the user orders it individually, naming the doubt to verify** — e.g. "is orchestration functioning? are the rules actually being read, or is work happening without them?". No standing observers: the continuous inbound channel is each project writing its own lessons at /close, and a watch nobody ordered burns tokens, not holes.) Rules improve fastest when a *different* project walks into their gaps. When the user orders an observation, **the first move is to enumerate what must be measured to answer "does it function", and run that measurement once, now** — continuous watching starts only after the measurement definition is fixed (PT-14: 20 hours of activity-watching produced less than one 2-minute measurement; PT-15: measure compliance and results, not access counts). Then, if watching is still warranted: watch it work, without touching it.

**How to watch without interfering.** Peer sessions appear in the agent listing; their transcripts are JSONL under `~/.claude/projects/<sanitized-cwd>/`. Extract *signals* — `jq` for tool-call names and truncated arguments, token usage, git state — never the whole transcript, which will bury your context. A background monitor with a tight filter turns the interesting moments into notifications. **Do not message a working session**: reading costs them nothing, writing lands in their context.

**A quiet monitor is not an idle session.** A filter tight enough to be affordable necessarily drops the tool calls a cold start is made of. Measured 2026-08-14: an observer reported the watched session idle while its transcript grew 29 KB → 990 KB, and was one step from committing into the repo whose HEAD that session was at that moment measuring. Read state from the artefact — transcript size, `git status`, the session's own report — never from the absence of notifications. **Never move their HEAD while they are measuring baseline.**

**Writing into the observed repo is a template-maintainer act, not part of observing.** Whether a rules change is pushed into another project at all is governed by `OPERATIONS.md` §1 (the model is fork + harvest; the sync exception is bounded and carries obligations). **A project that is not the template does not do this** — if you are reading this file inside a consumer project, the observation method applies to you and the sync does not. Where the exception does apply, stage only your own files: an uncommitted file of yours can break *their* acceptance criteria.

**Where rules get tested**, and therefore what is worth watching: the cold-start report (was the drift actually found, or transcribed?), the design proposal, the delegation packet, the acceptance review, the case filings.

**What to harvest is the gap your own rules just produced.** The first run of this yielded five changes, three of which were holes in rules written two days earlier — invisible from the desk, hit within a single session by the project actually using them. Read their close artifacts too: a session's self-assessment usually states its lesson more precisely than an outside observer can.

**Two cautions.** Do not overwrite what legitimately diverges — per-project case histories grow independently, so a harvest carries case *lessons* into the template, never case files out into another project. And an observer's inferences are exactly as unreliable as any other unverified claim: confirm from the transcript or the repo, and label what you could not (the first run produced two confident wrong statements about plan mechanics before measurement corrected them).

**Promotion path (origin: DigiCode):** an observation that survives 3+ sessions or 2+ phases graduates from memory into a rule. Failures graduate: incident → case entry in `judgment-mistakes-history.md` → (if structural) a numbered rule. This pipeline is how the origin project grew from 0 to 21 common rules — keep it running.

---

## How rules came to exist (origin story — DigiCode Phase 40-C, 2026-04-26)

Kept verbatim because it explains *why this system is shaped the way it is*.

P4 (2026-04-23 → 25) ran 14 modification phases for 42 closed bugs (39 fixed + 3 obsoleted). 9 of those were *secondary discoveries* found during fix Phases — not in the original P0–P2.6 audit. The user's retrospective ("scope was too narrow, analysis was insufficient") triggered this rules system.

10 root-cause patterns identified:
1. Bug file scope is a lower bound (up to 1000× under-estimated, BUG-039)
2. Caller-zero dead files hide in plain sight (a 229-line orphan component)
3. State machine that depends on hardcoded string matching breaks i18n
4. setState bailout + flag-as-state-machine = stuck flag (BUG-038)
5. Dependency upgrades skipped full-grep of API renames
6. Runtime constraints not pre-verified (edge-runtime crypto cap)
7. Migration code without sunset dates lingers forever
8. Audit tools should ship at MVP, not bolted on
9. Over-aggressive 1-word classifiers misfire
10. Library option side-effects are often undocumented

These patterns are baked into the rules. The deeper motivation (user, 2026-07-07): AI coding agents lose memory across sessions, must re-read project context every cold start, and repeatedly forget rules mid-session. This directory is the harness that compensates — regardless of model generation.

---

## Historical reference — `local/legacy/` convention

When a doc is superseded, move it to `local/legacy/` and add a header note pointing to its successor ("migrated to `rules/XX-….md`"). New lookups always go to `rules/` first; legacy files are kept for incident archeology only. (Origin: DigiCode migrated six 教訓 files this way — the header-pointer convention prevented anyone from following stale guidance.)
