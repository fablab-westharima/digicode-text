# 04 — Competitor / Overlap Population

- **Packet:** S007-D3-competitor-population
- **Lane:** INVESTIGATION (web discovery), AUTHORITY_MODE: DELEGATED
- **Integration owner:** digicode-text harness session S007
- **Date of all searches and retrievals:** 2026-08-26 (unless a row states otherwise)
- **Deliverable type:** POPULATION. Not a verdict, not a ranking, not a differentiation claim.

> **Scope discipline.** This lane constructs the candidate set and records where each name came
> from. It does not decide what digicode-text is, does not rank, and deliberately makes **no**
> "unique / only one / nothing like it" claim. Where a product looks close, the row says which
> dimensions it touches and stops there.

> **Non-exhaustiveness statement (required by the packet).** The population below is what this
> lane could reach with 20 searches and 6 direct page fetches in one session, US-locale search,
> English + one Japanese query. It is **not** proof of the absence of anything not listed. Two
> concrete demonstrations of that risk are already in this project's history: an earlier
> investigation concluded "no such product exists" from a five-product population, and a re-audit
> then found PleaseDontCode. In *this* lane, four names that no seed list contained
> (Embedder, Embedr, ESP-GenUI, Arduino App Lab Agentic Mode) appeared only on the 4th, 8th, 11th
> and 8th search respectively — i.e. the discovery curve had not flattened when the lane ended.

---

## 1. Search log (required deliverable)

All searches run 2026-08-26. "Examined" = result links returned and read in the result block
(typically 6–10 per query); it does not mean each target page was opened.

