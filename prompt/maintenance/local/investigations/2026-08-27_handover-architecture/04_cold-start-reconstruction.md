# S008-D cold-start reconstruction verification

- Packet: `S008-D-cold-start-reconstruction`
- Lane: `VERIFICATION`
- Authority: `DELEGATED`
- Date: 2026-08-27
- Scope discipline: the reconstruction used only the packet's cold-start set and conditionally routed owners. I did not open `investigations/**`, `handover/sessions/**`, `改定log.md`, donor files, or git history commands. The only `investigations/**` write is this report.

## Method and observed cold-start inputs

1. Ran `CLAUDE_PROJECT_DIR="$PWD" bash .claude/hooks/session-start.sh`; parsed `hookSpecificOutput.additionalContext`. The payload injected the complete router and named two conditional owners.
2. Ran `bash scripts/read-load.sh`: **58,262 tokens / 48,000-token allowance (121%), inputs 7/7, `BUDGET_STATUS: WARNING`, RC 0**. The unit is estimated tokens, not lines. WARNING is the packet's known accepted state.
3. Read only the emitted ranges: `README.md` lines 1–94, rule 13 lines 1–263, rule 17 lines 1–48, judgment history Part 1 lines 1–194, plus full `CLAUDE.md` and the injected router.
4. Before opening a conditional owner, recorded the fact chased, the pointer, and whether its stub was safe. The three trigger records were:
   - S007 evidence order → `evidence-map.md`; pointer: router lines 43–52 and `CLAUDE.md:23-26,66`; pointer sufficient: yes.
   - template-feedback queue → `evidence-map.md`; pointer: router lines 43–48, 201–206 and `CLAUDE.md:23-26,66`; pointer sufficient: yes.
   - C3/C4 body/GEN mutation target → `batons.md`; pointer: router lines 130–137 and `CLAUDE.md:23-25`; pointer sufficient: yes.
5. Ran `bash scripts/baseline.sh`; the measurements in A13 come from that run, not from the handover.

Verification labels: document reconstruction and source enumeration are **static**; script and mutation-copy results are **synthetic**. API-smoke, visual, and real-fire were not run because this packet tests the governance cold start and no application code exists.

## A. Reconstruction

### A1. Current objective and present authority — unconditional

`PRIMARY_OBJECTIVE` is **UNSET**; Practical IoT Competitive & DigiCode Capability Revalidation was Human-accepted and closed. Nothing authorises starting a product or maintenance objective now. The first candidate explicitly requires a newly declared Human objective, neither menu item is authority, and production implementation must not start automatically.

Sources: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:23-41` (injected router).

### A2. Next-objective menu — unconditional

There are **2 menu items**:

1. `Managed Environment & Device Knowledge Architecture Design` — **product design**.
2. `handover / context-brief / read-load topic split maintenance` — **harness maintenance**.

A menu item is not authority to begin.

Source: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:25-39` (injected router).

### A3. Full GO/STOP boundary — unconditional

**Waiting on user GO:**

- writing measured routing values into the routing profile;
- deciding whether S005 §1/§2/§3 requires a new ruling;
- starting `Managed Environment & Device Knowledge Architecture Design`;
- Web / Desktop / shared-Frontend architecture;
- formally adopting Local Helper;
- Text Compiler architecture;
- Board / Library bundle boundary;
- product specification;
- compatibility / acceptance matrix;
- technology stack / deployment target;
- third-party-material placement.

**Always needs its own GO, whatever came before:**

- any change to DigiCode, its compiler, Docker images, Cloudflare, DNS, deploy, production Board/Library additions, production AI, or production Web Serial/BLE OTA;
- any push capable of a production effect;
- adopting a mechanism or code asset from DigiCode or another reference implementation;
- changing a gate class or threshold;
- overwriting/relicensing `LICENSE` (AGPL-3.0);
- changing PUBLIC visibility;
- writing a model/effort/target mapping into the routing profile;
- creating a competitor account, signing a paid contract, charging money, making sales contact, or registering personal information.

**Forbidden without a new ruling:**

