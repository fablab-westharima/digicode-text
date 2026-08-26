# digicode-text — Claude Code Instructions

> **Reading rule:** This file is an index. Don't memorize details from here — follow the pointers and read the linked docs when relevant. Skim-reading is forbidden. When the task touches a referenced doc, fully read it.


---

## 0. CRITICAL: Read before any work

**Run `bash scripts/read-load.sh` first.** For each file below it emits "read up to line N and the mandatory portion is covered", as `Read limit:N`. Opening a file without knowing the range returns the whole file — measured in S004, that alone cost **+23.6%** over the entire mandatory set (files whose §Core sufficed were being read in full). **Do not copy the emitted line numbers into this file**: they are measurements, and a copied measurement loses its update trigger and drifts (`rules/README.md` §Single source of truth).

When resuming a session, read these in order:

1. **`prompt/maintenance/global/rules/README.md` §Core (mandatory read)** — how-to-use + decision tree. **Everything after §Core is opened only when a trigger row points at it** (§Writing for the reader = read when writing or restructuring a rule)
2. **`prompt/maintenance/global/rules/common/13-session-recovery.md`** — cold-start protocol, full read (this rule IS the mandatory-read activity, so it is not folded) (★★★★★)
3. **`prompt/maintenance/global/rules/common/17-no-self-imposed-scope.md` §Core only** — self-imposed scope is structurally forbidden; the founding use case is the anchor (★★★★★). The body (Why / Steps / Anti-patterns) is opened at the moment you write a scope judgment
4. **`prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`** — primary handover, current state
5. **`prompt/maintenance/global/rules/common/judgment-mistakes-history.md`** — judgment-failure pattern history (★★★★★). **Part 1 (taxonomy + self-check + case index) is mandatory every session** (no line count written here — the truth comes from `bash scripts/read-load.sh`; the period this file said "~100 lines" the actual was 148 lines, understating it by 60%. origin: LaserEditor S017 🟢4). Part 2 case bodies are read only when the taxonomy / index raises a suspicion of a match (no full read-through — a read-through obligation decays into ritual)
6. Task-specific rules from `global/rules/common/*` and `local/rules/digicode-text/*` (per README decision tree) — **conditional**

**Session history is conditional, not unconditional** (2026-08-25 user ruling N-α, re-deciding the 2026-08-24 N-1). Files under `local/handover/sessions/` are **historical evidence and never current authority** — everything a cold start needs to *act* is in 16.md, which was measured restoring all of `PRIMARY_OBJECTIVE` / GO-STOP / batons / OPEN-HOLD-DEFERRED / settled-superseded / baseline / GEN / current authority on its own. Open the relevant `S{NNN}` file — **the relevant one, which is often not the last one** — only when one of these fires:

- current authority plus 16.md §3's rejected-option grounds are **not enough** to settle why a decision stands;
- you need the **provenance** of a number, a ruling or a mechanism (who measured it, under what premise);
- 16.md §1's "Where the rest lives" pointer resolves to a session file for the fact you are chasing;
- the **user asks** about a past session.

"I'll read it just in case" is not a trigger — that is the unconditional read this ruling removed. It cost 341–10,294 tok depending on nothing but how long the previous author wrote (measured over 13/13 session files), and its content was measured redundant against 16.md + `investigations/` + the decision tree.

**This section is the owner of the cold-start read contract.** 16.md §5 points here and does not restate it; `scripts/read-load.sh` measures exactly this set and selftest B53 fails if the two disagree. Two files also arrive without being opened — the SessionStart hook injects 16.md and `local/bugs/active/index.md` — and they are unconditional cost, so they are in the measured set too (selftest B9).

The decision tree in `global/rules/README.md` tells you which rules apply to your task. Don't read everything; read what the tree points you to.

**Meta-docs layout:** `prompt/maintenance/` is split into `global/` (cross-project transferable) and `local/` (project-specific). Root-level file creation is **forbidden** (rule 15). Layout standard: `prompt/maintenance/local/README.md`.

---

## 1. Project-critical gates (highest priority, non-negotiable)

