# 04 — Integrated architecture (DRAFT, pre-falsification)

> 🔴🔴 **SUPERSEDED — DO NOT READ THIS AS CURRENT.** This is the pre-falsification draft, kept only as
> the audit trail. Lane L4 audited it and found **36 of 71 checkable claims OVERSTATED / UNSUPPORTED /
> CONTRADICTED (50.7 %)**. Read `05_integration-falsification.md` first, then
> `06_corrected-architecture.md`, which is the current document. Reading this file alone carries away
> corrected claims as if they stood — the exact hazard of case DT-6 (S007 `08` vs `09`).


**Author:** Claude Code (Opus 5), Harness / Integration Conductor. **This is an integration, and an
integration is the thing this project has twice measured to be wrong** (case DT-6 S007: 13 corrections;
case DT-9 S009: 12 claims unsupported by their own evidence, self-check caught 0). It is therefore
written to be attacked, and lane L4 attacks it before anything reaches the Human as a recommendation.

**Inputs:** `01_classic-per-addition-cost.md` (L1) · `02_hypothesis-falsification.md` (L3) ·
`03_prior-art-models.md` (L2b). Every claim below must trace to one of those or be labelled as design.

---

## A. Requirements — what architecture is being solved for

**The problem, restated from measured evidence rather than from the story:**

Classic's per-addition cost is not dominated by "writing a block". L1 measured that the block module
is 63.9 % of the *initial diff* — but the pathology is elsewhere: **adding device #N edits nine
global surfaces shared with devices 1…N−1.** Measured denominators at the pin: `BlocklyEditor.tsx`
72 imports · `toolboxGenerator.ts` 90 categories in 5–6 distinct placements per addition ·
`block-catalog.json` 580 blocks · five locale files (~4,124 leaf keys each) · `compile.ts` **one
57-entry global dependency universe compiled into every ESP32 build** · `sampleProjects.ts` 69
entries · `fewShotSelector.ts` · `crossBlockContracts.ts` 10 contracts · the probabilistic-debug
allocation files.

That shared-surface coupling is what makes cost superlinear, and it is what produced the observable
outcomes: a placeholder dependency polluting **16 of 20 boards** (`compile.ts:219`), and the **entire
RP2040 family deleted** because the shared dependency universe was incompatible and separation was
harder than removal (`boardStore.ts:21`).

**Therefore the requirement is not "make devices data". It is:**

> **R-1. Adding the (N+1)-th device must edit zero surfaces shared with devices 1…N.**
> **R-2. What a device *is* (canonical, model-wide) must be separable from what a project *does with
> it* (instance).** — the conflation L2b measured in ESPHome generic Modbus.
> **R-3. "Supported" must be a status derived from named evidence, never an opinion** — otherwise a
> cost comparison is unfalsifiable (L3/A7).
> **R-4. "AI and Compiler read the same source of truth" must be a hash equality, not a sentence**
> (L3/A6).
> **R-5. Code is a first-class, versioned, evidence-bearing citizen** — 15 of 20 donor device
> families are code-bearing (L3/A3). An architecture that models only data is modelling 25 % of reality.
> **R-6. A project must be reproducible six months later.** No prior-art system measured by L2b has a
> dependency-resolution lock — all seven are `NONE` (Q-B).
> **R-7. The schema must be able to change without invalidating N recorded profiles' evidence** (L3/A2).

**Non-requirements, stated so they cannot drift in:** whole-combination guarantees (settled ruling) ·
a marketplace · a knowledge graph · an ontology · a distributed registry · reducing functionality to
make things "easy" (settled ruling — MQTT / Azure / HA / RS485 / Modbus / CAN / industrial sensors /
local backend / Raspberry Pi stay in view).

---

## B. Entity / relation model

### B.1 The organising principle: **adapters are the unit of investment; devices are data on top of them**

L3/A3 is decisive and the design must be built on it, not around it: **≈25 % of device families
(5/20, strict method; cautious range 20–40 %) are expressible as pure data — and only where a generic
runtime adapter already exists.** L2b confirms the same shape independently: a new ESPHome Modbus
device needs **0 new Python component files** *when* the generic `modbus_controller` covers it, and a
new external component when it does not.

So the layering is:

```
 Project Manifest        ← instance: which board, which devices, at which address/pin/topic/endpoint
        │ (overlay, never merged into canonical)
        ▼
 Device Profile          ← canonical: what this MODEL is. Manufacturer/model/revision, interface,
        │                   protocol binding, CHANNELS, constraints.  DATA.
        ▼
 Protocol / Transport Adapter   ← CODE, versioned, evidence-bearing. Owns the schema of the
        │                          `encoding` block its profiles may use.
        ▼
 Package (library) ── Framework / Toolchain ── Board / Platform     ← DATA + pinned artifacts
        │
        ▼
 Environment Resolution Artifact (ERA)  ← the single hash every consumer must agree on
```

