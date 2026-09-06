# S010 — 2026-08-27 — Managed Environment & Device Knowledge Architecture Design

<!-- IMMUTABLE historical evidence. Never current authority — the owner of current state is
     16_次セッション引き継ぎ指示書.md. Never rewritten after close. -->

**GEN at close: S010-close** · `PRIMARY_MODEL_MODE: T1-conserve` · `SESSION_ROLE: PRIMARY`
**Conductor:** Claude Code (Opus 5, effective effort `medium` — the intended state, §3)

---

## §0. Purpose re-examination

**Why this objective existed.** DigiCode Classic reached real depth in MQTT / Azure IoT / Home
Assistant / HTTP / WebSocket / BLE / Wi-Fi / CAN / Modbus and a Controller/UI, and stalled before the
industrial-device layer — not from lack of intent, but because the per-addition implementation and
verification cost under Blockly grew too large (§3, 2026-08-27 Human context). The Human asked
whether DigiCode Text can convert "supporting a new device" from *implementing a Block/Generator/UI*
into *adding managed knowledge / data*, and how Board · Toolchain · Framework · Library ·
Dependency · Device · Sensor · Actuator · Electrical Interface · Protocol · Register Map · Backend ·
UI capability · Compatibility · Evidence · Verified/Custom should be managed as a source of truth
shared by AI, Compiler and UI.

**Did the work serve that purpose?** Yes, and it served it by *refuting* the premise rather than
elaborating it. The Human explicitly instructed (§3 of the instruction document) not to assume the
central hypothesis and to falsify it. That instruction is the reason this session's output is usable:
had the hypothesis been assumed, the design would have rested on a claim that does not hold.

**Founding-use-case check (rule 17).** The passing-grade definition and the core-value ruling
("the managed environment, not the editor") were the anchor throughout. Nothing was scoped out by the
harness. The one scope decision that *was* taken unilaterally — selecting Option C while L3 had
explicitly returned a choice to the Human — was caught by the falsification lane and returned as D-1.

## §1. Work done

**Cold start (rule 13).** HEAD `b1534d3` · branch `main` · working tree clean · origin `0 0` ·
baseline re-measured (never transcribed) · selftest **78/0** · read-load **66,846 tok / 48,000
allowance = 139 % WARNING** (known, accepted, baton 25) · owner set 3, GEN `S009-close` consistent ·
B71 49/49. Mandatory reads completed per `CLAUDE.md` §0 plus task-specific rule 22 / rule 24 /
routing-profile / packet template.

**Baton 39 discharged at open.** The ground this objective stands on was declared before work began,
as baton 39 requires: **not** the refuted P8 ranking, but S007-supported ⑥ (AI library hallucination
is real) + ⑦ (managed/verified mechanisms have prior implementations) + the Human-supplied structural
account of Classic's per-addition cost.

**Adaptive fan-out, three waves as the Human's standard prescribes.**

| Lane | Packet | Type | Outcome |
|---|---|---|---|
| L1 | `S010-L1-classic-cost` | INVESTIGATION | PASS — donor measured from source |
| L2 | `S010-L2-prior-art` | INVESTIGATION | **ERROR / INVALID_MEASUREMENT** — sandbox had no network (`curl` RC=6, DNS). A correct fail-closed return |
| L2b | `S010-L2b-prior-art` | INVESTIGATION | PASS — network-enabled redispatch |
| L3 | `S010-L3-hypothesis-falsification` | FALSIFICATION | PASS — the hypothesis is REFUTED in its universal form |
| L4 | `S010-L4-integration-falsification` | FALSIFICATION | PASS — 36 of 71 integration claims defective |

**No second wave.** The first-wave lanes did not disagree, and the residual gaps (L3/A1 total cost,
L3/A5 AI throughput) are gaps a *measurement* closes, not another lane. "We could check a bit more"
is excluded as a reason to add lanes (2026-08-27 Human directive §6/§16).

**Principal measurements obtained** (owner: `investigations/2026-08-27_managed-environment-architecture/`):

- **L1** — three real additions (HX711 / Modbus RTU / Relay) = 32 file instances / 642 added lines in
  their initial commits; block implementation 63.9 %, generated catalog 20.9 %, toolbox 8.3 %.
  Shared-surface denominators: 72 imports · 90 toolbox categories (5–6 placements per addition) ·
  580 catalog blocks · 5 locales × ~4,124 keys · **one 57-entry global dependency universe compiled
  into every ESP32 build** · 69 samples · 10 cross-block contracts. Real harm on record: a placeholder
  dependency polluted **16 of 20 boards**; the **RP2040 family was deleted** rather than separated.
  🔴 **Load-bearing negative: the donor contains no register-map model at all** — `register_map` /
  endianness / word-order searches return **0** first-party hits, and `modbusBlocks.ts` hard-codes
  FC `0x03` read / `0x06` write, one 16-bit register per operation, with **0** semantic-metadata hits.
  Baton 50 confirmed from source (C++-analysis markers 0, Blockly-extraction markers 16) and the auto
  Web UI's actual registration record, renderer schema and transport contract captured verbatim.
