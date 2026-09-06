# DigiCode practical IoT capability revalidation

- Packet: `S007-D2-donor-iot-capability`
- Lane: `INVESTIGATION`
- Authority: `DELEGATED`
- Investigation date: 2026-08-26 JST
- Investigation state: criteria evidence collected / adoption and acceptance remain with the integration owner

## Evidence notation and boundaries

- **[command+RC]** `git -C /Users/ohahiso/github_project/DigiCode rev-parse HEAD` returned `bb35c3b8025610299bf952c2c45eda2196a07401`, RC 0. This is exactly the packet's expected donor SHA.
- **[command+RC]** The same repository's `git status --short` returned zero output lines, RC 0; no tracked donor delta was present when inspected.
- **[command+RC]** Related repositories were read at `digicode-compile-api` SHA `3376746f1e5a4ca039e0cade279741f16612fccf` and `DigiCode-Helper` SHA `fa95dfd67ee83d881f93be7641cc9cef171165a2`, both from `rev-parse HEAD`, RC 0.
- **[command+RC]** Primary search populations were 687 source-visible donor files after the stated exclusions, 343/343 files under the shipping frontend `src`, 7/7 compiler `src` files, 4/4 compiler templates, and 11/11 Helper `src` files. The cross-repository source/template population was therefore 365/365 files; all count pipelines returned RC 0.
- **[static]** The generated public block catalog declares catalog schema version `1.0` and generation timestamp at `DigiCode/variants/ota/frontend/public/ai/block-catalog.json:2-4`.
- **[command+RC]** `jq` measured 580/580 catalog entries, 580/580 distinct block type identifiers, 79/79 distinct category identifiers, and 16/16 catalog board projections, RC 0. These are block-type counts, not physical-device counts.
- **[static]** Source aliases used below are: `D` = `/Users/ohahiso/github_project/DigiCode`; `F` = `D/variants/ota/frontend`; `C` = `/Users/ohahiso/github_project/digicode-compile-api`; `H` = `/Users/ohahiso/github_project/DigiCode-Helper`.
- **[command+RC]** Every donor-root search excluded `prompt/**`, `CLAUDE.md`, `AGENTS.md`, `.git/**`, and `node_modules/**`; source-population scans also excluded generated `dist/**` and `build/**`. I did not open or read any donor governance file. The known `node_modules/` population was not scanned.
- **[command+RC]** No donor file was written. The only write made by this lane is this report file.
- **[inference]** “Implemented” below means a registered block/feature emits a concrete implementation and its required core or library dependency is available to the compiler. It does not mean real hardware or a live service was exercised in this lane.

## Executive finding

- **[inference]** DigiCode is not limited to LED-level Arduino work. Its source contains a usable, ESP32-only IoT transport path: Wi-Fi, MQTT pub/sub, HTTP, WebSocket, BLE, raw CAN, raw LoRa, and a narrow Modbus RTU master, plus first-class Azure IoT and Home Assistant integrations.
- **[inference]** Its industrial-device model is nevertheless narrow. It can address a Modbus slave and one 16-bit holding register, but it has no reusable device/register-map schema, multi-register decoding, Modbus TCP, CANopen, IO-Link, or generic industrial analog-interface model. The architecture is a hybrid of maker-board library blocks, raw GPIO/bus operations, and a few protocol blocks—not a general industrial-device abstraction.
- **[inference]** The golden path can reach Azure or a self-hosted MQTT broker today when the inverter exposes the needed values as individual holding registers. It breaks at the device interpretation layer for common multiword/input-register/vendor-specific layouts, and DigiCode does not install or host the Raspberry Pi broker, Node-RED, database, or dashboard layers.

## A. Communication / network

### Classification matrix