**Why this shape rather than a flat registry:** it puts the code/data boundary at exactly the place
L3 measured it to be, and it makes the honest cost statement structural — *per-device* cost falls,
*per-protocol* cost does not, and it is amortised over every device on that protocol.

### B.2 Registries — five owners, joined by relation, never one store

| Owner | Holds | Why separate |
|---|---|---|
| **Platform Registry** | platform · board · framework · toolchain, with exact version pins. Fields modelled on PlatformIO's board manifest + Arduino `package_index.json` (L2b S5.2/S6.2) | Board churn is upstream-driven and has nothing to do with device semantics |
| **Package Registry** | library/package releases: `name · version · dependencies[{name, constraint}] · frameworks · platforms/architectures · license · url · archiveFileName · checksum · providesIncludes`. Field list taken from Arduino `library_index.json` + PlatformIO `library.json` (L2b S5.3/S6.1) — **do not invent a new package schema** | Package identity must interoperate with the ecosystems that already publish it |
| **Adapter Registry** | protocol / transport / bus adapters. **Code artifacts**, versioned exactly like packages, each declaring `encoding_schema` — the JSON Schema of the per-channel encoding block its profiles may use | This is the migration firebreak (R-7): one protocol's encoding evolving does not touch other protocols' profiles |
| **Device Knowledge Registry** | Device Profiles (§B.3). **Canonical only** — no addresses that vary per installation, no topics, no endpoints, no credentials | R-2. This is the store ESPHome does not have and the donor does not have at all |
| **Evidence Store** | evidence records keyed on the full tuple `(profile@v, adapter@v, package@v…, board, toolchain@v, generator@v)` → outcome + artifacts + timestamp | R-3. Status is *derived* from here; it is never a field someone types |

**Project instance configuration is NOT a registry.** It is a manifest in the user's project (§B.4).
**Backend is NOT a registry entity either** (Human §15): a backend is (a) a *deployment profile* in
the project manifest, plus (b) optionally a *backend adapter* package — the same citizen class as a
protocol adapter. Azure, local Mosquitto, Node-RED, InfluxDB, a custom REST API and Home Assistant
are then the same kind of thing, and adding one does not touch device knowledge.

### B.3 Device Profile — the schema (v0 sketch, Modbus-bound example)

```yaml
profile_id: dev.mitsubishi.fr-e800          # namespace:vendor:model — Viam's triple shape (L2b S4)
version: 1.2.0                              # semver; profiles are versioned artifacts
identity:
  manufacturer: Mitsubishi Electric
  model: FR-E800
  revision_range: ">=1.00 <2.00"            # firmware/hardware applicability is part of identity
interface: rs485                            # gpio|i2c|spi|uart|rs485|can|4-20ma|0-10v|pulse|ethernet
protocol:
  adapter: adapter.modbus-rtu               # ← the CODE this profile requires
  adapter_version: "^1.0"
  encoding_schema: adapter.modbus-rtu@1     # the adapter owns this block's schema
defaults:                                   # canonical DEFAULTS, overridable per project
  baud: 19200
  parity: even
channels:
  - id: output_frequency
    semantic: { device_class: frequency, state_class: measurement, unit: Hz }   # HA vocabulary, L2b S2.1
    access: read
    datatype: u16
    encoding: { register_type: holding, address: 0x2103, register_count: 1, value_type: U_WORD }
    transform: { scale: 0.01 }
    ui: { display: numeric, graph: true, precision: 2 }
  - id: output_current
    semantic: { device_class: current, state_class: measurement, unit: A }
    access: read
    datatype: u16
    encoding: { register_type: holding, address: 0x2104, value_type: U_WORD }
    transform: { scale: 0.01 }
    ui: { display: numeric, graph: true }
  - id: running
    semantic: { device_class: running }      # binary_sensor vocabulary
    access: read
    datatype: bool
    encoding: { register_type: holding, address: 0x2100, bitmask: 0x0001 }
    ui: { display: led }
  - id: alarm
    semantic: { device_class: problem }
    access: read
    datatype: enum
    encoding: { register_type: holding, address: 0x2101, value_type: U_WORD }
    transform: { enum_map: { 0: none, 16: OC1, 32: OV1, 48: THT } }
    ui: { display: badge }
  - id: run_command
    semantic: { device_class: switch }
    access: write
    datatype: bool
    encoding: { register_type: holding, address: 0x2000, bitmask: 0x0002 }
    ui: { display: toggle, confirm: true }
capability_code: []                          # ← the honest escape hatch, see B.5
constraints:
  poll_interval_min_ms: 100
  max_concurrent_reads: 1
```

