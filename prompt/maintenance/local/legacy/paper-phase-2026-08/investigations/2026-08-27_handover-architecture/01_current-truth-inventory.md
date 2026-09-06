# Current-truth inventory and ownership analysis

**Packet:** `S008-A-inventory`  
**Lane:** `INVESTIGATION` / `AUTHORITY_MODE: DELEGATED`  
**Measured subject:** `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md` at the S007-close tree  
**Method:** static line/byte inventory, repository-wide assertion search, and synthetic harness execution. No donor repository or donor governance was read. No file other than this report was created or edited.

## A. Item-level inventory of 16.md

### Classification rules

- `YES` means the semantic fact must be available on every cold start, even if a future router supplies it from a different owner. In particular, a Human ruling whose omission could authorize a forbidden action is `YES`.
- `CONDITIONAL:<trigger>` means the item is read when the named antecedent fires. Section C states the failure if it is skipped.
- `current truth` is an operative fact now; `historical evidence` records a point-in-time event; `pointer` routes to another owner without making that evidence current authority.
- `bytes` is the exact UTF-8 byte count of the inclusive line range, including newline bytes. Blank lines and headings are assigned to the adjacent semantic block so that there are no gaps.

| id | item (what fact it is) | current location | bytes | required at EVERY cold start? | kind | who else already owns it |
|---|---|---:|---:|---|---|---|
| A1 | File identity and the claim that 16.md alone owns current state; history is immutable evidence | §preamble, lines 1-8 | 673 | YES | pointer/ownership contract | `local/README.md:20-29`; `global/rules/README.md:228-235` |
| A2 | Last-close label and author | §preamble, lines 9-11 | 335 | CONDITIONAL: provenance or close audit | historical evidence | NONE |
| A3 | Current generation `S007-close` and frozen-copy ordering rule | §preamble, lines 12-13 | 400 | YES | current truth | `local/README.md:45`; `scripts/selftest.sh:1367-1390` validates it |
| A4 | Project purpose plus warning that a cold start must recover it | §0, lines 14-20 | 711 | YES | pointer containing a restatement | `CLAUDE.md:73-77` |
| A5 | `PRIMARY_OBJECTIVE = UNSET` and S007 accepted/closed | §1, lines 21-23 | 172 | YES | current truth | NONE (`CLAUDE.md:52` only points here) |
| A6 | First next-objective candidate, purpose, renamed scope, and no-start-without-Human rule | §1, lines 24-30 | 707 | YES | current truth | NONE |
| A7 | Two different menu entries (product design vs harness maintenance), neither authority | §1, lines 31-39 | 648 | YES | current truth | NONE |
| A8 | Standing prohibition on automatically entering any production implementation | §1, lines 40-41 | 273 | YES | current truth | NONE outside 16.md |
| A9 | Seven closed objectives and their evidence/plan destinations | §1, lines 42-54 | 1,468 | CONDITIONAL: prior-objective evidence or completed-plan lookup | pointer | `改定log.md:14-21`; `plans/completed/01_…` through `08_…` |
| A10 | Three donor repositories' pinned branch/SHA/dirty state | §1, lines 55-62 | 450 | CONDITIONAL: an authorised donor/evidence task | current truth | measured provenance in `practical-iot-revalidation/03_donor-iot-capability.md:11-13` |
| A11 | Current DigiCode ecosystem boundary and decommissioned/non-authoritative components | §1, lines 63-64 | 349 | CONDITIONAL: an authorised donor/ecosystem task | current truth | `donor-audit/02_ecosystem-inventory.md` |
| A12 | Exact external-source paths for planning/ruling/report documents and their authority order | §1, lines 65-80 | 2,635 | CONDITIONAL: exact Human wording or external provenance is needed | pointer | NONE in-repo; the named files are deliberately outside git |
| A13 | Measurements belong to immutable investigations and must not be copied into current state | §1, lines 81-84 | 259 | YES | pointer/ownership contract | `global/rules/README.md:228-239`; `local/README.md:29` |
| A14 | Evidence-owner map for all seven investigations and each prescribed entry point | §1, lines 85-94 | 1,703 | CONDITIONAL: measured evidence is needed | pointer | each named `investigations/*/00_index.md` |
| A15 | S007 evidence read order: `09` before corrected `08` | §1, lines 95-97 | 286 | CONDITIONAL: S007 evidence or conclusion is read | current truth + pointer | `practical-iot-revalidation/09_integration-falsification.md`; `08_conclusion-and-next.md` |
| A16 | Current items waiting on Human GO | §1, lines 98-103 | 660 | YES | current truth | NONE |
| A17 | Actions that always need their own GO | §1, line 104 | 801 | YES | current truth | `CLAUDE.md:40-42,165-181`; `AGENTS.md:134-144` |
| A18 | Actions forbidden without a new ruling | §1, line 105 | 582 | YES | current truth | `CLAUDE.md:161-183`; settled decisions below |
| A19 | Owner map for sessions, investigations, completed plans, rules, indexes and structure map | §1, lines 106-112 | 534 | YES | pointer | `CLAUDE.md:46-59`; `local/README.md:20-29`; `maintenance_index.md:29-40` |
| A20 | Baton semantics, removal classification, status grammar and table schema | §2, lines 113-124 | 753 | YES | current truth/contract | `scripts/handover-diff.sh:22-34`; `local/README.md:37` |
| A21 | Baton 2 — compatibility/acceptance matrix remains open and risk-based | §2, line 125 | 798 | CONDITIONAL: user opens compatibility/acceptance work | current truth | evidence pointers in the row; `CLAUDE.md:133-135` points here |
| A22 | Baton 3 — technology stack/deployment target and adapter architecture remain open | §2, line 126 | 386 | CONDITIONAL: architecture/stack work opens | current truth | `CLAUDE.md:188-193`; `AGENTS.md:28-31` |
| A23 | Baton 4 — routing values measured but profile write remains GO-gated | §2, line 127 | 1,055 | CONDITIONAL: routing-profile write or dispatch escalation | current truth | `local/docs/routing-profile.md:16-31`; `orchestration-re-audit/01_method-and-lanes.md:110-142` |
| A24 | Baton 5 — protected-path list has no project rows | §2, line 128 | 206 | CONDITIONAL: stack/deployment is settled | current truth | NONE (the list itself is the data, not a second assertion) |
| A25 | Baton 6 — spec-boundary terms empty; trigger has fired | §2, line 129 | 421 | CONDITIONAL: product-facing text is edited | current truth | `scripts/spec-boundary-terms.txt:1-21` |
| A26 | Baton 7 — bootstrap L-6/L-7 remain deferred | §2, line 130 | 299 | CONDITIONAL: Human rules on L-6/L-7 | current truth | `local/docs/RULES_SNAPSHOT` |
| A27 | Baton 13 — browser support matrix remains unsettled with measured caveats | §2, line 131 | 745 | CONDITIONAL: architecture/browser-support work opens | current truth | `orchestration-re-audit/07_primary-sources.md:32`; `product-value-revalidation/07_user-segments.md:22` |
| A28 | Baton 14 — third-party material placement decision pending | §2, line 132 | 450 | CONDITIONAL: Human chooses placement | current truth | `donor-audit/10_browser-and-third-party-placement.md` |
| A29 | Baton 15 — licence text must be read at adoption, with Marketplace restriction | §2, line 133 | 750 | CONDITIONAL: any adoption/redistribution decision | current truth | `editor-lsp-spike/02_oss-landscape.md`; `orchestration-re-audit/07_primary-sources.md` |
| A30 | Baton 16 — planning docs cannot enter public git without de-identification | §2, line 134 | 519 | CONDITIONAL: Human considers bringing planning docs in-repo | current truth | NONE in-repo; originals intentionally external |
| A31 | Baton 17 — corrections still needed in the user's external planning docs | §2, line 135 | 750 | CONDITIONAL: user revises the planning docs | current truth | parts source-verified in `orchestration-re-audit/03_donor-reverify.md:32,138` |
| A32 | Baton 18 — licence marking is not portability verdict; trigger retained | §2, line 136 | 353 | CONDITIONAL: portability/adoption question | current truth | settled decision A75; `judgment-mistakes-history.md` case DT-1 |
| A33 | Baton 19 — evidence outranks summary; conclusions may contradict evidence | §2, line 137 | 506 | CONDITIONAL: choosing objective or using an investigation conclusion | current truth | investigation evidence/conclusion pairs; case DT-4 |
| A34 | Baton 20 — B57 handles only `PT-` specially; template defect queued | §2, line 138 | 432 | CONDITIONAL: case index/template deployment work | current truth | template-feedback queue A107; `scripts/selftest.sh:1533-1617` |
| A35 | Baton 21 — Text Compiler architecture is still undecided, with four design inputs | §2, line 139 | 650 | CONDITIONAL: compiler architecture objective | current truth | `orchestration-re-audit/03_donor-reverify.md` |
| A36 | Baton 22 — FastAccelStepper resolution is unconfirmed and donor-side only | §2, line 140 | 502 | CONDITIONAL: user opens donor-side objective | current truth | `orchestration-re-audit/04_compiler-probe-reverify.md` |
| A37 | Baton 24 — S002 probe is not production; runner evidence is missing | §2, line 141 | 776 | CONDITIONAL: anyone reaches for S002 probe as starting point | current truth | `compiler-shared-probe/06_probe-implementation.md`; `orchestration-re-audit/04_compiler-probe-reverify.md` |
| A38 | Baton 25 — read-load warning accepted but unresolved; only two Human-owned structural choices | §2, line 142 | 1,057 | CONDITIONAL: handover/read-load maintenance objective | current truth | `local/README.md:31-60`; `scripts/read-load.sh:37-83`; settled decision A96 |
| A39 | Baton 26 — S003 probes are not production and Helper lacks production controls | §2, line 143 | 484 | CONDITIONAL: anyone reaches for S003 probe as starting point | current truth | `editor-lsp-spike/*`; `local-helper-feasibility/*` |
| A40 | Baton 27 — Helper technically feasible, adoption pending; permission claim unverified | §2, line 144 | 574 | CONDITIONAL: Web/Desktop/Helper architecture opens | current truth | `local-helper-feasibility/08_options-findings-and-next.md`; settled decision A85 |
| A41 | Baton 28 — Board/Library bundle boundary undecided and size evidence unreproducible | §2, line 145 | 550 | CONDITIONAL: Desktop architecture opens | current truth | `local-helper-feasibility/05_bundling-and-board-environment.md`; baton 34 |
| A42 | Baton 29 — explicitly design what works without LSP | §2, line 146 | 621 | CONDITIONAL: architecture objective opens | current truth | settled decisions A77-A79 |
| A43 | Baton 30 — classroom Local LSP Server remains deferred; memory extrapolation unusable | §2, line 147 | 461 | CONDITIONAL: Human opens classroom-server option | current truth | `local-helper-feasibility/07_cost-comparison-and-fs-course.md`; baton 40 |
| A44 | Baton 31 — enterprise LNA policy exists, real deployment unverified | §2, line 148 | 651 | CONDITIONAL: Helper option is adopted/tested | current truth | `orchestration-re-audit/07_primary-sources.md` S9 |
| A45 | Baton 32 — custom `lib_deps` headers unresolved; same Registry problem | §2, line 149 | 632 | CONDITIONAL: local semantic analysis or registry objective | current truth | `orchestration-re-audit/07_primary-sources.md` S11 |
| A46 | Baton 33 — donor Finder PNA may be insufficient; donor behavior unmeasured | §2, line 150 | 444 | CONDITIONAL: user opens donor-side objective | current truth | `local-helper-feasibility/03_donor-helper-audit.md` |
| A47 | Baton 34 — Desktop local vs cloud Compiler are different products; decide before bundle | §2, line 151 | 582 | CONDITIONAL: Desktop architecture opens | current truth | `product-value-revalidation/05_web-and-desktop-value.md` |
| A48 | Baton 35 — AI-primary may conflict with enterprise network restrictions | §2, line 152 | 613 | CONDITIONAL: architecture or enterprise proposal | current truth | donor evidence in `orchestration-re-audit/03_donor-reverify.md` |
| A49 | Baton 36 — debugger absence remains unaddressed | §2, line 153 | 431 | CONDITIONAL: product specification/planning doc is written | current truth | NONE |
| A50 | Baton 37 — direct competitors and expanded 48-row population; real use remains zero | §2, line 154 | 846 | CONDITIONAL: competitor objective or planning revision | current truth | `orchestration-re-audit/07_primary-sources.md:29,34,53-63`; `practical-iot-revalidation/04_competitor-population.md` |
| A51 | Baton 38 — evidence under S005 rulings was refuted; re-ruling choice belongs to Human | §2, line 155 | 1,321 | CONDITIONAL: Human revisits S005 rulings | current truth | `orchestration-re-audit/08_conclusion-and-next.md:34-39,91-92`; `practical-iot-revalidation/08_conclusion-and-next.md` |
| A52 | Baton 39 — Registry-next ranking ground absent, design evidence stronger, objective renamed | §2, line 156 | 1,153 | CONDITIONAL: managed-environment/device-knowledge objective | current truth | `orchestration-re-audit/08_conclusion-and-next.md`; `practical-iot-revalidation/08_conclusion-and-next.md` |
| A53 | Baton 40 — nine instruments require positive-control remeasurement | §2, line 157 | 852 | CONDITIONAL: affected architecture or instrument remeasurement objective | current truth | `orchestration-re-audit/08_conclusion-and-next.md` §6-1 |
| A54 | Baton 41 — competitor real use is zero; 11 Human tests own the next step | §2, line 158 | 727 | CONDITIONAL: competitor real-use objective | current truth | `practical-iot-revalidation/08_conclusion-and-next.md:327-337` |
| A55 | Baton 42 — injected product-level anti-AgentTool instruction explains S006 behavior | §2, line 159 | 796 | CONDITIONAL: harness behavior is unexplained | current truth | NONE outside 16.md |
| A56 | Baton 43 — conductor effort mismatch marked `未verify` with proposed check | §2, line 160 | 834 | CONDITIONAL: session pre-flight/effort diagnosis | current truth, stale against A112 | `CLAUDE.md` rule pointer; contradicted by 16.md line 270 |
| A57 | Baton 44 — competitor use and account/payment actions remain GO-gated; 11 tests | §2, line 161 | 842 | CONDITIONAL: Human selects a real-use test | current truth | `practical-iot-revalidation/08_conclusion-and-next.md:327-337` |
| A58 | Baton 45 — Arduino Cloud AI Assistant is closest un-audited competitor | §2, line 162 | 734 | CONDITIONAL: next objective or competitor audit | current truth | `orchestration-re-audit/07_primary-sources.md:28,34`; practical-IoT evidence |
| A59 | Baton 46 — semiconductor-vendor AI category was not searched | §2, line 163 | 560 | CONDITIONAL: competitor population is reconstructed | current truth | NONE exact; Microchip is an example, not an owner |
| A60 | Baton 47 — Particle verified coverage is small and AI evidence absent | §2, line 164 | 640 | CONDITIONAL: Particle is used as reference implementation | current truth | `practical-iot-revalidation/09_integration-falsification.md`; `08_conclusion-and-next.md` |
| A61 | Baton 48 — academic evidence scope must not be widened | §2, line 165 | 738 | CONDITIONAL: academic evidence is cited | current truth | `practical-iot-revalidation/07_falsification.md`; `09_integration-falsification.md` |
| A62 | Baton 49 — absence claims must stay bounded to searched population | §2, line 166 | 471 | CONDITIONAL: writing competitor absence/uniqueness claim | current truth | case DT-6 |
| A63 | Baton 50 — auto Web UI corrected model and portable-core candidate | §2, line 167 | 762 | CONDITIONAL: UI/device-knowledge architecture | current truth | settled decision A102; `practical-iot-revalidation/02_auto-web-ui-deep-dive.md:207,229` |
| A64 | Baton 51 — Device knowledge expansion is a Human expectation, not proven value | §2, line 168 | 598 | CONDITIONAL: device-knowledge architecture | current truth | settled decision A100 |
| A65 | Baton 52 — 96 KiB brief cap is provisional; future raise needs new GO; topic split is permanent repair candidate | §2, line 169 | 854 | CONDITIONAL: brief nears cap or menu #2 opens | current truth | settled decision A105; `scripts/context-brief.sh:15-23` |
| A66 | Settled-decision section and required 5-tuple/supersession grammar | §3, lines 170-176 | 268 | YES | current truth/contract | `.claude/commands/close.md:16`; `scripts/selftest.sh:1520-1527` |
| A67 | Independent project, not DigiCode fork; donor read-only; no history import | §3, line 177 | 462 | YES | current truth (Human ruling) | `CLAUDE.md:83-90`; `AGENTS.md` donor boundary |
| A68 | DigiCode legacy governance never imported; template provenance retained | §3, line 178 | 243 | YES | current truth (Human ruling) | `CLAUDE.md:88-90,181`; `AGENTS.md` absolute donor boundary |
| A69 | Public tracked governance; content discipline and secret gate, not concealment | §3, line 179 | 433 | YES | current truth (Human ruling) | `CLAUDE.md:40-42` |
| A70 | Routing profile records absence, now measured values await GO | §3, line 180 | 624 | YES | current truth (Human ruling + open transition) | `local/docs/routing-profile.md:16-31`; baton 4 |
| A71 | Product spec/scope/completion/compatibility remain provisional except fixed core value/definition | §3, line 181 | 523 | YES | current truth (Human ruling) | `CLAUDE.md:113-135` |
| A72 | Project_Template is not modified from this repo | §3, line 182 | 238 | YES | current truth (Human ruling) | `CLAUDE.md:141-144`; `maintenance_index.md:57-61` |
| A73 | AI is a primary feature from the start | §3, line 183 | 356 | YES | current truth (Human ruling) | `CLAUDE.md:93-96` |
| A74 | One Human GO authorises only one declared objective | §3, line 184 | 469 | YES | current truth (Human ruling) | `AGENTS.md:142-144`; rule 24 is the execution policy |
| A75 | Licence marking is not a portability verdict | §3, line 185 | 371 | YES | current truth (Human ruling) | case DT-1 in `judgment-mistakes-history.md` |
| A76 | Dedicated Text Compiler first-candidate ruling, reused/not-reused assets, open boundary and corrected evidence | §3, line 186 | 2,336 | YES | current truth (Human ruling) | compiler investigations are evidence, not current authority |
| A77 | AI primary; LSP advanced support, never a product condition | §3, line 187 | 414 | YES | current truth (Human ruling) | `CLAUDE.md:98-100` |
| A78 | Web is primary and must be complete without Helper/LSP | §3, line 188 | 428 | YES | current truth (Human ruling) | `CLAUDE.md:79-81,98-100` |
| A79 | Server-side LSP is not mandatory backend; cost evidence corrected | §3, line 189 | 940 | YES | current truth (Human ruling) | `orchestration-re-audit/05_editor-helper-instrument-audit.md`; baton 40 |
| A80 | Monaco is first candidate, not production selection; startup evidence limited | §3, line 190 | 494 | YES | current truth (Human ruling) | NONE exact outside 16.md |
| A81 | Internal standard `main.cpp`; `.ino` import direction; conversion unsettled | §3, line 191 | 682 | YES | current truth (Human ruling) | NONE exact outside 16.md |
| A82 | Desktop formally in view; shared Frontend/adapter direction; Compiler location open | §3, line 192 | 1,218 | YES | current truth (Human ruling) | `CLAUDE.md:79-81`; product-value evidence |
| A83 | Desktop targets Windows/macOS/Ubuntu; signing deferred to distribution; evidence correction | §3, line 193 | 678 | YES | current truth (Human ruling) | NONE exact outside 16.md |
| A84 | Advanced LSP in Desktop is likely but not decided | §3, line 194 | 225 | YES | current truth (Human ruling) | NONE exact outside 16.md |
| A85 | Helper feasibility accepted, adoption unresolved, with evidence limits | §3, line 195 | 926 | YES | current truth (Human ruling) | Helper investigations; baton 27/40 |
| A86 | Direction rulings do not authorize production implementation | §3, line 196 | 532 | YES | current truth (Human ruling) | `plans/completed/08_practical-iot-competitive-revalidation.md:18` is historical scope; A8 restates current effect |
| A87 | Managed environment, shared by Compiler/AI, is the settled core value; supporting evidence was refuted | §3, lines 197-200 | 1,310 | YES | current truth (Human ruling) | `CLAUDE.md:102-111`; baton 38 |
| A88 | One-sentence product definition | §3, line 201 | 415 | YES | current truth (Human ruling) | `CLAUDE.md:109-111` points here |
| A89 | Web value is avoiding user-side MCU environment setup, with priority segments and corrected uniqueness ground | §3, line 202 | 630 | YES | current truth (Human ruling) | `CLAUDE.md:102-111`; baton 38 evidence |
| A90 | Classic serves Block users; Text is AI+Text+managed environment; no Blockly return | §3, line 203 | 538 | YES | current truth (Human ruling) | NONE exact outside 16.md |
| A91 | Managed Environment Registry was next design core; ranking ground refuted, design evidence retained | §3, line 204 | 696 | YES | current truth with superseded naming/ranking context | later ruling A103; baton 39 |
| A92 | Verified/Custom two-layer Registry candidate; not closed ecosystem | §3, line 205 | 684 | YES | current truth (Human ruling) | evidence pointer to partial mirror; baton 32 |
| A93 | Custom-to-Verified promotion path must retain Human review | §3, line 206 | 643 | YES | current truth (Human ruling) | `practical-iot-revalidation/08_conclusion-and-next.md:306` |
| A94 | Registry operations should use AI, but AI self-report is not acceptance evidence | §3, line 207 | 512 | YES | current truth (Human ruling) | testing rules/evidence are pointers, not current owner |
| A95 | Risk-based compatibility/regression; no all-combination/count guarantee | §3, line 208 | 389 | YES | current truth (Human ruling) | NONE exact outside 16.md |
| A96 | Read-load WARNING accepted as working state but unresolved | §3, line 209 | 405 | YES | current truth (Human ruling) | baton 25; `local/README.md:35-37`; `scripts/read-load.sh:46-54` |
| A97 | Opus 5 solo prohibited; role split and nonzero Codex requirement | §3, lines 210-213 | 1,412 | YES | current truth (Human ruling) | `CLAUDE.md:165-166`; `AGENTS.md` session/worker contract |
| A98 | S007 final evidence state: legacy grounds refuted, problem supported, product value unresolved | §3, lines 214-218 | 1,135 | YES | current truth (Human-adopted evidence state) | `practical-iot-revalidation/09_integration-falsification.md`; corrected `08_conclusion-and-next.md` |
| A99 | Human context: industrial-IoT depth stopped because Blockly expansion/maintenance exhausted capacity, not lack of intent | §3, line 219 | 1,250 | YES | current truth (Human ruling/context) | NONE; this is the designated persistent owner |
| A100 | Expected structural shift from Block implementation to data/knowledge additions is a hypothesis, not proven value | §3, line 220 | 590 | YES | current truth (Human ruling) | baton 51 |
| A101 | Home Assistant semantic affinity is design input, not an adoption | §3, line 221 | 678 | YES | current truth (Human ruling/context) | NONE exact outside 16.md |
| A102 | auto Web UI is registration-metadata driven; Text needs input adapter; core remains candidate; uniqueness rejected | §3, line 222 | 965 | YES | current truth (Human ruling) | baton 50; practical-IoT evidence |
| A103 | Next-candidate name/purpose/scope/reference implementations; menu is not authority | §3, line 223 | 1,843 | YES | current truth (Human ruling) | §1 A6; baton 39 |
| A104 | S007 reconfirms Opus solo prohibition and actor split | §3, line 224 | 707 | YES | current truth (Human ruling) | A97; `CLAUDE.md:165-166` |
| A105 | 96 KiB provisional cap ruling; no deletion/mid-close split; future raise needs new GO | §3, line 225 | 856 | YES | current truth (Human ruling) | baton 52; `scripts/context-brief.sh:15-23` |
| A106 | Current harvest/crossdeploy/spot-observation loop position and owned cases | §4, lines 226-235 | 786 | CONDITIONAL: harness loop/feedback or case work | current truth | `CLAUDE.md:141-144` points here; case bodies own evidence |
| A107 | Eight-item template feedback queue and why each is project-independent | §4, lines 236-249 | 2,301 | CONDITIONAL: authorised Project_Template deployment visit | current truth/pointer | baton 20; cases DT-1…DT-7; sessions are evidence |
| A108 | Two additional structural observations live in S004 | §4, lines 250-251 | 155 | CONDITIONAL: template-feedback visit | pointer | `sessions/S004_2026-08-26_handover-compliance-and-read-load.md` §2 |
| A109 | Baseline method/header plus HEAD/application-code absence group | §5, lines 252-260 | 481 | YES | current truth + remeasurement pointer | `scripts/baseline.sh` |
| A110 | Baseline index group: bugs, rules, cases, plans, sessions | §5, lines 261-265 | 682 | YES | current truth + remeasurement pointer | `scripts/baseline.sh`; indexes |
| A111 | Baseline harness-health group: read load, selftest, mutation, placement | §5, lines 266-269 | 860 | YES | current truth + remeasurement pointer | named commands; read load owner is `scripts/read-load.sh` |
| A112 | Baseline route/mode/lane/usage and conductor-effort result | §5, line 270 | 956 | YES | current truth + remeasurement pointer | `scripts/usage-report.sh`; S007 plan/session are historical evidence |
| A113 | Baseline objective/delegation/routing policy checks | §5, lines 271-273 | 411 | YES | current truth + remeasurement pointer | three named scenario scripts |
| A114 | Baseline coverage caveat: harness only; measured/unrun product and real-fire dimensions | §5, lines 274-275 | 1,052 | YES | current truth/limits | investigation evidence owners named in the text |
| A115 | Mandatory-read contract pointer to CLAUDE §0/read-load and B53/B9 | §5, lines 276-279 | 400 | YES | pointer | `CLAUDE.md:8-32`; `scripts/read-load.sh:151-159`; `scripts/selftest.sh:391-449` |