| Capability | Classification | Support shape | Evidence |
|---|---|---|---|
| Wi-Fi | `implemented` | Built-in block; generated ESP32-core code | **[static]** One dedicated Wi-Fi block out of 580 catalog entries; `wifi_connect` emits `WiFi.h`, `WiFi.begin`, status polling, and IP reporting at `F/src/blocks/arduino/communication/wifiBlocks.ts:44-89`. All 16/16 frontend board entries set `supportsWifi: true` in `F/src/stores/boardStore.ts:100-312`. |
| BLE | `implemented` | Built-in block family; volume-mounted NimBLE library; browser Web Bluetooth controller | **[command+RC]** 19/580 catalog entries are category `ble`, RC 0. **[static]** NUS, scan/beacon, and custom GATT service/characteristic paths are emitted from `bleBlocks.ts:32-60`, `:142-221`, `:352-477`, and `:659-955`. `C/src/compile.ts:261-280` mounts `NimBLE-Arduino` and `NimBLEOta`. |
| Ethernet | `absent` | No built-in feature found | **[grep]** Zero exact Ethernet matches among 350/350 donor source/config files in the refined absence scan, RC 1. **[command+RC]** Zero of 580 catalog types/categories represent Ethernet. **[inference]** A user-written ESP32 Ethernet library may be possible outside the exposed model, but it is not a DigiCode feature found here. |
| MQTT | `implemented` | First-class block family; compiler-pinned PubSubClient; firmware talks directly to an arbitrary broker | **[command+RC]** 21/580 catalog entries are category `mqtt`, RC 0. **[static]** Broker host/port/client ID, optional user/password, connection/reconnect, publish/retain, subscribe/callback, loop, LWT, buffer, keepalive, state, and unsubscribe are emitted in `mqttBlocks.ts:28-106`, `:168-370`, and `:412-687`. `C/src/compile.ts:137-154` pins PubSubClient. |
| HTTP/REST | `implemented` | First-class blocks using ESP32-core HTTPClient; firmware calls arbitrary endpoints | **[command+RC]** 9/580 catalog entries are category `http`, RC 0. **[static]** GET, GET with headers, POST, JSON POST, PUT, DELETE, success check, URL encode, and URL build are registered at `httpBlocks.ts:27-390`; the request generators use `HTTPClient` and supplied URLs at `:43-57`, `:92-108`, and `:148-296`. |
| WebSocket | `implemented` | Client plus ESP32 runtime server; compiler-pinned ArduinoWebsockets | **[command+RC]** 12/580 catalog entries are category `websocket`, RC 0. **[static]** Client connect/send/callback/status/disconnect is at `webSocketBlocks.ts:33-203`; an ESP32-side HTTP/WebSocket server and channel controls are at `:240-660`. `C/src/compile.ts:153-155` pins ArduinoWebsockets. |
| RS485 | `partial` | Concrete DE/RE handling only inside Modbus RTU; generic UART2 otherwise | **[static]** Modbus initialization drives a transceiver DE/RE pin and UART2 at `modbusBlocks.ts:32-79`. Generic Serial2 begin/send/read/available exists at `uart2Blocks.ts:38-167`, but it has no transceiver-direction abstraction. **[inference]** Modbus RTU over RS485 is directly supported; arbitrary RS485 framing requires manual GPIO/code outside a dedicated RS485 feature. |
| Modbus RTU | `partial` | First-class master blocks; compiler-pinned ModbusMaster | **[command+RC]** 4/580 catalog entries are category `modbus`, RC 0. **[static]** The complete 4/4-block family is init, slave selection, FC03 read of exactly one holding register, and FC06 single-register write at `modbusBlocks.ts:40-147`. `C/src/compile.ts:203-213` pins ModbusMaster. |
| Modbus TCP | `absent` | No block, dependency, or runtime service found | **[grep]** Zero exact Modbus-TCP matches among 350/350 refined donor source/config files, RC 1. **[command+RC]** Zero of 580 catalog entries identify Modbus TCP. |
| CAN | `implemented` | Raw classic CAN/TWAI blocks; external physical transceiver required | **[command+RC]** 5/580 catalog entries are category `can_bus`, RC 0. **[static]** Init/pin/bitrate, transmit, receive-available, received ID, and received payload are registered at `canBlocks.ts:29-163`; `C/src/compile.ts:231-249` pins the ESP32 TWAI wrapper. **[inference]** This is raw CAN frame support, not CANopen, J1939, or CAN FD. |
| LoRa | `implemented` | Raw SX127x radio blocks; compiler-pinned LoRa library | **[command+RC]** 6/580 catalog entries are category `lora`, RC 0. **[static]** SPI/SX1276-79 init, frequency, power, send, receive handler, and received value are at `loraBlocks.ts:35-184`; `C/src/compile.ts:245-249` pins the LoRa library. |
| LoRaWAN | `absent` | No network-stack feature found | **[grep]** Zero exact LoRaWAN matches among 350/350 refined donor source/config files, RC 1. **[command+RC]** Zero of 580 catalog entries identify LoRaWAN. **[inference]** Raw LoRa packets do not establish LoRaWAN join, keys, channels, or network-server interoperability. |
| Cellular | `absent` | No modem/network feature found | **[grep]** Zero exact cellular, NB-IoT, or named modem/library matches among 350/350 refined donor source/config files, RC 1. **[command+RC]** Zero of 580 catalog entries identify cellular networking. |

### Why MQTT is already supported, and its shape

- **[static]** MQTT is not merely incidental to Home Assistant. `BlocklyEditor` directly registers the MQTT module at `F/src/components/editor/BlocklyEditor.tsx:57-62`, and the public AI catalog exposes 21/580 independently named MQTT block types.
- **[static]** `mqtt_setup` creates a plain `WiFiClient` and a `PubSubClient`, accepts an arbitrary broker host and port, and connects Wi-Fi at `mqttBlocks.ts:28-106`. This makes a LAN broker and an Internet broker the same firmware-side abstraction.
- **[static]** Basic bidirectional messaging is concrete: publish/retain at `mqttBlocks.ts:244-283`, subscribe and message callback at `:285-350`, and client servicing at `:353-369`.
- **[static]** Operational controls include authentication, reconnect, LWT, buffer sizing, keepalive, disconnect, unsubscribe, and state at `mqttBlocks.ts:168-242` and `:449-687`.
- **[static]** The generic IoT-cloud facade independently accepts broker, port, user, password, and client ID, publishes on its fixed telemetry topic, and subscribes to its fixed incoming topic at `iotCloudBlocks.ts:89-154`; provider selection exposes generic MQTT alongside Azure and two stubs at `:198-218`.
- **[static]** The compiler supplies the dependency on every applicable build through the fixed `lib_deps` universe at `C/src/compile.ts:137-154` and `:251-293`. The user does not need to upload PubSubClient for this supported path.
- **[static]** A limitation is visible in the advertised QoS publish block. It reads a QoS field, but the QoS-1 branch emits `beginPublish(topic, length, retain)` without emitting that QoS field at `mqttBlocks.ts:690-746`. The LWT connection path does emit an LWT QoS argument at `:595-670`.
- **[inference]** Therefore base MQTT is implemented, while the specifically advertised outbound QoS-1 behavior is not expressed in generated code. Generic MQTT also uses a plain `WiFiClient`; TLS certificate/client configuration is supplied only by specialized integrations such as Azure, not by the generic MQTT setup.

## B. Cloud and local backend

