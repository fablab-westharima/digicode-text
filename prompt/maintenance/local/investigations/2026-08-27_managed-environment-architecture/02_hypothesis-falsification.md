# 02 — Falsification of the central hypothesis (Lane L3)

**Packet:** `S010-L3-hypothesis-falsification` · LANE: FALSIFICATION · Route A / `AUTHORITY_MODE: DELEGATED`
**Executor:** six-lane delegate (Codex), read-only sandbox, no network, baseline effort
**VERDICT: PASS / REASON: NONE** · CHANGED_FILES: NONE
**`HUMAN_DECISION_REQUIRED: YES`** — see the closing section.

> This file is **immutable measured evidence**. It was produced BEFORE any architecture was designed,
> deliberately, so the design rests on what survived rather than on what was hoped.

---

## Overall finding (lane's own words)

> The universal claim — "new device support becomes data, not code, and therefore total support cost
> falls dramatically" — is **refuted**. A narrower claim survives: metadata can reduce marginal
> authoring work for devices already covered by stable, pre-existing runtime adapters and generic
> protocol engines. The donor does not establish that verification, dependency, hardware and
> lifecycle costs fall.

Verdict vocabulary: `REFUTED` = fails in its stated form · `WEAKENED` = only a narrower version
survives · `SURVIVES` = attack did not materially damage it · `NOT DECIDABLE WITHOUT MEASUREMENT` =
donor evidence exposes the uncertainty but cannot determine magnitude.

| Attack | Verdict |
|---|---|
| A1 cost relocates rather than falls | **NOT DECIDABLE WITHOUT MEASUREMENT** |
| A2 the Registry becomes the new Blockly | **WEAKENED** |
| A3 device knowledge cannot be pure data | **REFUTED** (the hypothesis is refuted; the attack succeeds) |
| A4 the golden scenario is favourable, not representative | **REFUTED** (attack succeeds) |
| A5 the AI-managed registry is credible | **NOT DECIDABLE WITHOUT MEASUREMENT** |
| A6 "same source of truth" has content | **REFUTED in its current verbal form** |
| A7 (free attack) "support" has no acceptance contract | **REFUTED** (attack succeeds) |

The lane recorded no verdict as `RHETORICAL_ONLY`.

---

## Evidence ledger

### Q1 — repository surface and compile history

```
BLOCK_FILES=69      BLOCK_LOC=22263     TEST_FILES=67
CATALOG_BLOCKS=580  SAMPLES=69          LOCALES=5      REGISTRY_LIBS=48
RUN=2026-06-04_03-50-05  TOTAL=1000 PASS=1000 FAIL=0 MEAN_MS=109385.671 CACHE_MISS=823
EARLY_RUN=2026-05-05_17-19-07 TOTAL=1000 PASS=921 FAIL=79 PASS_RATE=0.921
```

### Q2 — catalog-maintenance history

```
generate-ai-block-catalog.ts commits = 15
audit-ai-catalog.ts          commits =  8
public/ai/block-catalog.json commits = 111
```

…while the catalog is still labelled schema version `1.0` (`block-catalog.json:1`).

---

## A1 — "The cost does not actually move; it relocates." → NOT DECIDABLE WITHOUT MEASUREMENT

**Evidence that substantial non-Blockly cost is real:**

- **Dependency universe.** ≥48 registry dependencies in the measured section plus vendored libraries.
  `compile.ts:219` states every ESP32 dependency is build-active on every ESP32 build and warns one
  placeholder library **polluted 16 of 20 boards**.
- **Dependency correctness failed repeatedly, independent of block UI work:**
  two generators referenced never-installed libraries (`compile.ts:117`) · AccelStepper emitted by
  seven blocks but absent from `lib_deps`, described as the same systematic root cause as several
  earlier fixes (`:160`) · two RFID libraries exported the same class → link collisions (`:186`) ·
  the wrong SD library was transitively selected and failed ESP32 compilation (`:281`) · M5
  dependencies failed across **every** ESP32-C3 target on missing chip-specific symbols and
  transitive headers (`:347`).
