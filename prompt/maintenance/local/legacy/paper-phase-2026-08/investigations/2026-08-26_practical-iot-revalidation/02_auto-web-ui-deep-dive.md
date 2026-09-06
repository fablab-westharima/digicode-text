# DigiCode 自動 Web UI 生成機能 deep dive

- [static] Packet: `S007-D1-auto-web-ui`
- [static] Lane: `INVESTIGATION`
- [static] 調査日: 2026-08-26
- [static] donor: `/Users/ohahiso/github_project/DigiCode`
- [static] 関連 repo: `/Users/ohahiso/github_project/digicode-compile-api`、`/Users/ohahiso/github_project/DigiCode-Helper`

## 0. 結論（観測結果、採否判断ではない）

- [static] 現行実装は、任意の C++／生成済みコードを解析して UI を発見する機能ではない。BLE では Blockly workspace XML 内の `ble_*` block と直下 `field`、Wi‑Fi では `websocket_server_start` / `websocket_server_register` block の field を読む。BLE parser は `DOMParser` と block type 分岐、Wi‑Fi parser は Blockly API または `DOMParser` と block type 分岐であり、C++ parser、AST、AI、runtime introspection は Layer 1 の推論に使われていない。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/inferUiSchema.ts:35-86,89-180,187-193`、`$D/variants/ota/frontend/src/components/editor/Controller/inferWifiUiSchema.ts:84-111,113-205,249-274,301-355`。
- [static] Layer 1 が自動生成できる機能 widget は実質 3 種、`gatt-toggle`、`gatt-slider`、`gatt-display` である。BLE だけは別枠として NUS UART chat を追加できる。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/types.ts:24-63`、`$D/variants/ota/frontend/src/components/editor/Controller/types.ts:75-106`。
- [inference] したがって、再利用可能な核は「任意コード解析器」ではなく、(a) 小さい controller schema、(b) `dataType × read/write/notify` の規則表、(c) BLE／WebSocket renderer と通信 client、(d) schema を ESP32 配信 HTML または standalone HTML に詰める packaging である。入力 adapter は Blockly 固有であり、text-code 製品では置換が必要である。根拠となる構造: `$D/variants/ota/frontend/src/components/editor/Controller/inferWifiUiSchema.ts:59-82,84-111`、`$D/variants/ota/frontend/src/components/editor/Controller/types.ts:42-161`、`$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:166-235`。
- [static] BLE UI は editor 内から Web Bluetooth で MCU に直接接続する。単機 Wi‑Fi UI はコンパイル時に firmware へ埋め込まれ、ESP32 が HTTP で HTML と schema を配信し、page が ESP32 の WebSocket に接続する。複数機 Wi‑Fi UI は `.digicode.json` 群から browser 内で standalone HTML Blob を作って download し、その file が各 ESP32 の WebSocket に直接接続する。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/webBluetoothClient.ts:117-210,224-310`、`$D/variants/ota/frontend/src/blocks/arduino/communication/webSocketBlocks.ts:349-382,404-430`、`$D/variants/ota/frontend/public/wifi-controller-bundle/index.html:369-418`、`$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:166-235`、`$D/variants/ota/frontend/public/unified-controller-bundle/index.html:475-559,704-753`。
- [static] AI customization コードは存在するが、現在の両 dialog では `SHOW_PHASE4_AI_CHAT = false` で非表示である。さらに AI diff は `displayMode/layout/colorScheme/customCss` に制限され、channel、widget type、label、min/max など機能 field を変更・追加できない。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/WifiControllerDialog.tsx:54-70,419-451`、`$D/variants/ota/frontend/src/components/editor/Controller/UnifiedControllerSection.tsx:59-74,647-676`、`$D/variants/ota/frontend/src/services/ai/jsonValidator.ts:29-37,62-92,95-136`、`$D/variants/ota/frontend/src/components/editor/Controller/controllerCustomizer.ts:39-81`。
- [static] `gauge` / `graph` / `led` は型・validator・AI prompt では許されるが、実際の単機／複数機 bundle の widget factory は 3 種しか分岐せず、customization renderer が解釈するのも color と schema-level layout だけである。現 snapshot では gauge/graph/led と `customCss` は実表示にならない。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/types.ts:48-69`、`$D/variants/ota/frontend/public/wifi-controller-bundle/index.html:294-345`、`$D/variants/ota/frontend/public/unified-controller-bundle/index.html:412-460`。

以降、`$D` は `/Users/ohahiso/github_project/DigiCode`、`$C` は `/Users/ohahiso/github_project/digicode-compile-api` を表す。

## 1. 調査境界、SHA、denominators

### 1.1 SHA と禁止領域

- [command+RC] `git -C /Users/ohahiso/github_project/DigiCode rev-parse HEAD` → RC=0、`bb35c3b8025610299bf952c2c45eda2196a07401`。期待 SHA と一致した。
- [static] donor の `prompt/`、`CLAUDE.md`、`AGENTS.md`、governance 文書は開いておらず、検索 glob から除外した。`node_modules/` と `.git/` も除外した。
- [static] donor は読み取りのみとし、ファイル変更コマンドは実行していない。

### 1.2 検索母集団と match 数

- [command+RC] `rg --files $D -g '!node_modules/**' -g '!prompt/**' -g '!CLAUDE.md' -g '!AGENTS.md' -g '!.git/**' | wc -l` → RC=0、検索可能母集団 `687 files`。
- [grep] 自動 UI／controller／dashboard を狙った focused pattern を上記 `687 files` に適用し、`54 matched files / 687 searched files`。これは候補絞り込みだけに使用し、結論には使用していない。
- [grep] `controller|dashboard|web.?ui|gauge|chart|slider|toggle` の broad pattern は `119 matched files / 687 searched files`。決済コード等の語彙衝突を多数含むため、match 数そのものは機能の証拠にしていない。
- [command+RC] 関連 compile repo は同じ除外条件で `603 searched files`、`compile/sse|setupCode|loopCode|connectionType|WebServer|controller_bundle` が `7 matched files`。うち call boundary の source 3 files を行番号付きで読んだ。
- [command+RC] Helper repo は同じ除外条件で `51 searched files`、focused feature pattern が `2 matched files`。両方とも JSON Schema 自己参照 (`src-tauri/tauri.conf.json:2`、`src-tauri/capabilities/default.json:2`) の語彙衝突で、auto UI の source trail は得られなかった。
- [static] 行番号付きで実内容を調べたのは `38 files`（DigiCode `33`、compile API `3`、Helper `2`）。DigiCode 33 files は toolbar/editor 3、BLE controller 11、Wi‑Fi/controller 8、block/generator 2、bundle 2、AI 6、compile client 1。これは `38 examined files / 1,341 searched files`（3 repo 合計）の分母である。

### 1.3 実行した主な command

- [command+RC] SHA、`rg --files`、候補 `rg -l/-n`、対象 source の `nl -ba ... | sed -n ...` はすべて最終採用 run で RC=0。
- [NOT OBTAINED] BLE shared page/download の absence search の最初の wrapper は、zsh で bash の `PIPESTATUS` を前提にしたため `zsh:test:1: unknown condition: -le`、RC=2 となった。この run の結果は破棄した。
- [command+RC] 同じ対象を `bash -c` で再実行し、`rg` の 0/1 を明示的に正常化した run は RC=0。match は future 記述の comment (`BleController/types.ts:7`、`BleController/BleControllerLayout.tsx:7`) と無関係な sample selector comment のみで、実装 symbol／route／builder は出なかった。この absence は単独結論にせず、現存 component call flow と併せて扱った。

## (1) どこにあり、何の mechanism か

### 1A. User entry point

- [static] Header toolbar の「UI 生成」dropdown が BLE と Wi‑Fi の toggle callback を呼ぶ。根拠: `$D/variants/ota/frontend/src/components/editor/LinearToolbar.tsx:210-240`。
- [static] `EditorPage` は callback を state toggle に結び、同じ live `workspaceXml` を BLE panel と Wi‑Fi dialog に渡す。根拠: `$D/variants/ota/frontend/src/pages/EditorPage.tsx:1318-1338,1403-1418`。
- [static] workspace 変更時、Blockly editor は workspace を XML に serialize すると同時に generator の `workspaceToCode` を呼び、`EditorPage` は XML と generated code を別 state に保存する。根拠: `$D/variants/ota/frontend/src/components/editor/BlocklyEditor.tsx:190-249`、`$D/variants/ota/frontend/src/pages/EditorPage.tsx:295-300`。

### 1B. BLE call/data flow

```text
[static] UI 生成 > BLE
  → EditorPage(workspaceXml)
  → BleControllerPanel.useMemo(inferUiSchema(workspaceXml))
  → BleControllerDialog
  → BleControllerLayout
  → WebBluetoothClient
  → navigator.bluetooth → MCU GATT/NUS