| Target | Firmware can talk to it? | DigiCode hosts/operates it? | Evidence |
|---|---|---|---|
| Azure IoT Hub | Yes, first class | No evidence DigiCode hosts Azure tenant resources | **[command+RC]** 9/580 catalog entries are `azure_iot`, RC 0. **[static]** Secure MQTT/SAS initialization, D2C telemetry, C2D, and direct method handling are at `azureIotBlocks.ts:54-274`; the exposed block types are at `:423-690`. |
| Azure IoT Central | Yes, first class | No evidence DigiCode hosts the Central application | **[static]** DPS registration, assignment polling, Hub handoff, publish, direct methods, and twin update are at `azureIotBlocks.ts:277-412` and exposed at `:538-676`. |
| AWS IoT Core | No operational implementation | No | **[static]** It is a selectable stub that logs and returns false at `iotCloudBlocks.ts:107-112`; the provider list labels it a stub at `:198-204`. |
| GCP IoT | No operational implementation | No | **[static]** It is a selectable stub that logs and returns false at `iotCloudBlocks.ts:113-117`; the provider list labels it a stub at `:198-204`. |
| Generic MQTT broker | Yes | No broker is hosted by the examined DigiCode source | **[static]** Arbitrary broker host/port/auth is supported at `mqttBlocks.ts:28-106` and `iotCloudBlocks.ts:89-106`. **[inference]** A Mosquitto broker on a Raspberry Pi or another LAN server is a valid destination. |
| Generic HTTP/REST endpoint | Yes | No general telemetry endpoint is hosted | **[static]** The 9/580 HTTP blocks accept user URLs and payloads at `httpBlocks.ts:27-390`. **[grep]** Zero IoT telemetry/time-series/MQTT route matches were found in all 14/14 production backend route files, RC 1. |
| WebSocket endpoint | Yes, client; ESP32 can also serve | Device runtime can host its own controller endpoint; no central telemetry service found | **[static]** Client and ESP32 server paths are separated at `webSocketBlocks.ts:33-203` and `:240-660`. |
| Home Assistant | Yes, via ArduinoHA/MQTT discovery | The user's Home Assistant and broker remain external | **[command+RC]** 47/580 catalog entries are `arduino_ha`, RC 0. **[static]** The module uses ArduinoHA and auto discovery at `arduinoHABlocks.ts:9-30`; its 47/47 exposed blocks cover device init/auth, sensors, binary sensors, switches, lights/RGB, numbers, fans, covers, buttons, triggers, scenes, tags, connection callbacks, diagnostics, reporting, and OTA at `:578-2760`. `C/src/compile.ts:231-249` supplies the library. |
| Raspberry Pi / local server | Yes as a generic network destination | No Pi provisioning or service orchestration found | **[inference]** MQTT, HTTP, and WebSocket are address-neutral, so LAN/self-hosted destinations work. **[static]** No Pi board/runtime target exists in the board definitions at `boardStore.ts:100-312`; the backend's 14/14 production route files are auth/project/class/subscription/feedback/compile-usage functions rather than Pi/IoT services. |
| Database | Only through an external HTTP/MQTT consumer | DigiCode's database stores projects/accounts, not sensor telemetry | **[static]** Project persistence stores Blockly XML and generated code at `D/esp32-blockly-backend/src/routes/projects.ts:42-46`, `:64-88`, and `:124-173`; its schema is at `D/esp32-blockly-backend/migrations/0001_initial_schema.sql:13-25`. **[grep]** The 14/14 production route inventory had zero telemetry/time-series database routes, RC 1. |
| Google Sheets | Yes through a user-supplied webhook | No | **[static]** The 2/2-block module posts JSON to a user-created Apps Script webhook and formats a row at `googleServicesBlocks.ts:9-20` and `:40-113`. |

- **[command+RC]** The backend route population was 16/16 route files total and 14/16 production route files after excluding 2/16 test files, RC 0. The production names cover authentication, administration, classes, projects, submissions, subscriptions, feedback, feature flags, and compile usage; no telemetry ingestion route was measured.
- **[inference]** “Firmware can send to a local broker/server” is supported. “DigiCode supplies the Mosquitto/Node-RED/database/dashboard deployment” is absent in the examined source. These are separate capability claims.

## C. Board / compute support

### Frontend board source of truth

- **[static]** `F/src/stores/boardStore.ts:100-312` contains the shipping `SUPPORTED_BOARDS` array.
- **[command+RC]** Counting object IDs and FQBN fields inside that array produced 16/16 physical board entries and 10/16 distinct FQBN strings, RC 0. Category counts were 9/16 M5Stack, 3/16 Seeed XIAO, and 4/16 generic ESP32.
- **[static]** The 16/16 entries are:

| Category | Entries in category | Code evidence |
|---|---:|---|
| M5Stack | 9/16 | **[static]** M5StampS3 BAT, ATOMS3 Lite, M5StampS3A, M5Stamp C3/C3U, M5StickC Plus, ATOM Lite, ATOM Matrix, M5Stamp Pico, M5Stack Basic/Gray/Fire at `boardStore.ts:101-218`. |
| Seeed XIAO | 3/16 | **[static]** XIAO ESP32C6, XIAO ESP32S3, XIAO ESP32C3 at `boardStore.ts:219-258`. The section comment says 4 boards, but the array contains 3/3 XIAO objects. |
| Generic | 4/16 | **[static]** ESP32-C6, ESP32-S3, ESP32-C3, and original ESP32 at `boardStore.ts:259-312`. |

- **[static]** Modern ESP32 S3, C3, and C6 variants, Seeed XIAO, and M5Stack are present. The 16/16-entry array contains zero RP2040/RP2350, nRF, STM32, Raspberry Pi/Linux SBC, cellular, or non-ESP32 MCU entries.
- **[static]** The board source explicitly states ESP32-only and records removal of RP2040 entries at `boardStore.ts:21-27`. This is code-adjacent source commentary, not a README/marketing claim.