**Every element of `encoding` and `value_type` above is taken from ESPHome's measured model**
(L2b S1.1: `register_type` FC01/02/03/04 · `address` · `register_count` · `bitmask` · `offset` ·
and the `U_WORD…FP32_R` word-order enumeration). **Every element of `semantic` is taken from Home
Assistant's measured vocabulary** (L2b S2.1: `device_class` enumerations, `state_class`,
`unit_of_measurement`). Neither is invented here, and that is deliberate: L2b measured what these
vocabularies unlock (unit conversion, long-term statistics, automation, icons), and re-inventing them
would forfeit that and the interoperability.

**What the profile deliberately does NOT contain:** slave address · pin assignment · MQTT topic ·
Azure endpoint · credentials · poll interval chosen for a site. Those are instance (R-2).

### B.4 Project Manifest — the instance overlay

```yaml
schema: digicode.project/1
board: esp32-s3-devkitc-1
framework: { type: arduino, version: "6.1.0" }
devices:
  - ref: inverter_1
    profile: dev.mitsubishi.fr-e800@1.2.0
    bind:
      bus: rs485_a
      slave_id: 3                     # ← instance
      overrides: { baud: 38400 }      # ← instance override of a canonical default
buses:
  - id: rs485_a
    adapter: adapter.modbus-rtu@1.4.2
    pins: { rx: 16, tx: 17, de_re: 4 }
telemetry:
  - from: inverter_1.output_frequency
    to: mqtt_main
    topic: factory/line1/inv1/freq    # ← instance
backends:
  - id: mqtt_main
    kind: mqtt                        # a deployment profile, NOT a registry entity
    endpoint: "mqtt://192.168.1.50:1883"
    credentials: ${secret:MQTT_MAIN}  # by reference; never a literal
ui:
  auto: true                          # derive the Web UI from channel semantics
```

### B.5 `capability_code` — modelling the 75 % honestly

L3/A3 measured **15 of 20** donor device families as code-bearing: ISRs (encoder, YF-S201),
calibration loops (HX711, QTR), persistent algorithmic state (MAX30102), non-linear conversion
(thermistor Beta), streaming parsers (GPS), multi-step init + readiness polling (SCD30), BLE callback
/ race / recovery handling. **An architecture that has no slot for these is modelling a quarter of
reality and will grow the slot informally later.**

So a profile may declare:

```yaml
capability_code:
  - id: calibration
    package: pkg.digicode.hx711-calib@1.0.3    # a Package Registry entry — versioned, licensed,
    entry: calibrate(known_mass_g)             #   compiled, evidence-bearing. NOT free text.
```

This is ESPHome's `lambda` / `external_component` (L2b S1.3/S1.4) made **addressable and pinnable**
instead of embedded. The rule: **`capability_code` is a Package reference, never inline source in a
profile.** Inline code in a data record is how a registry silently becomes a codebase with no build,
no licence and no evidence.

---

## C. Architecture options compared

### Option A — Single central registry
One store, one schema, all entities (boards, packages, devices, protocols, compatibility, project
config) as rows of one model.

*For:* trivially consistent; one query surface; simplest to start.
*Against:* **every schema change is a global migration** across all entity kinds — exactly L3/A2's
first-migration problem at maximum blast radius. Project instance data lives beside canonical data,
reproducing the ESPHome conflation L2b measured (Q-A). And it recreates R-1's pathology in a new
costume: one shared store that every addition writes into.

### Option B — Multiple domain registries + relation graph
Separate registries joined by a general relation graph; project configuration is another node kind.

*For:* migration blast radius is per-domain; extensible.
*Against:* making project configuration a graph node re-conflates canonical and instance (R-2 fails)
and drags per-site secrets/endpoints into a shared store. The general graph is also the over-design
Human §33 names — a relation graph invites an ontology, and nothing in the evidence demands one.
Backend-as-node is explicitly what Human §15 said not to assume.

### Option C — Adapter-anchored layered canonical registries + project manifest overlay + resolution lock ✅
Five domain registries (B.2), the **adapter owning its own `encoding` schema**, a project-side
manifest that is never merged into canonical, and an **ERA** hash binding every consumer.

