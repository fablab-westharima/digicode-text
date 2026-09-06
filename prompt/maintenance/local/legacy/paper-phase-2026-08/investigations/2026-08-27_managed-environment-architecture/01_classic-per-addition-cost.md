# 01 — Classic per-addition cost, measured from donor source (Lane L1)

**Packet:** `S010-L1-classic-cost` · LANE: INVESTIGATION · Route A / `AUTHORITY_MODE: DELEGATED`
**Executor:** six-lane delegate (Codex), read-only sandbox, baseline effort
**VERDICT: PASS / REASON: NONE** · CHANGED_FILES: NONE
**Donor HEADs verified 3/3 against the pins** — `DigiCode bb35c3b8025610299bf952c2c45eda2196a07401` ·
`digicode-compile-api 3376746f1e5a4ca039e0cade279741f16612fccf` ·
`DigiCode-Helper fa95dfd67ee83d881f93be7641cc9cef171165a2`; `git status --short` entries = 0 in all three.
No `prompt/` directory was read in any donor repo.

> This file is **immutable measured evidence**. It is never edited to agree with a later conclusion.
> Line references are donor paths at the pinned SHA.

---

## Executive result

Three real additions — **HX711** (simple sensor), **Modbus RTU** (protocol), **Relay** (actuator) —
identified by their initial commits (`a96d204`, `eb56771`, `13b7318`, found with
`git log --diff-filter=A` on each block module). Their initial commits touched **32 file instances
and added 642 lines**.

| Artifact class | Added lines | File touches | Interpretation |
|---|---:|---:|---|
| Block definition + parameter UI + generator / C++ synthesis | 410 | 3 | Dominant implementation work; co-located in one TypeScript module per addition |
| Generated AI catalog | 134 | 1 | HX711 only in its initial commit; generated / derivable |
| Toolbox | 53 | 3 | One shared global file, edited in 5–6 distinct positions per addition |
| Regression allocation / dependency cases | 27 | 7 | Mostly mechanical probability maintenance, plus dependency relationships |
| Initial i18n category keys | 15 | 15 | One key × five locales × three additions |
| Global block registry | 3 | 3 | One import per new module |
| **Total** | **642** | **32** | from `git show --numstat` on the three commits |

**This is the initial-commit total only.** Later batched sample / semantic-i18n / generated-catalog /
compile-dependency work is not per-device separable and is reported as `NOT OBTAINED` where that is so.

---

## Q1 — Per-device addition surface

### Origin identification (method stated per number)

```
git -C DigiCode log --diff-filter=A --format='%h %H %s' -- <block module>
a96d204  feat(hx711): ... HX711 ... 6 blocks
eb56771  feat(modbus): ... Modbus RTU master 4 blocks
13b7318  feat(relay): ... Relay 4 blocks
```

`git show --format= --numstat <sha>`:

```
HX711 a96d204: 12 files changed, 309 insertions(+), 6 deletions(-)
134  1  public/ai/block-catalog.json
3    3  scripts/probabilistic-debug/generate-cases.test.ts
2    2  scripts/probabilistic-debug/generate-cases.ts
6    0  scripts/probabilistic-debug/lib/strategies/combo.ts
139  0  src/blocks/arduino/sensor/hx711Blocks.ts
1    0  src/components/editor/BlocklyEditor.tsx
19   0  src/components/editor/toolboxGenerator.ts
1    0  each of en.json, es.json, ja.json, pt-PT.json, zh-TW.json

Modbus eb56771: 10 files changed, 172 insertions(+), 8 deletions(-)
3    3  scripts/probabilistic-debug/generate-cases.test.ts
5    5  scripts/probabilistic-debug/generate-cases.ts
138  0  src/blocks/arduino/communication/modbusBlocks.ts
1    0  src/components/editor/BlocklyEditor.tsx
20   0  src/components/editor/toolboxGenerator.ts
1    0  each of the five locale files

Relay 13b7318: 10 files changed, 161 insertions(+), 8 deletions(-)
3    3  scripts/probabilistic-debug/generate-cases.test.ts
5    5  scripts/probabilistic-debug/generate-cases.ts
133  0  src/blocks/arduino/actuator/relayBlocks.ts
1    0  src/components/editor/BlocklyEditor.tsx
14   0  src/components/editor/toolboxGenerator.ts
1    0  each of the five locale files
```

In all three the block module is a **new file**; every other initial-commit file is an edit to a
**shared global** file.