```

- [static] `BleControllerPanel` は `workspaceXml` が変わるたび `inferUiSchema` を呼び、schema を dialog と connection bar に渡す。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/BleControllerPanel.tsx:30-53,68-80`。
- [static] dialog 自体は受け取った schema を `BleControllerLayout` に渡すだけである。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/BleControllerDialog.tsx:18-39`。
- [static] parser は `DOMParser(..., 'text/xml')`、全 `<block>` の走査、`type.startsWith('ble_')` と 4 block type の分岐、直下 `<field>` の読み取りを行う。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/inferUiSchema.ts:35-86,182-193`。
- [static] 規則は `DATA_TYPE × READ/WRITE/NOTIFY` の `if` chain であり、bool write→toggle、numeric write→slider、numeric/string read/notify→display である。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/inferUiSchema.ts:104-179`。
- [static] renderer は schema の union type を switch し、NUS chat と 3 GATT widgets を React component にする。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/BleControllerLayout.tsx:74-123,150-181`。
- [static] 通信は browser の Web Bluetooth GATT API wrapper で、device chooser、GATT connect、read/write/notify、NUS RX/TX を直接実行する。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/webBluetoothClient.ts:84-103,117-210,224-310,329-343`。

### 1C. Wi‑Fi single-device call/data flow

```text
[static] preview path:
UI 生成 > WiFi → WifiControllerDialog(workspaceXml)
  → extractWsServerDataFromXml → inferWifiUiSchema → static preview + ESP32 URL/QR

[static] firmware path:
Blockly workspaceToCode
  → websocket_server_start generator
  → extractWsServerData(live Workspace)
  → inferWifiUiSchema
  → JSON schema + gzipped HTML bundle as C++ PROGMEM
  → compile API compiles firmware
  → ESP32 HTTP serves / and /schema.json
  → served browser page opens WebSocket to ESP32
