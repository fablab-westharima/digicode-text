# Rule: Setting-to-HW Reflection Integrity — UI Settings Must Reach Their Final Effector

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

> **Note on the name:** "HW" in the filename is historical; read it as **"final effector"** — wherever a setting finally takes effect: hardware, an external API, persisted output, a generated artifact, a rendered document. The rule applies unchanged to all of them. (The filename is kept to preserve cross-references from other rules.)

**Severity:** ★★★★★ (a setting UI that does not actually reach its final effector is worse than no UI: the user believes the system is configured, ships work on that assumption, and the failure mode looks like a defect in the effector itself)
**Scope:** common
**Last reviewed:** 2026-08-25 (Project_Template Phase 7 case promotion — added §Discipline 1.1 (a setting that must apply first is written at the layer that exists before the effect is born) plus its Discipline 6 checklist row. Origin case 109; Discipline 1 asks whether the arrow connects, 1.1 asks when, which is why it lives here rather than in rule 10. 前 review 2026-07-07 (template edition))
**Related memory:** `shared_store_sideeffect`, `lib_adoption_verify`, `evidence_based_runtime_research`, `reactive_vs_systematic`, `minimum_passing_grade` (Origin: DigiCode)
**Related cases:** Origin: DigiCode — `judgment-mistakes-history.md` case 19 (setCheck insufficient), case 20 (setCheck excessive + Phase 1 snap judgment), case 22 (founding-use-case-unmet scope), case 23 (the six-incident orphan-setting cluster preserved below)

---

## TL;DR

1. **Every setting UI must have a verified path from user input to the final effector's actual behavior.** "The dialog saves successfully" is not verification — the verification is "the effector behaves differently after the save."
2. **Every consumer of a setting must be enumerated and listed in the design proposal.** If a setting has zero consumers (orphan storage) or has consumers in some paths but not others (partial reflection), the design must surface this and ask the user to decide.
3. **A setting's UI label, internal index, and effector target must be reconciled in one cross-reference table.** UI label "left foot" cannot map to a downstream label "left leg" silently — that mismatch is the seed of a class of bugs that surface only at the effector.
4. **For every library adopted (vendored, registry, fork) verify license + API + maintenance + dependency on evidence.** Header comments and convention assumptions are not evidence. A library declared MIT in its header can be a GPL-3.0 rename; the license claim must be re-derived from upstream source by verbatim comparison.
5. **When a new write path is added to an existing setting domain, audit every other write path in the same domain in the same commit — and define the domain as the whole project's persisted settings (vertical scan), never a hand-picked sub-cluster.**

---

## Why this exists

On the origin project (DigiCode, Sessions 137–139) a single investigation surfaced a cluster of **six structural failures sharing one root: the gap between "what the UI implies" and "what the final effector does."** Concretely: settings saved to device storage that no code ever read back (orphan storage); a library-internal calibration system with no UI writer; settings honored by one code path and silently ignored by four sibling paths (partial reflection); a UI-label ↔ library-label mismatch latent underneath one of them; a GPL-3.0 library rename falsely declared MIT, exposed by verbatim upstream comparison during the same audit; and — after the initial audit was scoped to one settings family — one more orphan surfaced by the user the same day.

Every one of these was invisible from the UI side and from internal metrics (typecheck 0 errors / unit tests all green / audits 0 warnings); each was caught only by end-to-end tracing or effector-level smoke. The full six-incident evidence (A–F) is preserved in the Origin worked example below; the same catalog is `judgment-mistakes-history.md` case 23.

---

## When to apply

Read this rule when any of the following are about to happen:

- Adding a new settings surface (dialog, panel, config-file field, env-driven option).
- Modifying the storage path of an existing setting (store field add, namespace change, persisted-layout change).
- Adding a new code path that consumes or could consume an existing setting (a new output channel, a new generator/emitter, anything that addresses the same effector).
- Adopting a new library (vendored, registry, fork) or modifying an existing one.
- Renaming an enum / constant / field that crosses the UI ↔ store ↔ downstream-library boundary.
- Reviewing a setting-related bug to determine whether it is isolated or a cluster.
- Writing a "Decisions for user" table for any setting design.

---

## How to apply

### Discipline 1 — UI → final-effector reflection trace, end to end

For every setting, draw the path from UI to the effector's actual behavior. Each arrow must be a verified call site, not an inferred connection:

```
UI surface (dialog / panel / config field)
   ↓ (event handler)
Store mutation (state update / config write)
   ↓ (consumer reads)
Storage layer (persisted store / DB / file / device storage / transport send)
   ↓ (load, or emit into generated output)
Effector-side variable or generated artifact
   ↓ (apply-time call)
Final effector write (hardware write / external API call / file render / response emit)
   ↓ (observable effect)
Final effector behavior
```

Every arrow must be verified with grep / source read / runtime probe. **If any arrow cannot be verified, the setting is orphan — surface it.**

### Discipline 1.1 — A setting that must apply first is written at the layer that exists before the effect is born

Discipline 1 asks *whether* the arrow connects. This asks *when*. A value can travel the whole verified path and still arrive after the effector has already acted once, because the effector's default is what runs at birth.

- **Identify the moment the effect first becomes possible** — process launch, watcher start, first poll, device power-on — and write the setting at the layer that exists **before** that moment: the config file rather than the running instance, the image rather than the container, the record rather than the API call that would have amended it.
- **"Stop it, then wire it up" has to be guaranteed by the procedure, not by the ordering of your commands.** A stop whose persistence does not outlive the wiring is not a stop, and **a sleep is not a synchronisation point** — it is a guess about someone else's timing. (The instrument-side twin of this, reusing one poll as the synchronisation point for a different resource, is `04-testing-strategy.md` case 85; that rule owns the measurement, this one owns the setting.)
- **Bundling the wiring and the pause into one command removes the window you were relying on.** If the two must be separate to be safe, they are separate commands, and the safe order is verified before the second one is composed.

(Origin: LaserEditor case 109 — a watcher whose default was `enabled=true` began consuming before the pause API existed; the wiring and the pause were issued as one command, and an eight-second window let a pre-GO ingest run. What prevented harm was a chance `Permission denied`, not the design.)

### Discipline 2 — Save → Consume path integrity check

For every storage point in the path, enumerate every consumer (read site):

```bash
# Example: enumerate consumers of a stored setting value
grep -rnE "{{SETTING_KEY_OR_ACCESSOR_PATTERN}}" --include="*.{{SRC_EXT}}" {{SRC_DIR}}
```

The minimum acceptable state:

- **At least one consumer exists.** If zero, the setting is orphan storage — either delete the storage or add a consumer.
- **Every code path that should consume the setting actually does.** A consumer in one path but not in the sibling paths of the same domain is a partial-reflection bug, not a complete feature.
- **The consumer applies the value, not just reads it.** A consumer that reads the value and then ignores it (e.g. logs it but never passes it to the effector-facing call) is still orphan.

### Discipline 3 — Label / index / effector-target cross-reference

When a setting is per-channel, per-index, or per-target, build a single table that reconciles every layer:

| UI index | UI label | Store field | Downstream internal label | Channel / address | Real-world target |
|---|---|---|---|---|---|
| 0 | (string shown in UI) | (store field name) | (library const name) | (pin / endpoint / column) | (what it physically or externally is) |

If any column has a mismatch (e.g. UI label "left foot" maps to downstream `LEFT_LEG`), one of the following must happen:

- **Rename to reconcile** (preferred): update the UI label or the downstream const to remove the mismatch.
- **Document the mismatch with a verbatim cite** in the design proposal so the user can decide whether the inconsistency is acceptable.

A silent mismatch — where both sides compile and the system "works" because the channel numbers happen to align — is a latent bug that surfaces only when the setting starts being consumed.

### Discipline 4 — Library origin / license verification

Before adopting (or continuing to use) a library, verify on evidence:

- **License**: read the upstream `LICENSE` file verbatim, not the in-file header. The header can claim one license while the upstream is another. For dual licenses (e.g. GPL-3.0 / Commercial), record both and choose explicitly.
- **Origin lineage**: if the library has identifier patterns (class names, constant names, method names, algorithm shapes) that match a known upstream project, compare them verbatim. Removing a prefix and editing the header's license line does not change derivative-work status.
- **License compatibility with the consuming project**: derivative works of GPL-3.0 cannot be relicensed as MIT. AGPL-3.0 can include GPL-3.0 dependencies (upward compatible per AGPL §13) but cannot relicense them.
- **Maintenance**: last commit date, open issues, response time.
- **Dependency**: transitive deps and their licenses (a GPL-3.0 transitive dep through an MIT-declared lib is still a GPL-3.0 exposure).