- **L2b** — ESPHome's full Modbus register model including the `U_WORD … FP32_R` word-order
  enumeration; Home Assistant's `device_class` / `state_class` enumerations and the MQTT discovery
  schema; Particle's verification criteria and a **fresh 10 / 977 = 1.02 %** coverage measurement
  (numerator confirmed, denominator 972 → 977) **with its own proxy limitation stated**; Viam's
  `meta.json` and model triple; Arduino's `package_index.json` / `library_index.json` field lists;
  PlatformIO's `library.json` and the finding that **it has no dependency-resolution lock**; Embedder's
  peripheral/schematic/SVD model and a `NOT OBTAINED` on PDF→typed-schema extraction.
  🔴 **All seven prior-art systems have reproducibility lock = `NONE`.**
  🔴 **ESPHome generic Modbus conflates canonical device facts with project-instance settings** in one
  YAML tree — the mistake this design can avoid.
- **L3** — the central hypothesis **REFUTED** in its universal form. Only a conditional proposition
  survives. **5 of 20 donor device families (25 %, strict method; cautious 20–40 %, low confidence)**
  are pure-data expressible, and only above a pre-existing adapter. Total cost is
  **NOT DECIDABLE WITHOUT MEASUREMENT**. Support has no acceptance contract, so a cost comparison is
  currently unfalsifiable ("denominator laundering").
- **L4** — the integration audited: **36 of 71 claims (50.7 %) OVERSTATED 14 / UNSUPPORTED 18 /
  CONTRADICTED 4.**

**Deliverables.** `06_corrected-architecture.md` (repo) = the Human report at
`~/Downloads/DigiCode_Text_Managed_Environment_Device_Knowledge_Architecture_Design_Report_2026-08-27.md`
— A Requirements · B Entity/Relation · C three options compared · D selected (Option C) with the ERA
and the L0–L6 support contract · E golden scenario · F custom device · G lifecycle · H AI flow ·
I Compiler/AI/UI · J risk-based QA · K effort comparison · L MVP · M sequence · N 19 risks · plus
**8 Human decisions D-1…D-8**. The pre-falsification draft `04` is kept with a SUPERSEDED banner and
the read order `05` → `06` is written into `00_index.md`.

**Donor discipline.** Read-only throughout; 3/3 pinned SHAs verified with `git rev-parse HEAD` and
`git status --short` = 0 in each; no donor `prompt/` directory was opened.

## §2. State changes

- **New case: DT-11** (Part 2 body + Part 1 index row) — the integration broke in the same shape for
  the **third consecutive time**, in a document that quoted DT-6 and DT-9 at its top and carried their
  self-check. **DT-9's own prescribed forward application was applied and measured ineffective.**
- **New batons: 57** (the design output is a recommendation with nothing verified; 8 Human decisions
  pending) · **58** (integration self-check is inert, 3/3; a falsification lane is the only measured
  defense) · **59** (`usage-report.sh` cannot match codex threads dispatched with a cwd outside the repo).
- **Updated batons: 39** (ground declared, trigger consumed) · **45** (Arduino AI Assistant's consumed
  knowledge measured; compile-error feedback `NOT OBTAINED`) · **47** (Particle 10/977 = 1.02 %, with
  the proxy limitation and an explicit prohibition on the misuse DT-11 recorded) · **50** (auto Web UI
  schema captured; "almost unchanged" corrected to a widget-vocabulary gap plus the `endpoint.path`
  caveat) · **51** (hypothesis REFUTED in universal form; the surviving proposition written out).
- **New plan:** `plans/active/11_managed-environment-device-knowledge-architecture.md`.
- **New investigation directory:** `investigations/2026-08-27_managed-environment-architecture/`
  (7 files).
- **evidence-map:** S010 objective row, external-source paths, derived Human report, and template
  feedback #13 updated to **3/3**.
- **No new rules.** No local rule was written. `global/rules/` was modified only by the DT-11 case
  append (case history, not a rule).

## §2b. Close outcome — BLOCKED