### 1A — HX711 (simple sensor)

Created: `src/blocks/arduino/sensor/hx711Blocks.ts`.
Edited (11): `public/ai/block-catalog.json` · `scripts/probabilistic-debug/generate-cases.test.ts` ·
`scripts/probabilistic-debug/generate-cases.ts` ·
`scripts/probabilistic-debug/lib/strategies/combo.ts` · `src/components/editor/BlocklyEditor.tsx` ·
`src/components/editor/toolboxGenerator.ts` · the five locale JSON files.

Six blocks, definition and generator **co-located** (`hx711Blocks.ts` def/gen pairs at 35/52, 64/74,
79/89, 94/108, 114/125, 130/144). Configurable: DOUT + SCK pins (`:39`), known calibration weight
(`:98`), scale factor (`:134`). The same file emits the C++ — **there is no separate synthesis
template file.**

Later completion artifacts:
- Library dependency `robtillaart/HX711@^0.6.3` in the **global** dependency array
  (`digicode-compile-api/src/compile.ts:203`), entered via compile-api commit `5dc5e58`, which added
  six libraries in one 8-line batch → per-HX711 line count **NOT OBTAINED** (batch not device-only).
- Sample + AI material entered with batch commit `b47cfa2` touching six global files
  (`block-catalog.json`, `aiSystemPrompts.ts`, `sampleProjects.ts`, `sampleProjectsI18n.ts`,
  `catalogInvariants.test.ts`, `fewShotSelector.ts`), **381 insertions / 7 deletions across 12
  samples** → per-HX711 **NOT OBTAINED**.
- Present sample: `sampleProjects.ts:1191` + four non-Japanese overrides. Selector entry:
  `fewShotSelector.ts:89`. Generated catalog: six block records (matches six definitions).
- i18n: 1 category key/locale initially; later commit `5d1c54d` added 16 semantic block-message keys
  per locale → present **17 keys/locale × 5 locales = 85 locale records**.

Negative surfaces: **no** board-specific branch, **no** auto-Web-UI registration, **no** per-device
compile-matrix entry, **no** dedicated block unit test (regression is via the shared probabilistic
generator).

### 1B — Modbus RTU (protocol)

Created: `src/blocks/arduino/communication/modbusBlocks.ts`. Edited (9): the probabilistic-debug
pair, `BlocklyEditor.tsx`, `toolboxGenerator.ts`, five locale files.

Four blocks. Init params RX / TX / DE-RE / baud (`:40`), init generator `:63–81`, slave-ID block
`:84–103`, read holding register `:105–123`, write single register `:125–147`.

**🔴 The read generator is hard-wired to Modbus function `0x03`, one 16-bit register at a time,
returning an integer or `-1`; the write generator is function `0x06`. There is no parameter for
function code, register width, signedness, endianness, word order, scale, or semantic unit.**

Later: global dependency `4-20ma/ModbusMaster@^2.0.1` (`compile.ts:211`), commit `f553c7e` added 14
entries in one 16-line batch → per-Modbus **NOT OBTAINED**. Catalog entry arrived only in a later
bulk regeneration `bf70375` (4,608/2,753 lines) → per-Modbus **NOT OBTAINED**. Sample/AI batch
`9c8744f`, 190/5 lines across six samples → per-Modbus **NOT OBTAINED**. Present sample
`sampleProjects.ts:1162` + four locale overrides; `fewShotSelector.ts:137`;
`catalogInvariants.test.ts:610`. i18n: 1 + 14 = **15 keys/locale × 5 = 75 records**.

Negative surfaces: same four zeroes as HX711.

### 1C — Relay (actuator)

Created: `src/blocks/arduino/actuator/relayBlocks.ts`. Edited (9): as Modbus.

Four blocks: shared pin/active-level helper `:31–56`, init `:58–82`, on `:84–101`, off `:103–120`,
toggle `:122–138`. The parameter UI exposes GPIO **and active-high/active-low**, and the generator
must preserve that electrical-semantic inversion — **this is not a declarative name/pin record.**
No library dependency declared (`relayBlocks.ts:18`).

Later: shares batch `b47cfa2` with HX711 → per-Relay **NOT OBTAINED**. Present sample
`sampleProjects.ts:1231` + four locale overrides; `fewShotSelector.ts:94`;
`catalogInvariants.test.ts:651`. i18n: 1 + 10 = **11 keys/locale × 5 = 55 records**. Catalog holds
four Relay block records.