| # | Exact query string | Examined | What it surfaced that was NEW |
|---|---|---|---|
| S1 | `AI-powered embedded firmware development platform browser IDE` | 8 | **Embedder**, **Embedist**, **Neural Inverse Cloud** — all three previously unknown to this project |
| S2 | `Codey Online OTRONIC AI Arduino code generator` | 8 | duinocodegenerator.com; confirmed Codey seed; PleaseDontCode reappeared unprompted |
| S3 | `PleaseDontCode AI embedded systems code generator` | 9 | PleaseDontCode vendor identity (ITALCODY, Turin); POTA + widget dashboards |
| S4 | `AI IoT development platform generate firmware and dashboard` | 7 | **TagoIO** (MCP-based AI dashboard/script generation), **ThingsBoard**, Blynk |
| S5 | `browser based ESP32 IDE cloud compile flash web serial no install` | 10 | **FlashESP**, **ESPConnect**, **espboards.dev ESP Tool**, **ESP Web Tools (ESPHome)**, **espflasher.app**, Toit web-serial flashing |
| S6 | `industrial IoT low-code gateway Modbus RS485 dashboard platform 2026` | 9 | Hardware-gateway vendors (IOT-LINK/Compulab, Robustel, IoTStudioz) — a whole bucket: buy-the-box substitutes |
| S7 | `managed IoT platform no toolchain setup firmware over the air ESP32 Golioth Toit Zerynth` | 7 | **Golioth** confirmed; Toit/Zerynth not returned → needed S13 |
| S8 | `AI copilot for embedded C++ Arduino ESP32 vibe coding hardware` | 6 | Confirmed Codey's own "vibe coding" positioning vs Cursor/Claude Code |
| S9 | `Wokwi simulator AI copilot embedded online` | 10 | Wokwi **MCP support** — Wokwi is now an AI-agent-addressable tool, not only a simulator |
| S10 | `"AI" "Modbus" firmware generation industrial edge device natural language` | 6 | Siemens Industrial Edge / AI Suite; nothing product-shaped matching the full stack |
| S11 | `no-code IoT device builder ESP32 sensors cloud dashboard SME factory data collection` | 9 | Reinforced Blynk / ThingsBoard / Arduino IoT Cloud as the SME-facing bucket |
| S12 | `Embedder YC AI embedded IDE datasheet driver generation 2026` | 9 | **Embedr** (distinct product, near-identical name); Embedder = YC S25, 500+ MCUs |
| S13 | `Embedr app AI embedded engineer Arduino review` | 9 | Embedr detail: Monaco + arduino-cli, Gemini 2.5 Flash, KiCad |
| S14 | `survey LLM code generation embedded systems microcontroller review paper 2025` | 10 | **Academic layer**: MDPI *Future Internet* 18(2) 94 benchmark, ScienceDirect closed-loop LLM-agent eval, arXiv 2508.00083 agent-codegen survey |
| S15 | `Viam robotics IoT platform managed hardware modules no firmware` | 7 | **Viam** — closest structural analogue to "managed environment on the vendor's side" (Registry + driver pull + fleet) |
| S16 | `Arduino App Lab AI 2026 Arduino Cloud new features` | 10 | **Arduino App Lab 0.10 "Agentic Mode" (2026-08-12)** — MCP-based agent + language server, from the incumbent. Two weeks old at retrieval |
| S17 | `obniz SORACOM 日本 IoT 開発 クラウド マイコン ブラウザ 開発環境` | 7 | **obniz** — browser-programmed, cloud-managed obnizOS; Japan; SORACOM partner |
| S18 | `Datacake Thinger.io Ubidots Losant no-code IoT platform comparison 2026` | 10 | Datacake / Thinger / Ubidots / Losant / Kilo positioning |
| S19 | `Particle Balena Memfault Espressif RainMaker managed device platform firmware toolchain` | 9 | Memfault↔Particle↔ESP-IDF integration mesh; ESP RainMaker |
| S20 | `Tulip Ignition Edge N3uron HighByte industrial DataOps no-code platform` | 10 | N3uron, HighByte Intelligence Hub, Tulip — the OT/DataOps bucket |
| S21 | `ESPHome Home Assistant no code YAML firmware builder web dashboard smart home device` | 8 | **ESPHome Device Builder** (2026.5.0/2026.6.0) — visual, no-YAML firmware build + dependency resolution |
| S22 | `FlowFuse Node-RED commercial industrial edge platform managed` | 9 | **FlowFuse** — managed Node-RED with certified OPC-UA/Modbus connector set |
| S23 | `Viper IDE MicroPython browser online editor ESP32 web` | 10 | **ViperIDE**, **ESP IDE (espide.eu)** |
| S24 | `AI generates complete IoT project firmware backend dashboard end to end startup 2026` | 7 | Only listicles/agencies — **no** new product. Recorded as a negative result |
| S25 | `Toit Zerynth Mongoose OS Cesanta managed firmware platform status 2026` | 10 | Zerynth = Italian IIoT hw+sw+cloud; Mongoose OS still shipping (Mongoose 7.21, 2026-04-01) |
| S26 | `"Factory Scientist" ファクトリーサイエンティスト 講座 IoT 教材` | 7 | Target-user context: 3 devices (thermometer/ammeter/distance), cloud send + visualise, no prior IoT knowledge assumed |
| S27 | `Embedist open source AI embedded development environment PlatformIO` | 8 | Embedist = Tauri **desktop**, multi-provider AI, PlatformIO integration |
| S28 | `"Neural Inverse" cloud IDE embedded STM32 ESP32 browser AI routing layer` | 9 | NeuralInverse GitHub org; cloud.neuralinverse.com; "forever-free AI models, no API keys" claim |
| S29 | `alternatives to PleaseDontCode Codey.online AI Arduino IDE competitors list` | 8 | **Negative result** — generic SEO listicles only. No aggregator tracks this category yet |
| S30 | `AI natural language PLC programming industrial automation code generation startup` | 8 | Siemens TIA Portal Engineering Copilot, Schneider copilot, PLC Copilot, LadderLogicAI — the PLC-side substitute bucket |
| S31 | `Blynk AI assistant firmware code generation 2026 low-code` | 8 | **Blynk AI Assistant** (generates dashboards+datastreams+alerts+code from a prompt) and **Blynk MCP Server** |
| S32 | `"cloud compiler" Arduino online IDE library manager verified versions compatibility service` | 10 | Arduino Cloud Editor: auto-updating pre-installed libraries, 5,000+ library manager |
| S33 | `"we maintain the toolchain" OR "curated libraries" IoT platform verified board library version compatibility guarantee` | 8 | **Meadow** (.NET on MCU, "curated peripheral drivers"); otherwise **negative** — no vendor found marketing a *compatibility guarantee* in these words |
| S34 | `AI generate web UI dashboard for ESP32 device embedded web server generator tool` | 9 | **ESP-GenUI**, **Mongoose Wizard**, **Xedge32** |

**Direct page fetches (primary source, all 2026-08-26):** codey.online, pleasedontcode.com,
embedder.com, embedr.app, flashesp.com (thin render — see §6), cloud.neuralinverse.com (thin
render — see §6).

**SEARCHES_RUN: 34. FETCHES: 6.**

---

## 2. Population table