### Compiler board source and duplication finding

- **[static]** `C/src/boards.ts:63-108` contains a separate `FQBN_TO_PIO` object with 10/10 FQBN keys. The file itself instructs that adding a board requires appending an entry there and says it mirrors the frontend at `:9-16`.
- **[command+RC]** Compiler counting produced 10/10 map entries and 10/10 distinct keys, RC 0. The key set exactly matched the frontend's 10/16 distinct FQBN values.
- **[inference]** The earlier “duplicated by hand” finding is supported with a qualification: the frontend manually owns 16/16 physical selections, while the compiler manually owns the corresponding 10/10 distinct compile mappings. It is not a literal duplicate 16-entry list; it is two hand-maintained sources whose domains join on FQBN.
- **[command+RC]** The public AI catalog also projects 16/16 board entries, but it is stamped as generated and is a derivative artifact rather than evidence of another hand-maintained compile list.
- **[static]** The compiler maps all 10/10 FQBNs to an ESP32 PlatformIO platform/board at `C/src/boards.ts:51-108`; unsupported FQBNs throw at `:110-117`.

## D. Device / sensor / actuator support

### Measured exposed inventory

- **[command+RC]** The catalog contains 137/580 sensor-related block types across 21/79 catalog categories. All 137/137 sensor type identifiers are distinct, RC 0. This denominator is block operations, not unique physical sensors.
- **[command+RC]** Sensor category distribution is:

| Category | Block types / 137 sensor types | Representative model |
|---|---:|---|
| `sensor_analog` | 13/137 | Electrical ADC reads wrapped as maker sensor concepts |
| `sensor_digital` | 12/137 | GPIO digital inputs |
| `sensor_environment` | 18/137 | BME/BMP/SHT/QMP and M5 ENV modules |
| `sensor_current` | 9/137 | AC clamp, INA219, ACS712 |
| `sensor_air_quality` | 7/137 | SCD30 and PMS5003 |
| `sensor_dht` | 3/137 | DHT family |
| `sensor_motion` | 7/137 | Motion/IMU family |
| `sensor_line` | 7/137 | Line sensors |
| `sensor_qtr` | 12/137 | QTR array operations |
| `encoder` | 6/137 | Quadrature count/distance/speed |
| `sensor_encoder_mag` | 3/137 | AS5600 |
| `flow_meter` | 2/137 | Pulse flow meter |
| `gps` | 5/137 | NMEA GPS |
| `hx711` | 6/137 | Load-cell ADC |
| `apds9960` | 3/137 | Gesture/color/proximity |
| `sensor_health` | 3/137 | MAX30102 |
| `sensor_tof` | 2/137 | VL53L0X |
| `sensor_ultrasonic` | 7/137 | Ultrasonic distance |
| `sensor_wall` | 7/137 | Robot wall sensing |
| `microphone` | 3/137 | Analog microphone operations |
| `piezo` | 2/137 | Piezo operations |

- **[command+RC]** The catalog contains 24/580 actuator block types across 5/79 catalog categories: motor 4/24, relay 4/24, servo 4/24, stepper 8/24, and stepper-driver 4/24, RC 0.
- **[command+RC]** A separate robot-oriented population contains 35/580 block types across 3/79 categories (`robot_humanoid`, `robot_transform`, `robot_wheel`), RC 0.
- **[command+RC]** Source layout contains 19/343 sensor modules, 4/343 actuator modules, and 5/343 robot modules under frontend `src`, RC 0. These module counts do not equal device counts because a module exposes multiple operations and DHT/ultrasonic blocks live outside the 19-file sensor directory.

### What a “device” means structurally

- **[static]** Some blocks are electrical-interface wrappers. For example, a potentiometer block emits `analogRead` and fixed map operations at `analogSensorBlocks.ts:27-58`; a button block emits `pinMode`/`digitalRead` at `digitalSensorBlocks.ts:27-53`.
- **[static]** Some blocks are raw bus operations. Generic I2C register write/read is exposed at `i2cSpiBlocks.ts:145-199`, and generic SPI begins at `:201-220`. UART2 and raw CAN similarly expose byte/frame-level operations.
- **[static]** Many blocks model a named breakout/module and its Arduino library. The compiler's fixed dependency arrays include DHT, MPU6050, BME/BMP, VL53L0X, AS5600, QTR, HX711, INA219, ACS712, GPS, ModbusMaster, air-quality, APDS9960, MAX3010x, displays, motor libraries, and radio/network libraries at `C/src/compile.ts:137-249`.
- **[static]** Modbus models protocol plus numeric slave/register address, but not a device profile. Its only read operation requests one holding register and returns one integer or `-1` at `modbusBlocks.ts:105-123`; its only write operation emits a single-register write at `:125-147`.
- **[grep]** Searches of the 343/343 frontend source files found no user-facing library manager, dependency declaration, or custom-library workflow. Matches for dependency terms were implementation comments only. **[static]** The compile request type accepts source fragments, board, and connection type—not a dependency list—at `C/src/compile.ts:43-50`; library dependencies are built from fixed arrays at `:137-293`.
- **[inference]** The structure is therefore hybrid but maker-weighted: named Arduino-library devices are easiest; arbitrary devices are possible only where raw GPIO/I2C/SPI/UART/CAN or the narrow Modbus primitive is sufficient. It does not model an industrial device as a reusable combination of electrical layer, protocol, register map, datatype/endian/scaling, alarms, and commands.

### Arbitrary industrial-device fit

