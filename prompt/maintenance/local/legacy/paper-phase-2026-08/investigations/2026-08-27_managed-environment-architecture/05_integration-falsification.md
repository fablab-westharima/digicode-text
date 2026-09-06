# 05 — Falsification of the integration (Lane L4)

**Packet:** `S010-L4-integration-falsification` · LANE: FALSIFICATION · Route A / `AUTHORITY_MODE: DELEGATED`
**Executor:** six-lane delegate (Codex), read-only, no network, baseline effort
**VERDICT: PASS · `HUMAN_DECISION_REQUIRED: YES`** · CHANGED_FILES: NONE

> 🔴 **Read this file BEFORE `04_integrated-architecture.md`.** `04` is the pre-falsification draft and
> is preserved unedited as the audit trail; **`06_corrected-architecture.md` supersedes it.** This is
> the same read-order hazard as S007's `08`/`09` (case DT-6) — the corrected document is the one that
> is current, and `04` is kept only so the corrections are checkable.

## Headline

**71 checkable atomic claims audited. 36 failed (50.7 %).**

| Verdict | Count |
|---|---:|
| SUPPORTED | 35 |
| OVERSTATED | 14 |
| UNSUPPORTED | 18 |
| CONTRADICTED | 4 |
| **failed total** | **36 / 71 (50.7 %)** |

This is the **third consecutive** measurement of the same defect in this project's integration phase:
S007 = 13 corrections (case DT-6), S009 = 12 unsupported + 20 over-generalised (case DT-9), S010 = 36/71.
In all three the integrator's own self-check caught **0**, and a dispatched lane caught all of them.

`I` = `04_integrated-architecture.md` · `E1` = `01_…` · `E2` = `02_…` · `E3` = `03_…`

---

## F-01 🔴 "9 shared surfaces → 0" is not evidence, and Option C keeps many shared surfaces

The integration turned "adding device #N edits nine global surfaces" into a Classic general rule and
claimed Option C reaches "zero shared-surface edits" and "9 → 0".

**E1 measured no such thing.** In the three additions measured, **no addition edited all nine surfaces
in its initial commit**; catalog, dependency and sample work for Modbus/Relay arrived in later batches
whose per-device cost is explicitly `NOT OBTAINED` (E1:33–34, 95–102, 124–142). E1's conclusion goes
as far as "mechanical fan-out exists" (E1:384–392) — not that each addition always edits nine
surfaces, and not that another design reaches zero.

**Option C itself has at least fifteen shared surfaces**, enumerated by the lane:

1. Device Profile root schema; shared channel/access/datatype schema
2. `semantic` vocabulary + validator
3. `transform` vocabulary (`scale`, `enum_map`, …) — **owner undefined in `I`**
4. `ui` vocabulary + widget-inference rules
5. Adapter registry; adapter discovery/registry loader
6. Package registry schema, resolver, licence policy
7. Platform/board registry
8. Evidence record schema + the L0–L6 status contract
9. ERA schema, canonical serializer, resolver, hash/attestation contract
10. representative board-set policy
11. generated build-manifest schema + Compiler interface
12. AI environment/context serializer
13. channels → Web UI / MQTT / HA / logging converters
14. namespace, supersession, security-advisory reverse index
15. registry snapshot publication/storage

A new device needing a new semantic, transform, widget, compatibility rule, adapter or board-risk
selection edits these. E2 warned of exactly this: a registry brings "schema, generators, validators,
migrations, evidence records, compatibility logic and lifecycle workflows" (E2:107–136).

Verdicts: Classic-side "shared surfaces exist" **SUPPORTED** · "each addition edits nine" **OVERSTATED** ·
Text-side "zero" **UNSUPPORTED** · "Option C satisfies R-1" **UNSUPPORTED**.

## F-02 🔴 The ERA does not yet establish reproducibility; items 4 and 5 lack feasibility

`I` asserts package `content_digest` + "full transitive resolution, pinned" and concludes "the project
is reproducible". The evidence points the other way: ESPHome branch/default/movable tags change with
no content-snapshot guarantee (E3:100–118) · the Arduino index itself updates and
discovery/monitor dependencies carry **no version at all** (E3:338–366) · PlatformIO has **no**
dependency-resolution lock and range/latest transitives are unpinned (E3:397–405) · **all seven**
systems let transitives escape (E3:452–465).