Bucket key — **D** direct competitor (browser/text/AI/managed-env overlap on multiple axes) ·
**P** partial overlap · **A** adjacent (same user, different layer) · **S** substitute (a different
way to get the same job done) · **X** out of population.

Evidence key — **[P]** primary source (vendor site/docs/repo, URL + retrieved 2026-08-26) ·
**[S]** secondary source · **[I]** inference · **[N]** NOT OBTAINED.

### 2.1 Direct (D)

| # | Name | Vendor / country | URL | Vendor's own words | Ev |
|---|---|---|---|---|---|
| D1 | **Codey Online** | OTRONIC, Netherlands | https://codey.online/ | "Just describe your idea. Codey writes the code, draws the wiring diagram, compiles it in the cloud, and uploads it straight to your board — all from one browser tab." | [P] fetched 2026-08-26 |
| D2 | **PleaseDontCode** | ITALCODY (Francesco Colucci), Turin, Italy | https://www.pleasedontcode.com/ | "Pick sensors and actuators, AI draws the wiring schematic and generates ready-to-use firmware." | [P] fetched 2026-08-26 |
| D3 | **Arduino Cloud Editor + Arduino App Lab (Agentic Mode)** | Arduino SA, Italy | https://www.arduino.cc/en/software · https://blog.arduino.cc/2026/08/12/arduino-app-lab-0-10-meet-agentic-mode/ | Cloud Editor: write code and upload to any official Arduino board from your web browser; auto-updating pre-installed libraries, 5,000+ library manager. App Lab 0.10: "build applications alongside an AI agent that actively works on your project," MCP-based, BYO key, Claude first | [S] search-result excerpts 2026-08-26; blog URLs not individually fetched |
| D4 | **Embedder** | Embedder (YC S25), US | https://embedder.com/ | "Embedder is an AI platform built for embedded software. It reads your datasheets, writes the code, flashes the board, runs the tests, and fixes its own mistakes, autonomously." | [P] fetched 2026-08-26 |
| D5 | **Embedr** | Sinha Ventures, US | https://www.embedr.app/ | "AI-native Arduino IDE and automation stack for embedded developers." | [P] fetched 2026-08-26 |
| D6 | **Neural Inverse Cloud** | NeuralInverse (open-source org) | https://cloud.neuralinverse.com/ · https://github.com/NeuralInverse/neuralinverse | "open-source AI-native IDE with agentic coding, Power Mode, legacy modernization, and firmware development" (GitHub repo description) | [S] repo description + DEV article; site fetch returned near-empty (§6) |

### 2.2 Partial overlap (P)

| # | Name | Vendor / country | URL | Vendor's own words | Ev |
|---|---|---|---|---|---|
| P1 | **Wokwi** | Wokwi, Israel | https://wokwi.com/ · https://docs.wokwi.com/wokwi-ci/mcp-support | "IoT and Embedded System Simulator for ESP32, STM32, Arduino, Raspberry Pi Pico…"; MCP "enables AI agents such as Copilot, Claude Code, Cursor, Gemini, ChatGPT… to securely interact with" the simulator | [S] |
| P2 | **Blynk** | Blynk Inc., US | https://www.blynk.io/ · /blog/blynk-ai-assistant-describe-what-you-need-the-platform-builds-it | "Blynk's new AI Assistant generates IoT projects — including dashboards, datastreams, alerts, and code — from your prompt." Blynk.Edgent supplies ESP-IDF production firmware (BLE provisioning, OTA, secure MQTT) | [S] |
| P3 | **ESPHome Device Builder** | ESPHome / Open Home Foundation (Nabu Casa) | https://github.com/esphome/device-builder · https://esphome.io/ | "ESPHome reads that description and builds custom firmware for your device"; Device Builder adds "a visual component and automation builder, a component catalog with automatic dependency resolution, a firmware job queue, out-of-sync detection" | [S] |
| P4 | **obniz / obniz Cloud** | obniz Inc., Japan | https://iot.obniz.com/ja/devices/obnizboard/ | obnizOS on the device + obniz cloud; programs written in a browser online editor execute immediately, no compile/upload cycle, no install | [S] (Japanese sources) |
| P5 | **Viam** | Viam Robotics, US | https://www.viam.com/ · https://docs.viam.com/what-is-viam/ | "you declare the hardware and services you need in a JSON config. Viam installs the drivers and any additional software modules required"; Modular Registry as the resource hub; "container runtime for hardware" | [S] |
| P6 | **TagoIO** | TagoIO, US/Brazil | https://tago.io/blog/ai-accelerating-simplifying-iot-development | MCP integration enabling "AI-powered development of dashboards and scripts… describe their IoT applications in plain language" | [S] |
| P7 | **FlashESP** | FlashESP | https://flashesp.com/ | "cloud-based build-and-deploy platform for ESP32 and ESP8266… build happens server-side, flashing uses the WebSerial API" (secondary; own site rendered thin) | [S] (CNX Software 2025-12-09, XDA) |
| P8 | **ESP-GenUI** | ESP-GenUI | https://espgenui.com/ · https://hackaday.io/project/206012-esp-genui | Describe the project, AI "assembles a matching diagram with pages, widgets, and the wiring"; "a code generator, not a runtime" — emits an Arduino sketch or ESP-IDF project | [S] |
| P9 | **Embedist** | mandarwagh9 (open source) | https://github.com/mandarwagh9/embedist | "Open Source AI-native IDE for embedded systems that actually understands your board"; board-aware AI debug + PlatformIO build integration; Tauri desktop | [S] |
| P10 | **PlatformIO** | PlatformIO Labs | https://docs.platformio.org/ | "open source ecosystem for IoT development… cross-platform build system and library manager" — the reference implementation of managed toolchains/deps, but developer-installed | [S] |
| P11 | **Mongoose Wizard / Mongoose OS** | Cesanta, Ireland/UK | https://mongoose.ws/articles/esp32-device-dashboard/ · https://github.com/cesanta/mongoose-os | Wizard generates firmware including "an embedded web server for serving your dashboard and delivering its REST interface"; Mongoose OS = IoT firmware development framework, ESP32/ESP8266/CC32xx/STM32 | [S] |