- **Board support is not append-only metadata.** `boards.ts:69` documents missing variant
  directories, substitute board definitions, board-specific USB flags and a **pending physical-hardware
  UAT**; `boards.ts:39`'s platform-upgrade warning names LEDC, BLE callback, Wi-Fi, OTA, MQTT and
  Home Assistant paths as requiring renewed smoke tests.
- **RP2040 was removed entirely** because the shared dependency universe was incompatible, and
  deletion was chosen over finer dependency separation (`boardStore.ts:21`).
- **Verification is material.** 67 test files · 580 catalog blocks · 69 samples · 5 locales. The
  prebuild hook runs controller builds, catalog generation and **five separate audits** before the
  app build (`package.json:9`). An early 1,000-case run passed only **921**; the later run reached
  1,000/1,000 only after fixes. That final run took **≈7.6 hours at parallelism 4**
  (`metadata.json:3`), mean case **109.4 s**, **823/1000 cache misses**.
- **Real-device verification is separate from compile verification.**
  `servoSpeedCompileRateMatrix.test.ts:29` calls non-default-speed device flashing "user-driven UAT";
  DigiMotion host tests explicitly do not exercise FreeRTOS and defer it to hardware smoke
  (`libs/DigiMotion/test/test_pump/pump_test.cpp:1`).
- **Support extends outside generator/compiler**: DigiCode-Helper is a native macOS/Windows/Linux
  application built to handle mDNS discovery and reachability, particularly on Windows without
  Bonjour (`DigiCode-Helper/README.md:3`).

**What it does not prove:** LOC, test counts, compile duration and incident comments do not yield
person-hours. Blockly may still have dominated historically; the donor cannot establish the
counterfactual cost of the proposed registry.