**A digest can tell you whether the bytes are the same. It cannot make the bytes retrievable in six
months.** `I` has no artifact-byte retention, no content-addressed archive, and no path for upstream
disappearance. It also does not define how PlatformIO's actual resolution result, framework/tool
packages, or material fetched by package scripts is captured.

Further: `I` claims the ERA is "exactly" L3/A6's nine items, but E2 item 8 is "generated manifest
tying **source fragments** to the snapshot" (E2:259–270); `I`'s `manifest_digest` is the *project*
manifest and expresses no such binding.

Verdicts: "7/7 have no lock" **SUPPORTED** · "the ERA delivers that lock" **DESIGN / UNSUPPORTED** ·
"exactly L3/A6's nine" **OVERSTATED** · "a Custom device's project is reproducible" **UNSUPPORTED**.

## F-03 🔴 L0–L6 is gameable and not monotonic

- **L0** passes a schema-valid but factually wrong register map — it measures syntax only.
- **L1** leaves "no licence conflict" policy/authority undefined, and the full lock is itself unbuilt.
- **L2** passes by choosing one convenient board; it cannot see semantic correctness against the device.
- **L3** has no rule for what "representative" means, no minimum set, no change conditions — **the
  denominator is operator-choosable.**
- **L4** is self-confirming if the simulator is generated from the same profile it validates. The
  wrong-word-order control shows the decoder has detection power; it does **not** show the datasheet
  or the address is true.
- **L5** records model/firmware/operator/date but no expected values, tolerances, load, fault cases or
  channel coverage.
- **L6** requires only `L3+`, so it **is not necessarily stronger than L5** — the ladder is not
  monotonic. `N days` and "current upstream versions" are undefined and are in tension with the ERA's
  exact pinning.

And **CONTRADICTED**: `I` calls Particle's 10/977 "standing proof that everything Verified is not
reachable". E3:277–280 states it is a **docs-page proxy**, not an API registry count. A low current
coverage number does not prove unreachability.

## F-04 🔴 The canonical/instance split is not a field-name prohibition

`I` reduces all of R-2 to one validator test: "a profile containing a slave address must FAIL".

But E1 measured HX711 exposing a configurable **scale factor** and a **known calibration weight**, with
tare/calibration being installation-dependent behaviour (E1:90–93), and E2 classifies HX711 as
"calibration against a known mass / stored scale" (E2:142–150). `I` nevertheless places
`transform.scale` in the profile as a canonical channel fact.

The same field is canonical or instance depending on provenance:
- a datasheet-defined multiplier → canonical;
- a calibration scale derived from the load cell, the mechanism, the installation and a known mass → **instance**.

**A field name cannot separate them.** Relay active-high/low is the same shape — it can be a module
wiring/installation fact (E1:133–140).

Additionally `I` is **internally inconsistent**: §M's gate says "an address" (which would forbid the
register address every profile must carry, §B.3), while §B.3/§L mean the *slave* address only.

## F-05 🔴 The MVP and sequence are circular, and the MVP is not minimal

`I` puts at least nine subsystems in the MVP — schema, adapter, ERA/resolver, generator, Compiler
integration, evidence harness, UI adapter, migration rehearsal — and depends on a registry, a resolver
and artifact storage it never names.

Concrete ordering breaks:
1. Step 2's profile validator needs the adapter's `encoding_schema`, but the adapter is Step 4.
2. Step 3's ERA falsification tests need Compiler rejection, package resolution and a toolchain/registry
   snapshot — Step 4/5 or absent from the sequence entirely.
3. Step 4's real compile depends on the resolver/lock that Step 3 has not demonstrated.
4. MVP "In" omits L4 conformance, but implementation Step 7 includes it.
5. The support contract is made central, yet real hardware / L5 is never exercised in the MVP.
6. Step 2's gate ("a forbidden field fails schema validation") is a **validator self-consistency test,
   not a test of whether the canonical/instance classification is right** — the tautology F-04 predicts.

E2 asked for the support contract to be defined first (E2:287–308). It did not endorse this scale or
this dependency order.

## F-06 🔴 The cost conclusions exceed E2's stated limits

`I` states as established: per-device cost falls · per-protocol does not · adapter implementation
≈ Classic's per-block cost · per-device authoring cost falls · **"evidence cost does not fall at all"**.