```

- [static] Wi‑Fi pure inference consumes `projectName`, `serverStart`, `registrations` and outputs a one-device schema; Blockly extractor and XML extractor are adapters into that shape。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/inferWifiUiSchema.ts:59-111,230-274,301-355`。
- [static] `WifiControllerDialog` re-infers from live XML, renders a non-operable preview, and opens `http://<device>/` in a separate browser context; it does not run a live WS client itself。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/WifiControllerDialog.tsx:1-26,110-142,195-220,358-385`。
- [static] `websocket_server_start` generator walks the live workspace, serializes schema, and places bundle bytes and schema JSON in generated C++ definitions; generated HTTP routes serve HTML and schema, WS listens on the configured port。根拠: `$D/variants/ota/frontend/src/blocks/arduino/communication/webSocketBlocks.ts:349-382,385-430`。
- [static] compile client sends `includes/globals/setupCode/loopCode/board/connectionType` to a compile endpoint; it does not send a separate UI schema。根拠: `$D/variants/ota/frontend/src/services/compileService.ts:524-555,571-617`。
- [static] compile backend validates the request, calls `compile(body)`, selects a template, and injects the four code fragments before compilation。根拠: `$C/src/server.ts:124-162`、`$C/src/compile.ts:418-438,509-524`、`$C/src/inject.ts:31-76`。
- [inference] したがって frontend/backend boundary は「schema inference と HTML/C++ generation は frontend、compile backend はその生成 C++ を firmware にするだけ」である。backend に UI analyzer は見つからなかった。根拠は直前 3 bullets。

### 1D. Wi‑Fi multi-device downloadable HTML flow

```text
[static] .digicode.json × N (blocklyXml)
  + user-entered device label/id/host/port
  → extractWsServerDataFromXml
  → inferWifiUiSchema × N
  → one multi-device WifiControllerSchema
  → inline JSON in standalone HTML Blob
  → browser download
  → file:// page opens one WS connection per MCU
```

- [static] `.digicode.json` reader requires `blocklyXml`; `generatedCode` は読み込むが unified builder への schema input には使わない。根拠: `$D/variants/ota/frontend/src/services/projectFileReader.ts:27-36,53-77`、`$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:54-68,173-185`。
- [static] builder は各 XML を infer し、user input の host/port/id/label を override し、multi-device schema を HTML の application/json script に埋め、Blob を返す。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:151-160,166-235`。
- [static] UI は browser 内で object URL と `<a download>` を作って HTML を download する。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/UnifiedControllerSection.tsx:398-439`。
- [static] standalone bundle は embedded schema を読み、device ごとに `ws://host:port/path` を開き、JSON `{id,value}` を送受信する。根拠: `$D/variants/ota/frontend/public/unified-controller-bundle/index.html:24-38,285-295,475-559,704-753`。

### 1E. Mechanism classification

| Mechanism | Verdict | Evidence |
|---|---|---|
| static parser | `partially implemented` [static] | XML DOM parser と Blockly API extractor はあるが、C++ source parser ではない。`inferUiSchema.ts:46-63`; `inferWifiUiSchema.ts:249-274,301-342` |
| regex | `not the UI inference mechanism` [static] | UI inference は type/field walk。regex は device id sanitize、HTML embed、IP serial detection 等の周辺処理。`inferWifiUiSchema.ts:217-223`; `unifiedControllerBuilder.ts:148-159`; `WifiControllerDialog.tsx:76-96` |
| AST | `unsupported` [static] | parser entry は XML DOM／Blockly workspace で、C++ AST input/type はない。`inferUiSchema.ts:35-59`; `inferWifiUiSchema.ts:59-82,230-274` |
| block metadata | `implemented; primary source` [static] | `LABEL/DATA_TYPE/MIN/MAX/READ/WRITE/NOTIFY` は UI metadata 専用。`bleBlocks.ts:759-805`; `webSocketBlocks.ts:433-487` |
| runtime info | `not used for schema inference` [static] | runtime value は生成後の widgets 更新にだけ使う。BLE read/notify: `GattDisplayWidget.tsx:40-103`; Wi‑Fi WS: `wifi-controller-bundle/index.html:369-411` |
| AI | `Layer 1 unsupported; Layer 2 partial/inactive` [static] | current schema を prompt context にして appearance diff のみ生成し、両 UI の chat flag は false。`ControllerAiChat.tsx:142-194`; `systemPrompt.ts:343-371`; `WifiControllerDialog.tsx:66-70`; `UnifiedControllerSection.tsx:71-74` |
| template | `implemented` [static] | single-device gzipped HTML は C++ に埋め、unified HTML は inline schema 置換。`webSocketBlocks.ts:309-382`; `unifiedControllerBuilder.ts:141-159,232-235` |

## (2) 実際に何を分析するか