**Deciding measurement (lane's prescription):** implement the same stratified set of ≥20 devices under
both workflows with the support contract held constant, recording engineer-hours separately for
(1) authoring/UI/generation (2) dependency and licence resolution (3) compile-matrix remediation
(4) hardware setup and real-device UAT (5) documentation/i18n/samples (6) 90-day upstream churn and
support incidents. Report median and P90 total hours per **accepted** device.

---

## A2 — "The Registry becomes the new Blockly." → WEAKENED

The registry is not "just data": it creates schema, generators, validators, migrations, evidence
records, compatibility logic and lifecycle workflows. The donor's **much simpler** AI block catalog
already demonstrates the pattern.

Existing catalog schema already covers field kinds, credentials, dynamic values, output types, modes,
board requirements and board capability axes (`generate-ai-block-catalog.ts:28`). Schema/extraction
churn already came from: a scalar input check becoming `string | string[] | null` (`:39`) · adding
`outputType` plus unknown/dynamic output types (`:61`) · adding board capability and
experimental-status fields (`:76`) · supporting dynamic dropdowns that cannot be statically resolved
(`:519`) · replacing faulty source extraction with brace balancing and special handling for block
factories (`:608`) · maintaining a **separate audit parser that must mirror the generator parser**
(`audit-ai-catalog.ts:125`).

15 generator commits / 8 audit commits / 111 catalog commits — **before** Verified/Custom states,
provenance, register maps, firmware applicability, lifecycle or compatibility evidence exist.

**First migration with N devices already recorded** (analytical consequence of versioned evidence,
supported by the churn above):
- an additive field still requires transforming or defaulting all N entries and re-running structural validation;
- a **semantic** change — e.g. splitting "scale" into signedness, word order, multiplier, unit and
  applicability — requires reinterpreting entries and **may invalidate prior evidence**;
- if Verified status depends on the old semantics, either those entries lose Verified status or the
  migration must prove the old evidence still holds;
- supporting old snapshots introduces versioned readers and dual semantics; rewriting snapshots
  breaks reproducibility unless the old forms stay addressable.

The donor does not prove registry curation will equal Blockly's cost. It **does** refute describing
the registry as costless data entry.

---

## A3 — "Device knowledge cannot be pure data." → the hypothesis is REFUTED

Concrete donor cases where a device genuinely requires **code**:

| Failure class | Donor evidence |
|---|---|
| Initialization + multi-step measurement | SCD30 starts periodic measurement, polls readiness on a time schedule, updates three cached channels — `sensorAirQualityBlocks.ts:55` |
| Interrupt handling + timing | quadrature encoder installs two ISRs, volatile state, 20 ms deltas → speed/distance — `encoderBlocks.ts:56`; YF-S201 ISR + elapsed-time sampling + reset + pulse-frequency conversion — `flowMeterBlocks.ts:30` |
| Calibration | HX711 tare / repeated samples / calibration against a known mass / stored scale — `hx711Blocks.ts:79`; QTR calibration is a timed loop sampling while the robot moves — `qtrSensorBlocks.ts:198` |
| Persistent algorithmic state + non-linear conversion | MAX30102 rolling beat buffer, implausible-rate rejection, time deltas, Red/IR ratio, contact detection, clamping — `sensorHealthBlocks.ts:30`; thermistor Beta equation (logarithmic) — `analogSensorBlocks.ts:111` |
| Streaming parser / state machine | GPS bytes continuously drained into a parser; reads branch on validity — `gpsBlocks.ts:57` |
| Callbacks, race handling, recovery | BLE connection/disconnection callbacks, advertising restart, callback signature adaptation, race ordering, handler registration, deduplicated loop pumping — `bleBlocks.ts:130`, `:155`, `:258` |
| Upstream API churn | NimBLE 1.x→2.x changed callback signatures, time units, return types, advertising behaviour, scan APIs, payload types, and removed APIs — `libs/NimBLE-Arduino/docs/1.x_to2.x_migration_guide.md:30`, `:110`, `:162` |

### Source-derived estimate of how much is expressible as pure data

Method — denominator **20 distinct donor-supported device families**; strict criterion: a generic
GPIO/ADC/protocol engine already exists and the new device adds only constants, addresses, channel
types, polarity, units and affine scaling. Any device-specific call sequence, ISR, callback, parser
feed, calibration loop, persistent algorithmic state or helper function counts as code.

| Classification | Families |
|---|---|
| **Pure-data candidates: 5/20** | button · PIR · potentiometer · LDR · Modbus holding-register endpoint **once the generic RTU engine exists** |
| **Code-bearing: 15/20** | thermistor · encoder · YF-S201 · HX711 · MAX30102 · APDS9960 · GPS · SCD30 · PMS5003 · QTR · BLE GATT/NUS · RFID · DFPlayer · AS5600 · ENV-IV composite |

**Estimate: 25 % under the strict donor-sample method; cautious range 20–40 % for a similar MCU/IoT
catalog, low confidence.** The upper end assumes reusable code adapters already exist — it does not
mean the behaviour became data, it means the code cost was paid earlier.

`MODEL_KNOWLEDGE_UNVERIFIED` — ESPHome precedent: YAML looks data-driven to users because C++
components already implement device-specific initialization, polling, callbacks, conversions and
recovery. Unsupported deviations generally require a new component or lambda/custom code. Precedent
for "data over an adapter codebase", **not** for "device knowledge is pure data".

---

## A4 — "The golden scenario is favourable, not representative." → attack succeeds

The donor's whole Modbus surface is four operations: init UART/RS485, select slave ID, read one
holding register, write one register (`modbusBlocks.ts:9`). Once the RTU engine exists, an inverter
profile resembles exactly what a registry handles well: address, width, unit, scaling, access mode,
semantic channel.

Even this favourable case needs code at the protocol layer: DE/RE direction callbacks, UART
configuration, initialization order, success checking, error fallback (`modbusBlocks.ts:32`).

The Modbus model does **not** validate: interrupt-driven pulse sensors and encoders · continuous byte
streams (GPS) · BLE callbacks/discovery/reconnect/race handling · calibration workflows (HX711, QTR) ·
stateful signal processing (heart-rate) · composite devices needing coordinated reads · motion control
and real-time background pumping · devices requiring physical tuning. (All source-grounded via A3.)

`MODEL_KNOWLEDGE_UNVERIFIED` — further industrial classes Modbus says nothing about: CANopen
NMT/SDO/PDO state · EtherCAT cycle timing · OPC UA sessions/security · PROFINET configuration ·
IO-Link ISD interpretation · proprietary bootloader handshakes · encrypted vendor protocols · devices
whose documented standard is modified by firmware-specific deviations.

> Validating on Modbus proves only this narrow proposition: **a pre-existing generic Modbus engine can
> consume some per-model register maps as data.**

---

## A5 — "The AI-managed registry is credible." → NOT DECIDABLE WITHOUT MEASUREMENT

The donor supports AI as a **proposal accelerator, not an acceptance authority**.

Its existing AI generation required a semantic validator because prompt-only mitigation
"consistently failed"; detected failures include missing inputs, orphan values, asymmetric branches,
missing initialization, malformed XML and cross-block contract violations (`semanticValidator.ts:9`).
The retry system permits **up to four AI calls and may still return XML with residual issues after
exhaustion** (`validationRetryOrchestrator.ts:9`). Canonical samples then need structural, semantic,
generation and optionally real host-compile probes (`sample-e2e-probe.test.ts:9`).

**Throughput arithmetic** (from the observed final run):

```
1000 cases / 7.61 h  ≈ 131 cases/hour at parallelism 4
one case across the existing 16-board catalog ≈ 16/131 h ≈ 7.3 minutes
```

That is a **compile-only floor**. It excludes human review, datasheet verification, multiple
firmware/library versions, negative tests, regression repair and real hardware.

| Human review per proposal | Compile-only floor | Max entries / reviewer-hour before hardware |
|---:|---:|---:|
| 10 min | 7.3 min | 3.47 |
| 30 min | 7.3 min | 1.61 |
| 60 min | 7.3 min | 0.89 |

(Illustrative sensitivity — **not** observed donor review times.) With real-device time `H`:
`throughput ≤ 1 / (review time + H + compile gate time)`. **AI can lower proposal-drafting time; it
cannot remove evidence review while AI self-report is forbidden as acceptance evidence.**

`MODEL_KNOWLEDGE_UNVERIFIED` — datasheet-extraction failure modes: scanned/low-resolution PDFs · bad
OCR · merged cells · tables split across pages · repeated headers · ambiguous endianness and
signedness · footnote-only multipliers · register maps conditional on model or firmware ·
undocumented reserved values · non-English terminology · diagrams encoding state transitions · errata
superseding the main manual. Risk assertions, not donor-proven frequencies.

**Deciding measurement:** a blinded trial over ≥50 real device manuals — AI proposal vs
expert-authored; measure human review minutes; count wrong addresses/types/scales/access modes and
missed errata; compile across the declared matrix; test on acquired hardware; measure Custom→Verified
acceptance rate and 90-day rework. **Report accepted verified entries per reviewer-day, not generated
proposals per hour.**

---

## A6 — "AI and Compiler read the same source of truth" → REFUTED in its current verbal form

The donor's compile request carries source fragments, board FQBN and connection type — **no catalog
identity, no registry snapshot, no dependency lock, no artifact digest** (`compileService.ts:47`).
The AI receives filtered catalog block descriptions; the compiler receives generated C++.

The probabilistic harness does record a `catalogHash` and `generatorVersion` (`metadata.json:5`) —
but that is **test-run metadata, not a compiler-enforced identity contract**. And the donor itself
warns that a separately fetched `/health` Git SHA may come from a different load-balanced origin than
the actual compiler, so it is only approximate (`compileService.ts:119`) — precisely the weak identity
the phrase must exclude.

**For the phrase to have falsifiable content, the AI decision and the compile result must be tied to
identical or cryptographically linked values:**

1. canonical registry snapshot digest
2. registry schema version
3. device/profile ID and exact version
4. library artifact IDs, exact versions, content digests
5. dependency lock
6. board/FQBN, toolchain/core version, build flags
7. code-generator / compiler version
8. generated manifest tying source fragments to the snapshot
9. compile-result attestation returning those identities

**Falsification tests:** change the registry between AI generation and compile → compilation must
reject the stale manifest · retarget a library alias without changing its name → the digest must
differ and compilation must reject it · route compilation to an origin with a different lock/toolchain
→ the returned attestation must reveal or reject the mismatch · replay the locked input → dependency
resolution must be identical.

"We display the same name", "both query the same mutable registry", "the UI list matches the AI list"
satisfy none of these.

`MODEL_KNOWLEDGE_UNVERIFIED` — ESPHome, PlatformIO, Home Assistant and mainstream package-aware IDEs
already use shared component/package metadata to populate UI, validation, discovery or builds.
Same-name / same-list integration is therefore **not a differentiator** without immutable end-to-end identity.

---

## A7 — Strongest additional attack: "support" has no acceptance contract → attack succeeds

The hypothesis compares "the cost of supporting a device", but the donor demonstrates several
materially different meanings of support: (1) listed in the UI (2) generator produces code (3) code
compiles on one target (4) code compiles across the matrix (5) real hardware works (6) behaviour is
correct under faults and load (7) compatibility maintained across upstream updates.

The donor already blurs these boundaries:
- experimental boards are excluded from the probabilistic-debug denominator **while remaining visible
  in the UI** (`boardStore.ts:63`);
- M5 boards are sometimes compiled with **substitute board definitions** because they compile, with
  runtime differences declared irrelevant to "compile correctness" and physical UAT pending (`boards.ts:69`);
- a 100 % compile-rate gate is explicitly separate from real-device servo verification
  (`servoSpeedCompileRateMatrix.test.ts:29`).

> 🔴 **The architecture can therefore appear to reduce support cost simply by accepting
> "registered + compiles" where Classic implicitly paid for "works on hardware". That is denominator
> laundering, not an architectural improvement.**

Before any cost comparison, each status must specify required evidence: catalog validity, dependency
lock, board compile set, protocol conformance, hardware models tested, fault cases, firmware/library
versions, lifecycle obligations. Without that contract, "dramatic cost reduction" is not falsifiable.

---

## 🔴 What survives (the design must rest on exactly this, and no more)

> Where a stable generic runtime adapter already implements transport, initialization, timing, error
> behaviour and conversion semantics, adding another device whose differences are limited to
> addresses, channel definitions, constants, units, polarity and simple scaling **can be primarily a
> metadata operation** and can reduce marginal UI/generator authoring work.

Surviving concrete examples: GPIO and simple ADC sensors (`digitalSensorBlocks.ts:24`,
`analogSensorBlocks.ts:24`) · per-model register maps above an already-implemented Modbus RTU engine
(`modbusBlocks.ts:105`).

**Does NOT survive:**
- that device knowledge is universally data;
- that Board, Library, Sensor, Device and Protocol additions have the same cost shape;
- that Modbus validates the broader industrial-IoT architecture;
- that registry curation, verification, hardware testing or lifecycle cost falls automatically;
- that AI proposals increase Verified-entry throughput without measured reviewer and hardware costs;
- that "same source of truth" differentiates the product without immutable end-to-end identity.

`CONFLICT_SURFACE` reported: the literal claim "supporting a new Device = data, not code" conflicts
with donor implementations requiring device-specific initialization, timing, interrupts, callbacks,
calibration, algorithms and recovery; "cost falls dramatically" conflicts with the absence of
comparative labour and lifecycle measurements.

`HUMAN_DECISION_REQUIRED: YES` — define the support acceptance contract, and decide whether the
product adopts only the narrowed "metadata above pre-existing adapters" hypothesis, or funds the
comparative cost/throughput measurements needed to defend the broader claim.