E2's conclusion is bounded to: metadata **"can reduce marginal UI/generator authoring work"**
(E2:312–329); total cost and counterfactual person-hours are **NOT DECIDABLE WITHOUT MEASUREMENT**
(E2:62–103).

"Evidence cost does not fall at all" **inverts** E2's "the donor does not establish that verification
costs fall" into a proof of invariance. New selection, caching, simulators and hardware harnesses could
move it either way. **CONTRADICTED.**

Likewise 25 % is a low-confidence estimate over a strict n=20 donor sample (E2:154–168); "25 % of
reality" and N-1's `measured` label over general "device families" are **OVERSTATED**.

## F-07 🔴 Adapter-owned encoding is not a migration firebreak

`semantic`, `transform`, `ui`, `datatype`, `access`, channel identity and status/evidence
interpretation all sit **outside** the adapter. Decomposing `scale`, changing unit semantics, widget
semantics or write safety propagates across every adapter — and E2's example migration is precisely
"splitting scale into signedness / word order / multiplier / unit / applicability, which may
invalidate prior evidence" (E2:125–133).

R-7 demands "schema change **without** invalidating N profiles' evidence" while D.3 invalidates
evidence **by default**. That is an internal **CONTRADICTION** in `I`.

Declaring the HA vocabulary "additive by policy" does not bind upstream: E3:132–140 measured a live
ESPHome docs↔`dev` conflict with removals scheduled for 2027.3.

## F-08 🔴 "One record; six consumers" contradicts the document itself

`I`'s own flow requires at least: Device Profile · Project Manifest · Adapter package/schema · ERA ·
generated build manifest · Evidence record. The MQTT topic is in the **manifest**, not the profile;
the Compiler reads the **generated build manifest**, not a channel record; HA additionally needs
`unique_id` / topics / device identity; the logging contract is never defined.

E1 confirmed registration metadata → UI schema → renderer/transport (E1:301–380); E3 confirmed one
ESPHome YAML item carrying register + UI semantics together (E3:68–98). Neither measured a single
record driving six consumers. **CONTRADICTED.**

## F-09 🟡 "auto Web UI almost unchanged" is overstated

E1 measured a widget model of toggle/slider/display over `channelId`, `label`, `dataType`, `min/max`,
r/w/n (E1:314–362). `I` adds `graph`, `badge`, `confirm`, HA semantics and MQTT mapping. `I` also
**drops** E1's recorded fidelity caveat that the schema carries `endpoint.path` while the bundle pins
`/` (E1:370–380), and calls the transport unchanged. **OVERSTATED.**

## F-10 🔴 Not every lane conflict and NOT-OBTAINED was carried

| Evidence conflict / caveat | Treatment in `I` |
|---|---|
| E1 shared donor globals | carried in §A/§K, but over-generalised to "nine per addition" |
| E2 universal-data vs dramatic-cost conflict | carried in §K/§N |
| E2 **human must choose** narrowed hypothesis **or** fund comparative measurement | the instrument was carried; **the human choice was not** — `I` simply selects Option C |
| E3 ESPHome docs vs dev | carried as N-9 |
| E3 **HA device `name` requiredness conflict** | **OMITTED** |
| E3 **RP2040 current platform state `NOT OBTAINED`** | **OMITTED** |

Also dropped: E1's per-device later-cost `NOT OBTAINED` (treated as a steady per-addition surface) ·
E1's WebSocket `endpoint.path` caveat · E2's explicit note that the review-time table is
**illustrative, not observed donor review times** (`I` hardens it into "accepted entries" ceilings) ·
E3's Arduino discovery/monitor dependency version hole · E3's finding that external components carry
**no signature or content-snapshot guarantee** · E3's declared limit that the prior-art survey ran
**no synthetic and no real-fire** verification at all.

## F-11 🔴 Statements a human would reasonably read as established, that are not