### Coverage arithmetic

The ranges above are disjoint, ordered, and adjacent: `A1 = 1-8`, every next range starts at the previous end plus one, and `A115 = 276-279`. Therefore coverage is **279 / 279 lines** and **80,427 / 80,427 UTF-8 bytes**. No line is unassigned and no line is counted twice. The required command independently reported `279` lines.

## B. Duplication / wrong-owner findings

### Definitions and totals

- `DUPLICATE`: the same operative proposition is asserted by two locations; either can drift while still reading as authority.
- `POINTER`: the relationship is correctly directional. The current item points to evidence/index/mechanism, or another file points to the current owner without restating the operative fact.
- `SPLIT`: the operative proposition cannot be recovered from one owner because state, qualification or provenance is divided; a reader can take the wrong half.
- `NONE`: no second in-repository assertion was found. External Human documents do not count as another repository owner.

Counts over all inventory items: **DUPLICATE 32 / 115 items**, **POINTER 53 / 115**, **SPLIT 10 / 115**, **NONE 20 / 115**. The classes are mutually exclusive and total **115 / 115**. Byte cross-check: DUPLICATE **21,773 / 80,427 bytes**, POINTER **38,151 / 80,427 bytes**, SPLIT **7,328 / 80,427 bytes**, NONE **13,175 / 80,427 bytes**. Thus the Human's premise is supported: the document is not merely duplication. `POINTER + NONE = 73 / 115 items` and **51,326 / 80,427 bytes**; the dominant failure is over-concentration plus some restated strategic/governance facts, not a body that can safely be deleted.