### Cross-addition negative searches (commands + results)

```
rg -l '(hx711_init|modbus_init|relay_init)' .../src/blocks/__tests__ | wc -l   → 0
rg -n '(hx711|modbus|relay)' boardStore.ts blockBoardGuards.ts boards.ts | wc -l → 0
rg -n '(hx711|modbus|relay)' editor/Controller editor/BleController | wc -l    → 0
rg -n '(hx711|modbus|relay)' boards.ts board-fqbn.ts | wc -l                   → 0
```

---

## Q2 — Where the cost concentrates

Ranked by measured initial-commit line volume:

1. **Block implementation — 410/642 = 63.9%.** Definition, parameter UI, generator, imports, object
   lifetime, validation and emitted C++ in three files. **Judgment-bearing**: API choice, state
   lifetime, electrical behaviour, failure behaviour, type behaviour, exact generated code.
2. **Generated AI catalog — 134/642 = 20.9%.** Mechanical: `scripts/generate-ai-block-catalog.ts:684`
   loads toolbox + board + block sources, `:699–753` forms records, `:788–798` writes JSON. Modbus
   and Relay reaching it only via bulk regeneration **confirms it is a derived artifact.**
3. **Toolbox — 53/642 = 8.3%.** One global file but **5 / 5 / 6 distinct placements** per addition
   (`toolboxGenerator.ts:1238`, `:1254`, `:1376`). Insertion is mechanical; category/mode exposure
   and default shadows carry limited design content.
4. **Regression-generator bookkeeping — 27/642 = 4.2%**, 7 file touches. Mostly redistributing a
   fixed probability budget. HX711 additionally records its init/dependency relationship in the combo
   strategy — that part **is** real behavioural knowledge.
5. **Initial i18n category replication — 15/642 = 2.3%**, 15 file touches for **3 logical keys**.
   Replication mechanical, translation semantic. Present totals for these three: 85 + 75 + 55 =
   **215 locale records**.
6. **Global registry — 3/642 = 0.5%.** One static import each (`BlocklyEditor.tsx:21`). Mechanical.
7. **Compile dependency declaration** — small line count, but library selection/version is judgment,
   and the architecture forces it into **one global dependency universe** rather than a per-device manifest.

| Artifact | Classification |
|---|---|
| Registry import | Mechanical |
| AI catalog JSON | Derivable (generated) |
| Toolbox duplication | Mostly mechanical |
| Locale replication | Mechanical structure, semantic translation |
| Regression probability rebalance | Mostly mechanical |
| Sample locale duplication | Mostly mechanical once the sample exists |
| **Library dependency** | **Judgment-bearing** |
| **Block parameter shape** | **Judgment-bearing** |
| **Generator / C++ synthesis** | **Judgment-bearing** |
| **Sample content + AI few-shot association** | **Judgment-bearing** |
| **Board-specific guard (when present)** | **Judgment-bearing** |

---

## Q3 — Coupling map (measured global denominators)

```
block registry imports=72          toolbox category templates=90    toolbox mode lists=10
catalog blocks=580                 catalog unique categories=79     catalog boards=16
catalog boardFilters=5             frontend board records=16        compile FQBN mappings=10
COMMON dependencies=40             ESP32 dependencies=8             direct build dependencies=9
TOTAL dependency entries=57        sample projects=69               tutorial records=8
cross-block contracts=10           built-in pin presets=1           PinPreset numeric pin fields=56
locale leaf keys: en=4124 es=4124 ja=4126 pt-PT=4124 zh-TW=4124
```

| Coupled global surface | Current denominator | Why one addition edits it |
|---|---:|---|
| `BlocklyEditor.tsx:21` | 72 block-module imports | modules register by import side effect |
| `toolboxGenerator.ts:1238` | 90 category templates / 10 mode lists | static arrays |
| `public/ai/block-catalog.json` | 580 blocks / 79 categories | AI reads one global generated catalog |
| five locale JSON files | 5/5 locales | every category and message repeated |
| `compile-api/src/compile.ts:138` | **57 dependency entries** | compilation starts from a global dependency universe |
| `sampleProjects.ts:6` | 69 samples | one shared array |
| `sampleProjectsI18n.ts:217` | 4 override sections | per-locale repetition |
| `fewShotSelector.ts:89` | global selector rules | AI example selection centrally keyed |
| `crossBlockContracts.ts:93` | 10 protocol contracts | new register/handler protocols add a shared record |