| Device/interface | Fit to current structure | Evidence-based limit |
|---|---|---|
| 4–20 mA | `partial` | **[inference]** A conditioned voltage can be read with ADC and manually scaled, but there is no 4–20 mA input/current-loop block, transmitter-power model, open-loop detection, or calibration schema among 580/580 catalog entries. External analog hardware is required. |
| 0–10 V | `partial` | **[inference]** External division/isolation plus ADC and manual math can work; no 0–10 V electrical-interface profile exists among 580/580 catalog entries. |
| RS485 | `partial` | **[static]** DE/RE is built into the 4/580 Modbus family; generic UART2 lacks a dedicated RS485 transceiver abstraction. |
| Modbus RTU | `partial` | **[static]** Master FC03-one-register and FC06-one-register only at `modbusBlocks.ts:105-147`; no coils, discrete/input registers, multi-register access, typed decode, endian, or reusable register map was found. |
| Modbus TCP | `absent` | **[grep]** Zero exact matches in 350/350 source/config files, RC 1. |
| CAN | `implemented` at raw-frame level | **[static]** 5/580 blocks expose raw send/receive and payload/ID at `canBlocks.ts:36-163`. |
| CANopen | `absent` | **[grep]** Zero exact matches in 350/350 source/config files, RC 1. |
| IO-Link | `absent` | **[grep]** Zero exact matches in 350/350 source/config files, RC 1. |
| Pulse output | `partial` | **[static]** Encoder and flow-meter categories contribute 8/137 sensor operations; generic interrupt/GPIO primitives exist. **[inference]** Electrical conditioning and device semantics remain manual. |
| Industrial encoder | `partial` | **[static]** Quadrature and AS5600 operations exist as 9/137 sensor operations. **[inference]** Differential line receivers and SSI/BiSS/EnDat profiles were not found. |
| Power meter / PLC / inverter | `partial` | **[inference]** A Modbus RTU device works only to the extent its map fits FC03 single holding reads and FC06 single writes. No vendor/device profile exists. |

## E. Controller subsystem / dashboard / UI

- **[command+RC]** The BLE controller directory contains 15/15 files, of which 12/15 are non-test production files, RC 0. **[static]** Its schema supports NUS chat, GATT toggle, slider, and display widgets at `F/src/components/editor/BleController/types.ts:16-76`, rendered through browser Web Bluetooth components.
- **[command+RC]** The serial UI directory contains 2/2 files: monitor and plotter, RC 0. **[static]** `SerialMonitor` reads, clears, connects, disconnects, and sends through the serial store at `F/src/components/serial/SerialMonitor.tsx:13-58` and `:66-163`.
- **[static]** `SerialPlotter` parses scalar, comma-separated, and labelled numeric serial lines at `SerialPlotter.tsx:68-107`, keeps a configurable rolling point set at `:109-155`, and exports CSV at `:163-176`.
- **[static]** The plotter checks Wi-Fi connection state for its connected indicator at `SerialPlotter.tsx:187`, but the data-processing effect consumes only `serialOutput` when serial is connected at `:109-155`. **[inference]** The examined plotter is a serial data viewer, not a functioning network telemetry dashboard.
- **[command+RC]** PID tuning has 6/6 service files and 1/1 tuning component file, RC 0. **[static]** Its transport interface supports HTTP, USB serial, and BLE NUS at `F/src/services/pid/IPidTransport.ts:1-27`; the factory selects Wi-Fi, then serial, then BLE at `PidTransportFactory.ts:1-27`; the panel sends gains at `F/src/components/tuning/PIDTuningPanel.tsx:39-75`.
- **[static]** Home Assistant is an external dashboard/control integration through 47/580 ArduinoHA blocks, rather than a DigiCode-hosted dashboard.
- **[static]** A separate ESP32-served WebSocket controller and the unified/automatic Web UI machinery are linked through the WebSocket server blocks at `webSocketBlocks.ts:240-660`. Per packet scope, this report establishes that relationship but does not re-audit that generator.
- **[inference]** Outside the separately owned automatic Web UI feature, the available DigiCode-side UI machinery is device-local/session-oriented: BLE controls, serial monitor/plotter, PID tuning, and Home Assistant integration. No persistent, general-purpose time-series dashboard or telemetry database UI was found in the 343/343 frontend source and 14/14 production backend route populations.

## F. AI integration

### Providers and abstraction

- **[static]** The provider type has 4/4 options: OpenAI, Anthropic, Gemini, and custom; the AI modes have 3/3 options: block generation, help bot, and controller customization at `F/src/services/ai/index.ts:16-19`.
- **[static]** `AIClient` defines chat and conversation-to-generation operations, and the factory selects either the Anthropic client or the OpenAI-compatible client at `F/src/services/ai/index.ts:69-79`.
- **[static]** OpenAI, Gemini, and custom endpoints share the OpenAI-compatible request path; the custom provider appends a chat-completions path to a user endpoint at `openAICompatibleClient.ts:13-35`. Anthropic has its own request client at `anthropicClient.ts:19-48`.
- **[static]** A local-LLM help page explicitly names Ollama and LM Studio as 2/2 suggested local tools at `F/src/pages/HelpLocalLLMPage.tsx:6-20`. **[inference]** A local or self-hosted OpenAI-compatible endpoint is supported through `custom`, subject to browser reachability/CORS and compatible API shape.
- **[static]** The assistant UI refuses to send when the API-key field is empty at `F/src/components/editor/AIAssistantPanel.tsx:76-82`. **[inference]** Even a local endpoint that does not authenticate must currently be configured with a non-empty key-form field.

### Context and dictionary