The “other assertion” column gives both sides as `16:<line(s)> ↔ path:line(s)`. For `NONE`, it gives the searched current side and states that no second assertion was found.

| id | class | other assertion / relationship |
|---|---|---|
| A1 | DUPLICATE | `16:3-8` ↔ `local/README.md:23,29` ↔ `global/rules/README.md:231-235` all assert the single-current-owner model. |
| A2 | NONE | `16:10-11`; no second current author/update assertion found. |
| A3 | POINTER | `16:13` owns GEN; `local/README.md:45` and `selftest.sh:1367-1390` point/check it. |
| A4 | DUPLICATE | `16:17` says the invariant is not restated while restating it; `CLAUDE.md:75-77` asserts the same purpose. |
| A5 | POINTER | `16:23` owns objective state; `CLAUDE.md:52` points to §1. |
| A6 | NONE | `16:25-30`; no in-repo owner besides 16.md for the current first candidate and rename warning. |
| A7 | NONE | `16:32-39`; no second two-menu current-state assertion found. |
| A8 | NONE | `16:41`; the same effect reappears inside 16.md §3, but no second repository file was found asserting this full implementation list. |
| A9 | POINTER | `16:43-54` ↔ `改定log.md:14-21` and `plans/completed/*`; the latter own history/plans, not current authority. |
| A10 | SPLIT | `16:56-62` owns current pins; measurement/provenance is separately asserted at `practical-iot-revalidation/03_donor-iot-capability.md:11-13` without an explicit row-level edge. |
| A11 | POINTER | `16:64,78` points to `donor-audit/02_ecosystem-inventory.md` for the ecosystem table. |
| A12 | NONE | `16:66-80`; the primary files are external by decision, so no in-repo duplicate owner exists. |
| A13 | DUPLICATE | `16:82-84` ↔ `global/rules/README.md:231-239` and `local/README.md:29` assert the history/evidence boundary. |
| A14 | POINTER | `16:86-94` points to each `investigations/*/00_index.md`; those files own evidence. |
| A15 | SPLIT | `16:96-97` supplies the required order, while correction content is in `practical-iot-revalidation/09_integration-falsification.md` and `08_conclusion-and-next.md`; reading only either half yields the wrong state. |
| A16 | NONE | `16:99-103`; no second current GO-wait list found. |
| A17 | DUPLICATE | `16:104` ↔ `CLAUDE.md:40-42,165-181` and `AGENTS.md:134-144` repeat absolute GO/authority boundaries. |
| A18 | DUPLICATE | `16:105` ↔ `CLAUDE.md:161-183`; several forbidden actions are also asserted as settled decisions. |
| A19 | DUPLICATE | `16:107-112` ↔ `CLAUDE.md:50-57` ↔ `local/README.md:23-29` ↔ `maintenance_index.md:31-40` restate the owner map. |
| A20 | DUPLICATE | `16:115-121` ↔ `handover-diff.sh:22-34` repeat removal classes; `local/README.md:37` repeats non-removable state categories. |
| A21 | POINTER | `16:125` owns OPEN/trigger; `CLAUDE.md:133-135` points to baton 2 and the investigations own evidence. |
| A22 | SPLIT | `16:126` says Web is settled and concrete stack open; `CLAUDE.md:188-193` and `AGENTS.md:28-31` separately assert parts of that status. |
| A23 | POINTER | `16:127` points to `routing-profile.md:16-31` and `orchestration-re-audit/01_method-and-lanes.md:110-142`; status remains here. |
| A24 | NONE | `16:128`; `protected-paths.txt` is the subject data, not a second prose assertion. |
| A25 | POINTER | `16:129` points to the actual empty `scripts/spec-boundary-terms.txt`. |
| A26 | POINTER | `16:130` points to `local/docs/RULES_SNAPSHOT`. |
| A27 | POINTER | `16:131` points to `orchestration-re-audit/07_primary-sources.md:32` and `product-value-revalidation/07_user-segments.md:22`. |
| A28 | POINTER | `16:132` points to `donor-audit/10_browser-and-third-party-placement.md`. |
| A29 | POINTER | `16:133` points to `editor-lsp-spike/02_oss-landscape.md` and `orchestration-re-audit/07_primary-sources.md`. |
| A30 | NONE | `16:134`; the sensitive originals are intentionally not repository owners. |
| A31 | SPLIT | `16:135` owns pending corrections while `orchestration-re-audit/03_donor-reverify.md:32,138` owns only the verification half. |
| A32 | DUPLICATE | `16:136` ↔ `16:185` and case DT-1 assert the portability rule; the baton exists only to retain its trigger. |
| A33 | POINTER | `16:137` correctly points to evidence/conclusion pairs and case DT-4. |
| A34 | DUPLICATE | `16:138` ↔ `16:243` (feedback queue item 2); `selftest.sh:1533-1617` is the mechanism. |
| A35 | POINTER | `16:139` points to compiler evidence; the Human ruling remains in `16:186`. |
| A36 | POINTER | `16:140` points to the re-audit evidence and keeps uncertainty explicit. |
| A37 | POINTER | `16:141` points to `compiler-shared-probe/06_probe-implementation.md` and the audit. |
| A38 | DUPLICATE | `16:142` ↔ `16:209` ↔ `local/README.md:35-60` ↔ `read-load.sh:46-54` assert warning/structure/no-deletion status. |
| A39 | POINTER | `16:143` points to the S003 probe evidence; production status remains here. |
| A40 | POINTER | `16:144` points to Helper evidence and the ruling at `16:195`. |
| A41 | POINTER | `16:145` points to bundle evidence and baton 34. |
| A42 | POINTER | `16:146` is the open design item; `16:187-189` are the settled boundaries it must obey. |
| A43 | POINTER | `16:147` points to the S003b evidence and baton 40. |
| A44 | POINTER | `16:148` points to primary sources; its real-deployment status remains here. |
| A45 | POINTER | `16:149` points to primary source S11 and the future Registry trigger. |
| A46 | POINTER | `16:150` points to donor-helper evidence and preserves `未verify`. |
| A47 | POINTER | `16:151` points to `product-value-revalidation/05_web-and-desktop-value.md`. |
| A48 | POINTER | `16:152` points to donor evidence; the unresolved design conflict remains here. |
| A49 | NONE | `16:153`; no second current debugger-gap assertion found. |
| A50 | POINTER | `16:154` points to competitor population and primary-source owners. |
| A51 | POINTER | `16:155` points to the two conclusion tables; Human re-ruling state remains here. |
| A52 | POINTER | `16:156` points to re-audit and S007 evidence; the trigger remains here. |
| A53 | POINTER | `16:157` points to `orchestration-re-audit/08_conclusion-and-next.md` §6-1. |
| A54 | POINTER | `16:158` points to `practical-iot-revalidation/08_conclusion-and-next.md:327-337`. |
| A55 | NONE | `16:159`; no second in-repo assertion of the injected product-level instruction was found. |
| A56 | SPLIT | `16:160` says conductor effort is `未verify`; `16:270` says `medium` is measured and “baton 43 is CONFIRMED”. These two states cannot both be current. |
| A57 | POINTER | `16:161` points to the 11-test owner; GO state remains here. |
| A58 | POINTER | `16:162` points to S007/primary-source evidence. |
| A59 | NONE | `16:163`; the Microchip example does not duplicate the current “category not searched” state. |
| A60 | POINTER | `16:164` points to S007 falsification/conclusion evidence. |
| A61 | POINTER | `16:165` points to the academic evidence and its falsification. |
| A62 | NONE | `16:166`; case DT-6 is historical evidence, not a second current trigger owner. |
| A63 | DUPLICATE | `16:167` ↔ `16:222`; both assert the corrected auto-UI model; evidence is at `02_auto-web-ui-deep-dive.md:207,229`. |
| A64 | DUPLICATE | `16:168` ↔ `16:220` assert the same expectation/not-proven boundary. |
| A65 | DUPLICATE | `16:169` ↔ `16:225` ↔ `context-brief.sh:15-23` assert cap provenance, provisionality and new-GO requirement. |
| A66 | POINTER | `16:171-175` owns the 5-tuple grammar; `close.md:16` and B56 point/check it. |
| A67 | DUPLICATE | `16:177` ↔ `CLAUDE.md:83-90` repeat independent-project/no-history-import facts. |
| A68 | DUPLICATE | `16:178` ↔ `CLAUDE.md:88-90,181` and `AGENTS.md` repeat the governance-import prohibition. |
| A69 | DUPLICATE | `16:179` ↔ `CLAUDE.md:40-42` assert public/content-discipline/secret-gate facts. |
| A70 | SPLIT | `16:180` holds ruling plus measured-but-unwritten transition; `routing-profile.md:16-31` still holds `NONE`, and baton 4 holds the pending write. |
| A71 | DUPLICATE | `16:181` ↔ `CLAUDE.md:113-135` assert the same provisional/fixed boundary. |
| A72 | DUPLICATE | `16:182` ↔ `CLAUDE.md:141-144` ↔ `maintenance_index.md:57-61` repeat the consumer/no-template-edit rule. |
| A73 | DUPLICATE | `16:183` ↔ `CLAUDE.md:93-96` assert AI-primary-from-start. |
| A74 | SPLIT | `16:184` states the one-objective GO rule; `AGENTS.md:142-144` separately states no residual authority and rule 24 supplies transitions. |
| A75 | DUPLICATE | `16:185` ↔ case DT-1 repeat the portability ruling. |
| A76 | POINTER | `16:186` is the ruling; compiler investigations supply evidence and corrections. |
| A77 | DUPLICATE | `16:187` ↔ `CLAUDE.md:98-100`. |
| A78 | DUPLICATE | `16:188` ↔ `CLAUDE.md:79-81,98-100`. |
| A79 | POINTER | `16:189` is the ruling; `05_editor-helper-instrument-audit.md` owns the corrected measurement. |
| A80 | NONE | `16:190`; no exact second current assertion found. |
| A81 | NONE | `16:191`; no exact second current assertion found. |
| A82 | DUPLICATE | `16:192` ↔ `CLAUDE.md:79-81` restate Desktop-in-view/shared-Frontend direction. |
| A83 | NONE | `16:193`; no exact second current target/signing assertion found. |
| A84 | NONE | `16:194`; no exact second current assertion found. |
| A85 | POINTER | `16:195` is the ruling; Helper investigation owns measurements. |
| A86 | SPLIT | `16:196` owns the standing ruling; `plans/completed/08_…md:18` records historical scope and `16:41` restates the current effect. |
| A87 | DUPLICATE | `16:200` ↔ `CLAUDE.md:102-111` assert the same core-value axis. |
| A88 | POINTER | `16:201` owns the one-sentence definition; `CLAUDE.md:109-111` points to it rather than reproducing the sentence. |
| A89 | DUPLICATE | `16:202` ↔ `CLAUDE.md:102-111` repeat “managed environment, not editor” value. |
| A90 | NONE | `16:203`; no exact second current product-split assertion found. |
| A91 | SPLIT | `16:204` preserves the older “Registry next” ruling while `16:223` supersedes its name/scope and baton 39 says ranking ground was refuted; supersession is reconstructable only by reading all three. |
| A92 | POINTER | `16:205` is the candidate ruling; evidence and baton 32 are pointers. |
| A93 | POINTER | `16:206` is the ruling; `08_conclusion-and-next.md:306` supplies a reference implementation. |
| A94 | POINTER | `16:207` is the ruling; testing rules/evidence explain acceptance constraints. |
| A95 | NONE | `16:208`; no exact second current assertion found. |
| A96 | DUPLICATE | `16:209` ↔ baton 25 ↔ `local/README.md:35-37` and `read-load.sh:46-54`. |
| A97 | DUPLICATE | `16:213` ↔ `CLAUDE.md:165-166` and `AGENTS.md` repeat solo prohibition and actor split. |
| A98 | POINTER | `16:218` adopts the state; S007 `09` and corrected `08` own evidence. |
| A99 | NONE | `16:219`; this is the sole persistent in-repo owner of the Human context. |
| A100 | DUPLICATE | `16:220` ↔ baton 51 at `16:168`. |
| A101 | NONE | `16:221`; no exact second current Human-context assertion found. |
| A102 | DUPLICATE | `16:222` ↔ baton 50 at `16:167`. |
| A103 | DUPLICATE | `16:223` ↔ §1 candidate at `16:25-30`; baton 39 repeats the rename. |
| A104 | DUPLICATE | `16:224` ↔ `16:213` ↔ `CLAUDE.md:165-166`. |
| A105 | DUPLICATE | `16:225` ↔ baton 52 ↔ `context-brief.sh:15-23`. |
| A106 | POINTER | `16:227-235` owns movable loop position; `CLAUDE.md:141-144` points to it and case bodies own evidence. |
| A107 | SPLIT | `16:237-249` contains queue state, while several items are also batons/cases and `sessions/S004…md` owns two further observations; no single queue owner covers the whole deployment packet. |
| A108 | POINTER | `16:251` points to `sessions/S004_…md` §2. |
| A109 | POINTER | `16:253-260` points to `scripts/baseline.sh`; the command is the fresh measurement owner. |
| A110 | POINTER | `16:261-265` points to baseline/index owners. |
| A111 | POINTER | `16:266-269` points to the four measuring commands. |
| A112 | POINTER | `16:270` points to `scripts/usage-report.sh`; S007 plan/session are historical. (It also creates the A56 conflict.) |
| A113 | POINTER | `16:271-273` points to the three scenario commands. |
| A114 | POINTER | `16:275` states limits and routes measured propositions to investigation owners. |
| A115 | POINTER | `16:277-279` points to `CLAUDE.md:8-32`; read-load/B53/B9 measure/check the contract. |