- **This repository is PUBLIC and `prompt/` + `CLAUDE.md` are git-tracked** (2026-08-25 user ruling). Before EVERY commit and push — documentation-only commits, handover commits, and the commit that introduces a security rule included — run the staged secret scan and abort on any finding. **No self-exceptions**: "minor change" / "rules-only commit" is not a reason to skip. The `.claude/hooks/pre-commit-gate.sh` PreToolUse hook runs gitleaks automatically on `git commit` / `git push`; the hook firing is not a substitute for reading its output.
- **Never write a secret, credential, token, private key, personal information or a private URL into this repository at all.** The chosen defence for a public governance history is content discipline, not concealment (16.md §3). A value that must not be public is never redacted here — it is never written here.
- **Never overwrite or relicense `LICENSE` (AGPL-3.0) and never change the repository's visibility** without an explicit user GO. Both are inherited from this repository's own Initial commit.

---

## 2. Where the current state lives — pointer only (2026-08-25 user ruling)

**This file is never the owner of a current fact.** It is auto-loaded into every session, and it has no update trigger of its own — so anything written here about *how things stand* starts drifting the moment it is written, while continuing to read as authoritative. Two measurements from this repository: a `case index 45` line sat here for three sessions while the actual was 48, and the discipline note that replaced it ("no numbers here") still left a headed, empty slot for the current task — and a slot invites filling.

| you need | resolve it here |
|---|---|
| current objective, GO/STOP boundary, which generation of the handover you hold | `local/handover/16_…md` **§1** |
| open batons, OPEN / HOLD / deferred items and their triggers | `16.md` **§2** |
| settled decisions and what supersedes what | `16.md` **§3** |
| measured baseline numbers | `16.md` **§5** — and re-measure with `bash scripts/baseline.sh`, never transcribe |
| what happened in a past session and why | `local/handover/sessions/S{NNN}_…md` (immutable) — **historical evidence, never current authority** |
| where things live structurally | `local/handover/maintenance_index.md`, `local/README.md` |

**Never write into this file** (any of them makes a second owner for a fact that already has one): current progress, an active-task body, the next task, a current blocker, what is waiting on user GO, baton content, a session number, a phase or revision name, a completed point, or any measured count. The check that keeps this section honest is selftest **B54**, and `/close` step 4 walks it against the rewritten handover.

---

## 3. Roadmap — pointer only

<!-- Large plans live in local/plans/active|completed/. This section names where the plan register is;
     it does not carry progress, stage completion, deployment state, or commit ids — those are current
     facts and belong to their owners (16.md §1/§2, and the plan file itself). -->

Plan register: `local/plans/active/` (in flight) and `local/plans/completed/` (finished, kept). Which of them is currently being worked is a current fact and lives in `16.md` §1/§2.

---

## 4. Strategic axis (anchor for judgment) 🔴

**Purpose of all work:** develop **digicode-text** — a Web application for microcontroller
development that handles ordinary **text code**, not a block editor — by selectively porting
technical assets from **DigiCode** as a donor repository.

**The Web version is the primary product, and it is not the only one** (2026-08-26 user ruling). A
Desktop version is formally in view, so the Frontend is not to be fixed into a shape that only a
browser can host; the shared-Frontend / adapter direction and its boundaries live in `16.md` §3.

```
DigiCode (donor, READ ONLY)  ──selective port, evidence-recorded──▶  digicode-text
   ├ what may travel:  product/technical assets the user approves, one at a time,
   │                   each with donor repo + donor commit SHA + donor path + import
   │                   date + imported asset + excluded legacy governance recorded
   └ what never travels: the donor's CLAUDE.md, rules, handover, sessions, judgment-
                         mistakes history, orchestration bodies, and its git history
                         itself (no merge / subtree / rewrite / fork). 16.md §3, settled.
```

**AI is a primary feature of digicode-text and ships from the start** (2026-08-26 user ruling). It is
not provisional and is not deferred to the donor audit: the audit investigates *how* the donor
implements AI, its API-key handling and its dictionary / context design — never *whether* AI belongs
in the product. A template's generic provisional value never outranks this project's product ruling.