- **[static]** The AI fetches the generated public block catalog at `F/src/services/ai/systemPrompt.ts:86-105`. The catalog schema supplies type, category, tooltip, statement/output shape, output type, modes, board requirement, credential flags, fields, value inputs, and statement inputs at `:10-58`.
- **[command+RC]** That dictionary contains 580/580 unique block types and 16/16 board projections, RC 0.
- **[static]** The generation prompt separates statement/value/hat blocks, includes exact schemas, forbids credential values, adds board and mode, includes existing workspace XML up to 5,000 characters, injects few-shot examples, and adds cross-block/init contracts at `systemPrompt.ts:219-266`.
- **[static]** The help-bot prompt receives DigiCode feature descriptions, optional board/mode, and a catalog overview at `systemPrompt.ts:269-302`.
- **[static]** `filterCatalog` currently returns all 580/580 blocks and ignores its board/mode parameters at `systemPrompt.ts:98-105`. **[inference]** Board-requirement metadata is described to AI but is not used by this filter to reduce the supplied dictionary.
- **[static]** Controller customization receives the current controller schema and requests a customization-diff JSON shape at `systemPrompt.ts:303-365`.

### Output and key handling

- **[static]** Block generation returns validated Blockly XML plus raw response and attempt count at `F/src/services/ai/index.ts:38-42`; the panel applies that XML to the workspace and records it in a `system-meta` message at `AIAssistantPanel.tsx:147-192`.
- **[static]** C++ is then derived from the Blockly workspace by the normal generator at `F/src/components/editor/BlocklyEditor.tsx:196-237`. **[inference]** AI output is both metadata/structure (XML and controller diff) and indirectly code, but the provider does not directly supply the final C++ in this path.
- **[static — TYPE/LOCATION-CLASS ONLY]** Provider credentials are string fields in browser application state at `F/src/services/ai/index.ts:31-36`. The persisted fields are provider, credential string, custom endpoint, and model in browser local storage; conversations remain browser memory only at `F/src/stores/aiStore.ts:5-20` and `:37-88`.
- **[static — TYPE/LOCATION-CLASS ONLY]** The browser sends the credential in a provider request header directly to the configured provider/custom endpoint at `openAICompatibleClient.ts:43-52` or `anthropicClient.ts:30-47`. No key value was read, recorded, or reproduced in this report.
- **[inference]** No DigiCode server-side AI proxy or provider-secret vault is in the examined request path; custom/local traffic is browser-direct.

## G. Generated-code metadata

### Project artifact

- **[static]** The downloadable `.digicode.json` schema contains 6/6 fields: title, optional description, Blockly XML, generated code, language, and save timestamp at `F/src/services/projectFileReader.ts:20-36`.
- **[static]** The save dialog writes those 6/6 fields at `F/src/components/editor/SaveProjectDialog.tsx:68-89`; the parser requires only non-empty Blockly XML and supplies permissive defaults for the others at `projectFileReader.ts:53-77`.
- **[static]** The backend project record stores identity/ownership, title/description, Blockly XML, generated code, language, visibility, and timestamps at `D/esp32-blockly-backend/src/routes/projects.ts:42-46`, `:64-88`, and `:124-173`; the base schema and language migration are at `D/esp32-blockly-backend/migrations/0001_initial_schema.sql:13-25` and `0004_add_language_column.sql:1-4`.
- **[static]** The Blockly generator assembles raw source from definitions, setup fragments, loop-pre fragments, and workspace code at `F/src/components/editor/BlocklyEditor.tsx:196-237`. No project/provenance manifest is attached to that returned source in this function.

### Compile-time and cache metadata

- **[static]** A compile request transiently carries source fragments, board FQBN, and connection type at `C/src/compile.ts:43-50`.
- **[static]** A successful compile internally returns firmware plus 4/4 metadata fields: duration in milliseconds, template, PlatformIO board, and optional cache-hit flag at `C/src/compile.ts:52-64`.
- **[static]** The server transmits all 4/4 compile metadata fields in its completion event at `C/src/server.ts:216-225`.
- **[static]** The frontend reads that completion object but retains only template as template/version in its returned result; PlatformIO board, cache flag, and duration—3/4 transmitted metadata fields—are not returned by this construction at `F/src/services/compileService.ts:297-318`.
- **[static]** The compiler cache key derives from source, platform, board, template, sorted build flags, and a dependency-list hash at `C/src/cache.ts:35-69` and `C/src/compile.ts:440-460`. Cache-local `meta.json` contains 4/4 fields: template, PlatformIO board, original duration in milliseconds, and save timestamp at `C/src/cache.ts:72-77` and `:125-145`.
- **[static]** Library names and version/commit pins exist in compiler source and generated PlatformIO configuration at `C/src/compile.ts:137-293` and `:393-415`; their hash participates in the cache key at `:440-460`.
- **[inference]** Those dependency records and pins are compiler configuration/provenance, not metadata attached to the downloaded firmware or `.digicode.json`. Recovering them later requires the matching compiler source/image; the project artifact cannot identify them by itself.

### Registry-relevant gap inventory

- **[static]** Of the following 6/6 provenance dimensions, zero are fields in the 6/6-field `.digicode.json` schema: project schema version, selected board/FQBN, compiler revision/image identity, dependency list/pins or dependency hash, block-catalog version, and device/register-map schema.
- **[static]** Selected board and compile metadata exist transiently in the compile pipeline, and dependency pins are derivable from compiler source/cache, but they are not co-packaged with the project artifact.
- **[inference]** Current metadata is adequate to reopen blocks and retain a generated-code snapshot, but not to reproduce or register the exact board/compiler/dependency/device semantics without external source-state knowledge.

## H. Golden-scenario verdict

### Layer-by-layer result