**🔴 Dependency universe:** `compile.ts:222` explicitly warns that **each dependency is compiled for
every ESP32 build** and that placeholder dependencies polluted **16/20 board builds**. `buildLibDeps`
(`:252–293`) returns the combined global arrays.

**There is no explicit board × library matrix file.** Frontend exposes 16 board records; the debug
harness mirrors 16 board IDs (`board-fqbn.ts:11`); the backend collapses to 10 FQBN mappings
(`boards.ts:63`); every backend compile receives the same 57-entry universe. The coupling is
**global fan-out (10 × 57 = 570 pairs derived at runtime)**, not stored matrix rows.

---

## Q4 — 🔴 What is ALREADY data-driven in Classic

This is the most load-bearing section for the new architecture: it is what Classic already proved works as data.

| Asset | Schema (fields) | Records | Consumer |
|---|---|---:|---|
| **Board definitions (frontend)** `boardStore.ts:50` | `id · name · fqbn · description · category · supports{5 capability flags} · supportedFlashMethods · experimental` | **16** (`:100`) | editor / board selector |
| **Board definitions (backend)** `boards.ts:54` | map → `{ fqbn, platform }` | **10** (`:63–108`) | compiler target validation/resolution |
| **Generated AI block catalog** `generate-ai-block-catalog.ts:28` | field: `name/type/options/default`; value input: `name/check/shadow`; statement input: `name`; block: `type · category · message · fields · valueInputs · statements · output/previous/next · tooltip/help · board restrictions`; root: `version · generatedAt · blocks · boardFilters · boards` | **580 blocks / 79 categories / 5 boardFilters / 16 boards** | `systemPrompt.ts:88` fetches `/ai/block-catalog.json`, formats at `:137–183`, groups at `:203–216` |
| **Auto Web UI (Wi-Fi) registration + schema** `inferWifiUiSchema.ts:59`, `Controller/types.ts:75` | see Q6 | per project | generic renderer + WebSocket transport |
| **Auto Web UI (BLE)** `BleController/types.ts:16` | advertised name · optional service UUID · widgets · warnings; wire values ASCII (`:10–13`) | per project | generic renderer + BLE transport |
| **Pin presets** `pinPresetStore.ts:61` | `id · name · isPremium · isCustom · servoConfig · pins{56 named numeric pin roles}` | **1 built-in** + user-created persisted | UI + block defaults |
| **Board guards** `blockBoardGuards.ts:51` | block→board compatibility metadata; consumer `:64–78` | **1** (Hall sensor) | block/board compatibility check |
| **Cross-block protocol contracts** `crossBlockContracts.ts:33` | `id · registering block type · required handler block types · allHandlersRequired? · correlating ID field · optional field/value condition · protocol label` | **10** (`:93`) | validators, repair prompts, tests. Source comment states new protocols are added to this one registry |
| **Samples / tutorials** `sampleProjects.ts:6` | `id · title · description · category · language · blocklyXml` | **69** samples / **8** tutorials | sample browser, AI few-shot |
| **Helper discovery** `DigiCode-Helper types.rs:13` | name · host · addresses · port · TXT · lastSeen · online; mDNS `_digicode._tcp` (`mdns_service.rs:21`) | runtime | device-agnostic discovery, **not** a device knowledge catalog |

Two caveats that matter for design: **frontend and backend board records are duplicated rather than
sharing one schema**, and the AI catalog is **generated from Blockly implementation** — it is
metadata, but not an independent device-knowledge source.

---

## Q5 — The industrial-IoT layer as actually implemented

Sizes (`Blockly.Blocks[...]` registrations counted):

```
arduinoHABlocks.ts  2798 lines, 47 blocks     mqttBlocks.ts    814 lines, 21
bleBlocks.ts         959 lines, 21 assign.    azureIotBlocks.ts 691 lines,  9
webSocketBlocks.ts   666 lines, 12            httpBlocks.ts    426 lines,  9
canBlocks.ts         166 lines,  5            modbusBlocks.ts  150 lines,  4
wifiBlocks.ts         92 lines,  1
```