**AI is the primary feature; LSP is advanced editing support, not a condition of the product**
(2026-08-26 user ruling). A build without LSP is **never** to be described as a reduced or
incomplete version. The grounds, and what the Web version must stand up on its own, are in `16.md` §3.

**Everything below this line is PROVISIONAL and is settled by the user after the donor audit**
(2026-08-25 user ruling). It is written out rather than left blank because an anchor that is empty
still reads as present — but it is not a licence to treat it as settled. The four things explicitly
**not** fixed yet: the detailed product specification, the target scope, the completion conditions,
and the DigiCode compatibility range.

**Target users (provisional):**

- people who want to write ordinary text code in the browser and develop for microcontrollers;
- beginners to intermediates doing Arduino / ESP-family / RP-family development who want a clearer
  path than a full IDE offers;
- FabLab, education and workshop settings that want to handle real code rather than blocks.

**Out of scope (provisional):** re-implementing DigiCode's block editor as-is · fully replacing a
complete IDE such as VS Code · enterprise collaborative-editing / cloud-IDE features.

**"Passing grade" definition (provisional, user verbatim 2026-08-25):**

> 「DigiCode から必要な技術資産を選択移植したうえで、ブロックエディタに依存せず、ブラウザ上で通常のテキストコードを編集し、対象マイコン向けのビルドから書き込みまでを分かりやすく行える独立した Web アプリとして成立すること。」

Explicitly **not** fixed by that definition: full DigiCode feature parity, full board/device parity,
how much of the origin's compile-test suite is inherited, and the finished UI specification. A
compatibility / acceptance matrix is ruled on by the user after the donor audit (16.md §2 baton 2).

**Add nothing the user did not ask for.** Before writing any new mechanism, feature or check, be
able to say in one line which user directive or measured finding produced it. If you cannot, it is a
proposal for the user, not a task (rule 17 / rule 24).

**This project is a consumer of `Project_Template`**, not a distributor: template revisions arrive
by a user-decided deployment visit, and this repository never edits the template. **The current
position of that relationship lives in `local/handover/16_…md` §4** (this section is the invariant
purpose; 16.md §4 is the movable position — never mix them).

---

## 5. Working principles (mandatory)