"adding device #N edits nine global surfaces" · "Option C satisfies R-1/R-2/R-7" · "per-device cost
falls" · "the failure mode is structurally absent" · "RP2040 would not have had to be deleted" ·
"one record, six consumers" · "the project is reproducible" · "everything Verified is not reachable" ·
"AI removes drafting time" · "datasheet→profile is unproven in all prior art" (E3's direct
`NOT OBTAINED` covers Embedder's public material only) · "only a machine-derived status resists
erosion" · "adapter implementation ≈ Classic per-block cost" · "evidence cost does not fall at all".

## F-12 🔴 (free attack, strongest) The ERA attestation's trust boundary is circular

The Compiler receives `era_hash` as input and returns the **same** `era_hash` in its attestation.
But `I` requires no enumeration of the registry/package/toolchain identities the Compiler *actually*
used; there is no signer, no signature, no trusted-compiler identity; and no gate makes AI/UI/MQTT/HA
refuse to run on a mismatched hash. **A Compiler that simply echoes the input hash passes the
acceptance test.**

E2 required "compile-result attestation returning those **identities**" and revealing/rejecting a
different origin/lock/toolchain (E2:259–276). `I` collapsed that into a single hash round-trip.
**Hash equality is not evidence that each consumer used the contents the hash names.**

---

## Selected rows from the 71-claim ledger (failures only; full ledger reproduced in the lane's report)

| ID | Verdict | Claim → evidence |
|---|---|---|
| A01 | UNSUPPORTED | "S007 13 / S009 12 / self-check caught 0" — not in E1–E3 (it is in `16.md` §3 and the case index; the citation was simply wrong) |
| A03 | OVERSTATED | "each addition edits nine surfaces" |
| A05 | UNSUPPORTED | "coupling makes cost superlinear" — E1 has a coupling map, no N-vs-cost curve |
| A11 / A14 | OVERSTATED | "25 % of reality" / N-1 labelled `measured` over general device families |
| A13 | CONTRADICTED | R-7 "without invalidating evidence" vs D.3 default invalidation |
| A16 / A17 | UNSUPPORTED | "boundary exactly where L3 measured" / "per-device falls, per-protocol does not" |
| A20 | UNSUPPORTED | "adapter schema is the migration firebreak" |
| A21 | OVERSTATED | "vocabularies measured in production use" — E3 was static docs/source only, no real-fire |
| A23 | OVERSTATED | "every semantic element taken; neither invented" — the wrapper, `unit` and UI composition are design |
| A27 / A28 | UNSUPPORTED | Option A "every schema change is a global migration" / "one store recreates the shared-edit pathology" |
| A29 / A30 | UNSUPPORTED | "Option C satisfies R1/R2/R7" / "ERA is engineering nobody has built" |
| A31 | OVERSTATED | "ERA is exactly L3's nine" |
| A37 | CONTRADICTED | Particle proxy as "proof everything Verified is unreachable" |
| A39 | OVERSTATED | "semantic migration invalidates by default, adopted" — E2 says *may* invalidate |
| A40 / A41 / A45 | UNSUPPORTED | "one file, nothing shared" / "adapter cost not paid again" / "RP2040 needn't have been deleted" |
| A46 | OVERSTATED | "auto UI almost unchanged" |
| A47 | CONTRADICTED | "one record, six consumers" |
| A49 | UNSUPPORTED | "project reproducible" |
| A52 / A53 | OVERSTATED | review-time ceilings hardened / "AI removes drafting time" |
| A55 | OVERSTATED | "unproven in all prior art" |
| A56 | UNSUPPORTED | "the ERA hash proves it" |
| A59 | OVERSTATED | later batch costs treated as per-addition |
| A61 / A62 | UNSUPPORTED | Option C marginal-cost table / "authoring falls, 9→0" |
| A63 | CONTRADICTED | "evidence cost does not fall at all" |
| A66 | UNSUPPORTED | "only machine-derived status resists erosion" |
| A70 | OVERSTATED | "L0–L5 traceable to distinct donor states" |
| A71 | UNSUPPORTED | "append-only eliminates shared edits structurally" |

## What survives (lane's own words, narrowest form)

> Only E2:312–321's conditional proposition is supported: **where a stable generic adapter already
> implements transport, initialization, timing, error behaviour and conversion, a device differing only
> in address / channels / constants / unit / polarity / simple scaling can be added mainly as metadata,
> and can reduce marginal UI/generator authoring work.**

Verification: all `static` (full read of four documents, quotation cross-checking, claim ledger,
conflict / NOT-OBTAINED search). `synthetic` / `API-smoke` / `visual` / `real-fire` not run. No file
written; `git status --short` showed only the integration owner's pre-existing untracked paths.

`HUMAN_DECISION_REQUIRED: YES` — the integration selected Option C while its zero-coupling,
reproducibility, canonical-split, status-ladder and cost claims are unverified, and **E2's explicit
choice — adopt the narrowed hypothesis, or fund the comparative measurement — is still unresolved and
belongs to the Human.**