| Protocol | Configurable | Hard-coded / absent | Device-specific? |
|---|---|---|---|
| **MQTT** `mqttBlocks.ts:28` | SSID/pw · broker/port/clientId · optional user/pw · topic/message/retain · subscriptions/callbacks · buffer size · keepalive · last-will · QoS | Wi-Fi retry 30 × 500 ms (`:91–96`); QoS effectively 0/1 only (QoS 1 via `beginPublish`); **no payload schema, no topic semantic model** | agnostic |
| **Azure IoT** `azureIotBlocks.ts:30` | connection string · telemetry payload · C2D handler · IoT Central scope/device/key · key-value properties · method handler · twin key/value | MQTT TLS port 8883 · SAS lifetime 1 h · DPS endpoint/API-version strings | service-specific, not device-specific |
| **Home Assistant** `arduinoHABlocks.ts:578` | init + auth · multiple entity types/commands · entity id/name · **sensor device class + unit (`:868–938`)** · **number min/max/step/unit/mode (`:1558–1618`)** | — | 🔴 substantial **semantic entity layer** — but models HA entities, **not fieldbus registers or datasheets** |
| **HTTP** `httpBlocks.ts:27` | GET URL · one custom header · POST URL/body/content-type · JSON POST · PUT · DELETE | PUT hard-codes JSON content type; no request schema, response type model, TLS cert model or timeout policy | agnostic |
| **WebSocket** `webSocketBlocks.ts:53` | client host/port/path; server port/path + channel registration metadata; `{id,value}` dispatch; auto controller schema | — | generic channel semantics |
| **BLE** `bleBlocks.ts:142` | NUS setup · beacon · custom services/characteristics · read/write/notify · callbacks. Characteristic metadata `:768–805` = UUID · label · `dataType` · min/max · rwn flags | generator `:809–843` uses **only UUID + access flags** in firmware; source comments state label/dataType/min/max are **UI-only**; values are ASCII strings, not typed binary | generic |
| **Wi-Fi** `wifiBlocks.ts:44` | SSID/password only | retry hard-coded 30 × 500 ms | agnostic |
| **CAN** `canBlocks.ts:36` | RX/TX · 125/250/500/1000 kbit/s · arbitrary CAN id · ≤8 bytes as a string · send/receive | **no DBC/signal definitions, no extended-frame choice, no masks/filters, no typed byte layout, no scaling/units/signedness/byte order/signal semantics** | raw bus only |
| **Modbus** `modbusBlocks.ts:40` | UART pins · baud · slave id · register address · one 16-bit value | **function `0x03` read / `0x06` write hard-coded, one register per operation** | **no register-map or typed-value layer** |

### 🔴🔴 Load-bearing negative result — no register-map-level model exists in the donor

```
rg -i ... -n '(register[ _-]?map|registers[[:space:]]*:[[:space:]]*\[)' DigiCode digicode-compile-api DigiCode-Helper | wc -l
  → register-map exact first-party count = 0

rg -i ... -n '(endianness|endian|word[ _-]?order|byte[ _-]?order)' <frontend src> <compile-api src> <helper src> | wc -l
  → device/protocol endian candidates = 0

rg -i -n '(datatype|data_type|endian|word.?order|byte.?order|scal(e|ing)|unit|access|semantic|meaning)' modbusBlocks.ts | wc -l
  → modbus semantic metadata count = 0
```

Therefore, precisely:
- Classic **does** express generic `dataType`, access flags, labels and ranges for BLE / WebSocket **controller channels**.
- Home Assistant blocks **do** express units and entity device classes.
- HX711 has a calibration scale, implemented as **executable block/generator behaviour**, not data.
- **Classic contains no physical-device register map linking address / function code to width, type,
  byte-word order, scaling, unit, access mode or semantic meaning. No DBC-like CAN signal model exists.**

---

## Q6 — The auto Web UI contract (confirmed from source)

**Confirmed** (baton 50 stands): registration metadata → inferred schema → generic widget renderer +
WebSocket/BLE transport. **No C++ analysis.**

```
rg -i -n '(clang|tree.?sitter|parse.?cpp|analy[sz]e.?cpp|c\+\+.?analy)' Controller BleController | wc -l  → 0
rg -n '(getBlocksByType|getFieldValue|blocklyXml|DOMParser|querySelectorAll)' Controller BleController | wc -l → 16
```

Live workspace extraction uses `getBlocksByType` / `getFieldValue`; serialized projects are inferred
by parsing Blockly XML (`inferWifiUiSchema.ts:249`, `:301–355`).

### Registration record (`inferWifiUiSchema.ts:59`)