### Wrong-owner findings that matter structurally

1. **Baton 43 is stale inside the sole current owner.** `16.md:160` says the effort state is `未verify`; `16.md:270` says it was measured `medium` over `6 files / 1,427 records / 100%` and explicitly says “baton 43 is CONFIRMED”. This is `SPLIT`, not harmless history. A topic split that merely copies the two blocks would preserve the contradiction.
2. **The strategic axis is deliberately in CLAUDE §4, but 16.md restates several of its facts.** A4, A73, A77, A78, A82, A87 and A89 are the clearest examples. The declared line between “invariant purpose” and “movable current position” (`CLAUDE.md:141-144`) is therefore not consistently applied.
3. **The owner map itself has four owners.** A1/A19 are asserted by 16.md, CLAUDE §2, local/README and the global rules. These are low-frequency governance facts, but drift changes what a cold start reads, so they should become pointers to one routing contract rather than four prose assertions.
4. **Cap/read-load provenance is triplicated.** A38/A65/A96/A105 repeat the same no-deletion/provisional/new-GO boundary across baton, ruling and script comment. This is genuine current truth, but more than one location claims to own its current status.

## C. Conditionality analysis

### Items required unconditionally

**60 / 115 items** are `YES`: A1, A3-A8, A13, A16-A20, A66-A105, and A109-A115. These cover current authority/router identity, purpose, objective/menu, all GO/STOP protections, ownership boundary, baton grammar, every Human ruling/supersession relation, and the baseline/read contract.