| Candidate | Observed verdict | Evidence |
|---|---|---|
| variables | `not inspected` [static] | inference inputs は block field records のみ。`inferUiSchema.ts:61-84,89-118`; `inferWifiUiSchema.ts:84-103,113-141` |
| sensor values | `not inspected at generation time` [static] | numeric value は runtime notify/read/WS message で表示されるが、sensor block や expression は schema parser が走査しない。`inferUiSchema.ts:61-84`; `GattDisplayWidget.tsx:46-105`; `wifi-controller-bundle/index.html:386-391` |
| output values | `not inspected at generation time` [static] | BLE `ble_notify` と Wi‑Fi `websocket_server_send` は別 runtime generator。schema parser は registration metadata のみ読む。`bleBlocks.ts:846-872`; `webSocketBlocks.ts:552-587`; `inferWifiUiSchema.ts:253-270` |
| device definitions | `partially inspected` [static] | BLE は advertised name と最初の service UUID。Wi‑Fi は project name と WS port/path、unified は user-entered host/port。`inferUiSchema.ts:65-83,206-217`; `inferWifiUiSchema.ts:93-109`; `unifiedControllerBuilder.ts:201-212` |
| pins | `not inspected` [static] | parser が読む field 名の完全な set に pin field はない。BLE: `inferUiSchema.ts:65-83,95-118`; Wi‑Fi: `inferWifiUiSchema.ts:253-270,323-338` |
| communication config | `inspected` [static] | BLE name/service/characteristic UUID と R/W/N、Wi‑Fi port/path/channel ID と R/W/N。`inferUiSchema.ts:65-83,95-118`; `inferWifiUiSchema.ts:253-270` |
| block metadata | `inspected; load-bearing input` [static] | metadata field は block definition に明示され、BLE では C++ に影響しない UI 専用、Wi‑Fi register も runtime C++ は comment だけ。`bleBlocks.ts:759-805,809-843`; `webSocketBlocks.ts:433-487` |
| generated code text | `not inspected` [static] | editor は XML と generated code を別 state にするが controller には XML を渡す。unified builder も `blocklyXml` を使う。`EditorPage.tsx:295-300,1403-1418`; `unifiedControllerBuilder.ts:54-68,173-185` |
| comments | `not inspected` [static] | parser は XML block type と直下 field だけを読む。`inferUiSchema.ts:59-84,187-193`; `inferWifiUiSchema.ts:319-339,364-373` |
| known function patterns | `not inspected` [static] | function-call pattern matching branch はなく、block type exact match だけ。`inferUiSchema.ts:61-84`; `inferWifiUiSchema.ts:253-270,319-339` |
| AI-generated metadata | `not used by Layer 1; optional appearance diff only` [static] | AI は current schema を受け、structural field は validator/customizer が拒否・不変化。`ControllerAiChat.tsx:168-194`; `jsonValidator.ts:62-92,95-136`; `controllerCustomizer.ts:45-81` |
| duplicate/invalid declarations | `inspected as warnings` [static] | duplicate characteristic/channel、unknown type、R/W/N 全 false を warning/skip にする。`inferUiSchema.ts:98-123`; `inferWifiUiSchema.ts:119-143` |

- [inference] 「code を分析する」という product-level 表現で実際に分析対象となる “code” は、semantic C++ ではなく Blockly project serialization に含まれる宣言 metadata である。generated C++ に同じ UUID/channel string が現れることはあるが、それを逆解析してはいない。

## (3) 何を UI にできるか

判定は「現 snapshot の自動生成 schema と実 renderer で end-to-end に表せるか」を基準にした。偶然 HTML 内に存在する infrastructure button は、schema から生成できない場合は feature widget の `button` と数えない。

| UI capability | Classification | Per-item evidence |
|---|---|---|
| numerical display | `implemented` [static] | numeric read/notify→`gatt-display`; BLE は numeric format、Wi‑Fi は server value を文字表示。`inferUiSchema.ts:143-151`; `inferWifiUiSchema.ts:164-175`; `GattDisplayWidget.tsx:105-148`; `wifi-controller-bundle/index.html:294-310` |
| text/status | `partially implemented` [static] | string display と NUS text chat はある。ただし domain status enum/semantic mapping はない。`inferUiSchema.ts:143-163`; `NusChatWidget.tsx:83-102,107-166`; widget union: `Controller/types.ts:84-106` |
| gauge | `partially implemented` [static] | `displayMode:'gauge'` は型・validator・AI prompt に存在するが bundle factory/customization code は読まない。`Controller/types.ts:48-69`; `jsonValidator.ts:29-32,106-110`; `wifi-controller-bundle/index.html:313-345`; `unified-controller-bundle/index.html:431-460` |
| graph/chart | `partially implemented` [static] | `graph` は gauge と同じ schema slot まで。時系列 buffer、axis、canvas/SVG/chart renderer は widget switch にない。`Controller/types.ts:48-69`; `wifi-controller-bundle/index.html:294-345`; `unified-controller-bundle/index.html:412-460` |
| toggle | `implemented` [static] | bool+write→toggle。BLE は ASCII `1/0` を GATT write、Wi‑Fi は JSON envelope で送る。`inferUiSchema.ts:127-140`; `inferWifiUiSchema.ts:148-161`; `GattToggleWidget.tsx:24-47`; `wifi-controller-bundle/index.html:224-249` |
| button | `unsupported` [static] | schema union と renderer switch に momentary/button widget がない。toggle は ON/OFF stateful control であり独立 button schema ではない。`BleController/types.ts:24-63`; `Controller/types.ts:84-106`; `wifi-controller-bundle/index.html:313-320` |
| slider | `implemented` [static] | numeric+write→min/max slider。BLE write は 50 ms trailing timer、Wi‑Fi は 100 ms throttle。`inferUiSchema.ts:131-140`; `GattSliderWidget.tsx:24-63`; `wifi-controller-bundle/index.html:252-291` |
| input field | `partially implemented` [static] | BLE NUS chat には text input/send があるが、string write-only characteristic/channel は display fallback で専用 text-input にならない。`NusChatWidget.tsx:147-163`; `inferUiSchema.ts:14-17,154-163`; `inferWifiUiSchema.ts:178-188` |
| actuator control | `partially implemented` [inference] | generic bool toggle と numeric slider で actuator command は送れるが、actuator kind、momentary command、acknowledgement、interlock、安全状態という schema semantics はない。transport evidence: `GattToggleWidget.tsx:30-47`; `GattSliderWidget.tsx:35-63`; schema limit: `Controller/types.ts:84-106` |
| alarm/status | `unsupported` [static] | monitored value に対する threshold、comparison、severity、conditional color、alarm latch field/widget は schema union にない。`led` enum は renderer に未接続。connection status は transport infrastructure で、data-derived alarm ではない。`Controller/types.ts:48-106`; `wifi-controller-bundle/index.html:313-345,369-392` |
| multiple simultaneous values | `implemented` [static] | BLE layout は全 GATT widgets を map、Wi‑Fi bundle は全 widgets を loop、unified は全 devices を loop する。`BleControllerLayout.tsx:109-120`; `wifi-controller-bundle/index.html:348-365`; `unified-controller-bundle/index.html:704-726` |
| realtime update | `implemented, producer-dependent` [static] | BLE notify または read-only 1,000 ms polling、Wi‑Fi WS message update が実装済み。ただし firmware 側の notify/send block は user program に必要で、register metadata だけでは値を publish しない。`GattDisplayWidget.tsx:23-24,40-103`; `wifi-controller-bundle/index.html:369-392`; `bleBlocks.ts:846-872`; `webSocketBlocks.ts:552-587` |