### 2.3 Adjacent (A) — same user or same stack layer, different job

| # | Name | URL | Why adjacent | Ev |
|---|---|---|---|---|
| A1 | ThingsBoard | https://thingsboard.io/ | Open-source device management + 600+ dashboard widgets; consumes device data, does not author firmware | [S] |
| A2 | Datacake | https://datacake.co/ | LoRaWAN-first low-code platform, 400+ device templates with payload decoders | [S] |
| A3 | Ubidots | https://ubidots.com/ | Dashboard-centric, 20+ widget types, UbiFunctions serverless scripting | [S] |
| A4 | Thinger.io | https://thinger.io/ | Cloud infra for connecting devices + real-time dashboard | [S] |
| A5 | Losant | https://www.losant.com/ | Enterprise IoT with visual workflow engine | [S] |
| A6 | Golioth | https://golioth.io/ | Managed device cloud; OTA via one SDK call; ESP-IDF + Zephyr first-class | [P] docs.golioth.io retrieved via search 2026-08-26 |
| A7 | Memfault | https://memfault.com/ | Firmware observability: crash reporting, logging, OTA; integrates into ESP-IDF/Particle | [S] |
| A8 | Particle | https://www.particle.io/ | Vertically integrated device cloud + own hardware | [S] |
| A9 | Balena | https://www.balena.io/ | Fleet OS/container delivery — Linux-class edge, not MCU | [S] |
| A10 | Espressif RainMaker | https://github.com/espressif/esp-rainmaker | "ESP RainMaker Agent for firmware development" — vendor-run device cloud for ESP32 | [P] repo description |
| A11 | Toit | https://toit.io/ | Language + platform for ESP32; browser flashing via Web Serial | [S] |
| A12 | Zerynth | https://zerynth.com/ | Italian IIoT hardware+software+cloud for manufacturing | [S] Wikipedia |
| A13 | FlowFuse | https://flowfuse.com/ | Managed/enterprise Node-RED; "Certified OT Connections — OPC-UA, Modbus, etc." maintained + security-patched by the vendor | [S] |
| A14 | Node-RED (upstream) | https://nodered.org/ | The flow runtime the Raspberry-Pi-side of the reference scenario usually runs | [I] |
| A15 | HighByte Intelligence Hub | https://www.highbyte.com/ | "edge-native, no-code DataOps software that curates, models, and delivers AI-ready data" | [S] |
| A16 | N3uron | https://n3uron.com/ | Industrial edge platform for IIoT/DataOps, Sparkplug to SCADA | [S] |
| A17 | Tulip | https://tulip.co/ | Frontline operations app platform for manufacturing | [S] |
| A18 | Ignition / Ignition Edge | https://inductiveautomation.com/ | SCADA/edge platform; the incumbent the OT-side scenario often lands in | [I] |
| A19 | AWS IoT Core / Azure IoT Central | — | The cloud endpoint in the reference scenario (`… → MQTT/HTTP → Azure`) | [I] |
| A20 | ViperIDE | https://viper-ide.org/ | Browser MicroPython/CircuitPython IDE over WebSerial/WebUSB/BLE/WebREPL — browser+text, no AI, no managed env | [S] |
| A21 | ESP IDE (espide.eu) | https://www.espide.eu/en/ | Online programming for ESP32/ESP8266/RP2040/RP2350 with Blocks and MicroPython | [S] |
| A22 | ESP Web Tools / esptool.js flashers (ESP Web Tools, espflasher.app, espboards.dev, ESPConnect) | https://esphome.github.io/esp-web-tools/ | Browser flashing only — one dimension of the stack | [S] |
| A23 | Meadow (Wilderness Labs) | https://www.wildernesslabs.co/ | ".NET on microcontrollers… curated peripheral drivers" — the closest *phrasing* found to a curated device library | [S] |
| A24 | Edge Impulse (in Arduino App Lab) | https://edgeimpulse.com/ | Edge-ML training/deploy, now integrated into App Lab | [S] blog.arduino.cc 2026-03-04 |
| A25 | duinocodegenerator.com | https://www.duinocodegenerator.com/ | Single-purpose AI Arduino code generator, no environment layer | [S] |