All 39 settled-decision bullets are `YES`. Some are domain-specific, but marking a Human ruling conditional would make the failure condition “the session performs a related action without seeing the ruling and violates it”; the packet explicitly disallows that classification. A future low-cost mechanism may route a compact invariant/prohibition form plus a triggered detailed ruling, but the semantic constraint itself remains unconditional.

### Items conditionally read

**55 / 115 items** are conditional. The trigger is also written in every corresponding A-row; this table states what fails if the item is not read when that trigger fires.

| ids | trigger | what breaks if the triggered session does not read them |
|---|---|---|
| A2 | provenance, authorship, or close audit | The session cannot attribute the last rewrite or distinguish current content from close metadata. No authority boundary changes; GEN A3 remains the ordering token. |
| A9 | lookup of a closed objective, its plan, or its evidence | The session may redo closed work or open the wrong evidence/plan. It does not gain authority because A16-A18 remain mandatory. |
| A10-A11 | an explicitly authorised donor/ecosystem task | The session may inspect a wrong revision or treat a decommissioned/archive component as current. The unconditional donor GO/read-only boundary still blocks unauthorised access. |
| A12 | exact Human wording or external-document provenance | The source among roughly 180 unrelated Downloads files cannot be located reliably, or a derived report may be mistaken for evidence owner. |
| A14 | any measured-evidence lookup | The reader may use a conclusion file or the wrong investigation instead of the evidence owner. |
| A15 | reading S007 evidence/conclusions | Reading `08` before `09` imports 13 pre-correction claims as current; this trigger must be enforced before opening either file. |
| A21 | compatibility/acceptance objective | Risk/count boundary, unresolved guarantee breadth and consuming evidence are lost. |
| A22 | stack/deployment/adapter architecture objective | The session may falsely infer a framework or deployment target from the donor or ordinary Web practice. |
| A23 | routing-profile write or effort escalation | The measured scale, pending GO and fail-closed escalation status are lost. |
| A24 | stack/deployment becomes settled | Project-specific protected paths would remain unregistered. |
| A25 | product-facing text edit | Fork-neutrality would continue guarding only its mechanism and not the known domain vocabulary. |
| A26 | Human rules on L-6/L-7 | Deferred bootstrap findings could be treated as active defects or forgotten. |
| A27 | browser/architecture support work | Unsupported browser claims or the unmeasured ChromeOS state could be promoted into design. |
| A28 | Human chooses third-party placement | A public-repo/legal placement decision would be made without the four-option evidence. |
| A29 | dependency adoption or redistribution | Actual licence/Marketplace restrictions could be skipped. This item is conditional only on the adoption trigger; the underlying licence discipline is also protected by mandatory A75. |
| A30 | planning docs are considered for git | Personal/company information could enter the public repository. The general no-private-data rule A69 remains unconditional; A30 supplies the file-specific fact. |
| A31 | user revises planning docs | Known contradictions and source-verified factual errors remain in the external plan. |
| A32 | portability/adoption question | The licence mark could again be used as a portability verdict. Mandatory A75 is the unconditional defense; A32 carries the live trigger. |
| A33 | using a conclusion or selecting an objective | A summary/evidence contradiction can be adopted, repeating DT-4. |
| A34 | case-index/template work | The consumer-only B57 workaround or template defect can be removed/fixed in the wrong repository. |
| A35-A36 | compiler architecture or the named donor-side maintenance question | Open compiler design boundaries can be treated as settled, or a network failure can be misreported as version absence. |
| A37 | S002 probe reused | Non-production code and an unauditable runner could be treated as implementation/evidence. |
| A38 | handover/context/read-load maintenance | The Human-owned choice and no-threshold/no-deletion constraints are lost; this packet's topic-split work specifically triggers A38. |
| A39 | S003 probe reused | Probe-only security/installation limitations could enter production design. |
| A40-A48 | the corresponding Web/Desktop/Helper/LSP/Registry architecture option opens | The session loses unresolved decisions, evidence limits, required ordering (notably A47 before A41), and real-fire gaps. The A-row trigger names the exact option for each item. |
| A49 | product specification or planning document is written | Debugger scope is omitted without a Human decision. |
| A50-A54 | competitor, re-ruling, Registry, instrument, or real-use objective (respectively) | Population limits, Human-only re-ruling, measurement defects or 11 GO-gated tests are skipped. Each A-row names its narrower trigger. |
| A55 | harness behavior cannot be explained by repository rules | The session can waste effort searching repo configuration for a product-injected instruction and misdiagnose delegation behavior. |
| A56 | session pre-flight/effort diagnosis | The conductor effort is misreported. At present, reading A56 alone is itself unsafe because A112 contradicts it; owner reconciliation is required before migration. |
| A57-A62 | selected competitor test, closest-competitor audit, population rebuild, Particle reference, academic citation, or absence claim | The session can perform GO-gated external actions, overstate coverage/evidence, or generalize absence beyond the measured population. |
| A63-A64 | auto-UI/device-knowledge architecture | The wrong input model can be designed around, or an unproven Human expectation can be called proven product value. Mandatory A100/A102 remain the ruling-level defense. |
| A65 | brief nears cap or menu #2 opens | The provisional cap can be treated as repeatable authority, or current truth can be deleted instead of restructuring. Mandatory A105 retains the Human ruling. |
| A106 | harness loop/case/feedback work | Harvest/crossdeploy/spot state is reconstructed from history rather than current position. |
| A107-A108 | authorised template deployment visit | Project-independent findings or the two S004 structural observations are omitted from the visit. They do not authorize editing Project_Template; A72 remains mandatory. |