- reopening a §3 settled decision;
- importing DigiCode legacy governance; the donor `prompt/` stays unopened;
- deleting current truth to move a size signal;
- treating a baton or next-objective candidate as work authority;
- modifying `Project_Template` from this repository;
- treating S002/S003 probe code as production;
- making another read-load structural change;
- completing a `PRIMARY_OBJECTIVE` with Opus 5 solo.

Sources: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:57-63` (injected router).

### A4. Target users and “簡単” — unconditional

The primary users are people with an existing professional or technical domain who are beginners in embedded/IoT: company engineers/employees, Factory Scientist participants, technical-college and university users, researchers, FabAcademy/FabLab users, Makers and smart-device prototypers, especially specialists in mechanical/electrical/manufacturing/design fields who are not embedded-software specialists.

“簡単” means retaining capabilities needed for practical IoT/device development while hiding complexity through the environment, AI, and managed knowledge so a non-specialist can reach a practical result. Reducing MQTT, Azure, Home Assistant, RS485, Modbus, CAN, industrial sensors, local backends, or Raspberry Pi servers because they look difficult is the explicitly rejected direction. Therefore “reduce features for beginners” is wrong.

Sources: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:195-198` (injected router).

### A5. Primary/secondary-school and classroom use — unconditional

Primary/secondary-school, programming-classroom, workshop, education and simple-prototyping use is **not excluded**, but it is **not the main battlefield or primary evaluation axis**. The product must neither exclude those uses nor optimise features/architecture primarily to beat school-market competitors.

Source: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:199` (injected router).

### A6. Core value — unconditional

The project's own one-sentence definition is:

> 「DigiCode Text は、検証済みのマイコン開発環境(Board・Toolchain・Library・Dependency)を利用者自身に構築させずに提供し、その同じ管理済み環境を Compiler と AI が共有して利用する MCU 開発環境である。」

The core value is the managed, verified MCU environment and its shared source of truth for Compiler and AI—not editor competition, “Web IDE” uniqueness, or AI code generation by itself.

Sources: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:168-170`; `CLAUDE.md:116-125` (both unconditional).

### A7. What is and is not proven — unconditional

The proposed product value is **not proven**. The adopted state is exactly:

`legacy rationale mostly REFUTED / problem existence SUPPORTED / proposed product value NOT RESOLVED`.

Supported/resolved as evidence: embedded-code AI really produces nonexistent-library and wrong-API failures, and Managed/Verified-environment mechanisms have precedents. Not resolved: whether DigiCode Text's proposed solution and combination creates user value. “PRODUCT VALUE PARTIALLY RESOLVED” was explicitly rejected.

Source: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:186` (injected router).

### A8. Why industrial-IoT support stopped — unconditional

It did **not** stop because DigiCode did not value industrial IoT. DigiCode targeted people designing/building devices and implemented substantial MQTT, Azure IoT, Home Assistant, HTTP, WebSocket, BLE, Wi-Fi, CAN, Modbus and Controller/UI support. It stopped when each new industrial Board/Device/Sensor/Protocol caused a Blockly-wide chain of Block definition, Generator, parameter UI, synthesis, board differences, library dependencies, AI catalogue/context, samples, i18n, block combinations, compatibility, regression and compile tests; development and maintenance cost exhausted available capacity.

The specifically rejected interpretation is: **“DigiCode was not aiming at industrial IoT.”** “It did not reach the industrial-IoT layer” is an observation; that causal interpretation is wrong.

Source: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:187` (injected router).

### A9. Device knowledge and supported scope — unconditional

“Adding Device knowledge increases supported scope” is **an unproven Human design expectation/hypothesis**, not established product value. It is a high-priority question for the next architecture objective; the schema remains open.

Sources: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:127,188` (injected router).

### A10. Opus 5 solo — unconditional

Opus 5 may not complete a `PRIMARY_OBJECTIVE` alone. The conductor owns harness/scope/orchestration/integration; delegate lanes supply source analysis, probes, verification and falsification. An objective ending with **`codex tool calls = 0` is unmet**; lane unavailability is a STOP/escalation, not authority for silent solo completion.

Sources: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:181,192`; `CLAUDE.md:175-180` (unconditional).

### A11. GEN and disagreement — unconditional, conditionally cross-checked