```ts
interface WsServerStartFields { port: number; path: string }
interface WsServerRegistration {
  channelId: string; label: string; dataType: string;
  min: number; max: number;
  canRead: boolean; canWrite: boolean; canNotify: boolean;
}
interface InferWifiUiSchemaOpts {
  projectName: string; serverStart?: WsServerStartFields;
  registrations: WsServerRegistration[];
}
```

The Blockly registration block exposes exactly these (`webSocketBlocks.ts:444`): `CHANNEL_ID` ·
`LABEL` · `DATA_TYPE ∈ {string, bool, uint8, uint16, int8, int16, float}` · `MIN` · `MAX` · `READ` ·
`WRITE` · `NOTIFY`. **Its generator returns only a comment** — the metadata drives inference/UI, it
does not change wire typing.

### Renderer schema (`Controller/types.ts:75`)

```ts
interface WifiWidgetBase {
  id: string; label: string; channelId: string;
  displayMode?: 'plain' | 'gauge' | 'graph' | 'led';
  layout?: 'grid' | 'columns-2' | 'columns-3' | 'rows';
  colorScheme?: { bg?: string; fg?: string; accent?: string };
  customCss?: string;
}
interface WifiToggleWidget  extends WifiWidgetBase { type: 'gatt-toggle' }
interface WifiSliderWidget  extends WifiWidgetBase { type: 'gatt-slider';
  dataType: 'uint8'|'uint16'|'int8'|'int16'|'float'; min: number; max: number }
interface WifiDisplayWidget extends WifiWidgetBase { type: 'gatt-display';
  dataType: 'uint8'|'uint16'|'int8'|'int16'|'float'|'string'; notifyEnabled: boolean }
interface WifiEndpoint { port: number; path: string; host?: string }
interface WifiDeviceSchema { deviceId: string; deviceLabel: string;
  endpoint: WifiEndpoint; widgets: WifiWidgetDefinition[] }
interface WifiControllerSchema { connection: 'wifi'; version: '1.0';
  devices: WifiDeviceSchema[]; warnings: string[]; customization?: WidgetCustomization }
```

Defaults: port 81, path `/` (`Controller/types.ts:168`).

### Widget inference rules (`inferWifiUiSchema.ts:113`)

empty/duplicate channelId → skipped with warning · unknown type → `string` · no r/w/n → skipped ·
writable bool → toggle · writable numeric → slider · readable/notifiable numeric or string → display ·
write-only string → display placeholder · read/notifiable bool → string display · min/max apply to numeric slider.

### Transport contract

Both directions use one envelope — `{"id":"<channelId>","value":"<ASCII string>"}`
(`public/wifi-controller-bundle/index.html:186` outbound, `:386` inbound dispatch by `msg.id`).
Toggle sends `"0"`/`"1"`; sliders send strings with a 100 ms throttle (`:252–273`).

Startup: browser `GET /schema.json` (`:395`) → renders `schema.devices[0].widgets` → connects
`ws://<page-hostname>:<endpoint.port>/` (`:369`). Firmware serves `/`, `/schema.json` and the
WebSocket dispatcher (`webSocketBlocks.ts:349`).

**Fidelity caveat recorded by the lane:** the schema carries `endpoint.path`, but the standalone
bundle constructs the WebSocket URL with `/` directly. Today the generated path is `/`, so they coincide.

BLE parallel (`BleController/types.ts:24`): `version · projectId? · projectName? · deviceName ·
customServiceUuid? · widgets · warnings`; widget variants NUS UART / GATT toggle (UUID) / GATT slider
(UUID + numeric dataType + min/max) / GATT display (UUID + type + notify). **Wire encoding explicitly
ASCII for all characteristics** (`:10–13`).

---

## Overall measured conclusion (lane's own words)

- **Proven data-driven assets**: boards, generated AI catalog, pin presets, board guards, protocol
  contracts, samples, both controller schemas.
- **Mechanical fan-out**: registry import, toolbox repetition, generated catalog, locale replication,
  sample localization, regression allocation maintenance.
- **Irreducible code/design in the measured examples**: parameter semantics, library/API choice,
  state/lifetime, emitted C++, error behaviour, electrical active-level behaviour, protocol operation shape.
- **The donor contains no register-map-level device knowledge model.**

`CONFLICT_SURFACE` reported: shared donor globals — `BlocklyEditor.tsx`, `toolboxGenerator.ts`, five
locale JSON files, `public/ai/block-catalog.json`, probabilistic-debug allocation files, sample/AI
files, `compile-api/src/compile.ts`. `HUMAN_DECISION_REQUIRED: NO`.