| Golden-scenario layer | What DigiCode can do today in the examined source | Where it narrows or breaks |
|---|---|---|
| Inverter electrical link | **[static]** Generate ESP32 UART2 plus a DE/RE-controlled external RS485 transceiver through `modbus_init` at `modbusBlocks.ts:32-79`. | **[inference]** Transceiver, isolation, termination, biasing, grounding, and inverter wiring are external hardware/user responsibilities. |
| Modbus RTU acquisition | **[static]** Select slave ID, read one FC03 holding register, and write one FC06 register at `modbusBlocks.ts:84-147`. | **[inference]** Frequency/current/RPM/run/alarm work directly only when each desired value is available as a single 16-bit holding register. Input registers, coils/discrete status, multi-register values, signed/32-bit/float formats, word/byte order, scaling profiles, batched reads, and detailed error codes need manual/custom logic not represented by these 4/4 blocks. This is the first likely break for an arbitrary inverter. |
| ESP32 edge compute | **[static]** All 16/16 supported physical selections are ESP32-family targets, including S3/C3/C6; arithmetic, logic, storage, and protocol blocks can combine readings and messages. | **[inference]** No Linux SBC or non-ESP32 edge target exists, and real-time/resource suitability was not measured. |
| MQTT uplink | **[static]** Connect to an arbitrary broker and publish/subscribe with authentication, retain, reconnect, and LWT through 21/580 MQTT blocks and the compiler-pinned library. | **[static]** Generic MQTT uses a plain Wi-Fi client, and the advertised outbound QoS-1 field is not emitted at `mqttBlocks.ts:690-746`. Broker-specific TLS/client-certificate setups are not generic blocks. |
| Azure route | **[static]** Use first-class Azure IoT Hub/Central secure MQTT/SAS/DPS, D2C, C2D, direct-method, and twin paths in 9/580 Azure blocks. | **[inference]** Azure tenant/resource creation, policy, storage, and dashboards remain external. No live Azure connection was fired in this lane. |
| Raspberry Pi route | **[inference]** Point generic MQTT at a Pi/LAN Mosquitto broker; generic HTTP/WebSocket can similarly address a local service. Home Assistant can discover/control entities through the user's broker. | **[static]** No Raspberry Pi target, Mosquitto/Node-RED/database provisioning, service configuration, or Pi dashboard deployment exists in the examined 16/16 board list and 14/14 production backend routes. |
| Storage and visualisation | **[static]** Home Assistant integration, serial plotter/CSV, BLE controller, PID tuning, and the separately owned device-served controller machinery exist. | **[inference]** General telemetry persistence, time-series schema, Node-RED flow, database adapter, and server dashboard are external. Serial Plotter consumes serial data, not the MQTT stream. |
| Optional control | **[static]** MQTT subscriptions, Azure C2D/direct methods, Home Assistant command entities, and Modbus FC06 single-register writes can form a command path. | **[inference]** Safety interlocks, authorization policy, command acknowledgement, watchdog/failsafe behavior, register-profile validation, and multi-register control are not supplied as an industrial control model. |

### Practical verdict

- **[inference]** A narrow but real end-to-end demonstration can be built today without a user-uploaded library: inverter holding register → ModbusMaster → ESP32 → PubSubClient → local Mosquitto, or Azure-specific blocks → Azure IoT. The compiler already pins ModbusMaster, PubSubClient, and the Azure SDK at `C/src/compile.ts:137-249`.
- **[inference]** The local route is genuinely local-capable because broker/endpoint addresses are arbitrary; it is not cloud-only. DigiCode supplies the device firmware side, not the Pi/server stack.
- **[inference]** If the inverter uses a typical vendor map involving input registers, multiple words, floats, endian conversion, status bitfields, or non-FC03/FC06 functions, the current block structure is insufficient at the inverter-to-ESP32 interpretation step. Custom C++ could theoretically fill gaps, but no first-class user dependency/library declaration was found in the 580/580 catalog or compile request, so “bring any Arduino library” is not an established product capability.
- **[inference]** Consequently, DigiCode currently supports practical IoT transport and selected integrations, but only partial practical industrial-device development. The limiting dimension is not MQTT; it is device/electrical/protocol modelling plus the absent managed storage/dashboard backend.

## What I could not determine and why

- **[NOT OBTAINED]** Hardware behavior on an actual inverter, RS485 transceiver, ESP32 board, CAN transceiver, LoRa radio, or BLE peripheral was not obtained. No physical hardware was authorized or available; no `real-fire` rung was run.
- **[NOT OBTAINED]** Live compile success for representative golden-scenario Blockly XML was not obtained. The lane was source investigation and no acceptance compile command was supplied; no `synthetic` compile rung was run.
- **[NOT OBTAINED]** Live broker interoperability, packet delivery, reconnect behavior, Azure provisioning, Home Assistant discovery, and Pi service compatibility were not obtained. No network credentials or external-service mutation was authorized; no `API-smoke` or `real-fire` rung was run.
- **[NOT OBTAINED]** Compatibility of every communication library with every one of the 16/16 physical frontend choices was not obtained. Static flags and mappings exist, but this lane did not execute a 16-board compile/runtime matrix.
- **[NOT OBTAINED]** Whether generic HTTP HTTPS succeeds for every certificate/redirect mode was not obtained. The generic generator delegates to ESP32 `HTTPClient`; it exposes no generic certificate-policy block in the examined 9/580 HTTP family.
- **[NOT OBTAINED]** A specific inverter verdict was not obtained because no vendor/model/register map was supplied. The report instead states the exact supported Modbus function/data shape that such a map must satisfy.
- **[NOT OBTAINED]** A supported way to add an arbitrary user library was not obtained. The exposed catalog and compile request have no dependency-declaration field, while the compiler uses a fixed library universe; this does not prove that an undocumented operational escape hatch cannot exist outside the examined source.
- **[NOT OBTAINED]** Production deployment ownership and live hosted topology were not obtained. Source shows what DigiCode firmware/backend code can do, not which external tenants, brokers, databases, or dashboards are currently operated.
- **[NOT OBTAINED]** The initial backend-route probe used a wrong nested path and returned an IO error, RC 2. It was not treated as absence. The corrected path contained 16/16 route files and the corrected IoT-route search returned zero matches, RC 1.