Current `GEN` is **`S007-close`**. For the hook's frozen router copy versus a disk re-read, the higher generation is current and, if contents differ, **disk is right**. Across the three owner files, a GEN mismatch means at least one is stale; the router is the route owner and B70 is the fail-closed check.

Primary source: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:13` (unconditional). Conditional cross-checks after the recorded C3/C4 trigger: `prompt/maintenance/local/handover/batons.md:12`; `prompt/maintenance/local/handover/evidence-map.md:12`; both also read `S007-close`.

### A12. Batons — unconditional

Direct table enumeration and live B71 output show **46 total baton rows: 42 Status OPEN and 4 DEFERRED**. The prose claims “45”; that stale count is a false fact, not the measured answer.

The **24 🔴 batons** are:

- 2 compatibility/acceptance; 3 concrete stack/deployment/adapters; 4 routing-value write GO;
- 16 private planning material; 18 licence marking is not portability; 19 evidence before conclusions/menu is not queue;
- 21 Compiler direction is not design; 24 S002 probes are not production; 27 Helper feasibility is not adoption;
- 28 Board/Library bundle boundary; 29 Web complete without LSP; 34 cloud-vs-local Desktop Compiler first;
- 35 AI-primary vs intranet reachability; 37 competitor inventory/zero real use; 38 refuted grounds require Human choice;
- 39 updated Registry ground must be declared; 40 nine instruments need positive-control remeasurement; 45 Arduino Cloud AI Assistant priority audit;
- 47 Particle 10/972 scope is not demand proof; 48 academic evidence has limited reach; 50 auto Web UI consumes registration metadata, not C++;
- 51 Device-knowledge expansion is unproven; 52 96-KiB cap provisional/further increase GO-gated; 53 three-owner close/GEN integrity.

Three actionable-trigger examples:

- baton 4: only when Human gives GO to write the measured routing values;
- baton 16: when the user decides whether a de-identified planning document belongs in `local/plans/`;
- baton 52: when the brief again approaches its cap or menu #2 is opened as an objective.

Sources: router table `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:82-130` (unconditional); synthetic cross-check `bash scripts/selftest.sh` printed `B71 ... 46/46`.

### A13. Baseline — unconditional route, freshly measured

The owner says to obtain it with `bash scripts/baseline.sh`; captured values must not be transcribed from the handover. My static run, before writing this report, observed:

- HEAD `99d629c`; uncommitted entries **12**;
- typecheck/lint/test: absence measured, no `tsconfig.json` or `package.json`;
- active bugs **0**;
- common/local rules **25 / 0**;
- case-index rows **93**;
- active/completed plans **0 / 8**;
- sessions **8**;
- unconditional read **58,262 tokens / 48,000-token allowance**, WARNING, inputs **7/7**.

Sources: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:208-231`; `CLAUDE.md:61-70`; command artifact from `bash scripts/baseline.sh`. The numeric values above are measurements from that run.

### A14. S007 evidence read order — conditional

Trigger: A14 asks for an evidence file and its read order; router lines 43–52 explicitly route that need to `evidence-map.md` and already keep the safety-critical order in the stub.

Required order: **`00_index.md` → `09_integration-falsification.md` → `08_conclusion-and-next.md`**. Read 09 before 08 because 09 caused **13 corrections** to 08; otherwise a fresh reader carries pre-correction integration claims back as current truth.

Sources: unconditional stub `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:43-52`; conditional owner `prompt/maintenance/local/handover/evidence-map.md:61-72`.

### A15. Project_Template relationship and feedback queue — conditional

This repository is a **consumer**, not a distributor. It never modifies `Project_Template`; a feedback item waits in a queue for a user-decided deployment visit.

Unconditional sources: `CLAUDE.md:155-158,194-197`; router `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:150,201-206`.

Trigger: A15 explicitly asks for the queue; the above router stub points to `evidence-map.md`.

Queue contents:

1. DT-1: licence marking is not a portability verdict.
2. B57 special-cases only the `PT-` prefix.
3. DT-2: probe defects are biased toward false negatives.
4. No runtime audit proves the start-time route line was actually written then.
5. Rule 22 independent-perspective triggers lack a firing mechanism/enumeration.
6. `RESULT CAPSULE` does not specify persistence destination.
7. Integration documents lack a mandatory falsification-lane trigger.
8. Parent-side packet/file/integration work lacks a corresponding verification stage.
9. SessionStart can silently clip a mandatory owner while saying it was read.
10. read-load can under-report actual context cost when hook delivery is duplicated.
11. Template `handover-diff.sh` does not implement optional multi-owner scanning.

Only **#7 and #8 are explicitly Human-approved**. #1–#6 remain in the pre-existing queue. #9–#11 are new, **not approved** candidates. Approval means “may be recorded in the queue,” not authority to edit the template.

Source: `prompt/maintenance/local/handover/evidence-map.md:75-109` (conditional).

### A16. 96-KiB context-brief cap — unconditional

The 96-KiB cap is **provisional**, not settled permanently. S008's split did not shrink the brief; it grew because omitted truth was exported. It may not be raised again merely because it is exceeded or approached: another increase requires a fresh Human GO. Lowering it is also a Human decision.

