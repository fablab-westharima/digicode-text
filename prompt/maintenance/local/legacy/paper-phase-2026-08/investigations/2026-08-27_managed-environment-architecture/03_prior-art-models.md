# 03 — Prior-art entity/relation models and Verified lifecycles (Lane L2b)

**Packet:** `S010-L2b-prior-art` · LANE: INVESTIGATION · Route A / `AUTHORITY_MODE: DELEGATED`
**Executor:** six-lane delegate (Codex), workspace-write sandbox **with network**, baseline effort
**VERDICT: PASS / REASON: NONE** · CHANGED_FILES: NONE (verified independently by the integration
owner: `git status --porcelain` showed only the integration owner's own two new paths)
**Network probe:** `curl -I --max-time 20 https://esphome.io/` → RC=0, HTTP/2 200 (`API-smoke`)

**Predecessor:** packet `S010-L2` returned **VERDICT: ERROR / INVALID_MEASUREMENT** — the read-only
sandbox had no network (`curl` RC=6, DNS failure). That was a correct fail-closed return and is
recorded here rather than discarded: it is the measurement that produced this dispatch's network flag.

> Immutable measured evidence. Every unobtained item is `NOT OBTAINED`; the lane adopted **no**
> `MODEL_KNOWLEDGE_UNVERIFIED` material at all.

---

## S1 — ESPHome (highest priority for device knowledge)

Sources: `esphome.io` docs `current` branch for `modbus_controller` + its sensor / binary_sensor /
switch / number / select / text_sensor platforms and `external_components`; `esphome` repo `dev`
branch `components/modbus_controller/__init__.py`, `const.py`, `sensor/__init__.py`.

### S1.1 — The register declaration model

| Field | Type / values | What it actually means |
|---|---|---|
| `modbus_controller_id` | ID | binds the entity to a slave/controller; omittable with one controller |
| `register_type` | enum | `coil` = FC01, 1-bit r/w · `discrete_input` = FC02, read-only · `holding` = FC03, 16-bit r/w · `input`/`read` = FC04, 16-bit read-only |
| `address` | integer | start register address |
| `value_type` | enum | storage format — table below |
| `register_count` | integer | number of 16-bit registers to read; derived from `value_type` if omitted |
| `response_size` | integer (bytes) | bytes of the response used; default `register_count * 2` |
| `bitmask` | integer | extracts a bit group from a packed register |
| `offset` | integer (bytes) | offset into the response buffer; for coil/discrete_input treated as a **bit** position |
| `skip_updates` | integer | docs: skip N reads, read on the N+1th; **propagates to every entity merged into the same range** |
| `force_new_range` | boolean | forcibly splits read-range merging with adjacent registers |
| `lambda` | C++ lambda | receives `x`, raw response `data`, registered `item`; returns a number or `NAN` |
| `custom_command` | byte list | a complete custom request; docs include the leading slave address and ESPHome appends CRC. **Mutually exclusive with `address`/`register_type`** |
| `filters` | list | post-processing, e.g. `multiply: 0.1` |
| `unit_of_measurement` | string | unit sent to Home Assistant |
| `accuracy_decimals` | integer | display rounding |
| `device_class` | enum/string | semantic class (temperature, power, …) |
| `state_class` | enum/string | statistical meaning (measurement / total / …) |

**`value_type` enumeration as currently documented** — note this is the exact axis the donor has
**zero** of (see `01_…md` Q5):

| Value | Width | Order |
|---|---:|---|
| `U_WORD` / `S_WORD` | 16 bit | unsigned / signed |
| `U_WORD_S` / `S_WORD_S` | 16 bit | byte-swapped within one register |
| `U_DWORD` / `S_DWORD` | 32 bit | high word first |
| `U_DWORD_R` / `S_DWORD_R` | 32 bit | **low word first** |
| `U_QWORD` / `S_QWORD` | 64 bit | high word first |
| `U_QWORD_R` / `S_QWORD_R` | 64 bit | low word first |
| `FP32` | 32 bit IEEE-754 | high word first |
| `FP32_R` | 32 bit IEEE-754 | low word first |

The packet asked about a `FLOAT` type; the current primary source uses **`FP32` / `FP32_R`**.

Read/write per platform: `sensor` / `binary_sensor` / `text_sensor` are read entities; `switch` adds
write with `write_lambda`, `assumed_state`, `use_write_multiple`; `number` supplies `min_value` /
`max_value` / `step` to the UI and is writable, with `multiply` as a **write-side** conversion;
`select` maps display strings to register values via `optionsmap: Map[str, int]` and has
`optimistic`; `text_sensor` has `raw_encode ∈ {NONE, HEXBYTES, COMMA, ANSI}`.

### S1.2 — Where a register becomes an entity

Each platform schema **composes** the shared Modbus register-item schema with ESPHome's generic
entity schema and registers the result with the controller.

| ESPHome entity | Value from the register | What it adds in Home Assistant |
|---|---|---|
| `sensor` | numeric | state · unit · device class · state class · precision · statistics eligibility |
| `binary_sensor` | bit/boolean | on/off state, binary device class |
| `switch` | bit/word | state + turn_on/turn_off commands |
| `number` | numeric | min/max/step, current value, write control |
| `select` | integer ↔ label | option list, current option, select command |
| `text_sensor` | byte sequence → string | read-only string state |

🔴 **The register declaration is not only a communication model — the same YAML item carries the
Home Assistant semantic, UI and statistics attributes.** This is the single most reusable structural
idea for digicode-text.

### S1.3 — Is device knowledge data or code? (bounded: **both**)

- Device-specific register table, slave address, scale, unit, bitmask, entity kind → normally **YAML data**.
- The schema/codegen that validates YAML and emits C++, and the runtime, are **Python/C++ component code**.
- **For a new Modbus device expressible with the generic `modbus_controller`, the number of new Python
  component files required is `0`.** Official examples build controller + several entities in YAML alone.
- Special framing, state machines, conversions spanning multiple requests → a Python/C++
  **external component** is required.
- `lambda` is an embedded C++ fragment inside YAML, so it is **not purely declarative data**.

🔴 **ESPHome does not normalise a per-model canonical register catalog into a separate registry.**
For a typical new Modbus device, canonical device facts and project-instance settings live in the
**same YAML tree**. (This is the Q-A finding, and it is the mistake digicode-text can avoid.)

### S1.4 — `external_components` (the Custom lane's prior art)

| Field | Meaning |
|---|---|
| `source.type` | `local` / `git` |
| `source.url` | git repository URL |
| `source.ref` | branch, tag, or commit ref; default branch if omitted |
| `source.path` | component path in the repo, or a local path |
| `source.username` / `password` | auth for private git |
| `components` | list of component names to load; all if omitted |
| `refresh` | re-fetch interval for git sources, default `1day` |

Shorthand `github://org/repo@ref` and PR references exist; fetched material is cloned/cached under
`.esphome`.

**Guarantees:** a commit SHA in `ref` pins content; a branch, the default branch, or a movable tag can
change later. **The docs describe no signature verification, no Particle-style human verification, no
dependency lock and no content-snapshot guarantee.** An external component **can override a built-in
component**, so source trust is the user's responsibility.

### S1.5 — Platform / board / framework layer

| Platform | Board | Framework | Version pin |
|---|---|---|---|
| `esp32` | `board`: PlatformIO board ID | `framework.type ∈ {esp-idf, arduino}` | `framework.version`, `source`, `platform_version` |
| `esp8266` | `board`: PlatformIO board ID | Arduino | `framework.version`, `source`, `platform_version` |
| `rp2040` (historical, 2025.12.5) | `board` | `earlephilhower/arduino-pico` | `version`, `source`, `platform_version` |

Board decides pin aliases, flash size, build flags. On ESP32 the chip variant constrains available
frameworks/components. **The current (`2026.8.1`-era) RP2040 source URL 404s and RP2040 could not be
confirmed in the current component list; the reason is `NOT OBTAINED`.**

### S1.6 — 🔴 Conflicts *between* ESPHome primary sources

- Docs: `skip_updates` is effective. `dev` code: **accepted but has no effect, scheduled for removal
  2027.3**, warning to use controllers with different `update_interval` instead.
- Docs: `custom_command`. `dev` code: **deprecated in favour of `custom_pdu`, removal 2027.3**;
  `custom_pdu` omits the leading slave address.

No ESPHome release baseline was specified in the packet, so "stable docs lag dev" vs "dev is a future
spec" **cannot be separated by this investigation**.

---

## S2 — Home Assistant semantic entity model

Sources: `developers.home-assistant` `master` entity docs for sensor / binary-sensor / switch /
number / select / button / text; `home-assistant.io` `current` MQTT integration page;
`home-assistant/core` `dev` `components/mqtt/{schemas.py, config.py, sensor.py}`.

### S2.1 — Domains and what the semantics actually unlock

| Domain | Core fields | What the semantics unlock |
|---|---|---|
| `sensor` | `native_value`, `native_unit_of_measurement`, `device_class`, `state_class`, `options` | unit conversion, icon/display, line charts, **long-term statistics**, enum display |
| `binary_sensor` | `is_on`, `device_class` | semantic states (door open/closed, motion detected/clear) + icons |
| `switch` | `is_on`, `turn_on`, `turn_off`, `toggle`, `device_class` | UI toggle, automation service, outlet/switch classification |
| `number` | `native_value`, min/max/step, unit, `mode` | slider or number box, range validation, set-value service |
| `select` | `current_option`, `options`, `select_option` | dropdown, selection automation |
| `button` | `press`, `device_class` | stateless action, press service |
| `text` | `native_value`, min/max length, `pattern`, `mode` | text/password input, regex validation, set-value service |

**`state_class`**: `MEASUREMENT` (current measured value; short-term statistics, and long-term when
conditions are met) · `MEASUREMENT_ANGLE` · `TOTAL` (cumulative, may go up or down) ·
`TOTAL_INCREASING` (monotonic in principle, recognises resets). `MEASUREMENT` / `TOTAL` /
`TOTAL_INCREASING` are what qualify for long-term statistics.

**`device_class` enumerations (verbatim from source):**

`binary_sensor`:
```
BATTERY, BATTERY_CHARGING, CO, COLD, CONNECTIVITY, DOOR, GARAGE_DOOR, GAS, HEAT, LIGHT, LOCK,
MOISTURE, MOTION, MOVING, OCCUPANCY, OPENING, PLUG, POWER, PRESENCE, PROBLEM, RUNNING, SAFETY,
SMOKE, SOUND, TAMPER, UPDATE, VIBRATION, WINDOW
```
`switch`: `OUTLET, SWITCH` · `button`: `IDENTIFY, RESTART, UPDATE` · `select` and `text` have **no**
domain-specific device-class enum in the fetched official entity docs.

`sensor`:
```
ABSOLUTE_HUMIDITY, APPARENT_POWER, AQI, AREA, ATMOSPHERIC_PRESSURE, BATTERY,
BLOOD_GLUCOSE_CONCENTRATION, CO2, CO, CONDUCTIVITY, CURRENT, DATA_RATE, DATA_SIZE, DATE, DISTANCE,
DURATION, ENERGY, ENERGY_DISTANCE, ENERGY_STORAGE, ENUM, FREQUENCY, GAS, HUMIDITY, ILLUMINANCE,
IRRADIANCE, MOISTURE, MONETARY, NITROGEN_DIOXIDE, NITROGEN_MONOXIDE, NITROUS_OXIDE, OZONE, PH, PM1,
PM25, PM4, PM10, POWER, POWER_FACTOR, PRECIPITATION, PRECIPITATION_INTENSITY, PRESSURE, RADON,
REACTIVE_ENERGY, REACTIVE_POWER, SIGNAL_STRENGTH, SOUND_PRESSURE, SPEED, SULPHUR_DIOXIDE,
TEMPERATURE, TEMPERATURE_DELTA, TIMESTAMP, UPTIME, VOLATILE_ORGANIC_COMPOUNDS,
VOLATILE_ORGANIC_COMPOUNDS_PARTS, VOLTAGE, VOLUME, VOLUME_FLOW_RATE, VOLUME_STORAGE, WATER, WEIGHT,
WIND_DIRECTION, WIND_SPEED
```
`number` uses the numerically applicable subset; non-numeric classes (`DATE`, `ENUM`, `TIMESTAMP`, …)
do not apply.

### S2.2 — MQTT discovery (the proven "semantic metadata → UI + automation" contract)

Topic: `<discovery_prefix>/<component>/[<node_id>/]<object_id>/config`, default prefix
`homeassistant`. `node_id` is optional and **not part of entity identity**; `object_id` is required;
both allow `[a-zA-Z0-9_-]`. A **retained empty payload deletes** the entity; a retained replacement
payload updates it.

| Key | Type | Requiredness / meaning |
|---|---|---|
| `unique_id` | string | stable entity identity; strongly recommended, **required** in some device-discovery cases |
| `name` | string/null | display name |
| `device` / `dev` | object | the device the entity belongs to |
| `origin` / `o` | object | what produced the payload |
| `state_topic` | string | usually required for read-only entities |
| `command_topic` | string | usually required for writable entities |
| `value_template` | template | extract the value from the state payload |
| `device_class` · `state_class` · `unit_of_measurement` | enum/string | semantics |
| `availability_topic` · `availability` · `availability_mode` (`all`/`any`/`latest`) · `payload_available` (`online`) · `payload_not_available` (`offline`) | | availability model |
| `qos` · `retain` · `optimistic` | | transport behaviour |
| `json_attributes_topic` · `json_attributes_template` | | extra attributes |
| `enabled_by_default` · `entity_category` · `icon` · `entity_picture` · `default_entity_id` · `message_expiry_interval` · `~` (topic base abbreviation) | | registry/display/topic |

Requiredness is **per component**, not uniform: `MQTT_RO_SCHEMA` requires `state_topic`,
`MQTT_RW_SCHEMA` requires `command_topic`.

`device` block fields:
```
identifiers: list[string]          connections: list[[connection_type, identifier]]
manufacturer  model  model_id  name  hw_version  sw_version  serial_number
via_device  suggested_area  configuration_url
```
Core schema requires at least `identifiers` **or** `connections`. 🔴 **Doc/code granularity conflict:**
the prose docs say device discovery also requires `name`, but in the fetched common core schema
`name` is optional.

Device-discovery payload root may carry `device`, `origin`, `components`, `state_topic`,
`command_topic`, `availability*`, `qos`, `encoding`, `message_expiry_interval`. `components` maps an
entity key to a component object; each carries `platform`, and non-empty entity components require
`unique_id`.

---

## S3 — Particle verification lifecycle

Sources: docs.particle.io firmware-libraries page, Cloud API reference,
`docs.particle.io/assets/files/librarySearch.json`, `docs.particle.io/sitemap.xml`.

### S3.1 — What "verified" means

Particle's own team reviews a community library. Criteria:
1. **Well documented** — inline usage comments, an example for each included function.
2. **Quality reviewed** — compiles on all relevant hardware and behaves as intended.
3. **`verification.txt`** — contains **test instructions anyone can independently run**.

🔴 `verification.txt` is therefore **not a flag — it is a re-runnable verification procedure**, and the
verifying authority is the vendor's own team.

### S3.2 — `library.properties`

`name` (unique) · `version` (SemVer) · `author` · `license` · `sentence` · `paragraph` · `url` ·
`repository` · `architectures` (comma-separated; absent or `*` = all) ·
`dependencies.<library-name>` (per-dependency version) · `whitelist`.
Public API library attributes include `architectures`, `official`, `verified`, `visibility`, `repository`.

### S3.3 — 🔴 Fresh coverage measurement (2026-08-27 JST)

```
curl -L -sS https://docs.particle.io/assets/files/librarySearch.json |
jq '[.invertedIndex[] | select(.[0]=="verifi") | .[1].verification | keys[]] | {count:length, refs:.}'
→ verified community entries = 10 libraries
   CellularHelper, OneWire, PL_microEPD, Serial_LCD_SparkFun, ThingSpeak,
   Ubidots, blynk, google-maps-device-locator, neopixel, photon-thermistor

curl -L -sS https://docs.particle.io/sitemap.xml |
rg -o 'https://docs\.particle\.io/reference/device-os/libraries/[^<]+' | rg -v '/search/$' | wc -l
→ public library documentation entries = 977
```

A second cross-check found 15 entries with a non-empty `verification` field: **10 community verified
+ 5 official**.

**Result: 10 / 977 = 1.02 %.** Against the project's prior `10/972 = 1.03 %` (baton 47): the
**numerator 10 is confirmed**; the denominator moved 972 → 977 (**+5**); coverage updates 1.03 % → 1.02 %.

**Stated limitation:** 977 is a **proxy** — the count of public docs index / library pages, not a direct
registry count from the Particle API. `GET /v1/libraries` requires an access token; an unauthenticated
GET returned HTTP 400 `access token not found`, and the lane stopped there rather than obtain
credentials (packet prohibition). Docs-generation lag could shift the denominator from the API reality.

---

## S4 — Viam registry / module model

Sources: docs.viam.com module overview / module-anatomy / deploy-a-module / manage-modules.

| Entity | Fields / relations |
|---|---|
| Module | `module_id = namespace:name`, visibility, URL, description, models, entrypoint, build |
| Model | triple `namespace:family:model`; by registry convention family is usually the module name |
| API / resource subtype | `api`, e.g. `rdk:service:generic` |
| Version | semantic version |
| Package | an artifact **per version × target platform/architecture** |
| Resource instance | in the machine config: `name`, `api`, `model`, `attributes`, dependencies |
| Local module | launched from a path/entrypoint on the machine |
| Registry module | fetched from the cloud registry, matching version and platform |

`meta.json`:
```
module_id: string                    # namespace:name
visibility: private | public | public_unlisted
url, description
models: [ { api: string,            # e.g. rdk:service:generic
            model: string } ]       # namespace:family:model
entrypoint: string
build: { setup, build, path, arch: [string] }   # e.g. linux/amd64, linux/arm64
```

Lifecycle: module process starts as a child process → registers resource API/model over gRPC →
instance `attributes` and dependencies validated → resource created → reconfigure on machine-config
change → resources shut down when the module stops.

Uploads carry a semantic version and target platform. **`latest` auto-updates on new releases; an
exact version pins.** Confirmed primary targets `linux/amd64`, `linux/arm64`, `darwin/arm64`; further
manual/limited targets `linux/arm32v6`, `linux/arm32v7`, `windows/amd64`, `darwin/amd64`. Uploads can
be further constrained (e.g. OS distribution tags).

---

## S5 — Arduino: AI Assistant + the indexes

### S5.1 — What the Cloud AI Assistant consumes (official support API)

Confirmed inputs: **user prompt · the current Arduino sketch code · RAG-retrieved Arduino-maintained
articles · docs.arduino.cc tutorials · Arduino-developed library examples.** The official description
is: prompt + current sketch go to the backend, related material is retrieved from an
Arduino-maintained knowledge base, and passed to the model as context.

**`NOT OBTAINED` from primary sources:** whether the selected board/FQBN is explicitly passed · whether
anything beyond the sketch (whole project, multiple files, secrets, build profiles) is passed ·
whether third-party vendor docs or the whole library index are RAG targets · **whether compile
errors/diagnostics are automatically fed back to the assistant.**

🔴 This directly narrows baton 45: the *closest competitor's* compile-error feedback loop is **not
established by its own public documentation**.

### S5.2 — `package_index.json` (arduino-cli spec)

```
packages: Package[]
Package: name, maintainer, websiteURL, email, platforms: Platform[], tools: Tool[]
Platform release: name, architecture, version, deprecated?, category, help.online,
                  url, archiveFileName, checksum, size, boards: [{name}],
                  toolsDependencies:     [{packager, name, version}],
                  discoveryDependencies: [{packager, name}],
                  monitorDependencies:   [{packager, name}],
                  libraryDependencies:   [{name, version}]
Tool: name, version, systems: [{size, checksum, host, archiveFileName, url}]
```
Tool identity is `packager/name/version`. The actual board technical definitions are **not** in the
index's `boards[].name` — they live in `boards.txt` inside the platform archive.

🔴 **Reproducibility hole named by the lane:** `toolsDependencies` carries an exact version, but
`discoveryDependencies` / `monitorDependencies` carry **no version** and select the latest installed.

### S5.3 — `library_index.json`

```
name, version (semver), author, maintainer, sentence, paragraph, website, category,
architectures: string[], types: string[], url, archiveFileName, size, checksum,
dependencies: [ { name: string, version?: semver constraint } ],
license, providesIncludes: string[]
```
One release record per version of the same library. `architectures` constrains compile targets;
dependency `version` expresses a constraint; artifacts carry URL, size and checksum.

---

## S6 — PlatformIO

### S6.1 — `library.json`

Required: `name`, `version`, `description`, `keywords`. Optional: `homepage`,
`repository {type: git|hg|svn, url, branch?}`, `authors`, `license`, `frameworks`, `platforms`,
`headers`, `examples [{name, base, files[]}]`, `dependencies`, `export {include, exclude}`, `scripts`,
`build`.

Dependency object: `owner?`, `name`, `version?`, `frameworks?`, `platforms?`. `version` accepts a
registry semantic constraint, a git URL + tag/commit, or an archive URL.
`build`: `flags`, `unflags`, `includeDir`, `srcDir`, `srcFilter`, `extraScript`, `libArchive`,
`libLDFMode`, `libCompatMode`, `builder`.

### S6.2 — Board manifest and composition

```
name, vendor, url, frameworks: string[], platforms: string[],
build: { mcu, f_cpu, extra_flags, hwids },
upload: { maximum_ram_size, maximum_size, ... }
```

Composition: `platformio.ini` environment → platform package → board manifest → selected framework →
build/upload toolchain → `lib_deps`. Platform pins accept an exact version, a SemVer constraint, or a
git commit; the official docs themselves state that an unversioned latest is not repeatable and
recommend pinning.

### S6.3 — 🔴 Lock mechanism: **NONE**

No project lockfile fixing dependency-resolution results exists in the fetched official documentation
or core source. `platformio/package/lockfile.py`'s `LockFile` is a `.lock` **mutex for concurrent
package operations**, deleted on release — not an npm-style reproducibility artifact.

Reproducibility therefore depends on explicitly pinning platform / library / git commit in
`platformio.ini`. **Transitive dependencies expressed as a range or latest are not pinned.**

---

## S7 — Embedder

Sources: docs.embedder.com add-peripheral / schematics / registers; embedder.com `llms.txt` and
`llms-transcript.txt`.

Peripheral catalog search attributes: `part name`, `manufacturer`, `category`, `subcategory`,
`interface`, `indexed documentation`. A custom peripheral uploads ≥1 PDF and registers each row as a
peripheral; a PDF with no part name is indexed as project documentation and does **not** become a
peripheral entity.

Schematic parser structured entities: `components`, `pins`, `nets`, `buses`, `interfaces`,
`power_domains`, `functional_blocks`; reference identity `@sch:<kind>:<id>`. Schematic version
metadata: source hash, file list, detected MCU, component count, net count, current git branch,
current git commit, parser, created time.

SVD-derived register knowledge: peripheral base address, register address, register width, access
mode, description, bit ranges, reset value, enumerated values.
Access enum: `read-only`, `write-only`, `read-write`, `writeOnce`, `read-writeOnce`.

**Confirmed:** PDF datasheets are indexed and associated with a part/custom peripheral · schematic
files are structured into a graph · SVD supplies register/bitfield structure.
🔴 **`NOT OBTAINED`:** any pipeline that automatically normalises an arbitrary PDF's datasheet /
register table into a **published typed schema**. Using a datasheet as *search context* is
documented; **generating a canonical register-map entity from a PDF is not established by primary sources.**

---

## Q-A — 🔴 Canonical knowledge vs project-instance configuration

| System | Global / canonical side | Project-instance side | Boundary or conflation |
|---|---|---|---|
| **ESPHome** | component schema, protocol runtime, entity semantics | slave address, register address, scale, unit, UART, entity — **in the same YAML** | 🔴 **heavily conflated** for generic Modbus |
| **Home Assistant** | entity domain / device-class / state-class schema | MQTT topics, `unique_id`, device identifiers, templates, command/state payloads | identity separated via the `device` block vs entity block; **but it models no register/datasheet knowledge at all** |
| **Particle** | registry library release, `library.properties` architectures/dependencies, verified status | project `dependencies.<name>=<version>`, local library copies | cleanly separated |
| **Viam** | registry module, API, model triple, version, platform artifact | machine-config resource `name`, `model`, `attributes`, module version | cleanly separated; `attributes` **is** the instance data |
| **Arduino** | package/library index, board core, tool/library release, checksum | sketch, FQBN/board selection, installed version | separated; AI query joins sketch + canonical docs dynamically |
| **PlatformIO** | platform / framework / library / board manifests | `platformio.ini` environment, board, framework, `lib_deps` | cleanly separated |
| **Embedder** | catalog peripherals, indexed docs, SVD knowledge | project-attached peripherals, custom PDFs, schematic graph/version | separated; a custom peripheral is a project-side canonical candidate |

> The strongest conflation confirmed is **ESPHome generic Modbus**: "0x2103 is output frequency"
> (model-wide knowledge) and "this project's slave address is 3" (instance) sit in the same YAML tree.

---

## Q-B — Reproducibility six months later

| System | Reproducibility artifact | Verdict |
|---|---|---|
| ESPHome | exact framework/platform version in YAML; external-component commit SHA | dedicated lockfile **NONE**; branch/default refs drift |
| Home Assistant MQTT | retained discovery payload on the broker | config can be resent, but it is not a dependency/schema lock — **NONE** |
| Particle | exact dependency versions in `project.properties`; in-project `lib/` copies | dedicated lockfile **NONE** |
| Viam | machine-config exact module version + registry version/platform artifact | exact pinning possible; separate lockfile **NONE** |
| Arduino | index version, archive URL, size, checksum, exact tool version | the index itself updates; standard project lock **NONE** |
| PlatformIO | exact package / git-commit pins in `platformio.ini` | dependency-resolution lock **NONE** |
| Embedder | schematic version source hash, file list, git branch/commit, parser metadata | schematic snapshot evidence exists; peripheral-KB / dependency lock **NONE** |

🔴 **Not one of the seven systems has a dependency-resolution lockfile.** Reproducibility everywhere
rests on manual exact pinning, and transitive dependencies escape it.

---

## Competing hypotheses the lane could not separate (recorded, not resolved)

- **ESPHome doc drift** — H1: current web docs lag `dev` deprecations. H2: `dev` is a future release
  and stable docs remain valid. No release baseline was specified → **not separable here**.
- **Particle 972 → 977** — H1: five libraries genuinely added. H2: docs index generation/filtering
  changed and the real registry count is unchanged. No historical index artifact → **not separable**.
- **RP2040 in ESPHome** — H1: the target moved/was renamed/removed after 2025.12.5. H2: only the
  source/package publication path changed. 404 + absence from the component list observed; reason
  **NOT OBTAINED**.
- **Arduino compile feedback** — H1: the Cloud Editor internally passes compiler errors to the
  assistant and the public docs omit it. H2: only prompt + current sketch are passed and there is no
  compiler feedback loop. **NOT OBTAINED**.
- **Embedder PDF extraction** — H1: a private pipeline extracts datasheets into typed entities.
  H2: PDFs are search-index only and typed register data comes from SVD/EDA parsers. Public material
  states only H2's elements → **NOT OBTAINED**.

## Scope and limits declared by the lane

`static` (official docs / schemas / repository sources fetched over HTTP, field names read) ·
`API-smoke` (ESPHome reachability, Arduino official support JSON, Particle public search index and
sitemap) · Particle credential-required API stopped at an unauthenticated 400, no account or token
obtained · `synthetic`, `visual`, `real-fire` **not run** (no MCU compile, no HA broker, no Viam
machine, no Arduino Cloud compile, no PlatformIO build) · **no `MODEL_KNOWLEDGE_UNVERIFIED` adopted —
everything unobtainable is `NOT OBTAINED`** · no local repository read · no file written.

`CONFLICT_SURFACE`: ESPHome current web docs vs `dev` schema on `skip_updates` effectiveness and
`custom_command` → `custom_pdu`; Home Assistant MQTT device-`name` requiredness differs between prose
docs and the common core schema; RP2040 current platform state `NOT OBTAINED`.
`HUMAN_DECISION_REQUIRED: NO` — the conflicts require a release-baseline choice during design, and no
decision was authorised in this lane.