## (4) Generated UI と device の通信、既知 subsystem 間の関係

### 4A. BLE

- [static] transport は direct browser-to-MCU BLE GATT/NUS。DigiCode backend、HTTP、MQTT、WebSocket は BLE controller runtime path に入らない。`navigator.bluetooth.requestDevice`→GATT connect→service/characteristic read/write/notify である。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/webBluetoothClient.ts:133-205,224-310,329-343`。
- [static] schema は device name prefix、custom service UUID、characteristic UUID を connection/widget に渡す。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/BleConnectionBar.tsx:31-45`、`$D/variants/ota/frontend/src/components/editor/BleController/BleControllerLayout.tsx:74-81,109-120`。
- [inference] 現 snapshot で実装が追えた BLE distribution は editor 内 panel/dialog である。source comment は shared URL／single-file HTML を future distribution と記すが、実 route/builder/download call flow は見つからなかった。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/types.ts:1-9` と、現 call flow `EditorPage.tsx:1403-1406`→`BleControllerPanel.tsx:48-80`→`BleControllerDialog.tsx:26-39`。

### 4B. Wi‑Fi single-device, ESP32-served page

- [static] firmware 内 HTTP server は port 80 で bundle `/` と schema `/schema.json` を配信し、別 port（default 81）の WebSocket server を起動する。根拠: `$D/variants/ota/frontend/src/blocks/arduino/communication/webSocketBlocks.ts:239-302,349-382,385-430`。
- [static] page は same-origin `/schema.json` を fetch し、`ws://location.hostname:<schema port>/` へ接続する。widget→MCU は `{id,value}` JSON、MCU→widget も同じ envelope である。根拠: `$D/variants/ota/frontend/public/wifi-controller-bundle/index.html:186-189,369-411`。
- [static] MCU side は incoming JSON を parse し channel handler を呼び、server send／handler echo は全 client に JSON を broadcast する。根拠: `$D/variants/ota/frontend/src/blocks/arduino/communication/webSocketBlocks.ts:247-307,511-549,571-587`。
- [static] DigiCode Wi‑Fi dialog 自体は mixed-content 制約のため live WS 接続をせず、IP/QR/URL と static preview を提供して ESP32-served page を別 context で開く。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/WifiControllerDialog.tsx:18-26,195-220,309-385`。

### 4C. Downloadable controller HTML

- [static] previous audit の「downloadable controller HTML」は Wi‑Fi multi-device/unified flow と一致する。project file の `blocklyXml` から N-device schema を作り、schema を inline にした self-contained HTML を browser download する。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/UnifiedControllerSection.tsx:1-34,398-439`、`$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:166-235`。
- [static] download page は HTTP server を介さず `file://` から各 user-entered LAN host の WebSocket へ接続する。schema は inline なので `/schema.json` fetch は不要。根拠: `$D/variants/ota/frontend/public/unified-controller-bundle/index.html:11-38,42,285-295,475-559`。
- [static] multi-device page は device ごとに接続 state、reconnect backoff、pause/resume と widget map を持つ。根拠: `$D/variants/ota/frontend/public/unified-controller-bundle/index.html:462-569,704-753`。

### 4D. AI customization diff