Sources: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:128,193,224` (injected router).

### A17. Current-state owner set and safety — unconditional

The owner set is:

1. `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md` — router, **unconditional**, injected whole.
2. `prompt/maintenance/local/handover/batons.md` — baton bodies/grounds, **conditional**.
3. `prompt/maintenance/local/handover/evidence-map.md` — evidence/provenance/read order/loop/feedback queue, **conditional**.

The split is safe when every prohibition, limitation and read order has a router stub before a conditional open; the hook manifest exposes routes; B69 checks full injection; B70 checks owner existence/manifest/GEN agreement; B71 checks bidirectional baton stub↔body correspondence. The live baseline observed B69 2/2, B70 2 conditional owners, and B71 46/46.

Sources: `CLAUDE.md:17-28,39-41,61-70`; router `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:130-137,222-225` (unconditional).

## B. Failure list

### MISSES — 0 / 17 questions

None. Every A question was recoverable without an OFF-LIMITS read. This is not inferred from a clean answer set: section C shows six actual loss mutations and the mechanisms that did or did not see them.

### FALSE FACTS — 2 / 17 questions contained a wrong or overstated cold-start fact

1. **Baton count (A12):** I initially accepted “45 batons” from `CLAUDE.md:21,25`, router lines 134–136, and `batons.md:4-8`. Full router enumeration and live B71 instead measured **46/46**. Corrected answer: 46 total rows, 42 OPEN, 4 DEFERRED. The stale declaration is recoverable only by counting rather than trusting the prose.
2. **Which check catches a deleted stub (A17):** `CLAUDE.md:28` says B70 makes router-stub deletion loud. C2 showed B70 green and **B71** red (`COUNT=45/46 body-without-stub:2`). Corrected mechanism: B70 guards owner set/GEN/manifest; B71 guards stub↔body correspondence.

### LATE FACTS — 0 / 3 recorded conditional routes

No fact arrived too late to keep the session safe. Before `evidence-map.md`, the router already said 09 before 08, never to modify the template, and that queue items are not fixes. Before `batons.md`, every baton still had stub/status/trigger/owner/severity and no baton was authority. Conditional opens added grounds and inventory, not a missing permission boundary.

### WRONG-OWNER READS — 0 / 3 recorded conditional routes

Both pointers resolved correctly: the two evidence/queue triggers reached `evidence-map.md`; the C3/C4 body/GEN trigger reached `batons.md`.

## C. Negative controls

All mutations were made in independent copies below `/private/tmp/S008-D-controls.t5Qiir`, created by `mktemp -d` and `cp -a`. The real tree was not mutated. Each target count was checked before/after.

Unmutated-copy control:

- `bash scripts/selftest.sh` → **RC 0, 78 passed / 0 failed**.
- `bash scripts/handover-diff.sh` → **RC 0, GONE 0 / 84 previous entries**, current-state files scanned 3.

For every mutation the exact checks were:

```bash
bash scripts/selftest.sh
selftest_rc=$?
echo "SELFTEST_RC=$selftest_rc"
bash scripts/handover-diff.sh
handover_rc=$?
echo "HANDOVER_DIFF_RC=$handover_rc"
```

### C1. Delete one 🔴 Human ruling bullet from router §3

- Mutation: removed the single `S007 の最終 evidence state...` bullet; target count **1 → 0**.
- Reconstruction probe: hook payload contained target fact = **false**.
- **DETECTED by `handover-diff.sh`**: RC 0 but `GONE (1)` named the removed §3 ruling.
- Selftest: RC 0, **78/78 passed**. It did **not** detect this ruling loss.

### C2. Delete one baton stub, retain body

- Mutation: router baton 2 stub count **1 → 0**; hook reconstruction no longer contained the compatibility stub.
- **DETECTED by selftest B71**: RC 1, **77/78 passed**, `COUNT=45/46 body-without-stub:2`.
- `handover-diff.sh`: RC 0, `GONE 0/84`; it did not detect the missing stub because the body kept the union entry.

### C3. Delete one baton body, retain stub

- Mutation: `batons.md` baton 2 body **1 → 0**; router stub remained **1**.
- **DETECTED by selftest B71 and `handover-diff.sh`**: selftest RC 1, **77/78 passed**, `COUNT=46/45 stub-without-body:2`; diff RC 0 with `GONE (1)` naming the compatibility body.

### C4. Drift `batons.md` GEN

- Mutation: `batons.md` `S007-close → S006-close`; router stayed `S007-close`.
- **DETECTED by selftest B70**: RC 1, **77/78 passed**, `gen-mismatch:.../batons.md`.
- `handover-diff.sh`: RC 0, `GONE 0/84`.

### C5. Hook manifest points to nonexistent conditional owner

- Mutation: the one `evidence-map.md` hook path became `does-not-exist.md`; old/new counts **1 → 0 / 1**, and the new target did not exist.
- Reconstruction probe: hook manifest contained the missing path = **true**.
- **DETECTED by selftest B70**: RC 1, **77/78 passed**, `not-in-hook-manifest:.../evidence-map.md`.
- `handover-diff.sh`: RC 0, `GONE 0/84`.

### C6. Truncate router to first 200 lines

- Mutation: router **237 lines → 200 lines**.
- Reconstruction probes: §5 baseline present = **false**; Opus-solo ruling present = **true** in the current 237-line layout.
- **DETECTED by selftest**, but **not by B69**: RC 1, **74/77 checks passed and 3 failed**. Failures were the missing `scripts/baseline.sh` §5 pointer, B55's missing baseline-command responsibility (7/9), and B58's reconstruction result (7/8, missing baseline). B69 remained green because the hook injected the now-truncated disk file completely.
- `handover-diff.sh`: RC 0, `GONE 0/84`; its §2/§3 union did not cover the lost §5.

**Detection summary: 6 detected / 6 mutations.** This does not mean every mechanism detected every loss: C1 escaped selftest, C2 escaped handover-diff, and C6 escaped both B69 and handover-diff.

## D. Verdict

A fresh session's ability to restore current state from the three-owner structure is **equal to** what a single-file handover would give for the tested questions: 17/17 answers were recovered, 0/3 conditional routes exposed an unsafe pre-open window, and every one of C1–C6 became visible through at least one repository mechanism. I do not rate it “better”: the split introduces owner/manifest/GEN/stub failure modes, two unconditional safety assertions were stale or wrong (45 vs 46; B70 vs B71), and a deleted Human ruling still leaves selftest 78/78 green. I do not rate it “worse”: the two conditional opens were explicitly routed, their stubs preserved all action boundaries, and no requested fact required history or another OFF-LIMITS source.

## Observed limits and conflict surface

- The baseline and mutations are **synthetic/static governance checks**, not product or production evidence.
- No API-smoke, visual, real-fire, hardware write, production contact, network test, application test, Windows/Linux execution, or donor read was run.
- Conflict 1: prose says 45 batons; table and B71 measure 46.
- Conflict 2: `CLAUDE.md:28` attributes stub-deletion detection to B70; C2 observes B71.
- The integration owner must validate whether these conflicts alter acceptance of the S008 architecture; this delegated lane does not adopt or accept its own result.