Apply this not only at adoption time: **every library currently vendored or declared in the dependency manifest (`{{DEP_MANIFEST}}`) should be re-verified periodically.** (If your project has a library-adoption protocol rule, this discipline is its cross-cutting application to legacy/existing libraries.)

### Discipline 5 — Cluster audit when a write path is added

When you add a new write path that consumes a setting, audit every other write path in the same setting's domain in the same commit:

```
Setting: {{SETTING_NAME}} → {{VALUE_FIELD}}
Domain: every code path that ultimately drives {{EFFECTOR_CALL}}
   path_a            — this commit: consumer added ✅
   path_b            — ? (audit required)
   path_c            — ? (audit required)
   path_d            — irrelevant (does not drive this effector — state why)
```

Every "?" must be resolved in the same commit, or explicitly listed as "out of scope, surfaced to user" in the design proposal. **Resolving only one path while declaring the cluster complete is the case-22 founding-use-case-unmet trap.**

The minimum self-question:

> If a user sets value V at the UI, and the user exercises any path in this domain, does V reach the final effector?

If the answer is "only for some paths", the cluster is not complete and the design proposal must list every path where the answer is "no" with a per-path resolution (fix now / defer with user GO / out of scope with explicit justification).

### Discipline 5.1 — Audit scope must be a domain-wide vertical scan, not a sub-cluster

When applying Discipline 5, define the **domain** at the broadest level: "every persistent setting surface in the project," not "the cluster currently under investigation." A sub-cluster audit is itself a self-imposed scope (rule 17 violation) and reproduces the very trap the audit was meant to catch — on the origin project, the initial enumeration was scoped to one settings family and the user surfaced another orphan the same day (incident F below).

Concrete protocol:

1. Enumerate **every** persisted store / config surface in the project (`{{STORES_LOCATION}}`). Not only the ones relevant to the current investigation.
2. For each store, count its consumers: `grep -rlE "{{STORE_ACCESSOR_PATTERN}}" --include="*.{{SRC_EXT}}" {{SRC_DIR}}`. Count = 1 (= the store file itself) = orphan candidate. Count = 2 (= store + the dialog/panel that mutates it) = likely orphan (verify whether the mutator ever reaches an effector-facing call).
3. For each settings dialog / panel / config surface, trace whether its mutations reach an effector-facing call site (generated output, runtime command, API call, render).
4. **The vertical scan must land in the same commit or PR as the design proposal** — deferring "complete the scan later" reproduces the incident-F trap.

Anti-pattern shape:

```
Bad:  "Audited cluster X (incidents identified). Sub-cluster audit complete.
       Setting family Y is a different cluster, will audit later."
    → the deferred family contains an orphan; the user finds it first.
Good: "Vertical scan of every persisted store: N stores enumerated, each
       grep'd for consumer count. 1 new orphan found (store Z = 1 consumer
       = its own panel, no downstream integration). Added to the incident
       list in the same commit."
```

### Discipline 5.2 — The final effector may be a physical product, not a device

A real-world unit (mm, kg, seconds of exposure) has a surface on which it is supposed to mean something. Find that surface first, then write the conversion — the nearest available metadata is rarely it.

- State in the code or spec **which physical surface the unit lands on**, then derive the conversion from it.
- Beware conversions anchored to intermediate representations (image DPI, canvas pixels, preview scale). They pass every test at authoring resolution and vanish at production scale.
- Apply the retroactive self-audit on filing: sweep every same-shaped conversion in the codebase, not just the reported one.

(Origin: LaserEditor case 68 — a 0.5 mm mask offset was implemented against the image's DPI metadata. At the 1,206 px verification image it showed as a visible 6 px band; a 5,712 px phone photo engraved onto a 40 mm keychain reduced it to 0.04 mm and it disappeared. The user asked "is the offset actually doing anything?" The unit's real surface was the finished product, not the image. The retroactive sweep found the same defect in a second path.)

### Discipline 6 — Setting design checklist (for every new settings surface)

Before merging any new settings surface, the following must be verified and recorded in the PR / design proposal:

| Check | Pass criterion |
|---|---|
| Storage location chosen | Single canonical store — not multiple parallel stores |
| Consumer enumeration | Every path that should consume the setting is listed |
| Verified consumption | Each consumer's verbatim code path that reads + applies the setting is cited (file:line) |
| Persistence path | If persisted: storage layer, key/namespace, migration plan for existing data |
| Transport path | If the value must travel (device, service, process): which transport, and the transport's existence on the receiving side is verified |
| Label / index reconciliation | UI label ↔ store field ↔ downstream label ↔ channel/address table is built and verified for mismatches |
| Library license check | Every library consuming the setting has its license verified on upstream source |
| Effector smoke plan | The smoke test that proves the setting reaches the final effector is defined (not "the dialog saves successfully") |
| Birth-time ordering (Discipline 1.1) | The moment the effect first becomes possible is named, and the write lands at a layer that exists before it — no reliance on a sleep or on command order |

---

## Anti-patterns

Each pattern below is generic; the origin project hit every single one for real — see the matching incident in the Origin worked example.

### ❌ "The dialog saves successfully" treated as verification

```
User changes setting → save call → 200 OK → UI shows "saved"
Engineer concludes: the feature works.
Reality: storage has the value, but no code reads it.
```

Defense: the verification is effector behavior, not save status. Add to the smoke checklist: "after changing the setting, the effector's observable behavior must differ in the predicted direction." (Origin: incident B.)

### ❌ Adding a setting consumer in only one path

```
A consumer is wired into one code path; the sibling paths of the same
domain emit different output that never routes through it.
Engineer concludes: the feature is complete.
Reality: the setting is honored in one path and silently dropped in the rest.
```

Defense: when a write path is added, audit every other write path in the same domain (Discipline 5). The audit table goes in the design proposal. (Origin: incident A.)

### ❌ Storing a value and then never consuming it

```
Storage infrastructure: global array + persistence namespace + read/write
endpoints — dozens to hundreds of lines.
Call sites that pass the stored value to an effector-facing call: 0.
```

Defense: before merging new storage code, grep for the variable/key in the same commit and confirm at least one read site that actually applies the value to an effector-facing call. (Origin: incidents B and F.)

### ❌ Label mismatch papered over by channel alignment

```
UI:         index 0 = "left foot",  channel 27
Downstream: index 0 = LEFT_LEG,     channel 27
"Channel numbers match, so it works."
```

Defense: build the cross-reference table (Discipline 3). Either reconcile or explicitly document the mismatch with a verbatim cite. Channel alignment is not semantic alignment. (Origin: incident D.)

### ❌ Trusting an in-file license header without upstream comparison

```
Header: "Copyright (c) <this company>, MIT License"
Engineer concludes: lib is MIT, usable anywhere.
Reality: every constant, method name, and field maps 1:1 to a known
GPL-3.0 project, with only a prefix removed and names re-cased.
```

Defense: when a library is suspected of being derivative (identifier patterns match a known project), compare verbatim against upstream. A license claim cannot be self-asserted by renaming. (Origin: incident E.)

### ❌ Treating a "delegated to user code" comment as feature delivery

```
Source comment: "the actual application of this value must be implemented
on the user-code side; this layer only logs it."
Engineer (or release report) treats this as: "the feature exists."
```

Defense: a feature that delegates its implementation to a layer that has no path to implement it is not a feature. The orphan acknowledgment in the source comment is itself a release blocker, not a documentation note. (Origin: incident B.)

### ❌ Cluster-completeness claim without enumeration

```
"All settings in this domain now go through the new path." — without
listing every call site that drives the effector and verifying each one.
```

Defense: enumerate. Even a list of 20 entries with explicit ✅/❌/⏳ per entry is preferable to an unverified claim. (Origin: incident F.)

---

## Origin worked example (DigiCode)

This rule was established 2026-05-24 (Session 139) on DigiCode — a Blockly-based ESP32 robotics education platform: React settings dialogs → persisted browser stores → Blockly code generator → Arduino/ESP32 firmware, with device-side NVS/EEPROM storage. The final effector was literal hardware (servos). The rule was born when three orphan-setting clusters surfaced in one investigation, which also revealed that the entire robotics library set was an OttoDIYLib (GPL-3.0) rename declared as MIT. The full cluster is recorded as `judgment-mistakes-history.md` case 23 with a six-incident structure (A–F), preserved here: none of these was visible from the UI side or from internal metrics (typecheck / vitest / audit all passing).

### Incident A — ServoPulseDialog / ServoSpeedDialog silently ignored by robotics blocks