Adversarial result: there is no conditional item for which skipping it under its trigger is safe. Conditionality is therefore a routing obligation, not permission to omit the fact permanently. The safe cold-start sequence is: mandatory router/rulings/baseline first; then evaluate the current task against every enumerated conditional trigger before acting.

## D. Candidate future owners

I propose **4 topic owners**. These are authority domains, not final filenames or migration steps.

| candidate owner | holds | update trigger | read class | inventory ids |
|---|---|---|---|---|
| **1. Session authority + runtime** | generation, objective/menu, GO/STOP, ownership/read pointers, baton grammar, loop-independent baseline and its limits | every close; immediately on Human GO/STOP/objective change; remeasure baseline on cold start/final tree | **mandatory** | A1, A3, A5-A8, A13, A16-A20, A109-A115 |
| **2. Human rulings + supersession** | invariant purpose edge, 5-tuple grammar, every settled/superseded decision, rejected option and boundary | only when Human issues/revises a ruling or an existing ruling is legally superseded | **mandatory** | A4, A66-A105 |
| **3. Open batons** | one row per unfinished fact, closed status grammar by reference, actionable trigger, authority/owner/severity | at every close when a baton is added, reworded, resolved, relocated or Human-dropped; on status/trigger change | **conditional after router evaluates task**, with a mandatory count/status summary in owner 1 | A21-A65 |
| **4. Evidence/provenance + harness-feedback routing** | closed-objective destinations, donor pins/ecosystem, external-source paths, evidence owner/read order, loop position and template-feedback queue | objective close changes evidence map/pins; external source added; evidence correction changes order; feedback item changes | **conditional** on evidence/provenance/donor/template triggers | A2, A9-A12, A14-A15, A106-A108 |

Why four, not fewer:

- Three would force either batons back together with evidence routing or rulings back together with every-close runtime. Those pairs have different authority and update triggers: Human-only/rare vs close-time, and unfinished-current-state vs immutable evidence routing.
- The Human's example separated “session control” from “harness/runtime”. The observed data does not support that split here: objective/GO/GEN and baseline are all rewritten/revalidated at close, are all mandatory, and are already jointly consumed by cold start. Conversely, the example did not name the substantial evidence/provenance routing domain (A9-A15, A106-A108), whose read triggers are independent of product rulings. The candidate set is therefore derived from this inventory, not copied from the example.

Why not more:

- Splitting product rulings by Board/Compiler/UI/AI would create cross-file supersession joins such as A91↔A103 and A100↔A102. Their shared Human-only update authority is stronger than their topic vocabulary.
- One file per baton or ruling is rejected: it would create 84 independently stale generation surfaces and make cross-item constraints (A41↔A47, A56↔A112) harder to detect.
- Evidence routing and template feedback remain one conditional owner because both are indexes into immutable evidence, not evidence bodies. Separating them would save little read cost while adding another close/generation reconciliation surface.