### 2.4 Substitute (S) — a different route to the same outcome for the same user

| # | Name | Why it substitutes | Ev |
|---|---|---|---|
| S1 | General AI coding tools (Claude Code, Cursor, ChatGPT, GitHub Copilot, Windsurf) + local Arduino IDE / PlatformIO | Codey's own marketing positions against exactly this ("If you love vibe coding with Cursor or Claude Code, you'll feel right at home in Codey") | [S] |
| S2 | VS Code / GitHub Codespaces + PlatformIO extension | Browser-hosted text editing over a managed container; toolchain still user-declared | [I] |
| S3 | Buy-the-box Modbus/RS485 IoT gateways (Compulab IOT-LINK, Robustel, IoTStudioz, HashStudioz) | Removes the MCU-development step entirely for `inverter → RS485 → cloud` | [S] |
| S4 | PLC + AI copilots (Siemens TIA Portal Engineering Copilot, Schneider copilot, PLC Copilot, LadderLogicAI) | The "install a PLC instead" path, now with natural-language codegen; Siemens' copilot also generates HMI screens | [S] |
| S5 | Systems-integrator / IoT development agencies | The default for corporate IoT staff without in-house firmware skill | [I] |
| S6 | Academic/benchmark layer — MDPI *Future Internet* 18(2) 94 "Benchmarking LLMs for Embedded Systems Programming in Microcontroller-Driven IoT Applications" (https://doi.org/10.3390/fi18020094); ScienceDirect "Closed-loop evaluation of LLM agents for embedded software development" (S1383762126002559); arXiv 2508.00083 | Not a competitor — listed deliberately because the previous investigation's named failure was leaving the review literature unopened. Whoever prices/feature-audits next should read at least the MDPI benchmark | [S] |

---

## 3. Inclusion / exclusion reasoning

Every excluded candidate below has a stated reason. Nothing was dropped silently.

**Excluded (X):**

| Candidate | Reason for exclusion |
|---|---|
| Visual Studio, IntelliJ, PyCharm, Eclipse, NetBeans, Code::Blocks, RStudio, Spyder, WebStorm | Returned by S29's SEO listicles as "Arduino IDE alternatives". General-purpose IDEs with no MCU environment management, no board/toolchain curation, no flashing story. The listicles are keyword artefacts, not a market map |
| STM32Cube.AI, TensorFlow Lite Micro, edge-ML deployment tooling | "AI" here means *models running on the MCU*, the opposite axis from *AI writing the firmware*. Edge Impulse is kept as **adjacent** only because it is now shipped inside a direct competitor (App Lab) |
| Siemens Industrial Edge / AI Suite | Runs AI workloads on industrial edge hardware; not a development environment for MCU text code |
| Hardware-only Modbus/RS485 gateway SKUs sold as boxes | Kept as **substitute S3** rather than population members: they compete for the same budget and job, but have no development environment at all |
| Cloud backends as such (AWS IoT Core, Azure IoT Hub/Central, Google Pub/Sub) | Infrastructure the product would *target*, not compete with. Listed adjacent (A19) so the next lane does not re-discover them |
| IoT development agencies / SIs | Not products; retained as substitute S5 because they are the realistic incumbent for the corporate-IoT-staff user |
| "Best IoT platform 2026" comparison sites (Kilo, Intuz, Toolradar, Meddle, cloudstudioiot) | Secondary aggregators, some vendor-owned. Used as *pointers to names* only; no claim in this report rests on them alone |
| App-store "AI Code Generator" mobile apps | Generic codegen apps with no hardware, board or toolchain model |
| Blockly/block-editor tools (ESP IDE's Blocks mode, mBlock-class) | The product definition explicitly excludes block editors. ESP IDE is kept adjacent because it *also* offers MicroPython text |

**Borderline calls, stated explicitly (the packet asked for these by name):**

- **Managed IoT platforms (Blynk, Losant, Thinger.io, Datacake, Ubidots, Golioth, Memfault, Particle, Balena, Toit, Zerynth, Mongoose OS, RainMaker, Arduino Cloud, AWS/Azure)** — **IN**, split by whether they touch firmware authoring. Blynk is **partial** (its AI Assistant now generates code, not just dashboards); Arduino Cloud is **direct** (it is a browser text editor with a cloud compiler *and* now an agent); the rest are **adjacent**, because they manage the device *after* the firmware exists rather than managing the build environment.
- **No-code / low-code industrial gateways (FlowFuse, Ignition Edge, Tulip, N3uron, HighByte)** — **IN as adjacent**. They own the `MCU → protocol → server → dashboard` right-hand half of the evaluation stack and are what an SME often buys instead. FlowFuse is the most pointed: it sells *vendor-maintained, security-patched Modbus/OPC-UA connectors*, which is structurally the same promise (someone else maintains the integration layer) applied one layer up.
- **Browser IDEs (Wokwi, Codespaces+PlatformIO, Arduino Web Editor, ViperIDE, ESP IDE, FlashESP)** — **IN**. Arduino Web Editor and FlashESP are the strongest browser+cloud-compile cases; Wokwi is partial because it simulates rather than flashes real hardware; ViperIDE/ESP IDE are adjacent (browser + text, no AI, no managed environment).
- **AI coding tools aimed at embedded (Embedder, Embedr, Embedist, Neural Inverse)** — **IN**. Note that Embedder, Embedr and Embedist are all **desktop/VS Code**, not browser-hosted (all three [P] or [S] confirmed). That is a real dimension difference and it is recorded in §4, not used here as a differentiation claim.
- **Discovered outside the packet's buckets:** ESP-GenUI and Mongoose Wizard form a bucket the packet did not name — *AI/diagram-driven generators of the device's own web UI*. They touch the "auto-generated UI" dimension without touching board management at all.

---

## 4. Overlap map

Legend: ● touches · ◐ partial / qualified · ○ does not · ? not determined.

Dimensions: **Br** browser-based editing · **Tx** text code · **AI** AI as a feature ·
**Env** managed board/toolchain environment on vendor side · **Dep** dependency/version management ·
**CC** cloud compile · **Fl** browser flashing · **Ind** industrial protocols (RS485/Modbus/CAN/4-20mA) ·
**Cld** cloud backend · **Loc** local/self-hosted backend · **UI** dashboard or auto-generated UI ·
**HW** custom hardware extensibility.

| Candidate | Br | Tx | AI | Env | Dep | CC | Fl | Ind | Cld | Loc | UI | HW |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D1 Codey Online | ● | ● | ● | ● | ◐ | ● | ● | ○ | ○ | ○ | ○ | ◐ |
| D2 PleaseDontCode | ● | ● | ● | ● | ◐ | ● | ◐ (OTA/POTA) | ? | ● | ○ | ● | ◐ |
| D3 Arduino Cloud Editor + App Lab | ● | ● | ● (App Lab = desktop) | ● | ● | ● | ◐ (Create Agent) | ○ | ● | ○ | ● | ◐ |
| D4 Embedder | ○ (VS Code) | ● | ● | ● (500+ MCU, datasheet index) | ? | ○ | ○ (local flash + HIL) | ? | ○ | ● | ○ | ● |
| D5 Embedr | ○ (desktop) | ● | ● | ◐ (arduino-cli) | ◐ | ○ | ? | ○ | ○ | ● | ○ | ● (KiCad/PCB) |
| D6 Neural Inverse Cloud | ● | ● | ● | ? | ? | ● | ? | ? | ● | ● (OSS) | ○ | ? |
| P1 Wokwi | ● | ● | ◐ (MCP) | ● (simulated) | ◐ | ● | ○ (simulator) | ◐ | ○ | ○ | ○ | ◐ |
| P2 Blynk | ● | ◐ | ● | ◐ (Edgent SDK) | ○ | ○ | ○ | ◐ | ● | ○ | ● | ● |
| P3 ESPHome Device Builder | ● | ◐ (YAML, now optional) | ○ | ● | ● (auto dep resolution) | ● (local server) | ● | ◐ | ○ | ● | ● (via HA) | ● |
| P4 obniz | ● | ● (JS) | ◐ | ● (obnizOS, cloud-run) | ● | n/a (no compile step) | ○ | ◐ | ● | ○ | ● | ● |
| P5 Viam | ● | ● | ● | ● (Registry pulls drivers) | ● | ○ | ○ | ◐ | ● | ● | ● | ● |
| P6 TagoIO | ● | ● (scripts) | ● (MCP) | ○ | ○ | ○ | ○ | ◐ | ● | ○ | ● | ○ |
| P7 FlashESP | ● | ● | ? | ● | ◐ | ● | ● | ○ | ○ | ○ | ○ | ○ |
| P8 ESP-GenUI | ● | ● (emits C/C++) | ● | ○ | ○ | ○ | ○ | ○ | ○ | ● | ● (its whole point) | ○ |
| P9 Embedist | ○ (desktop) | ● | ● | ◐ (PlatformIO) | ● | ○ | ● (local) | ? | ○ | ● | ○ | ● |
| P10 PlatformIO | ○ | ● | ○ | ● (user-run) | ● | ○ | ● (local) | ◐ | ○ | ● | ○ | ● |
| P11 Mongoose Wizard / OS | ● (wizard) | ● | ○ | ◐ | ◐ | ● | ? | ◐ | ● | ● | ● | ● |

Reading note: the map records *what a candidate touches*, from its own words plus secondary
reporting. A ● is not a quality judgment and ◐/? are honest, not hedged — several cells are `?`
because the fetch did not settle them (see §6).

---

## 5. The five to price- and feature-audit next

| Rank | Candidate | Why it earned the slot |
|---|---|---|
| 1 | **Arduino Cloud Editor + Arduino App Lab (Agentic Mode)** | The incumbent, and the newest movement in the field: Agentic Mode is dated **2026-08-12**, two weeks before this search. Arduino already owns browser text editing, a cloud compiler, an auto-updating library layer and a dashboard product, and has now bolted an MCP agent and a language server on. Any design judgment about this project's core value has to be made against what Arduino shipped a fortnight ago, not against Arduino as of 2024. Also the only D-row where the *whole* left-hand column is already ● |
| 2 | **PleaseDontCode** | The re-audit find. It is the only candidate whose own marketing names the non-engineer industrial user ("the plant technician can describe what's needed and get ready-to-use firmware"), and it spans board selection → pin assignment → library predefinition → schematic → firmware → OTA → widget dashboard. Its pricing is credit-metered ("3 credits per month and 1 device, forever") — exactly the free-plan-vs-usable-for-free distinction the pricing lane must not merge |
| 3 | **Codey Online** | The nearest structural twin on the browser axis: browser tab → AI → cloud compile → Web Serial flash, plus a stated managed layer (smart library picker, voltage-safety checks, auto error fixing). Free tier is a **hard daily cap** ("5 AI messages per day"), Pro €9.99/mo — a clean, already-observed data point for the pricing lane |
| 4 | **Embedder** | The best-funded and most aggressive claim on the *managed environment* dimension (500+ MCUs, 4,000+ peripherals, datasheet/errata indexing with citation-back, closed-loop HIL validation). It is desktop-hosted, so it does not compete on "browser", but it competes hard on "the vendor maintains the hardware knowledge". Pricing is sales-gated — flagged as a human decision in §6 |
| 5 | **Viam** | The only candidate found whose architecture *is* the thesis — a vendor-run Registry that pulls drivers on declaration, described by the vendor as "a container runtime for hardware", with fleet OTA and dashboards. It sits at Linux/SBC class rather than bare-MCU, which is precisely why auditing it is worth the slot: it shows what the managed-environment promise looks like when someone has already built it one layer up |

Runners-up, with reason, so the harness can override: **ESPHome Device Builder** (the strongest
*free and self-hosted* answer to "never touch a Board/Library Manager" — automatic dependency
resolution plus a firmware job queue, and it just went default-on in 2026.5.0/2026.6.0);
**Blynk** (AI Assistant that emits dashboards+datastreams+alerts+code from one prompt, plus an MCP
server); **FlowFuse** (vendor-maintained certified Modbus/OPC-UA connectors — the same promise, one
layer up, and the closest thing found to the right-hand half of the evaluation stack being sold as
a managed service).

---

## 6. What could not be determined

| Item | Status | What was tried |
|---|---|---|
| FlashESP official description / pricing | **NOT OBTAINED** | https://flashesp.com/ fetched 2026-08-26 — returned title only, no body content. Description in this report is [S] from CNX Software (2025-12-09) and XDA. Retry with a different path (`/about`, `/pricing`) or a rendered fetch |
| Neural Inverse Cloud description / MCU list / pricing | **NOT OBTAINED** | https://cloud.neuralinverse.com/ fetched 2026-08-26 — returned heading only (SPA shell). Repo description is [S]. `github.com/NeuralInverse/neuralinverse` README not fetched |
| Embedder pricing | **NOT PUBLIC** [P] | embedder.com fetched 2026-08-26: "Plans are scoped to the team and the hardware, so the honest answer is a short call rather than a pricing table." Sales-gated by design |
| Embedr pricing | **NOT OBTAINED** | embedr.app fetched 2026-08-26; a /pricing page exists but was not fetched |
| PleaseDontCode — industrial protocol support (Modbus/RS485) | **NOT DETERMINED** | Home page fetch 2026-08-26 shows no mention of Modbus/RS485/industrial protocols. Absence on a landing page is not absence in the product — needs the docs, not an inference |
| Codey Online — behaviour past the 5-messages/day cap; whether a compiled project remains usable | **NOT DETERMINED** | Pricing text captured [P]; runtime behaviour is unobservable without an account |
| Whether any candidate publishes a **compatibility guarantee** across board × toolchain × library × version | **NEGATIVE RESULT** | S33 targeted exactly this phrasing and found only Meadow's "curated peripheral drivers". Recorded as *not found by these queries*, explicitly **not** as "does not exist" |
| Toit / Zerynth current commercial status 2026 | **THIN** | S7 returned neither; S25 returned only Wikipedia-level facts. Both remain in the population as adjacent with weak evidence |
| Japanese-market coverage beyond obniz | **INCOMPLETE** | One Japanese query (S17) was run. Ambient, SORACOM's own dev tooling, MESH, iLink and similar were not searched. Given the Factory Scientist user segment, this is the largest known gap in the population |
| Academic layer | **PARTIALLY OPENED** | The MDPI benchmark, the ScienceDirect closed-loop agent evaluation and arXiv 2508.00083 were *located* (S14) but **not read**. Locating them satisfies the "do not leave the review paper unopened" lesson only halfway |

**Human tests required (no accounts were created; none of these can be settled without one):**

1. **Codey Online** — sign in, exhaust the 5 free AI messages, observe what the editor/compiler still permits.
2. **PleaseDontCode** — free tier, 3 credits / 1 device: check what one credit buys and whether a generated project survives credit exhaustion.
3. **Embedder** — pricing is only obtainable via a sales call. Human decision on whether that call is worth making.
4. **Arduino Cloud / App Lab Agentic Mode** — BYO-key agent; needs an Arduino account and an Anthropic key to see the real loop.
5. **Neural Inverse Cloud** — "forever-free AI models, no API keys" is a [S] claim; verifying it requires opening the app.

---

## 7. Discipline notes

- No candidate is described here as unique, first, or without equivalent. Ranking and
  differentiation are the harness's to make.
- Pricing observations appear only where the vendor's own page stated them, and free-plan
  existence is never written as free-in-practice: Codey's "5 AI messages per day" and
  PleaseDontCode's "3 credits per month and 1 device" are recorded as **hard limits observed**,
  with the practical consequence left open for the pricing lane.
- Counts: 6 direct + 11 partial + 25 adjacent + 6 substitute = **48 named candidates**, plus 9
  named exclusion classes. "Candidate" = a named product, platform or service; exclusion classes
  are groups, not individual products, and are not counted in the 48.
- Nothing in `/Users/ohahiso/github_project/DigiCode` was read. Only this file was written.
