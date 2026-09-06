# 実用 IoT 競合 capability audit（vendor primary sources）

- Packet: `S007-D5-feature-primary-sources`
- Lane: `INVESTIGATION`
- 調査日・全 URL の取得日: **2026-08-26**
- 対象: Arduino Cloud Editor + Arduino App Lab 0.10、PleaseDontCode、Codey Online、Embedder、Viam、ESPHome / ESPHome Device Builder
- 対象外: 価格・プラン・無料枠・credit、アカウント作成、試用、DigiCode donor、製品実装
- 検証ラベル: 本文の URL 読解と公開 repository 集計は `static`、HTTP 取得は `API-smoke`。アカウント内 UI、実機 flash、compile、HIL、vendor cloud は実行していない（`visual` / `real-fire` 未実施）。

## 読み方と証拠型

- `[primary source]`: vendor 自身の公開ページ、公式 docs、公式公開 repository。必ず URL と取得日を伴う。
- `[secondary source]`: 今回は capability の根拠として使用していない。
- `[command+RC]`: 実行した取得・集計コマンドの観測値。
- `[inference]`: 一次資料からの限定的な推論。一次資料の文言そのものと分離した。
- `[NOT OBTAINED]`: 取得を試したが、公開資料、HTTP 応答、または account gate のため確定できなかったもの。

`documented` は対象製品の一次資料に機能または具体例があること、`via user-supplied library/module` は一般的な拡張機構は確認できるが対象 protocol/device の完成済み support は確認できないこと、`not found in docs` は検索した公開資料に記述を見つけなかったことを表す。**`not found in docs` を `unsupported` に読み替えてはならない。**

## 結論の要約

1. `[primary source]` ESPHome は golden scenario の field side を最も直接に文書化している。Modbus RTU、RS485、register/coils の sensor/switch 化、generic MQTT、local Home Assistant、config からの entity/UI 自動出現まで一続きである。Azure または DB は別途用意が必要で、Modbus TCP は今回の docs では確認できなかった。
2. `[primary source]` Arduino Cloud は MKR 485 Shield + Modbus meter + Cloud dashboard という具体例を持つ。一方 App Lab 0.10 Agentic Mode は workspace-aware な coding agent であって、industrial protocol catalog や deterministic build matrix の発表ではない。App Lab の現行 board denominator は公開 docs 上 UNO Q 1 機種、VENTUNO Q は upcoming だった。
3. `[primary source]` PleaseDontCode は 35+ boards、hardware-aware generation、cloud compile、browser flash、code-variable から dashboard widget を提案する POTA を掲げるが、公開製品資料から Modbus/RS485 または generic MQTT backend を確認できなかった。
4. `[primary source]` Codey は 12 boards / 79 component detail pages を公開し、MAX485、MCP2515 CAN、0-10 V converter を具体的に掲載する。しかし Modbus register semantics、backend、DB、hosted dashboard は公開資料で確認できず、golden scenario は MAX485 wiring と generic MQTT firmware generation の間で利用者実装を要する。
5. `[primary source]` Embedder は current docs で 590+ platforms / 13 manufacturers、5,850+ peripheral parts / 11 categories と明記し、off-catalog PDF、datasheet indexing、source/schematic context、実機を接続した build/flash/test loop を持つ。これは開発 agent / HIL 環境であり、IoT backend や運用 UI ではない。また user の board×toolchain×library を vendor が維持する service とは文書化されていない。
6. `[primary source]` Viam は resource API と registry module を宣言で導入し、version pin、cache、local `viam-server`、cloud data sync、dashboard/control を提供する。公開 registry の全 module 数は client-rendered page から得られなかった。ESP32 micro-RDK は WROVER series のみが明記され、Modbus は custom module 側に残る。

## Capability matrix

`[primary source]` 各セルは調査日現在の公開一次資料の横断要約。ただし `NF` / `NO` cell は下記の `[NOT OBTAINED]` と absence table、評価は `[inference]` の golden-scenario sectionを参照する。`NF` = `not found in docs`、`US` = `via user-supplied library/module`、`NO` = `NOT OBTAINED`。

| dimension | Arduino Cloud Editor + App Lab | PleaseDontCode | Codey Online | Embedder | Viam | ESPHome / Device Builder |
|---|---|---|---|---|---|---|
| boards / denominator | Cloud: 有限総数 NO、official/third-party と generic ESP32/8266。App Lab docsがcurrentとして直接名指す1機種=UNO Q、VENTUNO Q upcoming（網羅性NO） | 「35+」公称、公開 carousel で固有名 33 | 12 ItemList | 590+ platform、13 manufacturers | registry 総数 NO。Linux/macOS/Windows compute、Pi 等。micro-RDK は ESP32-WROVER series | platform families を docs で列挙。core source top-level component dirs 742 は board 数ではない。ESP32 13 variants、RP2040/2350、nRF52、Linux host |
| modern family spot check | generic ESP32、official C6 board は hardware catalog にあるが Cloud variant list NO。RP2040/nRF/STM32 official boards。XIAO/M5/RP2350 NF | S3/C3/C6、XIAO、M5Stack、Nano33BLE、Pi Zero 2W。RP2/STM32 NF | S3/C3。C6/XIAO/M5/RP2/nRF/STM32/Linux NF | S3/C3/C6、XIAO/RP2/nRF/STM32/Linux catalog。M5 NF | Pi/Linux documented。WROVER only for MCU runtime; S3/C3/C6/RP2/nRF/STM32 NF | S3/C3/C6、XIAO RP2040/XIAO nRF、RP2040/2350、nRF52、Linux host。M5 via PlatformIO board listの可否は NO |
| devices/sensors denominator | finite library/device count NO | finite sensor count NO | 79 component detail pages | 5,850+ parts / 11 categories | registry/model total NO | 742 top-level source component dirsはdevice数ではないproxy、device-only total NO |
| device model | library + code、Cloud Thing/variable/device twin。App Lab Brick | prompt に sensor/actuator、library/pin mapping、schematic | 79 component catalog + libraries/project files | indexed platform/peripheral datasheet + schematic + source | standard resource API + `namespace:family:model` driver module | YAML component/entity、または external component |
| RS485 / Modbus RTU | **documented**: MKR 485 + meter + Cloud dashboard | NF | RS485 transceiver documented、Modbus NF | RS485 transceivers documented、Modbus NF/US | NF/US custom module | **documented**: UART + MAX485、client/server、register map |
| Modbus TCP | NF | NF | NF | NF/US | NF/US | NF |
| CAN / CANopen | NF（PLC IDE 等の別製品は対象根拠にしない） | product docs NF | CAN documented / CANopen NF | CAN & CAN-FD documented、CANopen は raw CAN から推定不可と明記 | CAN custom module tutorial / CANopen NF | CAN documented / CANopen NF |
| 4-20 mA / 0-10 V | NF / NF | NF / NF | NF / 0-10 V converter documented | 4-20 mA DAC part documented / 0-10 V NF | NF / NF | NF / NF（ADC/output から可能という推定は support 証拠にしない） |
| IO-Link / pulse / encoder | NF / NF / NF | NF / NF / NF | NF / NF / NF | NF / NF / NF | IO-Link NF / board tickers・encoder resource documented | IO-Link NF / pulse_counter documented / rotary_encoder documented |
| extensibility | Cloud custom library/sketch import。App Lab custom Python/Docker Brick | `.cpp/.c/.h/.zip` import、library auto-selection。任意 custom board の方法 NO | multi-file、library picker/auto-install。catalog 外 board の方法 NO | PDF custom platform/peripheral、schematic upload、既存 repo/toolchain | registry/custom driver、source URL、semver pin、isolated deps | Git/local external component、Git/URL/file package、`ref`/`refresh` |
| compile | Cloud compiler。App Lab は local Linux/Python + sketch side。queue/limit NO | cloud compile + auto repair。queue/limit/version matrix NO | server-side `arduino-cli`。queue/limit/version matrix NO | user repo の既存 build command/toolchain | module cloud build または user build。MCU firmware compiler ではない | local Python/Desktop/HA app/Docker、framework auto install |
| write / flash | Cloud Agent desktop plugin + browser、OTA。App Lab USB/network/SBC、UNO Q flasher | Web Serial、desktop Chrome/Edge。初回 USB、POTA OTA | Web Serial Chrome/Edge、初回 USB、ESP OTA | installed vendor tools/probe、local/remote bench | `viam-server` install/update。ESP32 micro-RDK install path | initial USB、以後 OTA。Device Builder、CLI、container/browser path |
| backend | Arduino-hosted Cloud、webhook、Node-RED integration。firmware library 経由の任意 endpoint は user code | POTA vendor cloud + HTTPS/WebSocket。Azure/AWS/GCP/generic MQTT/local NF | firmware can generate MQTT/web server/BLE。hosted backend NF | IoT backend なし、Monitor network sandbox | Viam Cloud capture/sync/query、own MongoDB sync、local runtime | generic MQTT/HTTP、Home Assistant native API、local/self-hosted |
| UI / automatic generation | Cloud dashboard は手動 widget。App Lab App UI/Brick は開発者作成。source-analysis auto Web UI NF | dashboard widgets は code global variables を解析して提案、利用者が選択・配置 | wiring diagram は project から生成。Web page は prompt 生成、hosted dashboard NF | agent-generated project Monitor dashboard。dev-tool UI であり deployed Web UI ではない | dashboard widgets を手動設定、custom app は user build。auto UI NF | configured entities が Home Assistant UI に自動出現、device `web_server` も entity UI を生成。source analysis ではなく config-driven |
| AI | App Lab 0.10 MCP + App CLI、workspace/file/run/error、language server、BYOK、initial Claude | hardware-aware prompt-to-code/schematic、compile repair。provider/key方式 NO | Agent/Plan/Ask、multi-file、catalog/library awareness。provider/key方式 NO | repo + source + datasheet/schematic + instruments、local models/hosted providers | current config/validation/docs/registry を読み staged config edit | product AI coding assistant NF |
| managed reproducibility | board packages/libs を cloud 提供するが、verified board×toolchain×library×version matrix/lock の主張 NF | version snapshots はあるが toolchain/library lock/verified matrix NF | preinstalled libs/cloud toolchain はあるが disclosed versions/verified matrix NF | existing toolchainを使う。HILは条件付き。vendor-managed matrixではない | module semver pin/cache/build manifests。MCU matrixではない | framework `recommended`、version options、container tags、Git refs。vendor-hosted verified matrixではない |
| enterprise / offline | Cloud self-host/air-gap/proxy NF。App Lab desktopだが agent provider接続要件の air-gap可否 NO | offline/self-host/proxy/admin NF | offline/self-host/proxy/admin NF | SaaS / customer VPC / on-prem / air-gapped deployment documented。local model endpoints | local runtimeは回線断後も継続。Viam Cloud self-host/air-gap/proxy NF | open-source local Docker/Desktop/HA。no-internet device UI可。初回 dependency取得を含む完全 air-gapは NO |
| golden scenario | Modbus RTU→Cloud dashboard は具体例あり。Azure/RPi broker/DB は user integration | industrial protocol と generic MQTT の公開証拠で止まる。POTA cloudならOTA/UIへ分岐 | MAX485 + generic MQTT code generation まで。Modbus map、backend/DB/UIは user | firmware作成・実機検証を補助。Modbus/backend/UIは project/user supply | Modbus driver moduleを user supplyすれば local/Cloud data/UI/controlへ到達 | Modbus RTU→ESP32→MQTT/HA→UIまで。Azure/DBは user supply |