**This session did not close normally.** Steps 1–7 of the close protocol completed; step 8
(commit + push) did not run, by the Human's ruling and the rule check it required. **Every artifact
named in §2 is on disk and uncommitted**, including this file. `PRIMARY_OBJECTIVE` is `BLOCKED`
(rule 24: only the user moves `BLOCKED → ACTIVE`).

Recorded at the Human's instruction as **`Project_Template` audit candidates #16–#19**
(`evidence-map.md` §B): ① growth was predicted and still not detected until the close gate ②
the brief cap and read-load `REVIEW_REQUIRED` were crossed almost simultaneously ③ the final STOP
gate worked, but preventive growth control before the threshold may be missing ④ together with
S009's observed self-multiplication of derived work and over-fan-out, audit whether Objective /
Scope / Stop Discipline suppresses unnecessary derivation *early* rather than only stopping it *last*.

**Standing instruction carried forward: do not derive new fixes, investigations or design from here.**

## §3. Self-assessment

### ✅ Healthy

- The central hypothesis was falsified **before** the design was written, by a dispatched lane, and
  the design rests only on what survived. The Human's §3 instruction ("do not assume it; falsify it")
  is what made this possible.
- The integration was submitted to a falsification lane before reaching the Human, once only, per
  §38 — and all 36 findings were applied, in-line rather than appended, with the read order recorded.
- Every negative result carries the search that established it; every `NOT OBTAINED` stayed
  `NOT OBTAINED`; the L2b lane adopted **zero** `MODEL_KNOWLEDGE_UNVERIFIED` material.
- The L2 network failure was returned as `ERROR / INVALID_MEASUREMENT` rather than silently
  substituting training knowledge — the fail-closed behaviour the packet demanded.
- Donor read-only discipline held: 3/3 SHAs verified, `git status` 0 in each, `prompt/` never opened.
- The `workspace-write` sandbox granted to L2b (needed for network) was audited afterwards:
  `git status --porcelain` showed only the conductor's own paths. The lane wrote nothing.

### ⚠️ Warning — each one converted, not left as prose

1. **The integration was defective for the third time (36/71).** → Converted to **case DT-11** and
   **baton 58** (falsification lane as standing procedure; "self-check passed" may never be cited as
   quality evidence). Also carried to template feedback #13, now 3/3.
2. **The integration silently decided a choice L3 had returned to the Human** (narrowed hypothesis vs
   funded comparative measurement). → Converted to **baton 57 / D-1**, returned to the Human.
3. **`usage-report.sh` reported 3 threads against 5 codex calls.** → Converted to **baton 59**, with
   the mechanism (repo-external cwd) and the structural note that donor-audit dispatches always open
   this hole.
4. 🔴 **The context brief has reached its cap: 131,542 bytes against 131,072 (+470).** The 2026-08-27
   Human ruling and baton 52 both state that reaching 128 KiB is a **STOP-and-ask** condition, that the
   cap may not be raised again, and that current truth may not be deleted to fit. → **Returned to the Human rather than
   settled alone** (PT-18's exact shape). **The Human ruled**: keep the cap at 128 KiB · do not delete or
   compress current truth to fit · do not derive into a task-scoped-export implementation here · **do not
   treat S010 as a normal close — its state is BLOCKED** · preserve the output, the evidence and the
   undecided items. The Human also **corrected the harness's framing**: "raise the cap or delete truth"
   was a false dichotomy — a third path exists (task-scoped export · splitting the current-truth
   owner/delivery architecture · redesigning the unconditional payload) and each needs its own Objective
   and GO, so none is opened here.
   The Human's conditional — commit only if an existing rule permits saving a BLOCKED checkpoint that
   contains a red gate — was **checked, not assumed**: `close.md` step 8 conditions commit/push on
   "the 0 is observed, and **only then**"; rule 24 says RED is evidence, not authorization; cases 110 and
   PT-19 record this exact act as the failure; and a search of `global/rules/`, `local/` and
   `.claude/commands/` for any permitting provision (checkpoint / WIP / save-point / BLOCKED commit)
   returned **0**. → **No commit, no push. The session stops with the work on disk and uncommitted.**
   Selftest B21 and B68 are both red from this single cause.
5. **Nothing about the proposed architecture has been measured.** No schema, no validator, no ERA, no
   compile. → Converted to **baton 57**, and every design claim in `06` carries a falsification test.

### Verification-type labels

`static` — all lane work (source reading, docs/schema fetching, claim auditing).
`API-smoke` — L2b's network reachability and public index/sitemap fetches.
`synthetic` / `visual` / `real-fire` — **not run, in any lane.** No compile, no hardware, no browser
execution occurred this session. Nothing here measures the product.