- [static] AI customization は別の Layer 2 であり、Layer 1 が作った Wi‑Fi schema を AI prompt に渡し、validated appearance diff を同じ schema に merge する。BLE schema path には接続されていない。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/ControllerAiChat.tsx:5-10,142-194`、`$D/variants/ota/frontend/src/components/editor/Controller/controllerCustomizer.ts:39-81`。
- [static] AI call は DigiCode backend 経由ではなく frontend client から選択 provider endpoint へ直接行く。credential value は本報告に記載しないが、credential type は browser-side config から auth header に渡される。根拠 location: `$D/variants/ota/frontend/src/components/editor/Controller/ControllerAiChat.tsx:142-173`、`$D/variants/ota/frontend/src/services/ai/anthropicClient.ts:23-48`、`$D/variants/ota/frontend/src/services/ai/openAICompatibleClient.ts:26-52`。
- [static] unified builder は diff stack を embedded schema に apply できるため、AI UI が再表示されれば standalone HTML へ color/layout 等を運べる構造である。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:215-235`、`$D/variants/ota/frontend/src/components/editor/Controller/UnifiedControllerSection.tsx:420-439`。
- [static] ただし current UI flag は false であり、bundle が実際に反映する appearance は `colorScheme` と schema-level `layout`。`displayMode` と `customCss` は validator を通って schema に残せるが renderer は使わない。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/UnifiedControllerSection.tsx:71-74,647-676`、`$D/variants/ota/frontend/public/unified-controller-bundle/index.html:431-460,640-645,704-725`。

### 4E. 明示的に見つからなかった transport

- [static] auto controller の traced runtime path に MQTT broker、DigiCode application server relay、cloud dashboard relay はない。BLE は direct GATT、Wi‑Fi は direct LAN WS である。根拠は 4A–4C の complete runtime call flow。
- [inference] compile API は build-time service であり、生成 controller を実行時に中継する server ではない。根拠: `$C/src/server.ts:124-162`、`$C/src/compile.ts:418-438,509-524`。

## (5) Text-code product での再利用性

### 5A. Blockly-dependent parts（そのままでは壊れる）

- [static] BLE source adapter は Blockly XML の `<block type="ble_*">` と `<field name=...>` に完全依存する。plain C++ だけを渡すと widgets は 0 になる。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/inferUiSchema.ts:42-86,187-193`。
- [static] Wi‑Fi adapters は `Workspace.getBlocksByType()` または Blockly XML の exact block type/field を使う。plain C++ に entry point はない。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/inferWifiUiSchema.ts:249-274,301-355`。
- [static] Wi‑Fi firmware packaging は `websocket_server_start` block generator の side effect として bundle/schema C++ definitions と HTTP/WS startup code を生成する。text editor が同等 code/metadata を発生させない限り MCU page は存在しない。根拠: `$D/variants/ota/frontend/src/blocks/arduino/communication/webSocketBlocks.ts:404-430`。
- [static] `.digicode.json` unified flow は `blocklyXml` 必須で、保存済み `generatedCode` を解析しない。根拠: `$D/variants/ota/frontend/src/services/projectFileReader.ts:53-77`、`$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:54-68,173-185`。

### 5B. Blockly-independent parts（入力 adapter を替えれば生きる）

- [static] Wi‑Fi の pure inference は `InferWifiUiSchemaOpts`（project name、server config、registration records）だけを必要とし、内部で Blockly API を呼ばない。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/inferWifiUiSchema.ts:55-111`。
- [static] schema types、widget rule、bundle render、WebSocket wire envelope、multi-device builder の schema embed は Blockly そのものを必要としない。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/types.ts:42-169`、`$D/variants/ota/frontend/public/wifi-controller-bundle/index.html:186-189,224-320,369-411`、`$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:141-160,215-235`。
- [static] BLE renderer/client も schema を受け取った後は Blockly を必要としない。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/BleControllerLayout.tsx:26-40,74-123`、`$D/variants/ota/frontend/src/components/editor/BleController/webBluetoothClient.ts:84-103,117-343`。
- [inference] BLE parser と Wi‑Fi parser は別実装だが、`bool/numeric/string × R/W/N → toggle/slider/display` という policy は同型である。text-code product では共通 policy function と transport-specific endpoint fields に分離できる余地がある。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/inferUiSchema.ts:127-177` と `$D/variants/ota/frontend/src/components/editor/Controller/inferWifiUiSchema.ts:148-200`。

### 5C. Missing block metadata の具体的な代替候補

| Replacement | Evaluation | What breaks / survives |
|---|---|---|
| C++ source analysis (AST) | `plausible only with constrained APIs` [inference] | communication registration calls、string literal UUID/channel、read/write flags は AST で拾える可能性がある。しかし arbitrary variables から human label、min/max、control intent、alarm threshold は一意に復元できない。現 parser の入力 record と renderer は生きるが、新しい C++ frontend/AST adapter が必要。 |
| regex source analysis | `not sufficient as primary mechanism` [inference] | macro、wrapper、alias、constexpr、conditional compilation、generated code で容易に崩れる。prototype discovery には使えても、現 schema が要求する typed records の信頼できる source にはならない。 |
| compile metadata | `plausible, backend contract change required` [inference] | compiler plugin／preprocessor output が endpoint declaration と annotations を schema artifact にすれば deterministic。しかし現 compile request/response は code fragments と firmware artifact で、UI schema channel はない。`compileService.ts:540-555`; `$C/src/inject.ts:31-76`。 |
| project manifest | `high-fidelity replacement` [inference] | `channels[] {id,label,type,min,max,read,write,notify,transport,endpoint}` を text project に明示すれば、pure inference と bundle はほぼそのまま使える。欠点は code-manifest drift なので compile/check step が必要。 |
| registry metadata | `supporting input, not enough alone` [inference] | board/library registry は pin capability、sensor unit、known API を補えるが、「この program で何を見せ、何を操作可能にするか」は決められない。manifest/annotation/AST との組み合わせが必要。 |
| code annotations | `closest semantic replacement` [inference] | C++ annotation/macro（例: observable/control、label、range、transport id）なら block fields と同じ情報を source の近くに置ける。parser/compile extractor は新規だが schema/policy/render/transport は生きる。 |
| schema-first API generation | `strong deterministic option` [inference] | text project が controller schema または typed registration API を source of truth とし、そこから firmware declarations と UI の両方を生成すれば drift を抑えられる。これは現 Wi‑Fi register block が「runtime commentのみ／schema metadata source」という役割を text-native に置換する形。根拠となる現 role: `webSocketBlocks.ts:433-487`。 |
| AI analysis of source | `assistive, not drop-in` [inference] | AI は candidate schema を提案できるが、現 AI contract は existing ids の appearance diff のみで、functional schema を生成できない。full-schema validator、source/compile cross-check、unknown channel rejection、user confirmation が必要。`jsonValidator.ts:62-136`; `controllerCustomizer.ts:51-81`。 |

### 5D. 具体的な break/survival boundary

- [inference] text C++ に communication registration が全く明示されない場合、source analysis だけで sensor variable と actuator command を安全に分類することはできない。値の型は分かっても direction、range、units、safe command semantics が欠ける。
- [inference] text code が現 firmware wire contract（BLE ASCII value、Wi‑Fi `{id,value}` JSON）を実装するなら renderer/client は再利用しやすい。contract が異なる場合は transport adapter も置換対象になる。現 contract: `$D/variants/ota/frontend/src/components/editor/BleController/types.ts:10-13`、`$D/variants/ota/frontend/src/blocks/arduino/communication/webSocketBlocks.ts:217-230`。
- [inference] 最小の portable asset は `registration records → schema → renderer` であり、`program → registration records` と `schema/wire contract → firmware code` の両側 adapter が text product 固有 work になる。

## (6) AI potential（評価のみ）

### 6A. Plausibility

- [inference] 「既に schema に存在する widget の色・全体レイアウトを変える」範囲なら、既存 AI pipeline は構造的に近い。current schema を prompt に含め、JSON diff を validate し、schema に merge するところまで存在する。根拠: `$D/variants/ota/frontend/src/services/ai/systemPrompt.ts:343-371`、`$D/variants/ota/frontend/src/components/editor/Controller/ControllerAiChat.tsx:168-194`。
- [inference] 「この source code から monitoring screen を作る」「RPM/current/run state を新規発見する」「Start/Stop を追加する」範囲では、既存 mechanism をそのまま AI が drive することはできない。AI は source code を受け取らず Layer 1 schema だけを受け、existing widget id 以外を invent できず、functional fields を変更できない。根拠: `$D/variants/ota/frontend/src/services/ai/systemPrompt.ts:343-370`、`$D/variants/ota/frontend/src/services/ai/jsonValidator.ts:62-92,95-136`、`$D/variants/ota/frontend/src/components/editor/Controller/controllerCustomizer.ts:51-81`。

### 6B. Instruction ごとの structural obstacle

| Instruction | Existing mechanism result | Structural obstacle |
|---|---|---|
| “build me a monitoring screen from this code” | `not currently driveable` [static+inference] | AI context は code ではなく current schema。Layer 1 は Blockly metadata only。source→channel discovery stage がない。`ControllerAiChat.tsx:168-173`; `inferWifiUiSchema.ts:301-355` |
| “show RPM, current and run state” | `possible only if 3 channels already registered` [inference] | AI は ids を新規作成できず、labels/dataType も変更禁止。既存 schema に 3 widgets があれば layout/color のみ変更可能。`jsonValidator.ts:62-92`; `controllerCustomizer.ts:51-81` |
| “red when abnormal” | `unsupported as conditional behavior` [static] | colorScheme は固定 CSS variable。threshold、condition、normal/abnormal state mapping が schema にない。`Controller/types.ts:61-69,75-106`; `wifi-controller-bundle/index.html:322-345` |
| “add Start/Stop” | `unsupported` [static] | momentary button widget がなく、AI は channel/widget type/firmware handler を追加できない。toggle 1 個は stateful ON/OFF で Start と Stop の 2 command ではない。`Controller/types.ts:84-106`; `jsonValidator.ts:101-136`; `wifi-controller-bundle/index.html:224-249,313-320` |
| “temperature as gauge / history graph” | `schema diff accepted, renderer no-op` [static] | enum は validator/prompt にあるが bundle factory と customization apply が `displayMode` を参照しない。history buffer/graph renderer もない。`systemPrompt.ts:350-369`; `wifi-controller-bundle/index.html:294-345`; `unified-controller-bundle/index.html:412-460` |

### 6C. Existing AI path を functional generator へ広げる際に必要なもの（実装提案ではなく gap list）

- [inference] source/manifest/annotation から candidate channel schema を作る別 stage。
- [inference] appearance-only `CustomizationDiff` とは別の full functional schema contract と validator。
- [inference] newly invented channel と firmware handler/send/notify の存在を照合する compile/static check。
- [inference] momentary button、conditional status/alarm、threshold、units、gauge、time-series graph の schema と renderer。
- [inference] AI が unsafe actuator control を追加しないための authority/confirmation と MCU-side invariant。
- [inference] `displayMode/customCss` を許可する schema と実 renderer の不一致解消。現状は AI が成功 diff を返しても一部 field が visual no-op になる。

## Competing hypotheses I considered

### H1: 任意の generated C++ を解析して変数/sensor/function から UI を発見する

- [static] 反証された。controller call site は `workspaceXml` を渡し、parsers は block type/field のみを読む。`generatedCode` は compile/save 用の別 state である。根拠: `$D/variants/ota/frontend/src/pages/EditorPage.tsx:295-300,1403-1418`、`$D/variants/ota/frontend/src/components/editor/BleController/inferUiSchema.ts:35-86`、`$D/variants/ota/frontend/src/components/editor/Controller/inferWifiUiSchema.ts:301-355`。
- [inference] この仮説を復活させる証拠は、C++ parser/AST entry が controller schema builder を呼ぶ source、または compile backend が schema artifact を返す source である。今回の snapshot では得られなかった。

### H2: BLE/Wi‑Fi は単一の transport-neutral “program→UI schema” engine の adapter 違い

- [static] 部分的にのみ正しい。widget vocabulary と rule table は似るが、BLE/Wi‑Fi parser と schema type は別で、BLE は NUS widget、Wi‑Fi は devices/endpoints を持つ。根拠: `$D/variants/ota/frontend/src/components/editor/BleController/types.ts:24-76`、`$D/variants/ota/frontend/src/components/editor/Controller/types.ts:75-161`、両 infer files。
- [inference] 両者が完全に一つの engine であることを示すには shared policy function または共通 schema interface の実 call が必要だが、見つからなかった。

### H3: ESP32-served Controller と downloadable controller HTML は同じ artifact

- [static] 分離された二つの distribution だが Layer 1 schema と widget/wire semantics を共有する。単機版は firmware 内 gzip bundle + external `/schema.json`、unified 版は standalone HTML + inline schema + explicit per-device host である。根拠: `$D/variants/ota/frontend/src/blocks/arduino/communication/webSocketBlocks.ts:349-382`、`$D/variants/ota/frontend/public/wifi-controller-bundle/index.html:395-411`、`$D/variants/ota/frontend/src/components/editor/Controller/unifiedControllerBuilder.ts:151-160,166-235`、`$D/variants/ota/frontend/public/unified-controller-bundle/index.html:24-38,285-295`。

### H4: AI が auto UI の generation mechanism そのもの

- [static] 反証された。Layer 1 は deterministic block metadata inference。AI は後段の optional appearance diff で、現在 UI 非表示。根拠: `$D/variants/ota/frontend/src/components/editor/Controller/types.ts:29-35,144-161`、`$D/variants/ota/frontend/src/components/editor/Controller/WifiControllerDialog.tsx:66-70,419-451`。
- [inference] AI が generator になったと区別できる証拠は、source/manifest を AI に渡して new functional widgets/channels を出し、それを validator と firmware contract が採用する call flow である。現 snapshot にはない。

## What I could not determine and why

- [NOT OBTAINED] 実 hardware で BLE connect/read/write/notify、ESP32 HTTP serving、Wi‑Fi WebSocket send/receive、multi-device reconnect を real-fire していない。理由: INVESTIGATION の read-only source packet であり、device/flash/network/credential 操作は scope 外。したがって runtime reliability、latency、browser compatibility の comment claims は測定していない。
- [NOT OBTAINED] AI provider への API-smoke をしていない。理由: credential operation と external call は不要かつ scope 外。credential value は取得・記録していない。
- [NOT OBTAINED] frontend test suite を実行していない。理由: acceptance に test command はなく、donor を一切変更しない制約下で dependency cache 等の write risk を避けた。判定は static source read のみ。
- [NOT OBTAINED] generated `wifiControllerBundle.ts` の base64 payload が public source HTML と byte-for-byte 同一かは build script を実行して検証していない。source import/build path は読んだが、artifact reproducibility は本 mission の capability trace に不要と判断した。
- [NOT OBTAINED] source comments が記す BLE shared URL `/control/<projectId>` と BLE standalone HTML の future phases が他 branch/history に存在したかは調べていない。調査対象は指定 SHA の working tree source で、git history audit は要求されていない。
- [NOT OBTAINED] arbitrary text C++ から UI schema を作る未追跡 prototype が別非関連 repo にある可能性は否定できない。指定 3 repo の許可された `1,341 files` を検索し、Helper には trail がなかった、という範囲までである。
- [NOT OBTAINED] gauge/graph/customCss が hidden feature flag や runtime patch で別 renderer に差し替わる経路は得られなかった。指定 SHA の両 shipping bundle source と controller call flow では参照されないが、production deployed bytes は取得していない。
- [NOT OBTAINED] Wi‑Fi `READ` flag と `NOTIFY` flag が MCU runtime access-control を強制するかは schema inference 以外の意味として確認できなかった。observed generator では register block が C++ comment だけで、runtime send/on_message blocks が別に存在するため、これらは少なくとも UI inference hint であるが、security permission とは証明できない。根拠: `$D/variants/ota/frontend/src/blocks/arduino/communication/webSocketBlocks.ts:433-487,490-587`。

## Findings outside the packet

- [static] なし。`displayMode/customCss` が validator/schema には存在するが current bundle が使わない点は、この packet の UI capability と AI potential を直接左右する中心所見として扱い、隣接 finding には分類しない。

## Evidence/rung summary

- [static] 実施: source read（行番号付き）、schema/type/call-flow の相互照合。
- [grep] 実施: 3 repo の候補絞り込みと absence search。grep 単独で capability 結論を出していない。
- [command+RC] 実施: SHA、file denominator、match denominator、source read command。採用 command は RC=0。
- [git-history] 未実施（HEAD SHA の取得のみ）。
- [synthetic] 未実施。
- [API-smoke] 未実施。
- [visual] 未実施。
- [real-fire] 未実施。

## Claims index

- [static] C1 → §0 / §(1): auto UI は arbitrary C++ analyzer ではなく Blockly metadata parser。`$D/.../BleController/inferUiSchema.ts:35-86`; `$D/.../Controller/inferWifiUiSchema.ts:249-355`。
- [static] C2 → §(3): end-to-end functional widget は display/toggle/slider、BLE に NUS chat。`$D/.../BleController/types.ts:24-63`; `$D/.../Controller/types.ts:84-106`。
- [static] C3 → §(4): BLE direct GATT、Wi‑Fi ESP32 HTTP+WS、unified file→multi-WS。各 subsection の static evidence。
- [static] C4 → §(4D)/(6): AI は appearance-only、current UI hidden、gauge/graph/customCss は renderer gap。`WifiControllerDialog.tsx:66-70`; `UnifiedControllerSection.tsx:71-74`; bundle widget switches。
- [static+inference] C5 → §(5): portable core と Blockly-dependent adapters の境界。pure opts API `inferWifiUiSchema.ts:59-111` と XML/Workspace adapters `:249-355`。
- [command+RC] C6 → §1: donor SHA/denominators。rev-parse RC=0、`687/603/51 searched files`、`38 examined files`。