## Competing hypotheses I considered

| Competing hypotheses | Evidence observed | Evidence that would separate them further |
|---|---|---|
| H1: MQTT is only an incidental Home Assistant helper. H2: MQTT is a generic first-class transport. | **[static]** H2 is better supported: 21/580 independent MQTT types, arbitrary broker/port/auth, pub/sub, reconnect, and fixed compiler dependency at `mqttBlocks.ts:28-687` and `C/src/compile.ts:137-154`. | **[NOT OBTAINED]** A local Mosquitto API-smoke with publish and command round-trip would test runtime interoperability and reconnect behavior. |
| H1: DigiCode is maker-only. H2: DigiCode already has full industrial-device abstraction. H3: It is a hybrid with narrow industrial primitives. | **[inference]** H3 best fits: raw GPIO/buses and Modbus/CAN exist, but Modbus is limited to FC03/FC06 single registers and no register-map/device schema exists. | **[NOT OBTAINED]** Compile and real-fire tests against several inverter maps—single holding, input-register, multiword float, bitfield, and multi-register control—would measure the actual boundary. |
| H1: The frontend and compiler each duplicate the same 16-board list. H2: There is only one source of truth. H3: Two hand-maintained domains join through FQBN. | **[command+RC]** H3 fits the measured lists: frontend 16/16 physical entries and 10/16 distinct FQBNs; compiler 10/10 FQBN mappings, with an explicit manual-add instruction, RC 0. | **[NOT OBTAINED]** A CI mutation adding one physical board/FQBN on one side only would reveal whether an automated consistency gate detects drift. No mutation was allowed in this read-only lane. |
| H1: “Absent” protocols are merely hidden in compiler/helper code. H2: They are absent from the exposed/product source population. | **[grep]** H2 is supported for Ethernet, Modbus TCP, LoRaWAN, CANopen, IO-Link, and cellular: refined exact search found zero matches in 350/350 donor source/config files, RC 1, and zero corresponding types among 580/580 catalog entries. | **[NOT OBTAINED]** Installed framework libraries inside build images could contain those APIs without product exposure. Inspecting/running the exact compiler image would distinguish “available transitively” from “product supported”; no image inspection was performed. |
| H1: DigiCode operates an IoT backend/database/dashboard. H2: It only emits firmware that talks to external services. | **[static]** H2 fits: firmware-side Azure/MQTT/HTTP/HA integrations exist, while all 14/14 production backend route files concern product accounts/projects/classes/usage rather than telemetry ingestion. | **[NOT OBTAINED]** Infrastructure inventories and live deployment configuration could show an out-of-repository service; those were outside scope and not accessed. |
| H1: AI directly writes final firmware. H2: AI only emits metadata. H3: AI emits structured metadata that is then compiled into code. | **[static]** H3 fits: AI returns validated Blockly XML and controller JSON diffs; Blockly subsequently generates C++ at `AIAssistantPanel.tsx:147-192` and `BlocklyEditor.tsx:196-237`. | **[NOT OBTAINED]** Provider API-smoke and XML-to-C++ generation were not run, so semantic quality and runtime correctness remain unmeasured. |

## Instrument validity and commands observed

- **[command+RC]** `git -C /Users/ohahiso/github_project/DigiCode rev-parse HEAD` → expected SHA, RC 0.
- **[command+RC]** `git -C /Users/ohahiso/github_project/DigiCode status --short` → zero output lines, RC 0.
- **[command+RC]** `rg --files` source-population counts → donor-visible 687 files; frontend `src` 343 files; compiler `src` 7 files; compiler templates 4 files; Helper `src` 11 files; combined cross-repository source/templates 365 files; RC 0.
- **[command+RC]** `jq` catalog measurements → 580 block entries / 580 unique types / 79 distinct categories / 16 board projections; communication, sensor, actuator, and robot category counts above; RC 0.
- **[command+RC]** Board extraction/count pipeline → frontend 16 physical entries / 10 distinct FQBNs; compiler 10 mappings / 10 distinct FQBN keys; category split 9 M5Stack + 3 XIAO + 4 generic = 16 physical entries; RC 0.
- **[grep]** The first case-insensitive absence probe produced false positives because lowercase comparator text contained `lte`; it was rejected as an invalid instrument for cellular absence. A refined exact-term scan over the same 350/350 source/config population returned zero matches, RC 1. No conclusion uses the false-positive probe.
- **[command+RC]** Backend route enumeration → 16 total route files / 14 production route files / 2 test route files, RC 0; corrected exact IoT-route search → zero matches, RC 1.
- **[static]** Targeted `nl -ba`/`sed` reads supplied the path:line evidence cited throughout; all successful reads returned RC 0.
- **[command+RC]** Verification rung labels: `static` and `grep` were run; repository state/SHA checks are `command+RC`. `synthetic`, `API-smoke`, `visual`, and `real-fire` were not run. No test, selftest, or mutation was required or run for this read-only investigation report.

## Conflict surface

- **[command+RC]** Donor SHA matched exactly and donor tracked status was clean, RC 0.
- **[command+RC]** The receiving repository already had a modified `AGENTS.md` and other files in this investigation directory before this report was created; this lane did not touch them. This was treated as pre-existing shared-worktree state, not donor sandbox noise.
- **[inference]** No literal conflict with the packet, no unexpected donor sandbox noise beyond the declared `node_modules/`, and no uncovered decision were encountered.