The mapping accounts for **115 / 115 inventory ids** exactly. It does not delete current truth. Duplicate items must be resolved by choosing the surviving owner and converting all other appearances to pointers; SPLIT items must be reconciled before relocation.

## E. Mechanism constraints if 16.md ceases to be the sole owner

### Normative owner/read contracts

| mechanism | binding line (literal text) | what breaks / required semantic change |
|---|---|---|
| `CLAUDE.md` cold-start list | `CLAUDE.md:17` — “**prompt/.../16_次セッション引き継ぎ指示書.md — primary handover, current state**” | It names one full current-state file. The mandatory/conditional topic set and order must replace this single edge. |
| `CLAUDE.md` recovery claim | `CLAUDE.md:21` — “**everything a cold start needs to act is in 16.md**” | False after a split unless “16.md” becomes a router and the claim names how every required topic is recovered. |
| `CLAUDE.md` contract owner | `CLAUDE.md:30` — “**This section is the owner of the cold-start read contract. 16.md §5 points here... scripts/read-load.sh measures exactly this set**” | §0, read-load roster and hook injection must change atomically; otherwise B53/B9 can compare the wrong sets. |
| `CLAUDE.md` owner table | `CLAUDE.md:52-55` — objective/GO/GEN, batons, decisions and baseline all resolve to one 16.md section | Every row must point to the new canonical topic owner; B54 requires these to remain pointers, not copied facts. |
| `CLAUDE.md` strategic boundary | `CLAUDE.md:143-144` — “**this section is the invariant purpose; 16.md §4 is the movable position — never mix them**” | The new ruling/loop owners must preserve invariant-vs-movable ownership and remove current duplicate assertions, not move them wholesale. |
| `CLAUDE.md` bootstrap reminder | `CLAUDE.md:278` — “**auto-injects the current handover (16.md) + active bug index**”; `:283` — read `16.md` | Both fallback and automated path assume one file. They must route through the same topic declaration. |
| `local/README.md` default | `local/README.md:23` — “**16_...md = 現在地の canonical owner(常に上書き。hook が注入する唯一の入口)**” | The structure map must define 16.md as router/one topic plus the other owners, without inventing a new numbered handover. |
| `local/README.md` single-owner doctrine | `local/README.md:29` — “**現在地は単一・履歴は分散が原則**” | The optional exception must be explicitly activated for this project; current facts may not be copied into sessions. |
| `local/README.md` split eligibility | `local/README.md:55` — “**実際に独立した authority domain を複数持つ場合に限り...分割してよい**” | Section D supplies four independently triggered authority domains; the parent still must adopt that conclusion. |
| `local/README.md` three split obligations | `local/README.md:58` — “**① close の同一 commit で全 topic file を更新する ② handover-diff.sh が全 topic file を走査対象にする...③ 各 topic file の generation が router の宣言と一致する**” | All three are correctness requirements. Merely changing read-load/context-brief would leave cross-file staleness undetected. |
| global single-source rule | `global/rules/README.md:231-235` — current state has “**Exactly one canonical owner**” and topic split is optional | Each fact still needs one owner after the file-level split; topic files are not replicas. Global file is template-derived and must not be edited here. |
| `maintenance_index.md` | `maintenance_index.md:36` — “**16.md(現在地・上書き)**”; `:44` names CLAUDE/read-load as contract owner | Structure map/read-order summary becomes stale unless updated on structural change. It remains an index, not a new current-state owner. |

### `scripts/read-load.sh`

| binding | literal text | breakage |
|---|---|---|
| Roster | `read-load.sh:151-159` — `ROSTER=( ... "$L/handover/16_...md|injected by the SessionStart hook" ... )` | It expects **7** inputs and counts all of 16.md because it has no Core marker. New mandatory topic owners must be roster entries; conditional owners must not be charged unconditionally. |
| Portion rule | `read-load.sh:117-126` — if no `## Core`/`## Part 1`, `else cat "$f"` | A router/mandatory topic needs an explicit measured portion or remains full-cost. Conditional files must not be smuggled into a Core portion that the task does not need. |
| Denominator | `read-load.sh:163-164` — `EXPECTED=${#ROSTER[@]}` / `MEASURED=0` | File-count denominator must move with the declared mandatory set; hard-coded downstream `7/7` controls will otherwise fail or, worse, certify the old set. |
| Premise check | `read-load.sh:245-259` checks Core-only wording in `CLAUDE.md` §0 | Any new partial mandatory owner needs the same CLAUDE §0 “Core/Part 1” premise. This check currently knows only three global marker files. |
| Output contract | `read-load.sh:218-230` emits total/status and one row per roster entry | Parent consumers and tests parse line 1 plus `inputs measured M/E`; the schema can remain, but the plan must expose every mandatory topic and its exact range. |

### `scripts/context-brief.sh`

| binding | literal text | breakage |
|---|---|---|
| Single source variable | `context-brief.sh:14` — `HANDOVER=".../16_...md"` | Only one handover path can be overridden/exported. Topic paths need an explicit allowlist; directory globbing would violate the sanctioned surface. |
| Section extraction allowlist | `context-brief.sh:87-90` — extracts CLAUDE §4 and handover `§3`, `§1`, `§2` | After a split, decisions/current state/batons disappear from the brief unless each new owner/section is explicitly extracted. Ordering must preserve rulings before actionable state. |
| Brief assembly | `context-brief.sh:216-218` — `SETTLED DECISIONS`, then concatenated `CURRENT STATE`, then `BASELINE` | Assembly assumes one section grammar and no per-topic generation. It must include router generation plus each included topic generation so a recipient can reject a mixed snapshot. |
| Baseline fallback | `context-brief.sh:100-108` extracts handover §5 only if no generator exists | This repo has a generator, but the generic fallback would silently lose baseline if §5 moves. The fallback path must point to the runtime owner if retained. |
| Allowlist comment | `context-brief.sh:4-9` says it reads “**handover §1-§3**” and never sessions/bugs/case bodies | The documented export boundary and actual reads must change together. Thresholds are explicitly outside this packet. |

### `scripts/handover-diff.sh`

| binding | literal text | breakage |
|---|---|---|
| Single path | `handover-diff.sh:37` — `H=.../16_...md` | Git history/base selection and current copy operate on one file only. Other topic owners would have no removal detection. |
| False denominator | `handover-diff.sh:62-69` — “**One current-state file today**”; `SCANNED=1` | This would continue printing `files scanned: 1` after a split. Obligation ② requires the scan set and denominator to enumerate all topic files. |
| Parser grammar | `handover-diff.sh:74-90` — parses only `§2` table rows and `§3` bullets | It must parse baton and ruling owners at their new paths; current regex section state cannot see a router or separate topic grammar. |
| Version selection | `handover-diff.sh:44-60` uses the last commit touching `$H` | Different topic files can have different last-touch commits; comparing each file independently can create a mixed-generation view. Router generation and same-commit obligation must be checked before reporting clean. |
| Result denominator | `handover-diff.sh:116-136` prints parsed before/now and GONE counts | Denominators must be per topic plus total; zero entries in a legitimate non-baton topic cannot be treated like parser failure, while zero in the baton/ruling owners still must fail closed. |

### `scripts/selftest.sh` handover-related guards