*For:* satisfies R-1 (append-only records, zero shared-surface edits) · R-2 (overlay, not merge) ·
R-5 (`capability_code` is a Package) · R-6 (ERA is the lock nobody in prior art has) · R-7 (a protocol
encoding change migrates that protocol's profiles only). Every borrowed vocabulary is one L2b
measured in production use.
*Against:* the ERA is real engineering nobody else has built (Q-B: all seven prior-art systems are
`NONE`) — it is a differentiator **and** a cost. Cross-adapter queries ("all devices measuring
frequency") need the semantic layer to be uniform even though encodings are not — solvable, because
`semantic` is deliberately protocol-independent, but it must be enforced.

**Selected: Option C.**

---

## D. Selected architecture — the load-bearing definitions

### D.1 The Environment Resolution Artifact (answers §18 and L3/A6)

L3/A6 refuted "AI and Compiler read the same source of truth" **in its current verbal form** and gave
the nine values that would make it mean something. The ERA is exactly those nine:

```
ERA = {
  registry_snapshot_digest,     # 1
  schema_version,               # 2
  profiles:  [{id, version, digest}],        # 3
  packages:  [{id, version, content_digest}],# 4  (incl. adapters and capability_code packages)
  dependency_lock,              # 5  full transitive resolution, pinned
  target: {board, fqbn, toolchain_version, core_version, build_flags},  # 6
  generator_version,            # 7
  manifest_digest               # 8  binds the project manifest to the snapshot
}
era_hash = sha256(canonical_json(ERA))
```

- The **AI** is given the ERA's contents as its environment truth and may not propose a package,
  board or device outside it (except in an explicitly declared Custom/external mode, §H).
- The **Compiler** is invoked *with* `era_hash` and **rejects a request whose ERA does not resolve
  identically**.
- The compile result returns an **attestation** carrying `era_hash` (item 9).

**Falsification tests, and they are the acceptance criteria** (from L3/A6, adopted verbatim):
1. change the registry between AI generation and compile → the compile must **reject the stale manifest**;
2. retarget a library alias without changing its name → the digest differs → compile must **reject**;
3. route the compile to an origin with a different lock/toolchain → the attestation must **reveal or
   reject** the mismatch;
4. replay the locked input → dependency resolution must be **identical**.

L1 measured why this matters concretely: the donor's compile request today carries source fragments +
FQBN + connection type and **no catalog identity, no snapshot, no lock, no digest**
(`compileService.ts:47`), and the donor's own `/health` SHA check is documented as approximate because
a load balancer may answer from a different origin (`:119`). "Same name" is precisely the failure mode.

### D.2 The Support Status Contract (answers §23 and L3/A7)

L3/A7 is the finding that most changes what this project should build first: **the donor already has
at least three different meanings of "supported"** — visible in the UI while excluded from the
verification denominator (`boardStore.ts:63`), compiled against a *substitute* board definition with
physical UAT still pending (`boards.ts:69`), and a 100 % compile gate explicitly separate from
real-device verification (`servoSpeedCompileRateMatrix.test.ts:29`). Without a contract, an
architecture can "reduce cost" purely by accepting a weaker meaning. That is denominator laundering.

| Level | Name | Evidence required (all machine-recorded, tied to the ERA) |
|---|---|---|
| **L0** | `DECLARED` | profile validates against the adapter's `encoding_schema`; identity + source + licence recorded |
| **L1** | `RESOLVES` | dependency resolution succeeds and emits a lock; no licence conflict |
| **L2** | `BUILDS` | real compile RC=0 on ≥1 declared board; artifact digest + `era_hash` recorded |
| **L3** | `BUILDS_SET` | compile green across the declared **representative** board set (risk-based, §J — never all combinations) |
| **L4** | `CONFORMS` | protocol conformance against a simulator/probe (e.g. a Modbus slave sim); channel read/write exercised; **negative control included** |
| **L5** | `HARDWARE` | the real device, named model **and firmware version**, named channels exercised, operator + date recorded |
| **L6** | `MAINTAINED` | L3+ re-verified against current upstream versions within N days; no open security advisory |

**Verified** = a Human-set minimum level **per device class** (an industrial actuator may require L5;
a GPIO button may be satisfied at L3) **plus a human review record**. **Custom** = whatever level its
evidence actually reached, displayed as that level. **A status is never typed by hand; it is derived
from the Evidence Store and expires.**

This is Particle's insight generalised: L2b S3.1 found that `verification.txt` is **not a flag but a
re-runnable procedure**. Every level above stores its procedure, not just its outcome. And L2b S3.3's
fresh measurement — **10 / 977 = 1.02 % verified** — is the standing proof that "everything Verified"
is not a reachable state, so the architecture must make *partial* coverage legible rather than hide it.

### D.3 Migration firebreaks (answers L3/A2)

L3/A2 measured the donor's *much simpler* catalog already accumulating 15 generator commits, 8 audit
commits and 111 catalog commits while still labelled schema `1.0`, with churn from exactly the kind
of semantic change that invalidates evidence. Design consequences, adopted:

1. **The adapter owns its `encoding` schema.** A Modbus encoding change migrates Modbus profiles only.
2. **`semantic` is a shared, slow-moving vocabulary** (HA's), and changes to it are additive by policy.
3. **Every profile record carries `schema_version`**, and readers are versioned. Old snapshots stay
   readable; snapshots are never rewritten (R-6 would break otherwise).
4. **A semantic migration invalidates evidence by default.** If splitting `scale` into signedness ×
   word order × multiplier changes meaning, affected profiles **drop to the level their surviving
   evidence supports** — automatically, visibly. The migration may only preserve a level by
   *re-running* the evidence, never by asserting equivalence.
5. **Migration rehearsal is part of the MVP**, not a later concern: the first schema change is
   exercised against a synthetic corpus of N profiles before the second adapter ships.

---

## E. Golden scenario walkthrough — inverter → RS485/Modbus RTU → ESP32 → MQTT → Azure/RPi → UI/HA

1. **Device addition.** An FR-E800 profile is authored (or AI-proposed, §H) as a Device Profile record.
   Written: **one new file in the Device Knowledge Registry.** Edited: **nothing shared** (R-1).
2. **Register map.** Channels `output_frequency` / `output_current` / `running` / `alarm` /
   `run_command` carry address + `register_type` + `value_type` (word order) + `bitmask` +
   `scale` + `unit` + `access` + `device_class` (§B.3). Validated against
   `adapter.modbus-rtu@1`'s `encoding_schema` → **L0 `DECLARED`**.
3. **RS485 / Modbus relation.** The profile declares `interface: rs485` and
   `adapter: adapter.modbus-rtu`. The adapter is code and already exists; **its cost is not paid
   again** — this is the whole economic claim, stated narrowly (L3 "what survives").
4. **Board selection.** Project manifest picks `esp32-s3-devkitc-1` + arduino 6.1.0. The Platform
   Registry says which frameworks the variant permits (L2b S1.5: chip variant constrains framework).
5. **Code generation.** The generator consumes *profile + manifest + adapter* and emits C++: bus init
   with DE/RE direction handling, per-channel read/write with the declared word order and scaling,
   the telemetry publisher. **The DE/RE callback, UART configuration, init ordering and error
   fallback are adapter code, not data** — L3/A4 measured that even the friendliest case needs this
   (`modbusBlocks.ts:32`).
6. **Dependency selection.** Resolution over the Package Registry produces a **lock** (R-6), which
   goes into the ERA. Note against L1: the donor compiles **one 57-entry global dependency universe
   into every ESP32 build**, which is the mechanism behind "one placeholder polluted 16/20 boards".
   Here resolution is **per project**, so that failure mode is structurally absent — and RP2040 would
   not have had to be deleted to escape a shared universe.
7. **Compile.** Invoked with `era_hash`; mismatch is rejected; success returns an attestation.
   → **L2 `BUILDS`**, and across the representative board set → **L3 `BUILDS_SET`**.
8. **MQTT.** `telemetry:` maps `inverter_1.output_frequency` → topic. The channel's
   `device_class: frequency`, `state_class: measurement`, `unit: Hz` travel with it.
9. **Raspberry Pi / Azure.** `backends:` holds a **deployment profile**, not a registry entity
   (Human §15). Swapping local Mosquitto for Azure IoT changes the manifest and nothing canonical.
10. **UI / Home Assistant.** The auto Web UI is derived from the same channels: `read + numeric +
    graph:true` → display widget with a chart; `access: write + bool` → toggle. **This reuses the
    donor's measured asset almost unchanged** — L1 confirmed the auto UI is
    `registration metadata → schema → renderer → transport` with a `{"id","value"}` envelope and a
    `GET /schema.json` startup contract, and that channel metadata (`channelId · label · dataType ·
    min · max · canRead/canWrite/canNotify`) is *already* the shape a channel record has. **The Text
    side needs an input adapter (`channels → WifiControllerSchema`), not a new renderer** (baton 50).
    The same channel record emits a Home Assistant **MQTT discovery** payload, because
    `device_class` / `state_class` / `unit_of_measurement` / `unique_id` / `state_topic` /
    `command_topic` are exactly the discovery keys L2b S2.2 measured.

**One record; six consumers** — compiler, AI, Web UI, MQTT, Home Assistant, logging. That is the
concrete content of "the same source of truth", and D.1 is what makes it checkable rather than said.

---

## F. Custom device walkthrough — an unnamed AliExpress Modbus temperature/humidity sensor

1. **Manual / PDF.** The user uploads the vendor PDF. It is stored as a **Custom** source artifact
   with its own digest.
2. **Register map + AI extraction.** An AI lane proposes a draft profile: address, datatype, word
   order, scale, unit, access, semantic. **This is a proposal, never evidence** (settled ruling; and
   L3/A5 is why: the donor's own AI generation needed a semantic validator because prompt-only
   mitigation "consistently failed", and its retry orchestrator may still return residual issues after
   four attempts).
3. **Custom Device Profile.** The draft is validated against `adapter.modbus-rtu@1`'s
   `encoding_schema` → **L0 `DECLARED`, marked `origin: custom`, `source: <pdf digest>`.**
4. **Compile.** The project builds against it → **L2 `BUILDS`**. Note what L2 does *not* say: nothing
   about whether address 0x0001 really is humidity.
5. **Project lock.** The ERA pins profile version, adapter version, package versions and toolchain.
   The project is reproducible even though the device is unverified (R-6 is independent of status).
6. **Use.** The auto UI, MQTT and HA discovery all work off the same channels. The UI shows the
   status **as L2**, not as "supported".
7. **Verified candidacy.** Promotion requires **L4 `CONFORMS`** (a Modbus simulator replaying the
   claimed map, with a negative control — a wrong word order must fail) and, for this device class,
   **L5 `HARDWARE`** plus a human review record. **Nothing here is automatic**, and the flow is
   deliberately the one the Human already settled (§10 / 16.md §3).

The honest reading: this walkthrough gets a user *working* in step 4 and *trusted* only at step 7,
and the architecture's job is to make the difference between those two visible at every surface.

---

## G. Verified / Custom lifecycle — add · update · rollback · deprecate · remove · supersede

| Operation | Mechanism |
|---|---|
| **add** | append a versioned record; status derives from evidence (D.2). Never edits a shared surface (R-1) |
| **update** | a **new version**, never in-place mutation. Existing projects are unaffected because the ERA pins the old one |
| **rollback** | pin the prior version in the manifest; the lock makes this exact, not approximate |
| **deprecate** | a status flag on a version + a successor pointer; existing locks keep working, new resolutions warn |
| **remove** | forbidden for any version referenced by a published snapshot — removal would break R-6. Only *unpublished* versions are removable |
| **supersede** | `superseded_by: <id@version>` + a migration note; the UI and the AI both surface it |
| **migration** | per §D.3, with evidence invalidation as the default |
| **security advisory** | attaches to a package version; propagates to every profile and project whose lock includes it; drops `L6 MAINTAINED` |
| **breaking change** | detected by comparing the new version's `encoding_schema` / channel set against the old; a breaking diff **blocks auto-update and requires a decision** |

**User-added Custom updates (Human §21):** the default is **pin, notify, never auto-`latest`**. This
is not a preference — L2b Q-B measured that *no* prior-art system has a resolution lock and that
Viam's `latest` auto-updates on new releases; and L2b S1.4 measured that an ESPHome external component
pinned to a branch or a movable tag silently changes. A breaking change **stops** and asks.

---

## H. AI management flow — where AI is used, and where it is structurally not allowed

**AI proposes; evidence accepts.** The settled ruling ("AI self-report is never acceptance evidence")
is not a caution here, it is the load-bearing constraint, and L3/A5 quantified why:

- observed automated compile throughput from the donor's own 1,000-case run: **≈131 cases/hour at
  parallelism 4**, i.e. one device across a 16-board set ≈ **7.3 minutes of compile-only floor**;
- with human review at 10 / 30 / 60 minutes per proposal, the ceiling is **3.47 / 1.61 / 0.89 accepted
  entries per reviewer-hour**, *before* any hardware time `H`;
- throughput ≤ `1 / (review + H + compile gate)`. **AI removes drafting time. It cannot remove review.**

| AI task | Allowed output | Gate |
|---|---|---|
| package discovery · upstream release monitoring · changelog analysis | a **candidate** record | L1 resolution + licence check |
| dependency / licence analysis | a **candidate** licence field | recorded as candidate until a human confirms; L2b S3.2 shows licence is a declared field, not a derived one |
| datasheet / manual → register map | a **draft profile** | schema validation (L0) → simulator conformance (L4) → human review. **Never straight to Verified** |
| sample generation · compile-case generation | artifacts | must actually compile (L2/L3) |
| incompatibility / breaking-change detection | a **flag** | confirmed by a real build |
| Custom→Verified proposal | a **queue item** | human review is mandatory and is the last step |

**Datasheet extraction is the highest-risk item and the architecture must not assume it works.**
L2b S7 could not establish, from Embedder's own public material, any pipeline that normalises an
arbitrary PDF into a typed register schema — what is documented is PDF *indexing* plus SVD/EDA
parsing. Treat PDF→profile as **unproven**, gate it at L4 with a negative control, and measure it
before relying on it (L3/A5's blinded trial over ≥50 manuals is the right instrument).

---

## I. Compiler / AI / UI integration

**Registry does not own the Compiler** (Human §16). The coupling is one artifact in each direction:

```
Registry + Manifest ──resolve──▶  ERA (era_hash)  ──▶ generated build manifest ──▶ Compiler
                                      │                                              │
                                      ├──▶ AI environment context (same contents)    │
                                      └──▶ UI schema / MQTT discovery / logging      │
                                                                                     ▼
                                                              attestation { era_hash, artifact digest }
```

The Compiler's interface is the **build manifest + `era_hash`**; it never reads the registry directly
and never holds registry schema knowledge. This preserves the settled "digicode-text has its own
dedicated Compiler" ruling while keeping the boundary loose, and it keeps donor technique reusable
(PlatformIO orchestration, FQBN mapping, artifact/packaging, error parsing, cache, queue, Docker,
compile-result API, regression infrastructure — all named as actively reused in 16.md §3).

**UI:** channels → `WifiControllerSchema` adapter (donor renderer + `{"id","value"}` transport reused
as measured in L1 Q6). **HA:** channels → MQTT discovery payload (L2b S2.2 keys). **AI:** ERA contents.
All three read the same channel records; the ERA hash is what proves it.

---

## J. QA strategy — risk-based, and it must not weaken

Two settled constraints pull in opposite directions and both hold: **never return to whole-combination
guarantees / counts are not the goal** (Human §22), and **do not weaken QA — Classic's rigour exists
because AI's "it's done" could not be trusted** (Human §23).

Selection axes for what actually gets built, per change:
- **changed surface** — which profiles/adapters/packages the diff touches, computed from the ERA, not guessed;
- **dependency topology** — reverse dependencies of a changed package;
- **risk class** — device class (industrial actuator > sensor > GPIO input) and write-capability
  (anything with `access: write` on an actuator is high risk);
- **protocol-specific hazards** — word order, signedness, bitmask, scaling: the exact axes L2b showed
  ESPHome needs `U_DWORD_R` / `FP32_R` / `_S` variants for;
- **historically fragile** — the Evidence Store already knows which tuples failed before;
- **impacted board / changed toolchain** — a toolchain bump invalidates `L6` broadly, cheaply detected.

**Non-negotiables carried from Classic:** a real compile (never a static check standing in for one) ·
a **negative control** at L4 (a deliberately wrong word order must FAIL, or the instrument proves
nothing) · isolated environments · mutation on the guards themselves · real hardware where the class
demands it (L5). **A green that cannot go red is not evidence** — this project's own rule 04.

The economising is in *selection*, never in *rigour*: fewer, better-chosen builds — not weaker ones.

---

## K. Classic vs Text — effort comparison, stated as narrowly as the evidence allows

**Classic, measured (L1):** initial commit for one addition = **~161–309 lines, 10–12 files, 32 file
instances / 642 lines across three additions.** Plus, per addition: **5–6 toolbox placements · 1
registry import · 5 locale files · 1 global catalog · 1 global dependency universe · 1 sample array ·
1 few-shot selector · sometimes a cross-block contract.** Later per-device i18n reached 85 / 75 / 55
locale records for the three measured devices. Verification is separate and heavy: the 1,000-case
probabilistic run took **≈7.6 h at parallelism 4**, mean **109.4 s/case**, and an early run passed
only **921/1000**.

**Text under Option C:**

| Case | Marginal cost |
|---|---|
| **Device on an existing adapter** | 1 new profile record · 0 shared-surface edits · evidence run (L0→L2/L3, or higher by class) |
| **Device needing a new adapter** | adapter implementation ≈ Classic's per-block cost, **paid once per protocol**, amortised over every device on it |
| **Device needing `capability_code`** | one Package (versioned, licensed, evidence-bearing) + the profile referencing it |
| **New board** | 1 Platform Registry record + representative-set evidence. **No global dependency universe to pollute** |

**The defensible claim, and it is deliberately smaller than the hypothesis:**

> ✅ **The per-device *authoring* cost falls, and the *coupling* cost — Classic's nine shared surfaces —
> goes to zero.** The coupling change is the measurable one: **9 shared surfaces → 0**, from L1's
> measured denominators.
> ⚠️ **The per-protocol cost does not fall; it is relocated and amortised.**
> ❌ **The evidence cost does not fall at all.** Compile, conformance and hardware time are the same
> physics. L3/A1 could not decide from the donor which of these dominated historically, and neither
> can this document.
> ❌ **"Dramatically lower total cost" is NOT established** and must not be told to anyone as if it were.

**What would settle it** (L3/A1's instrument, adopted): ≥20 stratified devices implemented under both
workflows with the support contract held constant, engineer-hours recorded separately for authoring ·
dependency/licence · matrix remediation · hardware UAT · docs/i18n/samples · 90-day churn; report
median and P90 per **accepted** device.

---

## L. MVP boundary — what gets built first, and what explicitly does not

**In:**
1. The **Support Status Contract** (D.2) — paper first. Everything else's meaning depends on it.
2. **One adapter**: `modbus-rtu`, with its `encoding_schema`.
3. **Device Profile schema v0** + a JSON Schema validator (isolated).
4. **Project Manifest schema v0** with the canonical/instance split enforced by the validator
   (a profile containing a slave address must FAIL validation — that check is the whole of R-2).
5. **ERA** definition, canonical serialisation, hash, and the four falsification tests as its acceptance suite.
6. **Generator prototype**: profile + manifest + adapter → C++ for one board.
7. **Compile evidence harness** — reusing the donor's canonical-sample / host-compile probes.
8. **Channels → auto Web UI adapter**, reusing the donor's renderer and transport unchanged.
9. **Migration rehearsal** against a synthetic corpus of N profiles.

**Out (named so they cannot creep in):** a second protocol · AI datasheet extraction · the
Custom→Verified promotion workflow as software · marketplace · knowledge graph · custom DB engine ·
ontology · distributed registry · Home Assistant discovery emission · Azure · Desktop packaging ·
any production implementation of any of the above.

---

## M. Implementation sequence

| # | Step | Gate before the next step |
|---|---|---|
| 1 | Support Status Contract + Evidence record schema | Human ruling on the per-class minimum for Verified |
| 2 | Device Profile v0 + Project Manifest v0 + validators | **the canonical/instance separation test fails a profile carrying an address** |
| 3 | ERA + hash + the four falsification tests | all four tests demonstrably able to go RED |
| 4 | `modbus-rtu` adapter + generator prototype | a real compile, RC=0, artifact digest recorded |
| 5 | Compile evidence harness (donor probes) | negative control: a broken profile must FAIL |
| 6 | Channels → auto Web UI adapter | rendered and looked at, in every state (rule 04) |
| 7 | Loopback conformance with a Modbus slave simulator | wrong word order must FAIL |
| 8 | Migration rehearsal on N synthetic profiles | evidence invalidation observed, not asserted |
| 9 | **Only then** a second adapter, to test whether the schema generalises | — |

Nothing in this sequence is a GO. Each step is a proposal for the Human.

---

## N. Risks / unknowns

| # | Risk | Sev | Standing |
|---|---|---|---|
| N-1 | Only ~25 % (20–40 %) of device families are pure-data expressible | 🔴 | **measured** (L3/A3, n=20, strict method). Mitigated by `capability_code`, not solved |
| N-2 | The registry becomes a large software system with per-entry human cost | 🔴 | **weakened, not refuted** (L3/A2). The donor's simpler catalog already took 15+8+111 commits at schema `1.0` |
| N-3 | Total cost reduction is unproven | 🔴 | **NOT DECIDABLE WITHOUT MEASUREMENT** (L3/A1). Do not claim it |
| N-4 | Modbus validates only "metadata above a pre-existing engine" | 🔴 | **measured** (L3/A4). A second adapter of a different kind is the real test |
| N-5 | AI Verified-throughput is unmeasured; datasheet→profile is unproven in all prior art | 🔴 | L3/A5 + L2b S7 (`NOT OBTAINED`) |
| N-6 | The support contract erodes in practice, and "supported" quietly weakens | 🔴 | L3/A7. Only a machine-derived status resists this |
| N-7 | Schema migration invalidates N profiles' evidence | 🟡 | D.3 firebreaks; rehearsal is in the MVP |
| N-8 | Nobody in prior art has a dependency lock — the ERA is unproven ground | 🟡 | L2b Q-B: 7/7 `NONE`. Differentiator and cost simultaneously |
| N-9 | HA / ESPHome vocabularies are upstream-governed and can drift | 🟡 | L2b S1.6 measured a live docs↔`dev` conflict (`skip_updates`, `custom_command`→`custom_pdu`, removal 2027.3). **A release baseline must be pinned** |
| N-10 | The closest competitor's compile-error feedback loop is unestablished | 🟢 | L2b S5.1 `NOT OBTAINED`. Do not build a differentiation claim on its absence (baton 45/49) |
| N-11 | Registry curation staffing is assumed, not planned | 🟡 | Human §11 says AI-assisted; L3/A5 says review is the floor. Unresolved |
| N-12 | Particle coverage 10/977 = 1.02 % is a docs-page proxy, not an API count | 🟢 | L2b S3.3 states the limitation itself |

---

## Self-check (judgment-mistakes-history.md)

**Pattern A (snap judgment):** *applies and is guarded* — the central hypothesis was attacked by a
dispatched lane **before** this document was written, and the design is built on what survived rather
than on the hypothesis. The claim in §K is deliberately smaller than the one the objective proposed.

**Pattern B (self-confirmed scope):** *applies* — the temptation was to design the registry and skip
the support contract. §D.2 exists because L3/A7 named it, not because it was planned.

**Pattern C (sample as whole population):** *applies* — the 25 % figure has denominator n=20 donor
families and one strict method, stated in §N-1 as such. The three measured additions (HX711 / Modbus /
Relay) are n=3 and are never spoken of as "Classic's average cost".

**Pattern D (log head/tail):** *does not apply* — no truncated output was judged from; the lanes
returned complete reports and each negative result carries the search that established it.

**Evidence labels:** §A requirements = **evidence-based** (L1 denominators). §B.3/§B.4 schemas =
**design**, built from measured vocabularies (L2b). §D.1 nine ERA values = **adopted verbatim from
L3/A6**. §D.2 levels = **design**, with L0–L5 traceable to distinct donor states L3/A7 measured.
§K "9 shared surfaces → 0" = **evidence-based on the Classic side, design claim on the Text side**
— it describes an architecture nobody has built, and §K says so.

**What is inferred and why it proceeds anyway:** that append-only records eliminate the shared-surface
edit is a *structural* consequence of the design, not a measurement, and it is the one thing L4 should
attack hardest.