`ServoPulseDialog` lets the user set per-pin pulse range (e.g. 500-2500 us for MG996R). The `servo_attach` block emits `servo${pin}.attach(${pin}, ${pulseWidth.min}, ${pulseWidth.max})` (3-arg overload) so the setting reaches the hardware via that block. **But `humanoid_init` / `transform_init` / `wheel_init` emit only `humanoid.init(pinLL, pinRL, pinLF, pinRF)` (4-arg, no pulse), and the library internally calls `_servo.attach(pin)` (1-arg, default pulse 544-2400 us).** A user who sets pulse range and then uses `humanoid_walk` sees their setting silently dropped.

Same pattern for `ServoSpeedDialog` (`speedDegPerSec`): reflected only in `servo_write` (Session 138 redesign), silently ignored in every robot block. The robot blocks' `SPEED` parameter is a period-ms dropdown, semantically unrelated to the UI's deg/sec.

### Incident B — ServoTrimDialog → NVS storage with no consumer

`ServoTrimDialog` writes trim values to the device via HTTP (`POST /trim`). The DigiCodeOTA.ino template stores them in NVS namespace `"servo_trim"`. **But nowhere in the OTA template or the Blockly-generated user code does anything read those NVS values and apply them to a `servo.write()` call.** The template's `/trim/test` endpoint even contains the comment `「テスト動作の実際の実装は、サーボが接続されている ユーザーコード側で行う必要がある ファームウェアレベルではログ出力のみ」` ("the actual implementation of the test motion must be done on the user-code side where the servos are attached; at firmware level this is log output only") — i.e., the firmware explicitly acknowledges it does not apply the trim. In total: `servoTrims[16]` global + `Preferences trimPrefs` + GET/POST `/trim` + `/trim/save` + `/trim/test` endpoints ≈ 150 lines of trim infrastructure; call sites passing `servoTrims[i]` to `servo.write()`: 0.

### Incident C — DigiCodeHumanoid internal EEPROM trim with no UI writer

The `DigiCodeHumanoid` library has `setTrims / saveTrimsToEEPROM / loadTrimsFromEEPROM` and `init()` auto-loads trim from EEPROM addresses 0/2/4/6. The trim is applied at the servo write layer via `Oscillator::_trim`. **But no Blockly block emits `humanoid.setTrims(...)` or `humanoid.saveTrimsToEEPROM()`** — there is no UI path for the user to write the EEPROM trim values. The lib's trim system runs on whatever happens to be in EEPROM (typically 0 from factory), invisible to the user.

### Incident D — Label / index / hardware target mismatch

`ServoTrimDialog` preset `humanoid-basic` lists `[leftFoot=27, rightFoot=15, leftAnkle=14, rightAnkle=13]` as indices 0-3. The `DigiCodeHumanoid` library uses indices 0-3 as `[LEFT_LEG, RIGHT_LEG, LEFT_FOOT, RIGHT_FOOT]`. The pin numbers match (27/15/14/13) but the labels swap "leg" and "foot" between UI and library. A user adjusting "left foot trim" at UI index 0 (pin 27) would actually be adjusting what the library knows as "left leg" — except, per incident B, the NVS-stored value is not consumed by the library at all, so the mismatch never surfaces.

### Incident E — DigiCodeHumanoid is an OttoDIYLib (GPL-3.0) rename declared as MIT

`DigiCodeHumanoid.h` header reads `Copyright (c) 2024 DigiCo LLC / Licensed under MIT License`. Verbatim comparison against `OttoDIY/OttoDIYLib` (GPL-3.0, `(c) Juan Gonzalez-Gomez (Obijuan), Dec 2011 / GPL license` in `Oscillator.h:5-6`) reveals: 13 gesture #define names + values identical (only `Otto` prefix removed), 19 sound #define names + values identical, ~20 public API method names with identical signatures (only argument names renamed), `Oscillator` class with same field set and method set (some methods combined or renamed), `_moveServos` / `_execute` / `oscillateServos` helpers with identical signatures, `loadTrimsFromEEPROM` algorithm with same EEPROM byte-read pattern. The DigiCo LLC MIT claim is a false license declaration on a derivative work of GPL-3.0 source.

### Incident F — PID Tuning orphan, surfaced after a sub-cluster-scoped audit

The initial case-23 audit enumerated incidents A–E and scoped itself to servo settings (pulse/speed/trim) only:

```
Bad: "Audited the trim cluster (incidents A-E identified). Sub-cluster
      audit complete. PID Tuning is a different cluster, will audit later."
   → user re-audit surfaces incident F (PID Tuning orphan) the same day.
Good: "Vertical scan of every persisted store: 14 stores enumerated, each
      grep'd for consumer count. 1 new orphan found (pidTuningStore = 1
      consumer = PIDTuningPanel itself, no generator integration).
      Incident F added in the same commit."
```

This re-emergence — the document that catalogued the trap committing the same trap via self-imposed scope (rule 17 violation) — is why Discipline 5.1 mandates the domain-wide vertical scan in the same commit.

### The vertical-scan protocol, as instantiated

1. Enumerate **every** `usePersistStore` / persisted store in `stores/` (14 at the time), not only the ones relevant to the current investigation.
2. Per store: `grep -rlE "use<StoreName>" --include="*.ts" --include="*.tsx" src/`. Count = 1 (the store file itself) = orphan candidate; count = 2 (store + its mutating Dialog/Panel) = likely orphan.
3. For each settings surface in `components/**/*Dialog.tsx` / `**/*Panel.tsx` / `**/*Settings*.tsx`, trace whether its mutations reach a hardware-facing call site (generator emit, runtime API command, etc.).

### The Discipline 5 domain table, as instantiated

```
Setting: ServoSpeedDialog → speedDegPerSec
Domain: every block that ultimately calls servo.write()
   servo_write              — Session 138: speed cap added ✅
   servo_sweep              — ? (audit required)
   humanoid_walk            — ? (audit required)
   transform_walk           — ? (audit required)
   wheel_forward            — ? (audit required)
   ble_uart_setup           — irrelevant (no servo)
```

### The consumer grep, as instantiated

```bash
# Example: trim value consumers
grep -rnE "servoTrims\[|getServoTrim|trim_value" --include="*.ts" --include="*.cpp" --include="*.h"
```

### Anti-pattern instances, as they actually occurred

- **"Dialog saves successfully":** ServoTrimDialog slider → `POST /trim` → 200 OK → dialog shows "saved"; NVS had the value, no code read it. The real smoke criterion would have been "after setting trim, the servo's resting position must shift by N degrees."
- **One-path consumer:** Session 138 added the `_servoStart` helper to the `servo_write` block only; `humanoid_walk` / `transform_walk` / `wheel_forward` silently ignored the speed cap because their generator output never routed through the helper.
- **Unverified completeness claim:** "All servo settings now go through the new lib" — asserted without listing every call site that writes to a servo.
- **Lib-adoption protocol link:** Discipline 4 was the cross-cutting application of `digicode/15-lib-adoption-protocol.md` (License / API / Maintenance / Dependency) to the legacy libraries already sitting in `lib_deps` / `libs/`, not only to new adoptions.

---

## Related rules

- `common/12-collaboration.md` — design proposal format; the cross-reference table from Discipline 3 and the consumer enumeration from Discipline 5 belong in the proposal, not in the commit message.
- `common/14-decision-framework.md` — case 18 (axis recognition without action); the orphan-setting cluster is the case-18 trap applied to a setting domain instead of a single decision.
- `common/17-no-self-imposed-scope.md` — case 22 (founding use case unmet); the partial-reflection bug is the case-22 trap applied to a multi-path domain.
- `common/01-investigation.md` — the domain-wide scan here is that rule's call-site enumeration applied to a setting domain; use its Step 3b so the scan's denominator includes paths reached through helpers.
- `common/judgment-mistakes-history.md` case 23 — the origin incident catalog with full evidence cites.
- `digicode/15-lib-adoption-protocol.md` — origin-project 4-axis verification (License / API / Maintenance / Dependency) that Discipline 4 generalizes to existing-library re-verification (DigiCode only).
- `digicode/03-block-workflow.md` Trap 8 / Trap 9 / Trap 10 — origin-project Session 138 lessons that prefigured this rule: shared store mutation side-effects, generator-host subscribe gap, blocking helper preventing parallel actuator motion (DigiCode only).

### Sync protocol with `judgment-mistakes-history.md`

This rule's Origin worked example narrates incidents A–F from the rule-discipline angle. `judgment-mistakes-history.md` case 23 narrates the same incidents from the pattern-recurrence angle. Reviewers of either file should check the other and update both in the same commit when either changes.