| check | binding line (literal behavior) | what must change or remain |
|---|---|---|
| B4/B4s | `selftest.sh:311` runs `bash scripts/read-load.sh`; `:321-335` requires RC 0, unit and complete `M/E`; `:343-354` requires observable status | Logic can remain, but the new roster/denominator must be reflected. B4 does not prove conditional topics are reachable. |
| B8 | `selftest.sh:366-370` requires CLAUDE §0 to name `read-load.sh` | Remains necessary; CLAUDE §0 must additionally expose new mandatory ranges and conditional router. |
| B9 | `selftest.sh:397-409` extracts every `"$ROOT/..."` hook path and requires it in read-load output | Every newly injected topic becomes unconditional cost and must be rostered. A router-only hook means conditional topics must not be injected. B9 checks paths, not truncation/completeness. |
| B12 | `selftest.sh:384-388` rejects line counts in CLAUDE §0 unless the line names read-load | New topic ranges must stay command-produced; do not copy measured line counts into prose. |
| B50 | `selftest.sh:1230-1239` builds a fixture with only `16_*.md`; `:1253-1267` hard-codes `7/7`, `0/7`, `6/7` | Fixture copy set and all denominators must follow the new mandatory roster. Controls must still show all-missing/one-missing/present-empty failures and session-history invariance. |
| B51 | `selftest.sh:1302-1310` creates only `16_...md`; `:1320-1361` tests GONE/zero/alpha ids | Detection-power fixtures must exercise the multi-topic scan, a missing topic, cross-file generation mismatch and the baton/ruling parser owners. |
| B52 | `selftest.sh:1375-1389` hard-codes 16.md GEN and newest session comparison | Local obligation ③ requires router GEN plus every topic GEN. Presence/equality must be checked for **all declared topics**, not only 16.md. |
| B53 | `selftest.sh:424-449` parses numbered CLAUDE §0 paths and compares them with read-load; it also tests newest-session presence | It must see every mandatory topic path in both directions. Conditional owners need a separate reachability/trigger check rather than being added to this unconditional set. |
| B54 | `selftest.sh:1403-1416` scans CLAUDE §2/§3 for current assertions | Predicate can remain; CLAUDE's pointer table must be updated to new owners without copying state into CLAUDE. Current patterns are not exhaustive, so parent review remains necessary. |
| B55 | `selftest.sh:1471-1493` hard-codes one handover and requires `9/9` responsibilities in it | Directly conflicts with a topic split. It must validate the router declaration and recover the nine responsibilities from the declared owner set, while proving each has one owner. |
| B56 | `selftest.sh:1503-1529` validates close steps and 5 Phase-2 obligations | Close obligations must be revised first; B56 should additionally assert same-commit all-topic update and generation reconciliation. |
| B58 | `selftest.sh:1635-1679` copies one handover, empties sessions, parses eight facts from that one file, and deletes §1 for the negative control | Directly conflicts with split ownership. The positive must recover 8/8 from router + declared mandatory/triggered fixtures without history; negatives must remove one declared owner and break recovery. |

### SessionStart hook

| binding | literal text | breakage |
|---|---|---|
| Fixed path | `.claude/hooks/session-start.sh:14` — `HANDOVER="$ROOT/.../16_...md"` | Only 16.md is loaded. The hook needs either a complete mandatory-topic allowlist or a router whose conditional edges are followed later. |
| Read claim | `.claude/hooks/session-start.sh:37` — “**The current handover (16.md) is inlined below... Treat it as read.**” | This claim must name exactly what was injected. It cannot license treating non-injected conditional owners as read. |
| Current truncation defect | `.claude/hooks/session-start.sh:31` — `handover = clipped(..., 200)`; `:27-28` truncates beyond the limit | The measured file is 279 lines, so **200 / 279 lines are injected and 79 / 279 are omitted**, including decisions A88-A105 and all A106-A115. Yet line 37 says treat the handover as read. B9 remains green because it checks the path only. This defect exists before any split and must not be copied into the new architecture. |
| Stale comment | `.claude/hooks/session-start.sh:6` — “**≤100 lines by convention**” | Contradicts `local/README.md:31-37`, where the hard limit is abolished. It can mislead future maintenance even though it is not executed. |
| Generation | Hook emits no independent list of topic generations; it embeds the GEN-bearing file | A split requires a router-declared generation manifest and all injected topics to match it, satisfying local/README obligation ③. |

### `/close`

| binding | literal text | breakage |
|---|---|---|
| Full rewrite | `.claude/commands/close.md:16` — “**Full 16.md rewrite: overwrite ...16...md**” and put §3/§5/GEN there | Must become an atomic rewrite/update of router plus all topic owners in one commit. Ruling and baseline destinations change; GEN advances everywhere. |
| Removal audit | `close.md:18` — “**After rewriting, run bash scripts/handover-diff.sh (mandatory)**” | The command must scan every declared topic and print per-topic/total denominators before close can proceed. |
| CLAUDE consistency | `close.md:22-24` walks CLAUDE against the rewritten handover and keeps §2/§3 pointer-only | Owner-table reconciliation must cover every topic; this remains mandatory. |
| Baton registration | `close.md:26` requires each Warning to become “**a 16.md §2 task row**” or other disposition | Destination must become the baton owner, and the router generation must advance in the same close. |
| Index reconciliation | `close.md:28` updates maintenance_index only on structural change | This migration is a structural change, so the structure map/read-order summary is part of the parent's migration scope. |
| Final-tree evidence | `close.md:34` requires gates/baseline on the FINAL tree and after commit/push | Multi-topic generation and removal scans must run on the final tree; an earlier all-topic match cannot cover later edits. |
| Next-session promise | `close.md:36` — “**The next session auto-receives the updated 16.md via the SessionStart hook**” | Must say what mandatory snapshot is actually injected and how conditional topic owners are reached. |

### Mechanism-level conclusion

The architecture is not changed safely by moving prose first. The current mechanisms form one hard-coded chain:

`CLAUDE §0 single path → read-load one roster entry → hook one clipped file → context-brief §1/§2/§3 extraction → handover-diff one file → B52/B55/B58 one-file recovery → /close one-file rewrite`.

The local optional-capability contract requires all three compensating controls—same-commit update, all-topic removal scan, and router/topic generation equality—before that chain can truthfully claim recovery. This report does not design the migration sequence or change any threshold.

## Competing hypotheses, unresolved questions and evidence limits

### Competing hypotheses tested

1. **H1 — simple duplication is the primary cause.** Partially refuted. DUPLICATE+SPLIT is 42/115 items and 29,101/80,427 bytes, material but not dominant. POINTER+NONE is 73/115 items and 51,326/80,427 bytes. Deleting repeated-looking content would therefore destroy genuine current state or routing.
2. **H2 — ownership is over-concentrated despite mostly genuine content.** Supported. Four groups have different update authorities and read triggers, yet all are forced through one full-file roster/hook/export/diff/close chain. The 45 batons and 39 Human rulings alone are 84 distinct item-level facts.
3. **H3 — the present single-file mechanisms guarantee exact cold-start restoration.** Refuted for the actual hook path. Static code shows the hook truncates at 200 lines while claiming the 279-line handover is read. Selftest B58 proves the file-on-disk recovery grammar, not the hook payload; B9 proves the path is counted, not that all bytes were injected.
4. **H4 — moving facts into topic files is sufficient.** Refuted by mechanism analysis. Without the three local/README obligations and changes to context-brief/read-load/hook/diff/B52/B55/B58/close, a topic move creates internally plausible but mixed or unreachable state.

### Unconfirmed

- The four-owner candidate is an investigation output, not an adopted architecture. The integration owner/Human has not selected owner names, filenames, exact router grammar or the mandatory-summary shape.
- Actual post-split token cost is not measured because no migration artifact exists. This report does not use a hypothetical token saving as evidence.
- Whether all 39 Human rulings must be injected verbatim, or may be represented by an unconditional compact prohibition/index with triggered full grounds, cannot be distinguished by this inventory alone. The semantic rulings are mandatory; representation is a redesign question.
- The hook's real model-context behavior was not inspected through a Claude transcript in this lane. The 79-line omission is established statically from `clipped(..., 200)` plus the measured 279-line subject; the downstream behavioral effect is inferred from the hook's literal “Treat it as read” instruction.

### Evidence not obtained and why

- No external `~/Downloads` source was opened: the packet asks for current-owner inventory, and those files are outside the repository and are only provenance targets here.
- No DigiCode donor path was opened: explicitly forbidden for this packet.
- No migrated context brief, split-generation manifest or multi-file handover-diff output exists, so their correctness/detection power cannot be run. Section E is static mechanism analysis, not synthetic proof of a future design.
- No visual/API/real-fire rung applies to this documentation architecture inventory. The only synthetic rungs run are the current read-load and selftest instruments.

## Commands run and observed results

| verification type | command | observed result |
|---|---|---|
| static | `wc -l prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md` | `279` lines |
| static | `wc -c prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md` | `80427` bytes |
| synthetic | `bash scripts/read-load.sh` | `65868 48000 tokens`; inputs `7/7`; `BUDGET_STATUS: WARNING`; 16.md `279` lines / `30488` estimated tokens; RC 0 |
| static | inventory-range byte summation | `279/279` lines and `80427/80427` bytes, no gaps/overlap |
| synthetic | `bash scripts/selftest.sh; echo RC=$?` | `RESULT: 75 passed / 0 failed`; `RC=0`. Relevant observations: B4/B4s healthy/WARNING, B8 green, B9 green, B50 green, B51 green, B52 green, B53 `5/5` contract paths, B54 `2/2`, B55 `9/9`, B56 green, B58 read-load `7/7` and recovery `8/8` (negative `6/8`). The hook truncation finding is not detected because B9 checks injected paths, not injected line completeness. |

Not run: donor reads (forbidden/out of scope), network, API smoke, visual, real-fire, product typecheck/lint/test (no product code or stack), mutation harness (no guard was edited).