1. **Severity labels mandatory**: 🔴 release blocker / 🟡 design impact / 🟢 informational. Flat enumeration is forbidden.
2. **No "trust and skip"**. Either verify, or label `[未verify]` honestly.
3. **Axes are thinking lenses, not checklists**. Don't list them mechanically — use them to raise judgment quality (rule 14).
4. **Don't accept "the conclusion didn't change so it's fine" / "scope was reduced so it's fine"** as justification — these extend the trap (judgment-mistakes case 18).
5. **If the basis collapses, rewrite the basis** even when the conclusion is unchanged.
6. **Emphasis budget**: prose-emphasis 🔴 in this file ≤5 at any time — adding a 6th requires demoting one (severity labels inside tables are principle-1 usage and don't count). When everything is critical, nothing is — rules win by being few and load-bearing, not loud.

When in doubt, ask the user. Don't sacrifice required work to fit scope or hours.

---

## 6. Forbidden actions

- Starting work without reading the rules
- Implementing without user GO (wait-for-go — rule 12)
- Proposing changes that overturn settled decisions in §2 (settled is settled)
- Reporting "I understand" based only on grep hit counts — read the implementation
- Self-imposing scope ("out of scope" / "defer" is the user's decision — rule 17)
- Reading without reading — see §0
- Delegating implementation before user GO, or delegating parent-only duties (case filing / handover / baseline / commit / adopt-reject) — rule 22
- Transcribing a delegate's "tests pass" without type-labeled evidence (a delegate's report is a claim, not a measurement — rule 04)
<!-- Origin: LaserEditor S034 Harness/Worker permanentization. -->
- Shadow-executing delegated technical scope before its capsule closes
- Using delegate wait time for duplicate investigation
- Treating adopt/reject ownership as a duty to reproduce the parent's delegated technical work
- Reverting to old parent execution because a long session weakened start-of-session salience
- Continuing after the accepted objective is DONE — extra hardening, an adjacent defect, a cleanup — without a new user GO (rule 24)
- Treating a RED result as authorization to fix it, or promoting a finding on severity alone (rule 24: classify against acceptance first)
- Reading, cloning, or importing anything from the **DigiCode donor repository** outside a user-declared objective that authorises it — the gate is the current GO/STOP boundary in 16.md §1, not a one-time event that has already passed
- Importing DigiCode's legacy governance in any form — its old `CLAUDE.md`, rules, handover, sessions, judgment-mistakes history, or orchestration bodies (16.md §3, settled)
- Merging, subtree-ing, rewriting or force-pushing history — this repository's history begins at its own Initial commit and stays linear and independent
- Editing the `Project_Template` repository from this session. Defects found in the template are reported to the user and recorded as a baton; they are not fixed from here
- Fixing the technology stack, deployment target, or DigiCode compatibility range by inference — these are user decisions, and an audit that supplies material for them does not settle them (§7, §9)

---

## 7. Project structure

**No application code exists yet.** The technology stack, the repository layout it implies, and the
deployment target are **undecided and are the user's to decide** after the DigiCode donor audit
(16.md §2 baton 3). Settled so far: digicode-text is a **Web application**; Docker is a candidate
and is not chosen. Filling this table by inference from DigiCode, from this harness, or from what a
Web project "usually" looks like is the forbidden action §6 names.

| Path | Purpose | Deploy target |
|------|---------|---------------|
| `prompt/maintenance/` | Governance harness (global/ = template-derived, local/ = this project) | not deployed |
| `scripts/` | Harness instruments (selftest / baseline / read-load / mutation / scans) | not deployed |
| `.claude/` | SessionStart cold-start hook, pre-commit secret gate, `/close` command | not deployed |
| `LICENSE` | AGPL-3.0, from this repository's own Initial commit | — |
| *(application source — undecided)* | see baton 3 | — |

### Team structure (orchestration roster — rule 22; 2026-08-13 user decision, 2026-08-17 trust-tier form)

<!-- Origin: ouen-plus — running Claude Code + a second agent + desktop AI on one repo required
     explicit roles and commit attribution to keep the history auditable.
     This table names the ROLES rule 22 defines (§Roles and authority) and their duties. It does
     NOT assign models — that mapping has one owner, local/docs/routing-profile.md, and re-wiring
     THAT file is the rollback lever. -->

| Role (rule 22) | Duties |
|---|---|
| **Harness / Integration Conductor** | Route A, escalations, evidence contract, bounded review, adopt/reject, commit / handover / case filing / baseline. Its own model and reasoning effort are Human-declared per session and are never a routing output (rule 22 §Routing decision) |
| Alternative orchestrator | Route B reasoning primary — briefed via `scripts/context-brief.sh`, no repo access; conclusions re-enter as claims; produces no commits |
| **Primary technical execution system** / six-lane delegate | A = investigation / implementation / correction / tests; B = separate-thread verification / falsification. Never adopts its own work. Review asymmetry restricts only primary defect-finding on Claude-written code |
| Claude-side implementation fallback / parallel survey / Claude-lineage primary review | Cannot supply a different reasoning lineage — use the different-vendor lane where independence is required |
| Scope, settled decisions, GO for irreversible operations, UAT, roster changes | User |

**Which model holds each role, its supported effort values, baseline, authority and commit
attribution: `prompt/maintenance/local/docs/routing-profile.md` — the single owner of that mapping
(2026-08-25 ruling).** This file names roles and duties only; it held a second copy of the mapping
until Phase 6, and a mapping in two places drifts while both keep reading as authoritative.

---

## 8. Conventions (rule pointers)

Common rules under `prompt/maintenance/global/rules/common/` — see the full index and decision tree in `global/rules/README.md` (01-investigation … 24-objective-control + judgment-mistakes-history).

Project-specific rules under `prompt/maintenance/local/rules/digicode-text/`:

| Topic | Rule |
|-------|------|
| (none yet — when creating one, use rule-template.md and add a row here and in the decision tree) | |

Reference docs: `prompt/maintenance/global/rules/reference/{memory-index,phase-patterns,known-pitfalls,migration-history}.md` (origin lessons preserved; append your own)

---

## 9. Key absolute rules (summary; details in linked rule files)

- **Code**: Read existing code before editing. Grep before adding. Trace dependencies to terminus. Get user GO before implementation.
- **Language**: user-facing text = 日本語; code / comments / commits / rules = English (rule 07). Existing files keep their current language.
- **Secrets**: nothing secret is ever written into this repository — see §1. This is absolute because the repository is public and the governance layer is tracked.
- **Donor boundary**: DigiCode is a donor to be audited READ ONLY when the user opens that objective. Nothing from it — code, history, or governance — enters this repository without a recorded migration evidence entry (donor repo, donor commit SHA, donor path, import date, imported asset, excluded legacy governance).
- **Stack decisions are the user's**: the technology stack, deployment target and DigiCode compatibility range are recorded as batons, not inferred. Writing one of them into a design as though it were settled is a rule 17 violation in the inclusion direction and a rule 24 violation in the widening direction.

---

## 10. Anti-patterns Claude has been called out on

<!-- Append project-specific ones as they happen. The following six are origin (DigiCode) findings,
     kept because they are model-generation-independent AI behaviors. -->

1. Skim-reading when told to read maintenance/ files.
2. Claiming to have read files that weren't actually read.
3. Implementing without first investigating existing code.
4. Proceeding on "probably this is …" speculation, surfacing major divergence later.
5. Transcribing handover baseline numbers instead of measuring.
6. Reactive 1-bug-1-fix instead of systematic cluster audit.

---

## 11. Memory & docs system

`prompt/maintenance/` is a two-layer structure: **global/** (template-derived, project-independent) + **local/** (this project's own). Creating files directly under the root is forbidden (rule 15). Naming and lifecycle for local/ files: `local/README.md`.

- Memory (`~/.claude/.../memory/`) = short-term observations. Rules = durable. **On conflict, rules win** (rules/README.md §Memory vs. Rules).
- Lesson pipeline: incident → append a case to `judgment-mistakes-history.md` → if structural, promote to a rule (common vs local per rule 15 decision tree) → add a decision-tree row.
- **Your own sessions are not the only harvest source**: every project writes its lessons at its own /close, and a crossdeploy visit collects them (CLAUDE.md §4 channel ①/②). Live observation of another project's session exists but **fires only on an individual user directive naming the doubt to verify** (`rules/README.md` §Cross-project live observation; 2026-08-19 ruling — no standing observers).
- **Case / rule recording completes inside the session where the incident happened. "I'll write it later" is never written** — measured discipline: across two second-generation projects (fabcanvas 16 sessions / ouen-plus 15+ sessions), deferred cases and local rules were appended exactly 0 times in both.

---

## 12. Session-bootstrap reminder

**Automation note:** a SessionStart hook (`.claude/hooks/session-start.sh`) auto-injects the current handover (16.md) + active bug index + the cold-start directive into context at every session start / resume / clear — the user does not need to ask. If that injected block is NOT present in context, the hook didn't fire: read `local/handover/16_次セッション引き継ぎ指示書.md` manually before anything else.

When starting a fresh session (rule 13 protocol):
1. Confirm working dir = `/Users/ohahiso/github_project/digicode-text`, branch = `main`.
2. Run baseline actuals (re-measure the §2 table — record actual numbers, do not transcribe handover claims).
3. Read in order: §0 list above → `local/handover/16_次セッション引き継ぎ指示書.md` → relevant rules per task.
4. Submit sanity-check report: current state recap + actual baseline numbers + severity-labeled findings + handover discrepancies + self-assessment.
5. Wait for user GO. Do not start implementation without it.
6. For risky / multi-file work: produce a design review per rule 02 (10-step) + rule 12 (design-proposal format with Self-check section), then wait for GO.