## 1. Arduino Cloud Editor + Arduino App Lab 0.10

### Boards、device model、industrial capability

- `[primary source]` Cloud Editor は online IDE で、選択 board 用 compiler、upload、Serial Monitor、および **“all board packages & libraries available without download”** を掲げる。ただしこの文言は「全世界の board package」を意味する有限 support list ではなく、公開 docs から総 board 数を得られなかった（[Cloud Editor](https://docs.arduino.cc/arduino-cloud/getting-started/getting-started-web-editor/), [full reference](https://docs.arduino.cc/llms-full.txt), 2026-08-26）。
- `[primary source]` Cloud の device は physical board の “virtual twin” で、official/third-party board、Wi-Fi crypto、credential-based ESP32、LoRa、Ethernet、cellular、manual Python/MicroPython/JavaScript device type を扱う（[Device types](https://docs.arduino.cc/arduino-cloud/hardware/devices/), 2026-08-26）。generic ESP32/ESP8266 を “wide range” とするが S3/C3/C6 ごとの公開 denominator は得られなかった（[ESP32/ESP8266](https://docs.arduino.cc/arduino-cloud/hardware/wifi/), 2026-08-26）。
- `[primary source]` Arduino hardware catalog には ESP32-C6 の Nesso N1、RP2040 の Nano RP2040 Connect、nRF 系 Nano、STM32 系 GIGA/UNO Q MCU などがある。ただし hardware catalog 掲載を Cloud Editor/App Lab support と同一視しない（[Arduino full reference](https://docs.arduino.cc/llms-full.txt), 2026-08-26）。Seeed XIAO、M5Stack、RP2350 の target-product support は `not found in docs`。
- `[primary source]` App Lab の Linux image flasher docs は **“These instructions apply to the UNO Q only. Support for VENTUNO Q will be introduced in upcoming … releases.”** とする。これは公開 docs が現行対応として直接名指す集合では 1 board = UNO Q、VENTUNO Q は upcoming という証拠であり、App Lab 内部に非公開の別 support がないことまでは証明しない（[Flash Linux image](https://docs.arduino.cc/software/app-lab/configure/flash/), 2026-08-26）。
- `[primary source]` RS485/Modbus RTU は対象 ecosystem に具体例がある。MKR WiFi 1010 + MKR 485 Shield + Modbus energy meter で Arduino Cloud dashboard に power consumption を送る（[Monitor Your Energy Bill with Modbus](https://docs.arduino.cc/tutorials/mkr-wifi-1010/energy-bill-modbus-cloud/), 2026-08-26）。これは protocol/register logic を利用者 sketch/library が担う例で、Cloud の universal register-map model ではない。
- `[primary source]` MKR 485 Shield 自体は legacy industrial systems の RS-485 接続を掲げる（[MKR 485 Shield](https://docs.arduino.cc/hardware/mkr-485-shield/), 2026-08-26）。Modbus TCP、CAN/CANopen、4-20 mA、0-10 V、IO-Link、pulse counter、industrial encoder は target docs で `not found in docs`。

### Extensibility、compile、flash、backend、UI

- `[primary source]` Cloud Editor は local sketchbook と custom libraries の一括 import を持つ（[Importing files](https://docs.arduino.cc/arduino-cloud/cloud-editor/importing-sketches/), 2026-08-26）。公開 docs から board package/library の version lock、compile queue、resource limit は得られなかった。
- `[primary source]` Cloud Agent は PC に install する plugin で、browser と board の serial を結び、upload と serial read/write を行う。Cloud で device を program する requirement と明記される（[Cloud Agent](https://docs.arduino.cc/arduino-cloud/getting-started/technical-reference/), 2026-08-26）。compatible board は OTA upload も可能（[OTA](https://docs.arduino.cc/arduino-cloud/features/ota-getting-started/), 2026-08-26）。browser/OS の完全組合せ denominator は `NOT OBTAINED`。
- `[primary source]` Arduino-hosted Cloud は Thing variables と dashboards、webhook、Node-RED integration を持つ。dashboard は widgets を variable に手動 link する model で、source-analysis 自動 UI 生成ではない（[Dashboards & Widgets](https://docs.arduino.cc/arduino-cloud/cloud-interface/dashboard-widgets/), [Webhooks](https://docs.arduino.cc/arduino-cloud/features/webhooks/), [Node-RED](https://docs.arduino.cc/arduino-cloud/guides/node-red/), 2026-08-26）。Azure/AWS/GCP/local broker/self-hosted Arduino Cloud は docs で確認できなかった。generic endpoint は sketch/library による user code と vendor-hosted backend を区別する必要がある。

### App Lab 0.10 Agentic Mode と AI

- `[primary source]` 2026-08-12 の vendor announcement は Agentic Mode を MCP と integrated App CLI で構成し、workspace を理解して files を create/edit、App を run/stop、live errors を解釈し、App Lab/Apps/Bricks/Sketches の知識を持つとする（[Arduino App Lab 0.10: Meet Agentic Mode](https://blog.arduino.cc/2026/08/12/arduino-app-lab-0-10-meet-agentic-mode/), 2026-08-26）。検索 snippet ではなく本文 HTTP 200 を取得した。
- `[primary source]` provider key は BYOK。announcement は initial provider を Claude とし、additional providers を予定する。同時に language server が Arduino sketch、Python、HTML、CSS、JavaScript を横断して autocomplete、format、hover、go-to-definition、references を提供する。UNO Q の SBC mode では language server unavailable と明記される（同 URL、2026-08-26）。
- `[primary source]` 0.10 release note は Agentic Coding、Language Server、examples 再編、UI update を確認する（[release note](https://docs.arduino.cc/software/app-lab/release-notes/release-0-10/), [official raw source](https://raw.githubusercontent.com/arduino/docs-content/main/content/software/app-lab/9.release-notes/04.release-0-10/content.md), 2026-08-26）。
- `[primary source]` App Lab custom Brick は custom Python package と Docker service を追加できる（[Custom Bricks](https://docs.arduino.cc/software/app-lab/tutorials/custom-bricks/), 2026-08-26）。これは unsupported field sensor が自動対応されることを意味せず、利用者が Brick/code を作る拡張点である。

### Reproducibility と golden scenario

- `[primary source]` 正の証拠は Cloud Editor の引用 **“all board packages & libraries available without download”** と cloud compiler である。
- `[NOT OBTAINED]` vendor が board×toolchain×library×version の組合せを検証し、その exact version set を利用者の代わりに維持・lock するという文は、Cloud Editor/App Lab docs と 0.10 announcement で見つからなかった。`[inference]` したがって managed convenience は確認できるが、求める verified reproducibility contract までは証明できない。
- `[inference]` Golden scenario は MKR/ESP32 側の user sketchで Modbus register を読み、Arduino Cloud dashboard に送るところまでは一次資料で到達する。Azure または Raspberry Pi の generic MQTT broker/DB/dashboard を選ぶ場合は user firmware/integration が必要。App Lab Agentic Mode は作成支援にはなるが、Modbus/device/backend を自動供給する根拠はない。

## 2. PleaseDontCode

### Boards と device model

- `[primary source]` landing page は **35+ supported boards** とする（[PleaseDontCode](https://pleasedontcode.com/), 2026-08-26）。`[command+RC]` 公開 carousel の固有 board 名を DOM から集計すると 33 names / RC 0 だった。公開名は Arduino Nano ESP32、ESP32 DevKit V1、XIAO ESP32S3、ESP32-S3-Box、Firebeetle 2 ESP32-S3、ESP32S3 Dev Module、ESP32 Wrover、ESP32-WROOM-DA、Adafruit QT Py ESP32-C3、DOIT ESP32 DEVKIT V1、AI Thinker ESP32-CAM、ESP32-H2-DevKitM-1、ESP32-C6-DevKitC-1、Geekble Mini ESP32-C3、OLIMEX ESP32-C3-DevKit-Lipo、ESP32-S3 UNO、ESP8266 NodeMCU、M5Stack-CoreS3、Raspberry Pi Zero 2W、WEMOS LOLIN32 Lite、LOLIN S2 Mini、Arduino Uno、Pro Mini 3.3V/5V、Nano、Mega、Nano33BLE、Opta Lite/WiFi、Duemilanove、UNO Q、Nano33IoT、UNO R4 WiFi。これは claim denominator 35+ の complete list ではない。
- `[primary source]` board、sensor、actuator を選び prompt を与えると、code と wiring schematic を生成し、pin conflict、voltage mismatch、required library を hardware-aware に扱うと説明する。既存 `.cpp/.c/.h/.zip` の upload も記載する（同 landing、2026-08-26）。device model は protocol/register map ではなく selected parts + libraries + prompt である。

### Industrial、compile/flash、POTA、UI

- `[NOT OBTAINED]` product docs/landing/POTA README では RS485、Modbus RTU/TCP、CAN/CANopen、4-20mA、0-10V、IO-Link、pulse counter、industrial encoder を確認できなかった。vendor blog sitemap には一般解説タイトル “Understanding RS-485…” / “CAN Bus…” があったが、該当 fetch は HTTP 429 であり、一般記事の存在を product support に数えていない。
- `[primary source]` cloud compile、library selection、compile error の複数回 auto-repair、binary retention、browser Web Serial flash を説明する。desktop Chrome/Edge を指定し、別 agent 不要とする（[landing](https://pleasedontcode.com/), 2026-08-26）。queue/limit、exact compiler/core/library versions、arbitrary custom board method は `NOT OBTAINED`。
- `[primary source]` POTA は最初の USB upload 後に Wi-Fi OTA、HTTPS/WebSocket、vendor cloud dashboard を提供する。official repository は ESP32 variants including XIAO/Nano、ESP8266、Opta WiFi を列挙し、Arduino Library Manager、GitHub release ZIP、git clone の導入法を示す（[POTA README](https://raw.githubusercontent.com/pleasedontcode/POTA/main/README.md), [POTA page](https://pleasedontcode.com/programming-over-the-air/), 2026-08-26）。
- `[primary source]` README は dashboard の widget types を 33 個列挙し、bidirectional WebSocket を説明する。landing は project global variables を code から解析して widget 候補を提案し、利用者が追加・配置する流れを説明する。これは対象中で source-derived dashboard suggestion に最も近いが、完全自動 Web UI generation ではない（同 sources、2026-08-26）。
- `[NOT OBTAINED]` generic MQTT、Azure/AWS/GCP、local/self-hosted server、database、Home Assistant は product docs で見つからなかった。POTA は vendor-hosted HTTPS/WebSocket route である。

### AI、reproducibility、golden scenario

- `[primary source]` vendor は hardware-aware AI、schematic/code sync、compile-and-repair、各 chat change の version snapshot を説明する（landing、2026-08-26）。whole-project の厳密範囲、provider、BYOK、vendor-maintained knowledge-base update policy は `NOT OBTAINED`。
- `[NOT OBTAINED]` **“verified firmware” / “hardware-verified”** という marketing 表現に対し、公開資料で確認できた mechanism は compiler repair、pin/library/electrical checks、schematic sync までで、board×toolchain×library×version matrix または real-hardware test protocol は得られなかった。
- `[inference]` Golden scenario は prompt で code を作れる可能性はあるが、公開証拠は Modbus/RS485 と generic MQTT の両方の手前で途切れる。POTA を使えば vendor cloud OTA/dashboard に別経路で到達するが、指定された Azure/RPi/Mosquitto/Node-RED/DB chain の実装証拠ではない。

## 3. Codey Online

### Boards、component catalog、industrial

- `[primary source]` `/boards` の schema.org ItemList は **12 boards**: ESP32-C3 OLED、ESP32-C3 Super Mini、ESP32-S3 N16R8、ESP32-WROOM-32U、ESP8266 D1 Mini Pro/V2/V4、Arduino Mega、Nano、UNO、UNO R4 WiFi、ESP32 DevKit V1（[boards](https://codey.online/boards), 2026-08-26）。C6、XIAO、M5Stack、RP2040/RP2350、nRF、STM32、Linux SBC/Pi はこの 12-item list にない。
- `[primary source]` sitemap と component list の canonical English detail pages は **79 component detail URLs**（[components](https://codey.online/components), [sitemap](https://codey.online/sitemap.xml), 2026-08-26）。device model は component catalog + libraries + project files。
- `[primary source]` MAX485 page は TTL UART↔RS-485 transceiver、A/B differential bus、UNO wiring、compile-checked example を掲載する（[MAX485](https://codey.online/components/max485-ttl-to-rs485-converter-module), 2026-08-26）。Modbus RTU/TCP の register/function model は `not found in docs`。
- `[primary source]` MCP2515 CAN module と 0-10 V PWM-to-voltage converter は pinout/wiring/example とともに掲載される（[MCP2515](https://codey.online/components/can-bus-module-mcp2515-spi-5v), [0-10 V converter](https://codey.online/components/pwm-naar-voltage-converter-module-0-10v), 2026-08-26）。CANopen、4-20mA、IO-Link、pulse counting、industrial encoder は 79-page catalog と主要 feature docsで `not found in docs`。

### IDE、AI、compile/flash、backend/UI

- `[primary source]` browser IDE は multi-file/multi-board project、Agent/Plan/Ask modes、AI file create/edit、library picker、missing-library auto-install、snapshot/rollback、board electrical warnings、image input を説明する（[AI Arduino IDE](https://codey.online/ai-arduino-ide), 2026-08-26）。
- `[primary source]` server-side compile は `arduino-cli`、USB flash は Web Serial で Chrome/Edge、AVR と ESP32 WROOM/S3/C3、OTA は ESP32/ESP8266 の初回 USB 後 Wi-Fi とされる（[Program ESP32 with AI](https://codey.online/program-esp32-with-ai), 2026-08-26）。queue/limits は `NOT OBTAINED`。
- `[primary source]` AI は firmware web server、MQTT、BLE code を生成できるとする。これは firmware が endpoint と話す能力であり、Codey が Azure/AWS/GCP/local broker/DB/dashboard を host する証拠ではない（同 URL、2026-08-26）。hosted backend/dashboard は `not found in docs`。
- `[primary source]` project から wiring diagram は生成される。Web page は prompt で firmware に生成できるが、source analysis に基づく hosted UI/dashboard generation は確認できなかった。
- `[NOT OBTAINED]` provider、BYOK、knowledge-base update policy、proxy/offline/air-gap/admin/self-host は公開 docs で確認できなかった。

### Reproducibility と golden scenario

- `[primary source]` vendor は **“most popular … libraries are pre-installed”**、**“No ZIPs, no version conflicts”**、**“No toolchains, no SDKs, no updates to install”** と cloud environment を説明する（[AI Arduino IDE](https://codey.online/ai-arduino-ide), 2026-08-26）。
- `[NOT OBTAINED]` actual library/core/toolchain versions、per-project lockfile、verified board×toolchain×library matrix は公開されていない。`[inference]` managed environment の正の証拠はあるが、再現可能性の強い contract は証明されない。
- `[inference]` Golden scenario は MAX485 physical interface と generic MQTT firmware generation まで資料がある。Modbus register mapping、Azure/RPi broker、storage、dashboard は利用者が供給する。

## 4. Embedder

### Hardware denominator と device model

- `[primary source]` current supported-hardware docs は **590+ platforms across 13 manufacturers** と明記する。内訳例は STM32 150+、NXP 80+、Nordic 60+、Espressif 30+、Raspberry Pi 30+、Arduino 30+、AVR 60+。source of truth は project setup picker で catalog は client release なしに更新される（[Supported hardware](https://docs.embedder.com/supported-hardware), 2026-08-26）。marketing home の “500+ MCUs” より current docs の denominator が大きい。
- `[primary source]` Espressif page は S2/S3/C2/C3/C5/C6/C61/H2/P4 等、Raspberry page は RP2040/RP2350A/RP2350B と Linux computers、Nordic page は 60+、ST page は 150+ を列挙する。Seeed XIAO は catalog text 内で確認でき、M5Stack は `not found in docs`（[Espressif](https://docs.embedder.com/supported-hardware/espressif), [Raspberry Pi](https://docs.embedder.com/supported-hardware/raspberry-pi), [Nordic](https://docs.embedder.com/supported-hardware/nordic), [ST](https://docs.embedder.com/supported-hardware/st), 2026-08-26）。
- `[primary source]` peripheral docs は **5,850+ parts / 11 categories**。counted categories は converter 2,270+、power 1,720+、sensor 860+、driver 490+、wireless 260+、memory 80+、display 60+、connector 50+、加えて interface/dev-board/electromechanical（[Peripherals](https://docs.embedder.com/supported-hardware/peripherals), 2026-08-26）。marketing “4,000+ peripherals” より current docs が大きい。
- `[primary source]` catalog 外 platform/peripheral は PDF datasheet、schematic EDA data を upload して hardware context にできる。ただし custom platform は driver/flash backend を自動作成せず、custom peripheral の docs indexing と driver implementation/verification は別工程（[Add a peripheral](https://docs.embedder.com/core-concepts/add-peripheral), [Supported hardware](https://docs.embedder.com/supported-hardware), 2026-08-26）。

### Industrial、AI/HIL、compile/write、UI/backend

- `[primary source]` converter catalog は RS-485/RS-232 60+ transceivers を持ち、4-20mA の例として DAC7750 がある（[Converter catalog](https://docs.embedder.com/supported-hardware/peripherals/converter), 2026-08-26）。これは protocol stack ではなく parts/datasheets の support。
- `[primary source]` CAN monitor は classic CAN/CAN-FD、SLCAN/fdcanusb、DBC/KCD/SYM/ARXML を扱う。docs は **CANopen/J1939 等の higher-layer protocol は project information が必要で raw CAN traffic から infer できない** と明記する（[CAN](https://docs.embedder.com/debug-mode/can), 2026-08-26）。Modbus RTU/TCP、0-10V、IO-Link、pulse counter、industrial encoder は `not found in docs`。
- `[primary source]` agent は repository source、indexed datasheets/reference manuals/errata、schematics、Monitor history/instruments を必要に応じて読む。`/init` は既存 repo の build/test/debug/flash/observation workflows を inspect し、利用者に確認させる（[Quickstart](https://docs.embedder.com/quickstart), 2026-08-26）。whole-project/hardware knowledge の正の証拠である。
- `[primary source]` connected board があれば agent は user の installed vendor tools/probe と project command を使い build/flash/runtime observation を行う。remote bridge は別 machine の bench を使える（[Automated testing](https://docs.embedder.com/solutions/automated-testing), [Remote bridge](https://docs.embedder.com/integrations/remote-bridge), 2026-08-26）。cloud compiler service ではない。
- `[primary source]` project Monitor の dashboard は agent が operator task/live channels を基に JavaScript sandbox file として生成でき、plots/readouts/controls/hardware commands を持つ。sandbox は network access を許さない（[Dashboards](https://docs.embedder.com/core-concepts/dashboards), 2026-08-26）。これは開発時 instrument dashboard であり deployed IoT Web UI/backend ではない。
- `[primary source]` local OpenAI-compatible endpoints（Ollama、LM Studio、vLLM、llama.cpp）を接続でき、hosted provider/subscription integrations もある（[Local models](https://docs.embedder.com/integrations/local-models), [Model providers](https://docs.embedder.com/integrations/model-providers), 2026-08-26）。credential 値は取得・記録していない。
- `[primary source]` vendor marketing は SaaS、customer VPC、on-premises、air-gapped deployment を掲げる（[Embedder](https://embedder.com/), [Company transcript](https://embedder.com/llms-transcript.txt), 2026-08-26）。proxy support は `not found in docs`。

### Reproducibility と golden scenario

- `[primary source]` board skill docs は verified pinout/boot/connector/tooling context を提供する一方、**“does not mean every debugger or flasher works … installed vendor tools, probe, target metadata, OS, and licenses still determine”** と制約する（[Supported hardware](https://docs.embedder.com/supported-hardware), 2026-08-26）。
- `[inference]` Embedder の HIL は connected bench で結果を観測する verification loop であり、利用者に代わり board×toolchain×library version environment を vendor が提供・lock する model ではない。公開資料はむしろ既存 repo/toolchain を検出・利用すると説明する。したがって core-value 次元は **negative finding**。
- `[inference]` Golden scenario では ESP32/RS485 part docs/MQTT library を含む既存 project を読み、firmware を生成し、bench があれば flash/test できる。しかし Modbus device/register support、Azure/RPi/DB、deployed dashboard は利用者 project の責任で、Embedder platform自体はその runtime chainを hostしない。

## 5. Viam

### Hardware/resource model と registry extensibility

- `[primary source]` Viam は board、sensor、motor、encoder 等の standard resource API と、`namespace:family:model` の model identifier を使う。unsupported hardware は custom driver module で同じ API を実装する（[Driver module](https://docs.viam.com/build-modules/write-a-driver-module/), [Board API](https://docs.viam.com/reference/components/board/), [Sensor API](https://docs.viam.com/reference/components/sensor/), 2026-08-26）。
- `[primary source]` public registry module は machine `CONFIGURE` から追加でき、declarative `modules` block を `viam-server` が package service から download/cache し separate process で実行する。stable semantic version `>=1` と OS/architecture を確認し、production は specific version pin、development は latest を推奨する（[Use registry modules](https://docs.viam.com/build-modules/use-registry-modules/), [Module anatomy](https://docs.viam.com/build-modules/module-anatomy/), 2026-08-26）。依存 resource は declaration、module package の dependencies は隔離できる。
- `[NOT OBTAINED]` `app.viam.com/registry` は HTTP 200 だが client-rendered shell で、public module/model の総 denominator を得られなかった。account interaction は行っていない。
- `[primary source]` `viam-server` は Linux/macOS/Windows compute に導入され、Pi、Jetson、その他 SBC の guides がある（[First machine](https://docs.viam.com/set-up-a-machine/first-machine/), 2026-08-26）。micro-RDK MCU docs が明記する support は **ESP-32-WROVER Series** と minimum resource requirements で、S3/C3/C6、XIAO、M5Stack、RP2、nRF、STM32 は micro-RDK support として `not found in docs`（[micro-RDK ESP32](https://docs.viam.com/reference/components/board/micro-rdk/esp32/), 2026-08-26）。

### Industrial、backend/UI、AI、offline

- `[primary source]` CAN は Raspberry Pi + PiCAN + custom module の tutorial があり、Viam standard API operation を CAN frames に変換する（[CAN bus tutorial](https://docs.viam.com/tutorials/custom/controlling-an-intermode-rover-canbus/), 2026-08-26）。CANopen、RS485/Modbus RTU/TCP、4-20mA、0-10V、IO-Link は target docs で `not found in docs`。board tickers と encoder resource は documented だが、industrial encoder family catalogではない。
- `[primary source]` Viam data management は local buffer/capture と Cloud sync、query、own MongoDB への sync path を持つ（[Sync data](https://docs.viam.com/data/sync-data-to-your-database/), 2026-08-26）。Viam-hosted dashboard は widgets を手動追加する read-only visualization、control は別 teleoperation workspace/custom app で構成する（[Dashboards](https://docs.viam.com/monitor/dashboards/overview/), [Create dashboard](https://docs.viam.com/monitor/dashboards/create-dashboards/), 2026-08-26）。source-analysis automatic UI は `not found in docs`。
- `[primary source]` AI assistant は current machine configuration、validation error/log、Viam docs、module registry を読み、plain language から components/services/modules/remotes/triggers の staged edit を提案し、Save まで machine に適用しない（[AI assistant](https://docs.viam.com/hardware/ai-assistant/), 2026-08-26）。whole source project、MCU toolchain、board KB、BYOK の evidence はこの feature docs にはない。
- `[primary source]` module package が cache 済みであれば network outage 中も local `viam-server` と components は動作し、Cloud config/sync/remote access は中断する（[Use registry modules](https://docs.viam.com/build-modules/use-registry-modules/), [viam-agent/server](https://docs.viam.com/set-up-a-machine/viam-agent-and-server/), 2026-08-26）。Viam Cloud の self-host/air-gap/proxy は `NOT OBTAINED`。

### Reproducibility と golden scenario

- `[primary source]` module semantic version pin、package cache、platform compatibility、manifest/build process は再現性に有効な正の mechanism である。
- `[inference]` ただしこれは registry module/runtime の version management であり、MCU board×toolchain×library matrix を vendor が検証・維持する契約ではない。core-value 次元の positive evidence には数えない。
- `[inference]` Golden scenario は Pi/Linux local compute と Viam Cloud/data/UI/control は強いが、inverter Modbus→ESP32 は custom driver/module を利用者が供給する必要がある。generic MQTT/Azure route は target docs で first-class path として確認できない。

## 6. ESPHome / ESPHome Device Builder

### Boards と component denominator

- `[primary source]` ESP32 platform docs は **13 variants** を見出しとして列挙する: ESP32、S2、S3、C2、C3、C5、C6、C61、H2、P4、S31、H4、H21。`variant` を推奨し、legacy `board` は PlatformIO board ID を使う（[ESP32](https://esphome.io/components/esp32/), [official source](https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/esp32.mdx), 2026-08-26）。
- `[primary source]` RP2 は RP2040 と RP2350 を明記し、Pico/Pico 2、framework-supported board を扱う。docs は Seeed XIAO RP2040 の UART note も持つ（[RP2](https://esphome.io/components/rp2/), 2026-08-26）。nRF52 docs は XIAO BLE board ID を含み、Linux は host platform を持つ（[nRF52 source](https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/nrf52.mdx), [Host](https://esphome.io/components/host/), 2026-08-26）。M5Stack の finite support list は `NOT OBTAINED`。
- `[command+RC]` official `esphome/esphome` `dev` tree JSON から `type=tree` かつ `esphome/components/<one-level>` を数えると **742 top-level component directories / scanned 742 / distinct 742 / RC 0**（[Git tree API](https://api.github.com/repos/esphome/esphome/git/trees/dev?recursive=1), 2026-08-26）。これは sensor/device の catalog denominator ではなく、platform、transport、helper も含む source-code component directory proxy。board 数へ転用できない。

### Industrial chain

- `[primary source]` Modbus component は UART 上の **RTU**、MAX485 等の flow-control pin、120 Ω termination、client/server role を文書化する。`modbus_controller` は RS485 connection で coils、inputs、holding/input registers を sensors/switches/selects/numbers/outputs にし、custom command も扱う（[Modbus](https://esphome.io/components/modbus/), [Modbus Controller](https://esphome.io/components/modbus_controller/), 2026-08-26）。これは golden inverter register mapを YAMLに明示して読む mechanism。
- `[primary source]` CAN bus は internal ESP32 TWAI と component platformsを扱う（[CAN bus](https://esphome.io/components/canbus/), 2026-08-26）。CANopen は `not found in docs`。
- `[primary source]` `pulse_counter` は ESP32 hardware PCNT を利用でき、`rotary_encoder` component もある（[Pulse Counter](https://esphome.io/components/sensor/pulse_counter/), [Rotary Encoder](https://esphome.io/components/sensor/rotary_encoder/), 2026-08-26）。Modbus TCP、4-20mA、0-10V、IO-Link は `not found in docs`。

### Extensibility、compile/flash、backend/UI

- `[primary source]` external components は local path または Git URL/ref を取り、`refresh` interval を持つ。packages は local/URL/Git shorthand、`ref`、`refresh`、substitution を持つ（[External Components](https://esphome.io/components/external_components/), [Packages](https://esphome.io/components/packages/), 2026-08-26）。unsupported device は Python/C++ external component を利用者が実装できる。
- `[primary source]` compile は local。Device Builder は Home Assistant app、macOS/Windows/Linux desktop、pip、official Docker image で動き、Desktop は bundled Python environment を初回設定する（[Install](https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/install/index.mdx), [Docker](https://esphome.io/install/docker/), 2026-08-26）。ESP32 は default ESP-IDF integration の automatic framework installation/environment management と `recommended` / exact / dev / latest version options を持つ（[ESP32](https://esphome.io/components/esp32/), 2026-08-26）。cloud queue はない。
- `[primary source]` first install は USB、以後 OTA。Device Builder または CLI が uploadする。Docker/macOS は containerにUSB passthroughできないが dashboard web pathで flash可能と docs にある（[Getting started source](https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/install/getting-started.mdx), [OTA](https://esphome.io/components/ota/), [Docker](https://esphome.io/install/docker/), 2026-08-26）。Web Serial の browser/OS 完全 matrix は `NOT OBTAINED`。
- `[primary source]` generic MQTT broker、HTTP request、Home Assistant native API が documented。MQTT は ESP32/ESP8266/BK72xx/LN882H/RTL87xx、example broker は local network addressを使う（[MQTT](https://esphome.io/components/mqtt/), [HTTP Request](https://esphome.io/components/http_request/), [Native API](https://esphome.io/components/api/), 2026-08-26）。vendor-hosted cloud は必須ではない。Azure/AWS/GCP/DB は generic protocol の先を利用者が構成する。
- `[primary source]` Getting Started は **“Anything you define - sensors, switches, lights, displays - appears automatically in Home Assistant's user interface.”** とする。device `web_server` も configured entities の simple browser UI/REST APIを生成し、CSS/JSをlocal embedして no-internet UIにできる（[Getting started](https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/install/getting-started.mdx), [Web Server](https://esphome.io/components/web_server/), 2026-08-26）。これは config-driven UI generation で、arbitrary C++ source analysis ではない。
- `[NOT OBTAINED]` product AI coding assistant、vendor hardware-aware LLM、BYOK は公式 docs/repositories で確認できなかった。

### Reproducibility、offline、golden scenario

- `[primary source]` framework recommended/exact version、container tags、Git `ref`、config files は version control 可能で、build environment management の正の mechanism がある。
- `[inference]` 一方 arbitrary external components/packages を movable branch と `refresh` で参照でき、vendorが各 board×component×version combination を検証するという文はない。したがって deterministic lock は利用者の ref/container/version 選択に依存し、vendor-managed verified matrix の claim は `NOT OBTAINED`。
- `[primary source]` open-source local Docker/Desktop/HA deployment と local broker/Home Assistant/device web UI により self-hosted/local operation が可能。device UI は embedded CSS/JSなら no-internet で動く。fresh build の dependency cacheを含む完全 air-gap/proxy/admin policy は `NOT OBTAINED`。
- `[inference]` Golden scenario は inverter register mapを `modbus_controller` sensors/binary sensors にし、ESP32から generic MQTT brokerまたは Home Assistant APIへ出し、local UIに自動出現させるところまで直接 documented。Azure ingress、Mosquitto以降のDB、Node-RED dashboardは利用者構成。

## Competing hypotheses と evidence boundary

### H1: 「catalog が広ければ golden scenario も完成する」対「protocol/backend が別の層」

- H1a: Embedder 5,850+ parts、Codey 79 pages、PleaseDontCode 35+ boards の広い catalog は、unsupported device の確率を下げる。
- H1b: Golden scenario の難所は board count ではなく、Modbus register semantics、backend persistence、UI/control の接続である。
- 観測: ESPHome は board-count claim が最も大きいわけではないが Modbus register→entity→MQTT/HAを直接文書化する。一方 Embedder/Codey は physical partを扱っても runtime backendまで提供しない。
- `[inference]` 今回の証拠は H1b を強く支持する。ただし account 内 private catalog に完成済み Modbus driverがある可能性は排除できない。

### H2: 「cloud compile = reproducible」対「versioned verified matrix が別途必要」

- H2a: Arduino/PleaseDontCode/Codey の cloud compilerは local setup driftを減らす。
- H2b: compiler serviceの存在だけでは exact core/library/toolchain versions、per-project lock、再build保証は分からない。
- 観測: 3 vendorとも environment convenienceを明記するが、board×toolchain×library×version の maintained verified matrixを引用できなかった。ESPHomeは version knobs、Viamは module semver pinを公開するが別の対象を管理する。Embedderは existing toolchain/probe依存を明記する。
- `[inference]` H2a と H2b は両立する。今回の資料から「便利」以上の強い reproducibility claimを採用できない。

### H3: 「AIが whole projectを理解する」対「config/catalogに限定される」

- Arduino App Lab と Embedder は workspace/repository/filesを読む一次資料がある。
- Codey は multi-file project、PleaseDontCodeは uploaded sourceとgenerated project、Viamは current machine configuration/docs/registryを読む。
- `[inference]` “AIあり” を一列に比較すると scope差を失う。Viam AIは config editor、Embedderは firmware/HIL agent、App Labは app workspace agent、PDC/Codeyは generation IDEである。
- 未分離: accountに入らず context-window limits、binary/generated files、monorepo size、real multi-file accuracyは測れない。

## Not found in docs ≠ unsupported

下表の absence は support 不在の断定ではない。settling evidence は vendor docs の対象 feature page、公開 support list、公開 registry result、または account内での non-transactional UI確認である。

| target | 今回 `not found in docs` とした項目 | 調べた範囲 | 何があれば settle するか |
|---|---|---|---|
| Arduino Cloud/App Lab | Cloud board有限総数、ESP32 S3/C3/C6 variant support、XIAO/M5/RP2350、Modbus TCP、CAN/CANopen、4-20mA、0-10V、IO-Link、pulse/encoder、Azure/AWS/GCP/local broker/self-host、air-gap/proxy、verified matrix | docs llms-full、canonical Cloud/App Lab pages、0.10 post/release source、hardware catalog | Cloud Editor board picker export/support table、compiler manifest/lock docs、App Lab supported-board matrix、backend/offline admin docs |
| PleaseDontCode | RS485/Modbus、CAN/CANopen、analog industrial I/O、IO-Link/pulse/encoder、generic MQTT、hyperscaler/local backend、arbitrary custom board、provider/BYOK、offline/self-host/proxy、verified matrix | landing、POTA page/repository、tutorial index、public sitemap、GitHub org。4 blog fetchは429 | product docs/search result in signed-in UI、generated project test with MAX485/Modbus library、board/library/toolchain manifest、backend connector docs |
| Codey | Modbus、CANopen、4-20mA、IO-Link/pulse/encoder、catalog外 board、hosted backend/dashboard、provider/BYOK、enterprise/offline、verified matrix | landing、12-board list、79 component URLs、two feature pages、three industrial part pages | IDE board/library picker、account project compile manifest、official connector/dashboard docs、support list export |
| Embedder | Modbus、0-10V、IO-Link/pulse/encoder、M5Stack、IoT backend、deployed web UI、proxy、vendor-managed compile matrix | 84-URL sitemapからhardware/peripheral/CAN/HIL/dashboard/model/remote docs、home/transcript、official GitHub org | catalog picker query/export、protocol skills/modules docs、enterprise deployment guide、reproducibility/SBOM/toolchain contract |
| Viam | registry denominator、modern ESP32 variants、RP2/nRF/STM32 micro runtime、RS485/Modbus、CANopen、industrial analog/IO-Link、MQTT/Azure first-class connector、auto UI、BYOK、Cloud self-host/air-gap/proxy | docs sitemap、registry shell、resource/module/micro-RDK/CAN/data/dashboard/AI/offline docs | public registry API/search export、account registry query、official module README、enterprise architecture docs |
| ESPHome | M5Stack finite list、Modbus TCP、CANopen、4-20mA、0-10V、IO-Link、product AI、complete browser matrix、fresh-build air-gap、vendor-verified matrix | 896-URL sitemap、official docs source tree、742 core component dirs、platform/protocol/backend/UI/install docs | official component page/source directory with protocol, supported-board export, release/container dependency manifest and air-gap guide |

## What I could not determine and why

### Accountを使わずに確定できなかったもの

1. `[NOT OBTAINED]` Arduino Cloud Editor の実際の board picker全件、installed core/library exact versions、compile queue/limits、Cloud Agentの browser×OS matrix。公開 docs は概念と例を示すが current picker exportを提供しない。
2. `[NOT OBTAINED]` PleaseDontCode の「35+」の残り少なくとも2 board、product内 Modbus/RS485/library search、compiler manifest、AI provider。公開 carouselは33 unique names、blog fetchはHTTP 429。
3. `[NOT OBTAINED]` Codey の project settings内 toolchain/library versions、catalog外 board登録、AI provider、generated MQTT projectの実際の library/version。
4. `[NOT OBTAINED]` Embedder catalog pickerのexact 590+ platform / 5,850+ part全件、customer deployment controls、HIL claimの成功率/coverage。docsはaggregate denominatorを出すがfull exportとlabを公開しない。
5. `[NOT OBTAINED]` Viam public registry totalとModbus module有無。`app.viam.com/registry` はHTTP 200のclient-rendered shellで、account interactionを禁止したためUI検索しなかった。
6. `[NOT OBTAINED]` ESPHomeの742 source component dirsのうち「具体device driver」だけの分類数。directory taxonomyはplatform/helper/transportも含み、誤ったdevice denominatorを作らないため分類推定をしなかった。

### Human tests（account/payment/個人情報をこの調査では使わない）

| vendor | screen | Humanが試すこと | settleするclaim |
|---|---|---|---|
| Arduino Cloud | Cloud Editor new sketch board picker / Libraries / compile details | board listをexportまたは画面記録し、S3/C3/C6、XIAO、M5、RP2350を検索。blank sketchをcompileしcore/library version表示とrebuild pinの有無を記録 | board denominator、modern boards、version lock/reproducibility |
| Arduino App Lab | Settings / provider / board connection / project import | 0.10でprovider keyがlocal/vendorどちらに保存されるか、multi-file edit、UNO Q以外のboard picker、offline時のagent/editorを確認 | BYOK data path、whole-project、board/offline scope |
| PleaseDontCode | board/library/sensor picker、new project、POTA dashboard | `MAX485`, `ModbusMaster`, `ArduinoModbus`, `PubSubClient`を検索。ESP32-S3でcompileしartifact versionsを記録。global variableからwidget提案まで観測 | industrial/MQTT、library/version、automatic UI scope |
| Codey | board/library picker、Agent project、compile log | catalog外board追加可否、`ModbusMaster` + MAX485 + MQTT multi-file generation、compile log versions、dashboard/backend menu有無を確認 | Modbus、extensibility、reproducibility、backend/UI |
| Embedder | project setup hardware picker、Monitor、deployment/admin docs | 590+ catalogをfilter/export、Modbus/CANopen/M5を検索。known firmware repo+benchでbuild/flash/runtime evidenceを分けて記録 | exact catalog、protocol skills、HIL scope |
| Viam | public Registry search、machine CONFIGURE | `modbus`, `rs485`, `mqtt`, target ESP32 variantsを検索し、module model/version/platform/READMEを記録。module pin後にnetwork断でcached startを確認 | registry denominator/content、industrial modules、offline cache |
| ESPHome | local Device Builder / CLI | golden YAMLをvalidate/compileし、binary dependency versionsを保存。Home Assistant entity auto-discovery、local web UI、MQTT broker、network断後のrebuildを別々に観測 | real compile、UI、backend、offline/reproducibility |

`STOP_IF` に従い、上記 Human tests は実行していない。account creation、trial、個人情報入力、transactionはゼロ。

## Where a vendor's marketing and its documentation disagree

1. **PleaseDontCode board count:** `[primary source]` marketingは35+、同じ公開ページから観測できる固有名は33。これは直接矛盾ではなく、visible listがcompleteでない可能性があるため「分母未完」とした。
2. **PleaseDontCode verification strength:** `[primary source]` marketingの “verified firmware” / “hardware-verified” に対し、公開technical materialで確認できたのはcompile auto-repair、pin/voltage/library checking、schematic sync。real-hardware verification protocolまたはversioned matrixは `NOT OBTAINED`。claimを否定せず、documented mechanismとのgapとして扱う。
3. **Codey MAX485 page internal disagreement:** `[primary source]` page本文/schemaはRS-485 bus-side **A/B** と説明する一方、pinout tableの該当二行は **CAN-L/CAN-H** と表記し、同ページのwiring JSON/code commentは再びA/Bを使う（[MAX485](https://codey.online/components/max485-ttl-to-rs485-converter-module), 2026-08-26）。これは product capabilityではなく公開docsの内部不整合。
4. **Embedder counts:** `[primary source]` marketingは500+ MCUs / 4,000+ peripherals、current docsは590+ platforms / 5,850+ parts。後者が大きく、coverageが減った矛盾ではない。unitも “MCUs” と “platforms” が異なるため同じcountとして差し引かない。
5. **Embedder “every change verified on real silicon”:** `[primary source]` marketing表現に対し、docsはconnected hardware、installed tools/probe、target metadata、OS/licensesに依存すると明記する。`[inference]` technical docsはmarketingを条件付きに狭める。
6. **Arduino、Viam、ESPHome:** `[primary source]` 上記対象pagesについてmarketing headline、technical docs、release/sourceを照合したが直接矛盾は見つけなかった。ArduinoはCloud hardware catalogとproduct support listを混同しない、Viamはregistry shellから総数を推定しない、ESPHomeは742 source dirsをdevice countと呼ばないことで、見かけの不一致を作らないようにした。

## 任意優先対象

`[NOT OBTAINED]` Wokwi、Blynk、Espressif RainMaker、PlatformIO は “if time remains” の任意対象であり、優先6対象の一次資料・fetch log・denominatorを完成させるため今回未調査。これらに関する capability 結論は本報告から出せない。

## Fetch log

`[API-smoke][command+RC]` 全行の retrieval date は **2026-08-26**。`yield=Y` は本文、index、または discovery data を得た、`N` は intended data を得なかった、`index` は capability claimではなく探索に使えた、を意味する。curl は redirect follow、timeout付き。HTTP errorでもcurl transportが完了した場合は RC 0 である。

### Discovery / index

| URL | HTTP / RC | yield |
|---|---:|---|
| https://www.arduino.cc/robots.txt | 200 / 0 | index |
| https://docs.arduino.cc/robots.txt | 200 / 0 | index |
| https://blog.arduino.cc/robots.txt | 200 / 0 | index |
| https://app.arduino.cc/ | 200 / 0 | N: client shell |
| https://pleasedontcode.com/robots.txt | 200 / 0 | index |
| https://codey.online/robots.txt | 200 / 0 | index |
| https://embedder.com/robots.txt | 200 / 0 | index |
| https://www.viam.com/robots.txt | 200 / 0 | index |
| https://docs.viam.com/robots.txt | 200 / 0 | index |
| https://esphome.io/robots.txt | 200 / 0 | index |
| https://docs.arduino.cc/llms.txt | 200 / 0 | index |
| https://docs.arduino.cc/llms-full.txt | 200 / 0 | Y |
| https://docs.arduino.cc/sitemap-index.xml | 200 / 0 | index |
| https://blog.arduino.cc/sitemap_index.xml | 200 / 0 | index |
| https://blog.arduino.cc/post-sitemap.xml | 200 / 0 | index |
| https://blog.arduino.cc/post-sitemap2.xml | 200 / 0 | index |
| https://blog.arduino.cc/post-sitemap3.xml | 200 / 0 | index |
| https://blog.arduino.cc/post-sitemap4.xml | 200 / 0 | index |
| https://blog.arduino.cc/post-sitemap5.xml | 200 / 0 | index; App Lab 0.10 URL found |
| https://www.pleasedontcode.com/sitemap.xml | 200 / 0 | index |
| https://codey.online/sitemap.xml | 200 / 0 | Y: 749 unique URLs、107 English canonical candidates、12 board / 79 component detail URLs |
| https://embedder.com/sitemap.xml | 200 / 0 | index |
| https://embedder.com/llms.txt | 200 / 0 | index |
| https://embedder.com/llms-transcript.txt | 200 / 0 | Y |
| https://www.viam.com/sitemap.xml | 200 / 0 | index |
| https://docs.viam.com/sitemap.xml | 200 / 0 | index |
| https://esphome.io/sitemap-index.xml | 200 / 0 | index |
| https://esphome.io/sitemap-0.xml | 200 / 0 | index: 896 URLs |
| https://esphome.io/llms.txt | 404 / 0 | N: 404 body |

### Arduino

| URL | HTTP / RC | yield |
|---|---:|---|
| https://blog.arduino.cc/2026/08/12/arduino-app-lab-0-10-meet-agentic-mode/ | 200 / 0 | Y: full announcement |
| https://docs.arduino.cc/software/app-lab/release-notes/release-0-10/ | 200 / 0 | Y: docs shell/metadata |
| https://raw.githubusercontent.com/arduino/docs-content/main/content/software/app-lab/9.release-notes/04.release-0-10/content.md | 200 / 0 | Y: release source |
| https://docs.arduino.cc/software/app-lab/tutorials/develop-apps/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/software/app-lab/tutorials/custom-bricks/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/software/app-lab/tutorials/network-configuration/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/software/app-lab/tutorials/setup-overview/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/software/app-lab/tutorials/manage-apps/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/arduino-cloud/getting-started/getting-started-web-editor/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/arduino-cloud/hardware/devices/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/arduino-cloud/hardware/wifi/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/arduino-cloud/getting-started/technical-reference/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/arduino-cloud/cloud-editor/importing-sketches/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/tutorials/mkr-wifi-1010/energy-bill-modbus-cloud/ | 200 / 0 | Y via docs payload/full reference |
| https://docs.arduino.cc/arduino-cloud/features/dashboard-widgets/ | 404 / 0 | N: wrong/legacy path; canonical alternative used |
| https://docs.arduino.cc/arduino-cloud/cloud-interface/dashboard-widgets/ | 200 / 0 | Y via full reference |
| https://docs.arduino.cc/arduino-cloud/features/webhooks/ | 200 / 0 | Y via full reference |
| https://docs.arduino.cc/arduino-cloud/features/nodered/ | 404 / 0 | N: wrong path |
| https://docs.arduino.cc/arduino-cloud/guides/node-red/ | 200 / 0 | Y |
| https://docs.arduino.cc/arduino-cloud/features/ota-getting-started/ | 200 / 0 | Y via full reference |
| https://docs.arduino.cc/software/app-lab/tutorials/flash-linux-image/ | 404 / 0 | N: wrong path |
| https://docs.arduino.cc/software/app-lab/configure/flash/ | 200 / 0 | Y |
| https://docs.arduino.cc/hardware/mkr-485-shield/ | 200 / 0 | Y via full reference |
| https://github.com/arduino/arduino-app-lab | 200 / 0 | N: useful public source repository not established |

### PleaseDontCode

| URL | HTTP / RC | yield |
|---|---:|---|
| https://pleasedontcode.com/ | 200 / 0 | Y |
| https://pleasedontcode.com/PCGen/ | 200 / 0 | Y: same product content |
| https://pleasedontcode.com/programming-over-the-air/ | 200 / 0 | Y |
| https://pleasedontcode.com/POTA-Dashboard/ | final 302 / 47 after 50 redirects | N: redirect loop |
| https://pleasedontcode.com/tutorials/ | 200 / 0 | index |
| https://pleasedontcode.com/blog/how-to-code-arduino-and-esp32-with-ai | 200 / 0 | Y: generic vendor article, not industrial evidence |
| https://pleasedontcode.com/blog/understanding-rs-485-in-simple-words | 429 / 0 | N: rate limited |
| https://pleasedontcode.com/blog/understanding-the-can-bus-protocol-in-simple-words | 429 / 0 | N: rate limited |
| https://pleasedontcode.com/blog/building-real-time-iot-dashboards-with-pota | 429 / 0 | N: rate limited |
| https://pleasedontcode.com/blog/version-control-in-action | 429 / 0 | N: rate limited |
| https://github.com/pleasedontcode | 200 / 0 | index |
| https://api.github.com/users/pleasedontcode/repos?per_page=100 | 200 / 0 | Y: 3 public repositories |
| https://raw.githubusercontent.com/pleasedontcode/docs-content/main/README.md | 200 / 0 | N: Arduino docs fork README, product evidenceなし |
| https://raw.githubusercontent.com/pleasedontcode/library-registry/main/README.md | 200 / 0 | N: Arduino registry fork README, product evidenceなし |
| https://raw.githubusercontent.com/pleasedontcode/POTA/main/README.md | 200 / 0 | Y |

### Codey Online

| URL | HTTP / RC | yield |
|---|---:|---|
| https://codey.online/ | 200 / 0 | Y |
| https://codey.online/boards | 200 / 0 | Y: 12 ItemList |
| https://codey.online/components | 200 / 0 | Y: catalog |
| https://codey.online/ai-arduino-ide | 200 / 0 | Y |
| https://codey.online/program-esp32-with-ai | 200 / 0 | Y |
| https://codey.online/components/max485-ttl-to-rs485-converter-module | 200 / 0 | Y |
| https://codey.online/components/can-bus-module-mcp2515-spi-5v | 200 / 0 | Y |
| https://codey.online/components/pwm-naar-voltage-converter-module-0-10v | 200 / 0 | Y |
| https://codey.online/boards/esp32-s3-n16r8 | 200 / 0 | Y |
| https://codey.online/boards/esp32-c3-oled | 200 / 0 | Y |
| https://github.com/Codey-Online | 200 / 0 | N: product source relationを確定できず |

### Embedder

| URL | HTTP / RC | yield |
|---|---:|---|
| https://docs.embedder.com/robots.txt | 200 / 0 | index |
| https://docs.embedder.com/ | 200 / 0 | Y: quickstart content |
| https://docs.embedder.com/quickstart | 200 / 0 | Y |
| https://docs.embedder.com/sitemap.xml | 200 / 0 | index: 84 URLs |
| https://embedder.com/ | 200 / 0 | Y |
| https://embedder.com/company | 200 / 0 | Y |
| https://github.com/embedder-com | 404 / 0 | N: guessed org wrong |
| https://github.com/embedder-dev | 200 / 0 | Y: vendor-linked public org |
| https://docs.embedder.com/supported-hardware | 200 / 0 | Y |
| https://docs.embedder.com/supported-hardware/espressif | 200 / 0 | Y |
| https://docs.embedder.com/supported-hardware/arduino | 200 / 0 | Y |
| https://docs.embedder.com/supported-hardware/raspberry-pi | 200 / 0 | Y |
| https://docs.embedder.com/supported-hardware/nordic | 200 / 0 | Y |
| https://docs.embedder.com/supported-hardware/st | 200 / 0 | Y |
| https://docs.embedder.com/supported-hardware/peripherals | 200 / 0 | Y |
| https://docs.embedder.com/supported-hardware/peripherals/interface | 200 / 0 | Y |
| https://docs.embedder.com/supported-hardware/peripherals/converter | 200 / 0 | Y |
| https://docs.embedder.com/core-concepts/add-peripheral | 200 / 0 | Y |
| https://docs.embedder.com/core-concepts/dashboards | 200 / 0 | Y |
| https://docs.embedder.com/debug-mode/can | 200 / 0 | Y |
| https://docs.embedder.com/solutions/automated-testing | 200 / 0 | Y |
| https://docs.embedder.com/integrations/local-models | 200 / 0 | Y |
| https://docs.embedder.com/integrations/model-providers | 200 / 0 | Y |
| https://docs.embedder.com/integrations/remote-bridge | 200 / 0 | Y |
| https://docs.embedder.com/headless/daemon | 200 / 0 | Y |
| https://docs.embedder.com/core-concepts/settings | 200 / 0 | Y |

次の18 `.md` URL は clean text alternative を狙った最初の local loopで、zsh special parameter `path` を上書きした計測器 defectによりcurl自体が起動せず **HTTPなし / RC 127 / N** だった。vendor failureではない。各URLは直後に `/usr/bin/curl` で再取得して全て **HTTP 200 / RC 0 / Y** を観測した。失敗も省略しない。

| URL | first attempt | retry |
|---|---:|---:|
| https://docs.embedder.com/supported-hardware.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/supported-hardware/espressif.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/supported-hardware/arduino.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/supported-hardware/raspberry-pi.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/supported-hardware/nordic.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/supported-hardware/st.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/supported-hardware/peripherals.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/supported-hardware/peripherals/interface.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/supported-hardware/peripherals/converter.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/core-concepts/add-peripheral.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/core-concepts/dashboards.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/debug-mode/can.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/solutions/automated-testing.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/integrations/local-models.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/integrations/model-providers.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/integrations/remote-bridge.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/headless/daemon.md | HTTPなし / 127 / N | 200 / 0 / Y |
| https://docs.embedder.com/core-concepts/settings.md | HTTPなし / 127 / N | 200 / 0 / Y |

### Viam

| URL | HTTP / RC | yield |
|---|---:|---|
| https://docs.viam.com/build-modules/use-registry-modules/ | 200 / 0 | Y |
| https://docs.viam.com/build-modules/use-registry-modules/index.md | 404 / 0 | N |
| https://docs.viam.com/reference/components/board/micro-rdk/esp32/ | 200 / 0 | Y |
| https://docs.viam.com/reference/components/board/micro-rdk/esp32/index.md | 200 / 0 | N: intended markdownではなく別docs payload |
| https://docs.viam.com/build-modules/write-a-driver-module/ | 200 / 0 | Y |
| https://docs.viam.com/hardware/machine-configuration/ | 200 / 0 | Y |
| https://docs.viam.com/set-up-a-machine/viam-agent-and-server/ | 200 / 0 | Y |
| https://docs.viam.com/set-up-a-machine/first-machine/ | 200 / 0 | Y |
| https://docs.viam.com/reference/components/board/ | 200 / 0 | Y |
| https://docs.viam.com/reference/components/sensor/ | 200 / 0 | Y |
| https://docs.viam.com/monitor/dashboards/overview/ | 200 / 0 | Y |
| https://docs.viam.com/monitor/dashboards/create-dashboards/ | 200 / 0 | Y |
| https://docs.viam.com/data/sync-data-to-your-database/ | 200 / 0 | Y |
| https://docs.viam.com/build-apps/hosting/deploy/ | 200 / 0 | Y |
| https://docs.viam.com/tutorials/custom/controlling-an-intermode-rover-canbus/ | 200 / 0 | Y |
| https://docs.viam.com/build-modules/dependencies/ | 200 / 0 | Y |
| https://docs.viam.com/build-modules/module-anatomy/ | 200 / 0 | Y |
| https://app.viam.com/registry | 200 / 0 | N: client-rendered shell、totalなし |
| https://docs.viam.com/operate/reference/viam-app/ai-assistant/ | 404 / 0 | N: wrong path |
| https://docs.viam.com/operate/reference/viam-app/ai-assistant/index.md | 404 / 0 | N: wrong path |
| https://docs.viam.com/hardware/ai-assistant/ | 200 / 0 | Y |
| https://docs.viam.com/hardware/ai-assistant/index.md | 404 / 0 | N |

### ESPHome

| URL | HTTP / RC | yield |
|---|---:|---|
| https://esphome.io/ | 200 / 0 | Y |
| https://esphome.io/guides/getting_started_command_line/ | 200 / 0 | N: redirected/current canonical differed |
| https://esphome.io/guides/getting_started_hassio/ | 200 / 0 | N: redirected/current canonical differed |
| https://esphome.io/components/esp32/ | 200 / 0 | Y |
| https://esphome.io/components/rp2040/ | 200 / 0 | Y: redirected to current `/components/rp2/` |
| https://esphome.io/components/rp2/ | 200 / 0 | Y |
| https://esphome.io/components/host/ | 200 / 0 | Y |
| https://esphome.io/components/modbus/ | 200 / 0 | Y |
| https://esphome.io/components/modbus_controller/ | 200 / 0 | Y |
| https://esphome.io/components/canbus/ | 200 / 0 | Y |
| https://esphome.io/components/sensor/pulse_counter/ | 200 / 0 | Y |
| https://esphome.io/components/sensor/rotary_encoder/ | 200 / 0 | Y |
| https://esphome.io/components/mqtt/ | 200 / 0 | Y |
| https://esphome.io/components/http_request/ | 200 / 0 | Y |
| https://esphome.io/components/web_server/ | 200 / 0 | Y |
| https://esphome.io/components/api/ | 200 / 0 | Y |
| https://esphome.io/components/external_components/ | 200 / 0 | Y |
| https://esphome.io/components/packages/ | 200 / 0 | Y |
| https://esphome.io/components/ota/ | 200 / 0 | Y |
| https://esphome.io/install/docker/ | 200 / 0 | Y |
| https://github.com/esphome/esphome | 200 / 0 | Y |
| https://github.com/esphome/esphome-docs | 200 / 0 | Y: redirects to current docs repository |
| https://api.github.com/repos/esphome/esphome-docs | 200 / 0 | Y: resolves official `esphome/esphome.io` metadata |
| https://api.github.com/repos/esphome/esphome-docs/git/trees/current?recursive=1 | 200 / 0 | Y: docs tree |
| https://api.github.com/repos/esphome/esphome | 200 / 0 | Y: core repo metadata |
| https://api.github.com/repos/esphome/esphome/git/trees/dev?recursive=1 | 200 / 0 | Y: core tree/component denominator proxy |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/esp32.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/rp2.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/nrf52.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/host.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/modbus.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/modbus_controller.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/modbus_server.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/canbus/index.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/sensor/pulse_counter.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/sensor/rotary_encoder.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/mqtt.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/http_request.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/web_server.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/external_components.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/packages.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/ota/esphome.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/install/getting_started_command_line.mdx | 404 / 0 | N: stale guessed path |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/install/docker.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/install/getting-started.mdx | 200 / 0 | Y |
| https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/install/index.mdx | 200 / 0 | Y |

## Commands run and observed evidence

取得用 command の基本形（各URLごと）:

```bash
/usr/bin/curl -L --max-redirs 10 --connect-timeout 15 --max-time 60 \
  -A 'Mozilla/5.0 capability-audit' -sS -o <temporary-file> \
  -w '%{http_code} %{size_download}' <public-url>
```

- `[API-smoke][command+RC]` 上記 curl 群: 各 RC/HTTP は fetch log に記録。account、credential、private URLなし。
- `[static][command+RC]` Codey sitemap集計: `ALL_UNIQUE=749 URLs / ENGLISH_CANONICAL=107 URLs / BOARD_DETAIL=12 URLs / COMPONENT_DETAIL=79 URLs / RC 0`。79は英語 canonical component detail denominator。
- `[static][command+RC]` PleaseDontCode landing DOM のboard固有名集計: `SCANNED_NAMES=33 / DISTINCT_NAMES=33 / CLAIM_DENOMINATOR=35+ boards / RC 0`。33をcomplete denominatorとしない。
- `[static][command+RC]` ESPHome core tree集計: `SCANNED_TOP_LEVEL_COMPONENT_DIRS=742 / DISTINCT=742 / RC 0`。device countではなくsource component directory proxy。
- `[static][command+RC]` ESPHome ESP32 variant heading集計: `SCANNED_VARIANT_HEADINGS=13 / DISTINCT=13 / RC 0`。
- `[static][command+RC]` report本文+fetch log（verification記録より前の1–528行）の価格detail pattern scan（currency amount、英語通貨/料金語）: `SCANNED=528 lines / MATCHES=0 / rg RC 1（no match）`。scope説明にある日本語の「価格・プラン・無料枠・credit」以外の価格情報を採用していない。
- `[static][command+RC]` 同528行の secret-like pattern scan（private-key header、token形）: `SCANNED=528 lines / MATCHES=0 / rg RC 1（no match）`。
- `[static][command+RC]` 本文citation URLとfetch-log URLの集合差: `BODY_DISTINCT_URLS=79 / UNLOGGED=0 / RC 0`。fetch logはURL rows 191（同一URLのfailure/retryを別attemptとして記録した行を含む）。
- `[static][command+RC]` required heading scan: `SCANNED_HEADINGS=5 / FOUND=5 / MISSING=0 / RC 0`。trailing-whitespace scan: `SCANNED=545 lines / VIOLATIONS=0 / RC 0`。
- `visual` 未実施: client-rendered signed-in UIを開いていない。
- `synthetic` 未実施: vendor compiler/device codeにmutationを加えていない。INVESTIGATIONで製品挙動testを行っていないため。
- `API-smoke` の限界: HTTP 200は機能動作を証明せず、公開一次資料が取得できたことだけを証明する。
- `real-fire` 未実施: compile、flash、OTA、physical RS485/CAN、MQTT publish、Cloud sync、dashboard、HILを実行していない。

## Investigation limits

- vendor documentation は2026-08-26時点のmutable page。Git refをcommit SHAで固定しないURLもあり、将来内容が変わり得る。
- aggregate marketing denominator（35+、590+、5,850+）は vendor countの転記であり、個別全件を独立に数え直したmeasurementではない。Codey 12/79、PDC visible 33、ESPHome source 742だけを公開artifactから集計した。
- client-rendered/account-gated catalogを空と扱っていない。Viam registryは「0」ではなく `NOT OBTAINED`。
- industrial voltage/current capabilityは、ADC/DAC一般機能から推定していない。specific interface/part/docsがなければ `not found in docs` とした。
- firmwareがgeneric MQTT/HTTP libraryで通信できることと、vendorがbackend/database/UIをhostすることを分離した。
- source/configからのUI生成は、PDCのcode-variable widget suggestion、ESPHomeのconfig→entities、EmbedderのMonitor dashboard、Arduino/Viamのmanual widgetを別カテゴリとして扱った。
