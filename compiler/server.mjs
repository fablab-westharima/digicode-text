// DigiCode Text compiler — minimal first slice.
// POST /compile  { env: "xiao_rp2040" | "pico", source: "<main.cpp>" }
//   -> 200 UF2 bytes for RP2040/Pico; JSON flash set (manifest + base64 images) for ESP boards
//   -> 422 application/json { error, log }            on compile failure
// GET  /          -> web/index.html
// GET  /libraries/incompat -> the compiler's library incompatibility table (compiler/library-incompat.mjs)
// GET  /boards    -> [{ id, name, family, platform, framework, core, coreNote (what this board's core
//                       generation changes about the APIs, where that trips up code written for the
//                       older one; ESP32 boards only, null elsewhere), artifact, browserFlash, serial, flashHint,
//                       wireless (this board has a radio), flashRoute / routeLabel / routeVerified /
//                       routeVerifiedBy (the maintainers' own record of which flashing routes have been
//                       run on real hardware; derived from FLASH_ROUTES below and not shown in the UI),
//                       flashGuide (the steps shown before flashing; compiler/flash-guides.mjs),
//                       pins (generated from the PlatformIO variant header), pinTableNote (how to read
//                       that table, where the variant is generic), pinNotes (sourced board notes),
//                       statusNote (one sentence for a board the vendor has stopped selling; null
//                       everywhere else, shown in the manual's own section for that board),
//                       wirelessNote (one sentence for a board whose radio is not on the board
//                       itself; null everywhere else, shown in the same place as statusNote),
//                       incompatibleLibraries (rows of the incompatibility table for this board) }]
// GET  /health    -> { ok: true }
//
// No dependencies. Runs `pio run` in the project-local PlatformIO project
// templates. Each request builds in a fresh temporary project directory; several may run at
// once, up to MAX_BUILDS.
//
// Environment variables:
//   BIND_HOST              listen address (default '127.0.0.1'; the Docker image sets 0.0.0.0)
//   PORT                   listen port (default 3100)
//   PIO_BIN                the `pio` executable (default ~/.local/bin/pio)
//   COMPILE_TIMEOUT_MS     how long one `pio run` may take before it is killed (default 90000)
//   MAX_CONCURRENT_BUILDS  how many builds may run at once (default: half the cores, min 1)
//   ALLOWED_ORIGINS        comma-separated CORS origins (default: empty = no CORS headers)
//   PIO_CORE_DIR_ESP8266   PLATFORMIO_CORE_DIR used for esp8266 builds only (default: unset =
//                          the same core dir as every other platform)

import http from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, copyFile, readdir, rm } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { validateLibraries } from '../shared/libraries.js';
import { searchLibraries, libraryDetails, verifyLibraries } from './registry.mjs';
import { LIBRARY_INCOMPAT, findIncompat, incompatFor } from './library-incompat.mjs';
import { FLASH_GUIDES } from './flash-guides.mjs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const RP2040_PROJECT = path.join(here, 'pio-rp2040');
const ESP_SHARED = path.join(here, 'pio-esp'); // build scripts shared by every ESP-family project
// Sources for the hand-written pin notes below. Only the board vendor's own wiki and the
// silicon vendor's own datasheet are used; every note was read there before being written here.
const SEEED_XIAO_RP2040 = 'https://wiki.seeedstudio.com/XIAO-RP2040/';
const SEEED_XIAO_ESP32C3 = 'https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/';
// The Wio Node schematic is the only document that gives the board's own GPIO assignments; the
// wiki page links it under Resources -> Hardware. The link target is on files.seeedstudio.com,
// so the page that carries the link is named here, with the link's own text.
const SEEED_WIO_NODE_SCHEMATIC = 'https://wiki.seeedstudio.com/Wio_Node/ の Resources → Hardware → Schematic File in PDF（Wio Node v1.0）';
const RPI_PICO_DATASHEET = 'https://datasheets.raspberrypi.com/pico/pico-datasheet.pdf';
// Pico W has its own datasheet. The Pico one is not reused: the radio moves the user LED,
// VBUS sense and the SMPS control off the RP2040's GPIO, so the Pico sentences are wrong here.
const RPI_PICO_W_DATASHEET = 'https://datasheets.raspberrypi.com/picow/pico-w-datasheet.pdf';
const ESP32C3_DATASHEET = 'https://documentation.espressif.com/esp32-c3_datasheet_en.pdf';
const ESP32_DATASHEET = 'https://documentation.espressif.com/esp32_datasheet_en.pdf';
const ESP32S3_DATASHEET = 'https://documentation.espressif.com/esp32-s3_datasheet_en.pdf';
const SEEED_XIAO_ESP32S3 = 'https://wiki.seeedstudio.com/xiao_esp32s3_getting_started/';
const ESP32C5_DATASHEET = 'https://documentation.espressif.com/esp32-c5_datasheet_en.pdf';
const ESP32C6_DATASHEET = 'https://documentation.espressif.com/esp32-c6_datasheet_en.pdf';
const SEEED_XIAO_ESP32C6 = 'https://wiki.seeedstudio.com/xiao_esp32c6_getting_started/';
const SEEED_XIAO_ESP32C5 = 'https://wiki.seeedstudio.com/xiao_esp32c5_getting_started/';
// The C5 DevKitC's own user guide: the only document that says which of the two USB-C ports is
// wired to what, and which of the chip's pins this board brings out.
const ESP32_C5_DEVKITC_GUIDE = 'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32c5/esp32-c5-devkitc-1/user_guide.html';
// Espressif sells the DevKitC-1 in several flash/PSRAM variants and the board itself is not
// marked with which one it is. The shop page is what names the variant actually bought here,
// and the build (8MB flash, quad PSRAM) is set from it, so it is cited rather than implied.
const AKIZUKI_C5_DEVKITC = 'https://akizukidenshi.com/catalog/g/g131642/';
// ESPr Developer C5 is Switch Science's own board. Their product page is the only document that
// names the module variant it carries and what the Qwiic connector is wired to.
const SSCI_ESPR_C5 = 'https://www.switch-science.com/products/11006';
// The board's own schematic, published by the same vendor and linked from that page: the only
// document that says what the two buttons and the USB-C are actually connected to.
const SSCI_ESPR_C5_SCHEMATIC = 'https://doc.switch-science.com/media/files/bdfd7dc8-09b4-4459-bc5b-ce191022f9df.pdf';
// Espressif's module datasheet, hosted by the same vendor and linked from that page: the only
// document that says what the in-package PSRAM does to GPIO15.
const ESP32C5_WROOM_DATASHEET = 'https://doc.switch-science.com/media/files/bed45d54-6f49-4269-a6cf-f8ff7dfaa6ab.pdf';
// M5's own product page for the StampC5: the pad list, the two LEDs and the antenna.
const M5_STAMP_C5 = 'https://docs.m5stack.com/en/core/Stamp-C5';
// The board's own schematic, published by M5 and linked from that page: the only document that
// says where G4 comes out and what the test pads are wired to.
const M5_STAMP_C5_SCHEMATIC = 'https://m5stack-doc.oss-cn-shenzhen.aliyuncs.com/1258/S016_StampC5_V0.3_SCH_PDF_20260207_2026_02_07_11_34_57.pdf';
// M5's own product page for the CoreS3: the PinMap tables (what every GPIO of the ESP32-S3 is
// wired to inside the case), the three HY2.0 ports, the M5-Bus diagram and the download mode.
const M5_CORES3 = 'https://docs.m5stack.com/en/core/CoreS3';
// The CoreS3-SE's own page. The two boards share the PinMap, but the SE's page is what states
// what it does not carry (camera, proximity sensor, IMU, magnetometer, battery), so its own
// sentences are cited from it rather than inferred from the CoreS3 one.
const M5_CORES3_SE = 'https://docs.m5stack.com/en/core/M5CoreS3%20SE';
// M5's own product page for the StampS3A: the PinMap (the pad order, the LCD FPC pins, and which
// GPIO the button, the RGB LED and USB sit on), the specification table and the download mode.
const M5_STAMP_S3A = 'https://docs.m5stack.com/en/core/Stamp-S3A';
// The board's own schematic, published by M5 and linked from that page: the only document that
// says the USB-C goes straight to the chip and what the RGB LED's supply is gated by.
const M5_STAMP_S3A_SCHEMATIC = 'https://m5stack-doc.oss-cn-shenzhen.aliyuncs.com/1150/Sch_StampS3_v0.3.3.pdf';
// M5's own product page for the AtomS3: the PinMap (LCD, the MPU6886's I2C and the HY2.0 port),
// the specification table with the six GPIO the bottom brings out, and the download mode.
const M5_ATOMS3 = 'https://docs.m5stack.com/en/core/AtomS3';
// The AtomS3-Lite's own page. The two boards share the case and the bottom pins, but the Lite's
// page is what states what it carries instead (RGB LED, no screen, no IMU), so its own sentences
// are cited from it rather than inferred from the AtomS3 one.
const M5_ATOMS3_LITE = 'https://docs.m5stack.com/en/core/AtomS3%20Lite';
// The board's own schematic, published by M5: the only document that says which GPIO the button,
// the IR LED and the WS2812 sit on, and that the reset long-press drives GPIO0 through a
// comparator. M5 links the same file (byte for byte) from both product pages — the AtomS3-Lite
// has no separate schematic — so the notes of both boards cite this one.
const M5_ATOMS3_SCHEMATIC = 'https://m5stack-doc.oss-cn-shenzhen.aliyuncs.com/472/Sch_M5_AtomS3_v1.0.pdf';
// M5's own product page for the ATOM Lite: the PinMap (which GPIO the RGB LED, the button and the
// IR LED sit on, and what the bottom's two rows and the HY2.0 port carry), the specification table,
// and the schematic image that shows the USB-serial chip driving EN and GPIO0. M5 publishes no
// separate schematic PDF for this board — it is an image on this page — so the page is cited.
const M5_ATOM_LITE = 'https://docs.m5stack.com/en/core/ATOM%20Lite';
// The ATOM Matrix's own page. The two boards share the case, the bottom pins and the HY2.0 port,
// but the Matrix's page is what states what it carries instead (5x5 LED matrix, MPU6886) and what
// its own PinMap calls the I2C, so its sentences are cited from it rather than from the Lite one.
const M5_ATOM_MATRIX = 'https://docs.m5stack.com/en/core/ATOM%20Matrix';
// M5's own product page for the StickC Plus2: the PinMap (the LCD, the buzzer, the IR/red LED, the
// microphone, the IMU and RTC bus and the HY2.0 port), the specification table (ESP32-PICO-V3-02,
// 8 MB flash, 2 MB PSRAM, the five GPIO the outside gets), the power on/off procedure that this
// board needs because it has no PMIC, and the comparison tables that name HOLD, the battery
// voltage divider and the USB-serial chip.
const M5_STICKC_PLUS2 = 'https://docs.m5stack.com/en/core/M5StickC%20PLUS2';
// The board's own schematic, published by M5 and linked from that page: the only document that
// says what each hole of the 8-pin header carries, and that two of the chip's pins share one hole.
const M5_STICKC_PLUS2_SCHEMATIC = 'https://m5stack-doc.oss-cn-shenzhen.aliyuncs.com/512/Sch_M5StickC_Plus2_v0.5.pdf';
// M5's own product page for the Stamp-P4: the specification table (ESP32-P4NRW32, 16 MB flash,
// 32 MB PSRAM, which GPIO the stamp holes bring out, the two BTB connectors) and the Arduino
// Wi-Fi example that names the SDIO pins the add-on module sits on.
const M5_STAMP_P4 = 'https://docs.m5stack.com/en/core/Stamp-P4';
// The board's own PinMap image, published by M5 and shown on that page: the only document that
// names every stamp hole and both BTB connectors pad by pad.
const M5_STAMP_P4_PINMAP = 'https://m5stack-doc.oss-cn-shenzhen.aliyuncs.com/1218/S013-stamp-p4-pinmap.jpg';
// The board's own schematic, published by M5 and linked from that page: the only document that
// says what the USB-C is wired to, which flash chip the module carries, and that there is no
// button, no LED and no USB-serial chip on it.
const M5_STAMP_P4_SCHEMATIC = 'https://m5stack-doc.oss-cn-shenzhen.aliyuncs.com/1218/SCH_Stamp-P4_2026_03_16_17_23_06.pdf';
const ESP32P4_DATASHEET = 'https://documentation.espressif.com/esp32-p4_datasheet_en.pdf';
// The board's own user guide: the only document that says which of the chip's pins this board
// brings out, and the only one that names the SPI-flash pins grouped near the USB connector.
const ESP32_DEVKITC_GUIDE = 'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html';
// The ADC2 / Wi-Fi overlap is not in the ESP32 datasheet; it is stated only by the driver's
// own page, so that page is cited rather than the datasheet.
const ESP_IDF_ADC = 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/adc/adc_oneshot.html';
const ESP8266_DATASHEET = 'https://documentation.espressif.com/0a-esp8266ex_datasheet_en.pdf';
const RP2040_FLASH = 'BOOTSELを押したままUSBに接続するとRPI-RP2ドライブが現れる（Macでは「NO NAME」と表示される場合がある）。Build成功後に「書き込み」ボタンを押してそのドライブを選ぶと書き込まれ、完了後にボードは自動で再起動する。';
const ESP_FLASH = 'Build成功後に「書き込み」ボタンを押し、USB接続したボードのポートをブラウザのダイアログで選ぶ。';
// Wio Node is flashed through the Grove USB-serial adapter, which carries no auto-reset line,
// so the board is put into its flashing mode by hand before and after the same browser button.
const WIO_NODE_FLASH = 'GroveのUSBシリアルで接続し、書き込み前にFUNCを押したままRSTを押して書き込みモードに入れる。Build成功後に「書き込み」ボタンを押してポートを選び、完了後にRSTを押す。';
// The ESP32 boards all build with pioarduino's arduino-esp32 3.x, whose LEDC and Task WDT APIs
// differ from the 2.x ones most published ESP32 code still uses. One sentence, referenced by every
// esp32-platform board below, so the ESP8266 and RP2040 boards never carry it.
const ESP32_CORE_NOTE = 'coreはarduino-esp32 3.x（pioarduino）。LEDCはledcAttach系のAPIで、2.xのledcSetup・ledcAttachPinは無い。Task WDTのesp_task_wdt_initはesp_task_wdt_config_t構造体を1つ受け取る。';
// What was run on real hardware here is a flashing route, not a board: two boards that are written
// the same way are covered by the same measurement. This is the maintainers' own ledger of that —
// it is not shown anywhere in the UI. verifiedBy holds the boards actually flashed on that route.
const FLASH_ROUTES = {
  'rp2040-uf2': { label: 'BOOTSELドライブへUF2を置く方式', verifiedBy: ['xiao_rp2040', 'pico'] },
  'esp-usb-cdc': { label: 'チップのUSBシリアルへ直接書き込む方式', verifiedBy: ['xiao_esp32c3'] },
  'esp-uart-bridge': { label: '基板のUSBシリアル変換チップ経由で書き込む方式', verifiedBy: [] },
  'esp8266': { label: '外付けのUSBシリアルで手動で書き込みモードに入れる方式', verifiedBy: ['wio_node'] },
};
// The only board definition. The UI select, project validation and the AI's board facts
// are all generated from this table via GET /boards; nothing else lists boards.
// pinNotes hold what no header states: one sentence each, with the URL it was read from.
// wireless says the board carries a radio; the browser uses it to decide whether to show the
// 技適 notice. flashRoute names the entry of FLASH_ROUTES this board is written through.
const BOARDS = new Map([
  ['xiao_rp2040', { project: RP2040_PROJECT, family: 'rp2040', platform: 'rp2040', extension: 'uf2', contentType: 'application/octet-stream',
    name: 'XIAO RP2040', vendor: 'Seeed Studio', framework: 'Arduino', core: 'earlephilhower arduino-pico', artifact: 'uf2', browserFlash: true, serial: true, wireless: false, flashRoute: 'rp2040-uf2', flashHint: RP2040_FLASH, flashGuide: FLASH_GUIDES.xiao_rp2040,
    pinNotes: [
      { text: 'MCUの動作電圧は3.3Vで、汎用I/Oピンに3.3Vより高い電圧を入力するとチップが破損することがある', source: SEEED_XIAO_RP2040 },
      { text: 'USBとVIN/5Vピンから入れた5Vは基板上のDC-DCで3.3Vに落とされるため、5Vを受けられるのは電源ピンだけ', source: SEEED_XIAO_RP2040 },
      { text: 'オンボードRGB LEDは赤がGPIO17、緑がGPIO16、青がGPIO25で、点灯させるにはピンをLowに引く', source: SEEED_XIAO_RP2040 },
      { text: 'WS2812Bのデータ線GPIO12と電源イネーブルGPIO11は、wikiのピンマップではXIAO RP2040 Plusの列にだけ載っている', source: SEEED_XIAO_RP2040 },
      { text: 'アナログ入力はA0からA3（GPIO26からGPIO29）の4本', source: SEEED_XIAO_RP2040 },
      { text: '14ピンのフットプリントに引き出されているGPIOは11本', source: SEEED_XIAO_RP2040 },
      { text: 'BootボタンはRP2040_BOOTに接続されbootloaderモードへの移行に使う。GPIO番号はwikiに載っていない', source: SEEED_XIAO_RP2040 },
    ] }],
  ['pico', { project: RP2040_PROJECT, family: 'rp2040', platform: 'rp2040', extension: 'uf2', contentType: 'application/octet-stream',
    name: 'Raspberry Pi Pico', vendor: 'Raspberry Pi', framework: 'Arduino', core: 'earlephilhower arduino-pico', artifact: 'uf2', browserFlash: true, serial: true, wireless: false, flashRoute: 'rp2040-uf2', flashHint: RP2040_FLASH, flashGuide: FLASH_GUIDES.pico,
    pinNotes: [
      { text: 'GPIOは基板上の3.3Vレールから給電されるため3.3V固定', source: RPI_PICO_DATASHEET },
      { text: 'RP2040の30本のうち26本がヘッダに出ており、GPIO0からGPIO22はデジタル専用、GPIO26からGPIO28はデジタルにもADC入力にも使える', source: RPI_PICO_DATASHEET },
      { text: 'GPIO29はADC3としてVSYS/3の測定、GPIO25はユーザーLED、GPIO24はVBUS検出、GPIO23はオンボードSMPSのPower Save制御に基板内部で使われている', source: RPI_PICO_DATASHEET },
      { text: 'ADCに使えるGPIO26からGPIO29はIOVDD（3V3）への内部逆方向ダイオードを持ち、入力電圧はIOVDDより約300mV高い値を超えてはならない', source: RPI_PICO_DATASHEET },
      { text: 'デジタル専用のGPIO0からGPIO25とデバッグピンにはその制限がなく、RP2040が無給電でも電圧をかけて差し支えない', source: RPI_PICO_DATASHEET },
      { text: 'BOOTSELを押したまま電源を入れるとUSBマスストレージとして現れ、uf2ファイルを置くとFlashに書かれて再起動する', source: RPI_PICO_DATASHEET },
      { text: 'テストポイントTP4（GPIO23）は外部から使う想定がなく、TP5（GPIO25）はLEDの順方向電圧までしか振れないため使用は勧められていない', source: RPI_PICO_DATASHEET },
    ] }],
  ['xiao_esp32c3', { project: path.join(here, 'pio-esp32c3'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'XIAO ESP32C3', vendor: 'Seeed Studio', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.xiao_esp32c3,
    pinNotes: [
      { text: 'GPIO2、GPIO8、GPIO9はストラッピングピンで、起動時のレベルによってブートモードが変わる', source: ESP32C3_DATASHEET },
      { text: 'ADC1はGPIO0からGPIO4（ADC1_CH0からADC1_CH4）、ADC2はGPIO5（ADC2_CH0）に割り当てられている', source: ESP32C3_DATASHEET },
      { text: 'ADC1は工場校正済みだがADC2は校正されておらず、一部のチップリビジョンではADC2が動作しない', source: ESP32C3_DATASHEET },
      { text: 'D3（GPIO5）はADC2を使うため誤ったサンプリングで使えなくなることがあり、アナログ入力にはADC1側のA0/A1/A2（D0からD2、GPIO2からGPIO4）の3本を使う', source: SEEED_XIAO_ESP32C3 },
      { text: 'このボードにLED_BUILTINは無い', source: SEEED_XIAO_ESP32C3 },
      { text: 'BootボタンはGPIO9、ResetボタンはCHIP_ENに接続されている', source: SEEED_XIAO_ESP32C3 },
      { text: 'I/OのHighレベル入力電圧の最大はVDDより0.3V高い値、電源ピンの絶対最大定格は3.6Vなので、5Vを直接加えると定格を超える', source: ESP32C3_DATASHEET },
    ] }],
  ['xiao_esp32c6', { project: path.join(here, 'pio-esp32c6'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'XIAO ESP32C6', vendor: 'Seeed Studio', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.xiao_esp32c6,
    pinNotes: [
      { text: 'ピンマップのD0からD10は順にGPIO0、GPIO1、GPIO2、GPIO21、GPIO22、GPIO23、GPIO16、GPIO17、GPIO19、GPIO20、GPIO18', source: SEEED_XIAO_ESP32C6 },
      { text: '側面パッドでアナログ入力に使えるのはA0からA2（D0からD2、GPIO0からGPIO2）の3本。残りのADCチャンネルはJTAGパッドのMTMS（GPIO4）、MTDI（GPIO5）、MTCK（GPIO6）に出ている', source: SEEED_XIAO_ESP32C6 },
      { text: 'User LEDはGPIO15、BootボタンはGPIO9でブートモードへの移行に使い、ResetボタンはENに繋がっている', source: SEEED_XIAO_ESP32C6 },
      { text: 'アンテナは基板のセラミックアンテナと外付けを切り替えられる。GPIO3をLowにしてRFスイッチを有効にしてから、GPIO14をLowにすると内蔵、Highにすると外付けになる', source: SEEED_XIAO_ESP32C6 },
      { text: '2.4GHzのWi-Fi 6、Bluetooth 5.3、Zigbee、Threadに対応する。Flashは4MB、SRAMは512KB。電池で動かしているとき5Vピンには電圧が出ず、電池電圧を読むには200kオームの抵抗を1:2の分圧になるよう自分で半田付けしてA0で測る', source: SEEED_XIAO_ESP32C6 },
      { text: 'ESP32-C6のADCはADC1だけで、チャンネルはGPIO0からGPIO6の7本。ADC2は無い', source: ESP32C6_DATASHEET },
      { text: 'GPIO12とGPIO13は既定で内蔵USB Serial/JTAGのD−とD+として動くので、USBを使っている間は汎用I/Oにできない', source: ESP32C6_DATASHEET },
      { text: 'ストラッピングピンはMTMS（GPIO4）、MTDI（GPIO5）、GPIO8、GPIO9、GPIO15の5本で、ブートモードはGPIO8とGPIO9で決まる。電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、GPIOに5Vを直接加えると定格を超える', source: ESP32C6_DATASHEET },
    ] }],
  ['pico_w', { project: RP2040_PROJECT, family: 'rp2040', platform: 'rp2040', extension: 'uf2', contentType: 'application/octet-stream',
    name: 'Raspberry Pi Pico W', vendor: 'Raspberry Pi', framework: 'Arduino', core: 'earlephilhower arduino-pico', artifact: 'uf2', browserFlash: true, serial: true, wireless: true, flashRoute: 'rp2040-uf2', flashHint: RP2040_FLASH, flashGuide: FLASH_GUIDES.pico_w,
    // The four GPIO the radio takes over are exactly what a Pico sketch gets wrong on this board.
    pinTableNote: 'ピン表のD23、D24、D25、D29は無線チップCYW43439のためにボード内部で使われていて、ヘッダには出ていない。無印PicoでGPIO25だったユーザーLEDもこのボードには無く、LED_BUILTINはGPIO番号を持たない擬似ピン64になる（coreがCYW43側へ渡すため）。',
    pinNotes: [
      { text: 'GPIOはオンボードの3.3Vレールから給電されるため3.3V固定', source: RPI_PICO_W_DATASHEET },
      { text: 'RP2040の30本のうち26本がヘッダに出ており、GPIO0からGPIO22はデジタル専用、GPIO26からGPIO28はデジタルにもADC入力にも使える', source: RPI_PICO_W_DATASHEET },
      { text: 'GPIO23は無線チップの電源ON信号、GPIO24は無線SPIのデータ兼IRQ、GPIO25は無線SPIのCS、GPIO29は無線SPIのCLK兼VSYS/3を測るADC3として基板内部で使われている', source: RPI_PICO_W_DATASHEET },
      { text: 'ユーザーLEDはRP2040のGPIOではなく無線チップCYW43439のWL_GPIO0に繋がっていて、VBUSの有無はWL_GPIO2で検出する', source: RPI_PICO_W_DATASHEET },
      { text: 'GPIO25をHighにすると、GPIO29がVSYSを読むADCピンとして有効になる。無線SPIのCLKと共用なので、SPI転送中はVSYSを読めない', source: RPI_PICO_W_DATASHEET },
      { text: 'ADCに使えるGPIO26からGPIO29はIOVDD（3V3）への内部逆方向ダイオードを持ち、入力電圧はIOVDDより約300mV高い値を超えてはならない', source: RPI_PICO_W_DATASHEET },
      { text: 'VSYSは1.8Vから5.5Vの範囲で入れられ、オンボードのbuck-boost SMPSが3.3Vを作る', source: RPI_PICO_W_DATASHEET },
      { text: 'BOOTSELを押したまま電源を入れるとUSBマスストレージとして現れ、uf2ファイルを置くとFlashに書かれて再起動する', source: RPI_PICO_W_DATASHEET },
    ] }],
  ['xiao_esp32c5', { project: path.join(here, 'pio-esp32c5'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'XIAO ESP32C5', vendor: 'Seeed Studio', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.xiao_esp32c5,
    // The A-macros are the trap here: only one of them is a side pad.
    pinTableNote: 'ピン表のA1からA4（GPIO2からGPIO5）は基板の側面パッドには出ていない。GPIO2、GPIO3、GPIO4は裏面のJTAGパッド（MTMS、MTDI、MTCK）で、GPIO5はSeeedのピンマップに載っていない。側面パッドで使えるアナログ入力はA0（D0、GPIO1）の1本だけ。LED_BUILTIN（GPIO27）も基板上のLEDで、パッドには出ていない。',
    pinNotes: [
      { text: 'ピンマップのD0からD10は順にGPIO1、GPIO0、GPIO25、GPIO7、GPIO23、GPIO24、GPIO11、GPIO12、GPIO8、GPIO9、GPIO10', source: SEEED_XIAO_ESP32C5 },
      { text: 'アナログ入力が使えるのはD0（GPIO1）と裏面のJTAGパッドMTMS（GPIO2）、MTDI（GPIO3）、MTCK（GPIO4）、電池電圧用のGPIO6の5本', source: SEEED_XIAO_ESP32C5 },
      { text: 'User LEDはGPIO27で、LED_BUILTINをLowにすると点灯する', source: SEEED_XIAO_ESP32C5 },
      { text: 'ResetボタンはCHIP_EN、BootボタンはGPIO28に繋がっている', source: SEEED_XIAO_ESP32C5 },
      { text: '電池電圧はGPIO26をHighにして測定回路を有効にしてからGPIO6で読む。100kオーム2本の分圧なので読んだ値を2倍する', source: SEEED_XIAO_ESP32C5 },
      { text: '2.4GHzと5GHzのデュアルバンドWi-Fi 6に対応する', source: SEEED_XIAO_ESP32C5 },
      { text: 'ストラッピングピンはGPIO2、GPIO3、GPIO7、GPIO25、GPIO26、GPIO27、GPIO28の7本で、ブートモードはGPIO26、GPIO27、GPIO28で決まる', source: ESP32C5_DATASHEET },
      { text: '電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32C5_DATASHEET },
    ] }],
  ['esp32_c5_devkitc_1', { project: path.join(here, 'pio-esp32c5'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'ESP32-C5-DevKitC-1', vendor: 'Espressif', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.esp32_c5_devkitc_1,
    // The generic esp32c5 variant defines no Dn macros, and its LED_BUILTIN is not a GPIO at all.
    pinTableNote: 'このボードのvariantはD0からDnのマクロを定義していないので、コードにはGPIO番号を直接書く。上のピン表のA0からA5はArduinoのアナログ名で、同じ行のGPIO番号がその実体。基板のヘッダに印刷された数字はそのままGPIO番号で、例外はNC/15と印刷された穴だけ。このvariantのLED_BUILTINは基板のRGB LEDを指す擬似ピンでGPIO番号ではないため、ピンを直接動かすときはGPIO27と書く。',
    pinNotes: [
      { text: 'USB-Cは2口あり、USBと印字された口はESP32-C5のGPIO13とGPIO14に直結、UARTと印字された口はUSBシリアル変換チップを通ってU0TXD（GPIO11）とU0RXD（GPIO12）につながる', source: ESP32_C5_DEVKITC_GUIDE },
      { text: 'BootボタンはGPIO28、ResetボタンはCHIP_PU、アドレサブルLED（WS2812B）はGPIO27に繋がっている', source: ESP32_C5_DEVKITC_GUIDE },
      { text: 'GPIO13とGPIO14は既定でUSBのD−とD+として動くので、チップ直結のUSB口を使っている間は汎用I/Oにできない', source: ESP32C5_DATASHEET },
      { text: 'ヘッダにNC/15と印刷された穴はGPIO15で、PSRAMを載せたこの品種ではSPICS1としてモジュール内部で使われているため外からは使えない', source: ESP32_C5_DEVKITC_GUIDE },
      { text: 'ESP32-C5のADCはADC1だけで、チャンネルはGPIO1からGPIO6の6本。ADC2は無い', source: ESP32C5_DATASHEET },
      { text: 'ストラッピングピンはGPIO2、GPIO3、GPIO7、GPIO25、GPIO26、GPIO27、GPIO28の7本で、ブートモードはGPIO26、GPIO27、GPIO28で決まる', source: ESP32C5_DATASHEET },
      { text: '電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32C5_DATASHEET },
      { text: '通販コード131642で売られている品種はN8R8で、8MBのFlashと8MBのPSRAMを載せる', source: AKIZUKI_C5_DEVKITC },
    ] }],
  ['espr_developer_c5', { project: path.join(here, 'pio-esp32c5'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'ESPr Developer C5', vendor: 'Switch Science', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.espr_developer_c5,
    // The generic esp32c5 variant defines no Dn macros, so the board's own two header rows are
    // what a sketch is actually written against; they are listed here, before the table.
    pinTableNote: 'このボードのvariantはD0からDnのマクロを定義していないので、コードにはGPIO番号を直接書く。上のピン表のA0からA5はArduinoのアナログ名で、同じ行のGPIO番号がその実体。基板の2列のヘッダは、RESETボタン側がJ2でUSB-C側から3V3、EN、0、1、10、13、14、6、GND、VIN、7、8、9、3、2の順、FLASHボタン側がJ3でGND、26、25、24、23、TX、RX、28、GND、VOUT、15、27、4、5の順。数字はそのままGPIO番号で、TXはGPIO11、RXはGPIO12。どちらの列も残りの穴は末尾のGNDを除いて未接続。このvariantのLED_BUILTINはGPIO番号を持たない擬似ピンなので、基板の青いLEDはGPIO27と書いて動かす。',
    pinNotes: [
      { text: '搭載モジュールはESP32-C5-WROOM-1-N16R8で、Flashが16MB、PSRAMが8MB', source: SSCI_ESPR_C5 },
      { text: 'ヘッダに15と印刷された穴はGPIO15だが、PSRAMを載せたモジュールではSPICS1として内部で使われていて外からは使えない', source: ESP32C5_WROOM_DATASHEET },
      { text: '青のLEDは3V3から1kオームを通してGPIO27へ入っているので、GPIO27をLowにすると点灯する', source: SSCI_ESPR_C5_SCHEMATIC },
      { text: 'RESETボタンはENを、FLASHボタンはGPIO28をGNDへ落とすだけの手動スイッチで、USBシリアル変換チップも自動で書き込みモードに入れる回路も載っていない', source: SSCI_ESPR_C5_SCHEMATIC },
      { text: 'USB-Cは33オームを介してGPIO13（D−）とGPIO14（D+）へ直結しているので、USBを使っている間この2本は汎用I/Oにできない', source: SSCI_ESPR_C5_SCHEMATIC },
      { text: '基板中央のQwiicコネクタはGND、3V3、GPIO0（SDA）、GPIO1（SCL）の4極。VINは3.6Vから6Vを受ける入力で、VOUTにはUSBの5VとVINの高い方からショットキー1段ぶん落ちた電圧が出る', source: SSCI_ESPR_C5_SCHEMATIC },
      { text: 'ESP32-C5のADCはADC1だけで、チャンネルはGPIO1からGPIO6の6本。ADC2は無い', source: ESP32C5_DATASHEET },
      { text: 'ストラッピングピンはGPIO2、GPIO3、GPIO7、GPIO25、GPIO26、GPIO27、GPIO28の7本。電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、GPIOに5Vを直接加えると定格を超える', source: ESP32C5_DATASHEET },
    ] }],
  ['m5stamp_c5', { project: path.join(here, 'pio-esp32c5'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'M5StampC5', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stamp_c5,
    // The generic esp32c5 variant defines no Dn macros, so the board's own pad markings are what
    // a sketch is written against; they are listed here, before the table.
    pinTableNote: 'このボードのvariantはD0からDnのマクロを定義していないので、コードにはGPIO番号を直接書く。上のピン表のA0からA5はArduinoのアナログ名で、同じ行のGPIO番号がその実体。基板のパッドのG1からG10とG28という印字はそのままGPIO番号で、2.54mmのパッドは片側が3V3、G1、G2、G3、BAT、VUSB、GND、もう片側がG5、G6、G7、G8、G9、G10、G28/BOOT。このvariantのLED_BUILTINはGPIO番号を持たない擬似ピンなので、基板の青いLEDはGPIO28と書いて動かす。',
    pinNotes: [
      { text: 'G4はG2とG3の間の半ピッチずれた位置にある穴の無い小さなキャスタレーションに出ていて、2.54mmのピンヘッダでは取り出せない', source: M5_STAMP_C5_SCHEMATIC },
      { text: 'Extと印字された12ピンのFPCコネクタには3V3、3V3、GPIO23、GPIO0、GPIO24、GPIO25、GND、GPIO26、GPIO27、GPIO11（TXD）、GND、GPIO12（RXD）がこの順で出ている', source: M5_STAMP_C5_SCHEMATIC },
      { text: '物理ボタンは無く、基板表面の丸いパッドのRSTがCHIP_EN、BOOTがGPIO28で、GNDに落とすとそれぞれリセットとブートになる', source: M5_STAMP_C5_SCHEMATIC },
      { text: '青のLEDはGPIO28に繋がっていてLowにすると点灯する。赤のLEDは充電ICの状態出力なのでGPIOからは動かせない', source: M5_STAMP_C5 },
      { text: 'USB-Cはコモンモードフィルタを通してESP32-C5のGPIO13とGPIO14へ直結していて、USBシリアル変換チップは載っていない', source: M5_STAMP_C5_SCHEMATIC },
      { text: '基板にアンテナは載っておらず、無線を使うには裏面のIPEXコネクタに外付けアンテナを挿す', source: M5_STAMP_C5 },
      { text: '載っているのはESP32-C5HF4で、Flashを4MB内蔵しPSRAMは持たない', source: M5_STAMP_C5 },
      { text: 'ストラッピングピンはGPIO2、GPIO3、GPIO7、GPIO25、GPIO26、GPIO27、GPIO28の7本。電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、GPIOに5Vを直接加えると定格を超える', source: ESP32C5_DATASHEET },
    ] }],
  ['xiao_esp32s3', { project: path.join(here, 'pio-esp32s3'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'XIAO ESP32S3', vendor: 'Seeed Studio', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.xiao_esp32s3,
    pinNotes: [
      { text: 'ピンマップのD0からD10は順にGPIO1、GPIO2、GPIO3、GPIO4、GPIO5、GPIO6、GPIO43、GPIO44、GPIO7、GPIO8、GPIO9', source: SEEED_XIAO_ESP32S3 },
      { text: 'アナログ入力が使えるのはD0からD5とD8からD10の9本で、UARTのD6（GPIO43）とD7（GPIO44）にADCは無い', source: SEEED_XIAO_ESP32S3 },
      { text: 'User LEDはGPIO21で、ピンをLowにすると点灯しHighにすると消灯する', source: SEEED_XIAO_ESP32S3 },
      { text: 'ResetボタンはCHIP_PU、BootボタンはGPIO0に繋がっていて、BOOTを押したままUSBケーブルを繋いで離すとBootLoaderモードに入る', source: SEEED_XIAO_ESP32S3 },
      { text: '3V3は基板上のレギュレータ出力で700mAまで引ける。5VピンはUSBからの5V出力で、電池で動かしているときは電圧が出ない', source: SEEED_XIAO_ESP32S3 },
      { text: '電池電圧を読むためのGPIOが用意されていないため、ソフトウェアから電池電圧を取得できない', source: SEEED_XIAO_ESP32S3 },
      { text: 'ストラッピングピンはブートモードがGPIO0とGPIO46、VDD_SPIの電圧がGPIO45、ROMメッセージ出力がGPIO46、JTAG信号源がGPIO3', source: ESP32S3_DATASHEET },
      { text: '電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32S3_DATASHEET },
    ] }],
  // CoreS3 と CoreS3-SE は一覧では別の 2 台。中身の差はカメラ・近接センサ・IMU・地磁気センサと
  // 内蔵電池の有無だけで build には効かないので、env（PlatformIO の [env:...]）は 1 つを共有し、
  // 差は下の pinNotes に書く。env を書いた側が pio run と boards/<env>.pins.json の名前になる。
  ['m5stack_cores3', { project: path.join(here, 'pio-esp32s3'), env: 'm5stack_cores3', family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'CoreS3', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stack_cores3,
    // M5's m5stack_cores3 variant defines neither Dn nor An macros, so the pin table has no rows
    // at all: what a sketch is written against is the G<n> silk, which is the GPIO number itself.
    pinTableNote: 'このボードのvariantはD0からDnもA0からAnもマクロを定義していないので、上のピン表に行は無く、coreが名前を付けている機能ピンだけが並ぶ。コードにはGPIO番号を直接書く。M5の資料とコネクタの印字にあるG0、G1のようなG付きの番号はそのままGPIO番号で、たとえばPORT.Aの黄のG2はGPIO2。',
    pinNotes: [
      { text: 'variantがSDAと呼ぶGPIO12とSCLと呼ぶGPIO11は本体内部のI2Cで、AXP2101、BM8563、ES7210、AW88298、FT6336U、BMI270、LTR-553ALS-WAがこの2本に繋がっている。外のPORT.AのI2Cは別のGPIO2とGPIO1', source: M5_CORES3 },
      { text: 'HY2.0-4Pは黒がGND、赤が5Vで、赤のPORT.Aは黄がGPIO2（SDA）、白がGPIO1（SCL）。黒のPORT.Bは黄がGPIO9、白がGPIO8。青のPORT.Cは黄がGPIO17（TX）、白がGPIO18（RX）', source: M5_CORES3 },
      { text: 'LCDとmicroSDはSPIを共有していて、GPIO37がMOSI、GPIO36がSCK、GPIO35はLCDのDCとmicroSDのMISOを兼ねる。CSはLCDがGPIO3、microSDがGPIO4', source: M5_CORES3 },
      { text: 'マイクのES7210とアンプのAW88298へのI2SはGPIO34、GPIO33、GPIO13、GPIO14、GPIO0の5本', source: M5_CORES3 },
      { text: 'カメラのGC0308はデータ線にGPIO39、GPIO40、GPIO41、GPIO42、GPIO15、GPIO16、GPIO48、GPIO47、同期にGPIO45、GPIO46、GPIO38を使う。variantがSSと呼ぶGPIO15もこの中', source: M5_CORES3 },
      { text: 'LCD・タッチ・アンプのリセットと割り込みはESP32-S3ではなくIOエキスパンダAW9523Bの端子にあり、画面のバックライトと電源経路と内蔵500mAh電池はAXP2101が握っている', source: M5_CORES3 },
      { text: 'M5-Busの30ピンのうち、機能名がGPIOとADCだけで内蔵機器と共用していないのはGPIO5、GPIO6、GPIO7、GPIO10（ADC）の4本', source: M5_CORES3 },
      { text: '電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32S3_DATASHEET },
    ] }],
  ['m5stack_cores3_se', { project: path.join(here, 'pio-esp32s3'), env: 'm5stack_cores3', family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'CoreS3-SE', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stack_cores3_se,
    pinTableNote: 'このボードのvariantはD0からDnもA0からAnもマクロを定義していないので、上のピン表に行は無く、coreが名前を付けている機能ピンだけが並ぶ。コードにはGPIO番号を直接書く。M5の資料とコネクタの印字にあるG0、G1のようなG付きの番号はそのままGPIO番号で、たとえばPORT.Aの黄のG2はGPIO2。',
    pinNotes: [
      { text: 'カメラのGC0308、近接センサのLTR-553ALS-WA、IMUのBMI270、地磁気センサのBMM150は載っていないので、CoreS3向けのコードのうちそれらを使う部分は動かない。内蔵電池も無い', source: M5_CORES3_SE },
      { text: 'variantがSDAと呼ぶGPIO12とSCLと呼ぶGPIO11は本体内部のI2Cで、AXP2101、BM8563、ES7210、AW88298、FT6336Uがこの2本に繋がっている。外のPORT.AのI2Cは別のGPIO2とGPIO1', source: M5_CORES3_SE },
      { text: 'HY2.0-4Pは黒がGND、赤が5Vで、赤のPORT.Aは黄がGPIO2（SDA）、白がGPIO1（SCL）。黒のPORT.Bは黄がGPIO9、白がGPIO8。青のPORT.Cは黄がGPIO17（TX）、白がGPIO18（RX）', source: M5_CORES3_SE },
      { text: 'LCDとmicroSDはSPIを共有していて、GPIO37がMOSI、GPIO36がSCK、GPIO35はLCDのDCとmicroSDのMISOを兼ねる。CSはLCDがGPIO3、microSDがGPIO4', source: M5_CORES3_SE },
      { text: 'マイクのES7210とアンプのAW88298へのI2SはGPIO34、GPIO33、GPIO13、GPIO14、GPIO0の5本', source: M5_CORES3_SE },
      { text: 'LCD・タッチ・アンプのリセットと割り込みはESP32-S3ではなくIOエキスパンダAW9523Bの端子にあり、画面のバックライトと電源経路はAXP2101が握っている', source: M5_CORES3_SE },
      { text: 'M5-Busに出ているGPIOはGPIO0、GPIO1、GPIO2、GPIO5、GPIO6、GPIO7、GPIO8、GPIO9、GPIO10、GPIO11、GPIO12、GPIO13、GPIO14、GPIO17、GPIO18、GPIO35、GPIO36、GPIO37、GPIO43、GPIO44の20本', source: M5_CORES3_SE },
      { text: '電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32S3_DATASHEET },
    ] }],
  ['m5stamp_s3a', { project: path.join(here, 'pio-esp32s3'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'M5StampS3A', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stamp_s3a,
    // M5's m5stack_stamp_s3 variant names G0..G46 but defines neither Dn nor An macros, so the pin
    // table has no rows: what a sketch is written against is the G<n> silk, the GPIO number itself.
    // The same variant leaves SS/MOSI/MISO/SCK at -1, which is not a pin, so they do not reach the
    // function list either (compiler/tools/generate-board-pins.mjs); that absence is said here.
    pinTableNote: 'このボードのvariantはD0からDnもA0からAnもマクロを定義していないので、上のピン表に行は無く、coreが名前を付けている機能ピンだけが並ぶ。コードにはGPIO番号を直接書く。M5の資料と付属のピンステッカーにあるG0、G1のようなG付きの番号はそのままGPIO番号で、たとえばG13はGPIO13。パッドはUSB-Cのある辺を下にして、左の列が上からG1、G2、G3、G4、G5、G6、G7、G8、G9、G10、GND、G11、5V、G12、G13、G14、G15、右の列が上から3V3、G46、G43、G42、G44、G41、EN、G40、G0、G39、GND。SPIのSS、MOSI、MISO、SCKはこのvariantが値を決めていないので機能ピンにも出ず、SPI.begin()にピンを渡して使う。',
    pinNotes: [
      { text: '外に出ているGPIOは23本で、G0からG15、G39からG44、G46。GPIO16からGPIO18とGPIO33からGPIO38は裏面のLCD用FPCコネクタにだけ出ている。そのG46は起動前にHighに引くとチップが起動しない', source: M5_STAMP_S3A },
      { text: 'アナログ入力はADC1がGPIO1からGPIO10、ADC2がGPIO11からGPIO15で、タッチセンサはGPIO1からGPIO14の14本', source: M5_STAMP_S3A },
      { text: '押せるボタンは1つだけでGPIO0に繋がっている。このボタンを押したまま電源を入れ、電源が入ってから離すと書き込みモードに入る', source: M5_STAMP_S3A },
      { text: 'RGB LEDのWS2812B-2020はGPIO21に繋がっているが、その電源は裏面FPCの画面バックライトと共用でGPIO38が握っているので、GPIO38で電源を入れないと光らない。旧StampS3は電源を入れれば光った', source: M5_STAMP_S3A },
      { text: '裏面のLCD用FPCは12ピンで、順にGPIO37（CS）、3V3、GPIO36（SCK）、GPIO35（DAT）、GPIO34（RS）、GPIO33（RST）、GND、GPIO38（バックライトとRGB LEDの電源）、GPIO16、GPIO17、GPIO18、5V。8ピンのコネクタでは前半のLCD.PORTだけが出る', source: M5_STAMP_S3A },
      { text: 'USB-CはESP32-S3のGPIO19（D-）とGPIO20（D+）へ直結していて、USBシリアル変換チップは載っていない', source: M5_STAMP_S3A_SCHEMATIC },
      { text: '載っているのはESP32-S3FN8で、Flashを8MB内蔵しPSRAMは持たない。アンテナは基板上の3Dアンテナなので外付けは要らない', source: M5_STAMP_S3A },
      { text: 'ストラッピングピンはブートモードがGPIO0とGPIO46、VDD_SPIの電圧がGPIO45、ROMメッセージ出力がGPIO46、JTAG信号源がGPIO3。電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32S3_DATASHEET },
    ] }],
  // ATOMS3 と ATOMS3 Lite は一覧では別の 2 台。中身の差は 0.85 インチ LCD と IMU の有無、
  // RGB LED の有無だけで build には効かないので、env（PlatformIO の [env:...]）は 1 つを共有し、
  // 差は下の pinNotes に書く。env を書いた側が pio run と boards/<env>.pins.json の名前になる。
  ['m5stack_atoms3', { project: path.join(here, 'pio-esp32s3'), env: 'm5stack_atoms3', family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'ATOMS3', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stack_atoms3,
    // M5 sells this one as EOL and points at the AtomS3R in its place. It still builds and flashes
    // the same, so it stays in the list; the sentence is shown in the manual, next to this board's
    // own section, so nobody buys the wrong replacement.
    statusNote: 'このボードはM5Stackの公式ストアで販売終了（EOL）になっていて、後継として同じ24mm角のAtomS3Rが案内されている。',
    // M5's m5stack_atoms3 variant defines neither Dn nor An macros, so the pin table has no rows
    // at all: what a sketch is written against is the G<n> silk, which is the GPIO number itself.
    pinTableNote: 'このボードのvariantはD0からDnもA0からAnもマクロを定義していないので、上のピン表に行は無く、coreが名前を付けている機能ピンだけが並ぶ。コードにはGPIO番号を直接書く。M5の資料と底面のシールにあるG0、G1のようなG付きの番号はそのままGPIO番号で、たとえばPORT.Aの黄のG2はGPIO2。底面のピンは、シールの文字が読める向きで見てUSB-Cのある辺を下にすると、左の列が上から3V3、G5、G6、G7、G8の5本、右の列が上からG39、G38、5V、GNDの4本。MISOはこのvariantが値を決めていないので機能ピンにも出ず、SPI.begin()にピンを渡して使う。',
    pinNotes: [
      { text: '外に出ているGPIOは底面の6本（G5、G6、G7、G8、G38、G39）と、手前側の面のHY2.0-4P（PORT.A）の2本だけ。PORT.Aは黒がGND、赤が5V、黄がGPIO2、白がGPIO1', source: M5_ATOMS3 },
      { text: 'variantがSDAと呼ぶGPIO38とSCLと呼ぶGPIO39は6軸センサMPU6886のI2Cで、底面に出ているG38とG39も同じバス。外の機器をここに繋ぐと内蔵センサと同居することになる', source: M5_ATOMS3 },
      { text: '0.85インチLCD（GC9107、128x128）はGPIO21がMOSI、GPIO17がSCK、GPIO15がCS、GPIO33がRS、GPIO34がRST、GPIO16がバックライト。variantがMOSI・SCK・SSと呼ぶ3本はこのLCDのもので、外には出ていない', source: M5_ATOMS3 },
      { text: '上面の大きなボタンはGPIO41に繋がっていて、10kΩでプルアップされ押すとLowになる。画面の面がそのままボタンになっている', source: M5_ATOMS3_SCHEMATIC },
      { text: '赤外線送信LEDはGPIO4に繋がっている', source: M5_ATOMS3_SCHEMATIC },
      { text: 'GPIO0は基板のBOOT回路の出力に繋がっていて、RESETを約2秒押し続けるとLowに引かれ緑のLEDが点く。自由に使えるピンではない', source: M5_ATOMS3_SCHEMATIC },
      { text: '載っているのはESP32-S3FN8で、Flashを8MB内蔵しPSRAMは持たない。USB-CはESP32-S3のGPIO19とGPIO20へ直結していて、USBシリアル変換チップは載っていない', source: M5_ATOMS3_SCHEMATIC },
      { text: '電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32S3_DATASHEET },
    ] }],
  ['m5stack_atoms3_lite', { project: path.join(here, 'pio-esp32s3'), env: 'm5stack_atoms3', family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'ATOMS3 Lite', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stack_atoms3_lite,
    pinTableNote: 'このボードのvariantはD0からDnもA0からAnもマクロを定義していないので、上のピン表に行は無く、coreが名前を付けている機能ピンだけが並ぶ。コードにはGPIO番号を直接書く。M5の資料と底面のシールにあるG0、G1のようなG付きの番号はそのままGPIO番号で、たとえばPORT.Aの黄のG2はGPIO2。底面のピンは、シールの文字が読める向きで見てUSB-Cのある辺を下にすると、左の列が上から3V3、G5、G6、G7、G8の5本、右の列が上からG39、G38、5V、GNDの4本。variantはATOMS3と同じものが使われるので、機能ピンの並びもATOMS3と同じになる。RGB LEDはvariantがLED_BUILTINとRGB_BUILTINの名前を持つが、GPIO番号そのものではない値で定義しているので上の機能ピンには出ない。',
    pinNotes: [
      { text: '0.85インチLCDも6軸センサMPU6886も載っていないので、ATOMS3向けのコードのうち画面とIMUを使う部分は動かない。代わりにRGB LEDのWS2812C-2020が載っている', source: M5_ATOMS3_LITE },
      { text: '外に出ているGPIOは底面の6本（G5、G6、G7、G8、G38、G39）と、手前側の面のHY2.0-4P（PORT.A）の2本だけ。PORT.Aは黒がGND、赤が5V、黄がGPIO2、白がGPIO1', source: M5_ATOMS3_LITE },
      { text: 'RGB LEDのWS2812C-2020はGPIO35に繋がっている', source: M5_ATOMS3_LITE },
      { text: '上面の大きなボタンはGPIO41、赤外線送信LEDはGPIO4に繋がっている', source: M5_ATOMS3_LITE },
      { text: 'variantがSDAと呼ぶGPIO38とSCLと呼ぶGPIO39には、この板ではI2Cの機器が何も繋がっておらず底面にそのまま出ている。MOSI・SCK・SSと呼ぶGPIO21・GPIO17・GPIO15はATOMS3のLCD用で、この板では外に出ていない', source: M5_ATOMS3_LITE },
      { text: 'GPIO0は基板のBOOT回路の出力に繋がっていて、RESETを約2秒押し続けるとLowに引かれ緑のLEDが点く。自由に使えるピンではない', source: M5_ATOMS3_SCHEMATIC },
      { text: '載っているのはESP32-S3FN8で、Flashを8MB内蔵しPSRAMは持たない。USB-CはESP32-S3のGPIO19とGPIO20へ直結していて、USBシリアル変換チップは載っていない', source: M5_ATOMS3_SCHEMATIC },
      { text: '電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32S3_DATASHEET },
    ] }],
  ['esp32_devkitc_v4', { project: path.join(here, 'pio-esp32'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'ESP32-DevKitC V4', vendor: 'Espressif', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-uart-bridge', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.esp32_devkitc_v4,
    // The generic esp32 variant defines no Dn macros at all, so the table has no digital rows.
    // That is the trap on this board, and the silkscreen's own D0..D3 mean something else again.
    pinTableNote: 'このボードのvariantはD0からDnのマクロを定義していないので、コードにはGPIO番号を直接書く。上のピン表のA0からA19はArduinoのアナログ名で、同じ行のGPIO番号がその実体。基板に印刷されたD0からD3・CMD・CLKはSPI flash用の端子名であって、コードに書くラベルではない。',
    pinNotes: [
      { text: 'I/OのHighレベル入力電圧の最大はVDDより0.3V高い値、電源ピンの絶対最大定格は3.6Vなので、5Vを直接加えると定格を超える', source: ESP32_DATASHEET },
      { text: 'GPIO34からGPIO39は入力専用で、プルアップ・プルダウン抵抗を持たないため出力にはできない', source: ESP32_DATASHEET },
      { text: 'ストラッピングピンはGPIO0、GPIO2、GPIO12（MTDI）、GPIO15（MTDO）、GPIO5の5本で、起動時のレベルによってブートモードなどが決まる', source: ESP32_DATASHEET },
      { text: 'ヘッダのD0（GPIO7）、D1（GPIO8）、D2（GPIO9）、D3（GPIO10）、CMD（GPIO11）、CLK（GPIO6）はESP32とSPI flashの通信に基板内部で使われているので使わない', source: ESP32_DEVKITC_GUIDE },
      { text: 'ヘッダに出ているADC1はGPIO32、GPIO33、GPIO34、GPIO35、GPIO36、GPIO39の6本', source: ESP32_DEVKITC_GUIDE },
      { text: '給電はMicro USBポート、5VとGNDのヘッダピン、3V3とGNDのヘッダピンの3通りで、必ずどれか1つだけを使う', source: ESP32_DEVKITC_GUIDE },
      { text: 'Bootボタンを押したままENボタンを押すと、シリアル経由で書き込むFirmware Downloadモードに入る', source: ESP32_DEVKITC_GUIDE },
      { text: 'ADC2はWi-Fiも使うため、Wi-Fi動作中はドライバ側の保護を通してしか読めない', source: ESP_IDF_ADC },
    ] }],
  // ATOM Lite と ATOM Matrix は一覧では別の 2 台。中身の差は 5x5 の LED マトリクスと IMU の
  // 有無だけで build には効かないので、env（PlatformIO の [env:...]）は 1 つを共有し、差は下の
  // pinNotes に書く。どちらの id も env と同じ名前ではないので、2 台とも env を明示する。
  ['m5stack_atom_lite', { project: path.join(here, 'pio-esp32'), env: 'm5stack_atom', family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'ATOM Lite', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-uart-bridge', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stack_atom_lite,
    // M5's m5stack_atom variant defines neither Dn nor An macros, so the pin table has no rows at
    // all: what a sketch is written against is the G<n> silk, which is the GPIO number itself.
    // The variant's own SPI names disagree with M5's PinMap, so how to read them is said here.
    pinTableNote: 'このボードのvariantはD0からDnもA0からAnもマクロを定義していないので、上のピン表に行は無く、coreが名前を付けている機能ピンだけが並ぶ。コードにはGPIO番号を直接書く。M5の資料と底面のシールにあるG19、G21のようなG付きの番号はそのままGPIO番号で、たとえばHY2.0-4P（PORT）の黄のG26はGPIO26。底面のピンは、シールの文字が読める向きで見てUSB-Cのある辺を下にすると、左の列が上から3V3、G22、G19、G23、G33の5本、右の列が上からG21、G25、5V、GNDの4本。上の機能ピンのMOSI・MISO・SCKはvariantが付けた名前で、M5のPinMapの呼び方（G19がMOSI、G23がCLK、G33がMISO）とは一致しない。ESP32のSPIはどのピンにも割り当てられるので、SPI.begin()にピンを渡して使う。LED_BUILTINはこのvariantが定義していないので機能ピンには出ない。',
    pinNotes: [
      { text: '5x5のLEDマトリクスも6軸センサMPU6886も載っていないので、ATOM Matrix向けのコードのうちマトリクスとIMUを使う部分は動かない。RGB LEDは上面にSK6812が1つだけで、GPIO27に繋がっている', source: M5_ATOM_LITE },
      { text: '外に出ているGPIOは底面の6本（G19、G21、G22、G23、G25、G33）と、手前側の面のHY2.0-4P（PORT）の2本だけ。PORTは黒がGND、赤が5V、黄がGPIO26、白がGPIO32', source: M5_ATOM_LITE },
      { text: '上面の大きなボタンはGPIO39、赤外線送信LEDはGPIO12に繋がっている', source: M5_ATOM_LITE },
      { text: 'variantがSDAと呼ぶGPIO26とSCLと呼ぶGPIO32はHY2.0-4P（PORT）の黄と白に出ている2本で、M5のPinMapがI2Cと書くのは底面のG21（SCL）とG25（SDA）の方。Wireを既定のまま使うとPORT側に出る', source: M5_ATOM_LITE },
      { text: '載っているのはESP32-PICO-D4で、Flashは4MB、PSRAMは持たない。アンテナは基板上の3Dアンテナなので外付けは要らない', source: M5_ATOM_LITE },
      { text: 'USB-Cは基板のUSBシリアル変換チップに繋がっていて、そのチップがENとGPIO0を動かして自動で書き込みモードに入れる。ESP32のUARTはGPIO1がTX、GPIO3がRX。GPIO0は底面にもHY2.0にも出ていないので自由に使えるピンではない', source: M5_ATOM_LITE },
      { text: 'M5のPinMapは底面のG33とHY2.0のG32をADC、G25とG26をDACと書いている', source: M5_ATOM_LITE },
      { text: 'GPIO34からGPIO39は入力専用で、プルアップ・プルダウン抵抗を持たないため出力にはできない（ボタンのGPIO39もこれに当たる）。電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32_DATASHEET },
    ] }],
  ['m5stack_atom_matrix', { project: path.join(here, 'pio-esp32'), env: 'm5stack_atom', family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'ATOM Matrix', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-uart-bridge', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stack_atom_matrix,
    // M5 sells this one as EOL and names no replacement. It still builds and flashes the same, so
    // it stays in the list; the sentence is shown in the manual, next to this board's own section.
    statusNote: 'このボードはM5Stackの公式ストアで販売終了（EOL）になっていて、後継は案内されていない。同じ24mm角で今も売られているのはATOM Liteだが、5x5のLEDマトリクスと6軸センサMPU6886は載っていない。',
    pinTableNote: 'このボードのvariantはD0からDnもA0からAnもマクロを定義していないので、上のピン表に行は無く、coreが名前を付けている機能ピンだけが並ぶ。コードにはGPIO番号を直接書く。M5の資料と底面のシールにあるG19、G21のようなG付きの番号はそのままGPIO番号で、たとえばHY2.0-4P（PORT）の黄のG26はGPIO26。底面のピンは、シールの文字が読める向きで見てUSB-Cのある辺を下にすると、左の列が上から3V3、G22、G19、G23、G33の5本、右の列が上からG21、G25、5V、GNDの4本。上の機能ピンのMOSI・MISO・SCKはvariantが付けた名前で、M5のPinMapの呼び方（G19がMOSI、G23がCLK、G33がMISO）とは一致しない。ESP32のSPIはどのピンにも割り当てられるので、SPI.begin()にピンを渡して使う。variantはATOM Liteと同じものが使われるので機能ピンの並びも同じで、5x5のLEDマトリクスとMPU6886のピンにはvariantが名前を付けていないため上には出ない。',
    pinNotes: [
      { text: '上面の5x5のRGB LEDマトリクス（WS2812C-2020が25個）はGPIO27に繋がっている。マトリクスの下に隠れている大きなボタンはGPIO39、赤外線送信LEDはGPIO12', source: M5_ATOM_MATRIX },
      { text: '6軸センサMPU6886が載っていて、そのI2CはGPIO21がSCL、GPIO25がSDA。この2本は底面のピンにもそのまま出ているので、外の機器をここに繋ぐと内蔵センサと同居することになる', source: M5_ATOM_MATRIX },
      { text: '外に出ているGPIOは底面の6本（G19、G21、G22、G23、G25、G33）と、手前側の面のHY2.0-4P（PORT）の2本だけ。PORTは黒がGND、赤が5V、黄がGPIO26、白がGPIO32', source: M5_ATOM_MATRIX },
      { text: 'variantがSDAと呼ぶGPIO26とSCLと呼ぶGPIO32はHY2.0-4P（PORT）の2本で、MPU6886のバスではない。Wireを既定のまま使うと内蔵センサには繋がらない', source: M5_ATOM_MATRIX },
      { text: 'LEDマトリクスは明るくしすぎるとLEDとアクリル板を傷める。FastLEDを使う場合の明るさは20が目安で、M5のライブラリでは0から100に割り当ててある', source: M5_ATOM_MATRIX },
      { text: '載っているのはESP32-PICO-D4で、Flashは4MB、PSRAMは持たない。アンテナは基板上の3Dアンテナなので外付けは要らない', source: M5_ATOM_MATRIX },
      { text: 'USB-Cは基板のUSBシリアル変換チップに繋がっていて、そのチップがENとGPIO0を動かして自動で書き込みモードに入れる。ESP32のUARTはGPIO1がTX、GPIO3がRX。GPIO0は底面にもHY2.0にも出ていないので自由に使えるピンではない', source: M5_ATOM_MATRIX },
      { text: 'GPIO34からGPIO39は入力専用で、プルアップ・プルダウン抵抗を持たないため出力にはできない（ボタンのGPIO39もこれに当たる）。電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32_DATASHEET },
    ] }],
  // StickC Plus2 は自作の board 定義で建てる。platform が持つ M5Stick 系の定義は m5stick-c
  // （ESP32-PICO-D4、4MB flash・PSRAM 無し）だけで、この板の中身と合わないため。
  // 値は core 自身の boards.txt の m5stack_stickc_plus2 に合わせた（compiler/pio-esp32/boards/）。
  ['m5stack_stickc_plus2', { project: path.join(here, 'pio-esp32'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'StickC Plus2', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp-uart-bridge', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stack_stickc_plus2,
    // M5 sells this one as EOL and points at the M5StickS3 in its place. It still builds and
    // flashes the same, so it stays in the list; the sentence is shown in the manual, next to this
    // board's own section, so nobody buys the wrong replacement.
    statusNote: 'このボードはM5Stackの公式ストアで販売終了（EOL）になっていて、後継としてESP32-S3版のM5StickS3が案内されている。',
    // M5's m5stack_stickc_plus2 variant defines neither Dn nor An macros, so the pin table has no
    // rows at all: what a sketch is written against is the G<n> silk, which is the GPIO number
    // itself. Its SPI names are the built-in LCD's bus, not anything the outside can reach.
    pinTableNote: 'このボードのvariantはD0からDnもA0からAnもマクロを定義していないので、上のピン表に行は無く、coreが名前を付けている機能ピンだけが並ぶ。コードにはGPIO番号を直接書く。M5の資料と背面のシールにあるG0、G26のようなG付きの番号はそのままGPIO番号。2.54mmの8ピンヘッダは画面の上側の端（USB-Cの反対の端）にあり、背面のシールの文字が読める向きで見て左からGND、5V、G26、G36/G25、G0、BAT、3V3、5Vの8穴。上の機能ピンのMOSI（GPIO15）・SCK（GPIO13）・SS（GPIO5）は本体に内蔵されたLCDの3本で外には出ておらず、MISO（GPIO36）はヘッダのG36の穴。外の機器にはSPI.begin()にピンを渡して使う。',
    pinNotes: [
      { text: '外に出ているGPIOは、画面の上側の端の8ピンヘッダの3本（G26、G36、G0）と、USB-Cと同じ端のHY2.0-4P（PORT）の2本だけ。PORTは黒がGND、赤が5V、黄がGPIO32、白がGPIO33', source: M5_STICKC_PLUS2 },
      { text: 'ヘッダのG36/G25と印字された穴はGPIO36とGPIO25が基板の中で1本に繋がったもので、片方を出力にすると他方も同じ電位になる', source: M5_STICKC_PLUS2_SCHEMATIC },
      { text: 'variantがSDAと呼ぶGPIO32とSCLと呼ぶGPIO33はHY2.0-4P（PORT）の2本で、内蔵の6軸センサMPU6886とRTC BM8563のI2C（SCLがGPIO22、SDAがGPIO21）ではない。Wireを既定のまま使うとPORT側に出る', source: M5_STICKC_PLUS2 },
      { text: '1.14インチLCD（ST7789V2、135x240）はGPIO15がMOSI、GPIO13がCLK、GPIO14がDC、GPIO12がRST、GPIO5がCS、GPIO27がバックライト', source: M5_STICKC_PLUS2 },
      { text: 'ボタンはAが画面の下の大きなボタンでGPIO37、Bが側面でGPIO39、Cが電源ボタンでGPIO35。赤外線送信LEDと赤のLEDは同じGPIO19、ブザーはGPIO2、マイクSPM1423はCLKがGPIO0、DATAがGPIO34', source: M5_STICKC_PLUS2 },
      { text: 'この板は電源管理ICを持たず、GPIO4（HOLD）で自分の電源を保持する。BUTTON Cを2秒以上押すと電源が入るが、プログラムがGPIO4をHighにしないと切れる。USB給電が無いときBUTTON Cを6秒以上押すか、GPIO4をLowにすると切れる。電池電圧の検出はGPIO38', source: M5_STICKC_PLUS2 },
      { text: '載っているのはESP32-PICO-V3-02で、Flash 8MBとPSRAM 2MBを内蔵する。USB-CはUSBシリアル変換チップCH9102経由で、ESP32のUARTはGPIO1がTX、GPIO3がRX。ヘッダのG0はマイクのCLKと共用', source: M5_STICKC_PLUS2 },
      { text: 'GPIO0はストラッピングピンで、Lowのまま起動するとシリアルから書き込むモードになる。GPIO34からGPIO39は入力専用で、プルアップ・プルダウン抵抗を持たないため出力にはできない（ボタンのGPIO37・GPIO39、マイクのGPIO34、電池電圧のGPIO38がこれに当たる）。電源ピンの絶対最大定格は3.6V、Highレベル入力電圧の最大はVDDより0.3V高い値なので、5Vを直接加えると定格を超える', source: ESP32_DATASHEET },
    ] }],
  // Stamp-P4 は自作の board 定義と、この project 内の variant で建てる。platform が持つ P4 の
  // 定義は rev で 2 系統に分かれていて（esp32-p4 系が chip_variant esp32p4_es・360MHz、
  // esp32-p4_r3 系が esp32p4・400MHz）、手元の個体の rev が分からないので rev < 3.00 向けを
  // 既定にした。variant は SDIO の配線がこの板のものである必要があるため（compiler/pio-esp32p4/）。
  ['m5stamp_p4', { project: path.join(here, 'pio-esp32p4'), family: 'esp', platform: 'esp32', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'Stamp-P4', vendor: 'M5Stack', framework: 'Arduino', core: 'Arduino ESP32', coreNote: ESP32_CORE_NOTE, artifact: 'flashset', browserFlash: true, serial: true, wireless: false, flashRoute: 'esp-usb-cdc', flashHint: ESP_FLASH, flashGuide: FLASH_GUIDES.m5stamp_p4,
    // 無線を持たないボードだが、理由が「載っていない」ではなく「別売の子基板を載せたときだけ
    // 使える」なので、その 1 行を取説のこのボードの節に出す。statusNote（販売終了）とは別の話
    // なので別のフィールドで持つ。画面に出るのは取説だけで、AI へ渡すボードの文には入れない。
    // 子基板の型番は M5 の AddOn 自身の商品ページ（docs.m5stack.com/en/products/sku/A172 の
    // 仕様表）で確かめた。技適の表示がパッケージ側にあることと、この組み合わせが動くことは、
    // まだ実機で確かめていない。
    wirelessNote: 'このボード自体には無線が載っていない。2.4GHz Wi-Fi 6を使うには別売のStamp-AddOn C6 For P4（ESP32-C6-MINI-1-N4）をSDIOのコネクタに重ねて載せる。電波を出すのはそのAddOn側のモジュールなので、技適マークの表示もAddOnのパッケージ側にある。この組み合わせはまだ実機で確かめていない。',
    // この project 内の variant は Dn を定義せず、A0 から A13 だけを定義している（チップの ADC の
    // 割り当てそのもの）ので、ピン表に出るのはアナログ名の行だけ。その 14 本のうちどれがスタンプ穴に
    // 出ていてどれが BTB コネクタにしか無いかは variant からは分からないので、ここで言う。
    pinTableNote: 'このボードのvariantはD0からDnのマクロを定義していないので、コードにはGPIO番号を直接書く。上のピン表のA0からA13はArduinoのアナログ名で、同じ行のGPIO番号がその実体。A0からA9（GPIO16からGPIO23、GPIO49、GPIO50）とA11（GPIO52）はスタンプ穴に出ているが、A10（GPIO51）はSDIOのBTBに、A12とA13（GPIO53、GPIO54）はMIPI CSIのBTBにしか出ていない。M5の資料にあるG0、G24のようなG付きの番号はそのままGPIO番号で、たとえばSDIO_CLKのG43はGPIO43。SPIのSS、MOSI、MISO、SCKはこのvariantが値を決めていないので機能ピンにも出ず、SPI.begin()にピンを渡して使う。',
    pinNotes: [
      { text: '載っているのはESP32-P4NRW32で、16MBのFlashと32MBのOctal PSRAMを持つ。スタンプ穴に出ているGPIOは44本（G0からG39、G41、G49、G50、G52）', source: M5_STAMP_P4 },
      { text: 'スタンプ穴にはそのほかMIPI DSIの2レーン、USB2 OTGのD+/D−、CHIP_ENが出ている。G40、G42からG48、G51はUSB-Cのとなりの20ピンBTB（SDIO）、G53とG54は反対の辺の16ピンBTB（MIPI CSI）にしか出ていない', source: M5_STAMP_P4_PINMAP },
      { text: 'USB-CはESP32-P4のGPIO24（D−）とGPIO25（D+）へ直結していて、USBシリアル変換チップは載っていない。スタンプ穴のUSB1（G26、G27）とUSB2 HOSTのD+/D−は別の口', source: M5_STAMP_P4_SCHEMATIC },
      { text: 'GPIO24とGPIO25は既定でUSB Serial/JTAGに繋がっているので、USBを使っている間この2本は汎用I/Oにできない。GPIO26とGPIO27はその制限の対象に挙げられていない', source: ESP32P4_DATASHEET },
      { text: '押せるボタンもLEDも載っておらず、ENとG35（BOOT）はスタンプ穴。GNDに落とすとそれぞれリセットと書き込みモードになる', source: M5_STAMP_P4_SCHEMATIC },
      { text: '本体に無線は無い。2.4GHz Wi-Fi 6を使うには20ピンBTBにStamp-AddOn C6 For P4を重ねて載せる。SDIOはCLKがGPIO43、CMDがGPIO44、D0からD3がGPIO45からGPIO48、RSTがGPIO42', source: M5_STAMP_P4 },
      { text: 'M5のPinMapがSDAと呼ぶのはGPIO11、SCLと呼ぶのはGPIO9。ADC1はGPIO16からGPIO23の8本で、ADC2と印字があるのはG49、G50とBTBのG51', source: M5_STAMP_P4_PINMAP },
      { text: 'ストラッピングピンはGPIO34、GPIO35、GPIO36、GPIO37、GPIO38の5本で、ブートモードはGPIO35からGPIO38で決まる。電源ピンの絶対最大定格は3.6Vなので、GPIOに5Vを直接加えると定格を超える', source: ESP32P4_DATASHEET },
    ] }],
  ['wio_node', { project: path.join(here, 'pio-esp8266'), family: 'esp', platform: 'esp8266', extension: 'json', contentType: 'application/json; charset=utf-8',
    name: 'Wio Node', vendor: 'Seeed Studio', framework: 'Arduino', core: 'Arduino ESP8266', artifact: 'flashset', browserFlash: true, serial: true, wireless: true, flashRoute: 'esp8266', flashHint: WIO_NODE_FLASH, flashGuide: FLASH_GUIDES.wio_node,
    // Read before the pin table, because the table's own labels are the trap on this board.
    pinTableNote: 'ピン表のD0からD10はNodeMCU汎用variantのマクロで、Wio Node基板の表記ではない。基板のPORT0（UART/I2C0/D0）とPORT1（Analog/I2C1/D1）にあるD0/D1はコネクタの名前であり、コードのD0/D1マクロ（GPIO16とGPIO5）とは別物。コードではGPIO番号を直接書くこと。',
    pinNotes: [
      { text: '左のGroveコネクタPORT0（回路図のJ3）は、pin1（黄）がGPIO3（U0RXD）、pin2（白）がGPIO1（U0TXD）、pin3が3V3B、pin4がGND', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: '右のGroveコネクタPORT1（回路図のJ6）は、pin1（黄）がGPIO5、pin2（白）がGPIO4、pin3が3V3B、pin4がGND。上のピン表でSCLはGPIO5、SDAはGPIO4なので、I2CはこのPORT1に出ている', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: 'A0はPORT1 pin1から100k二本を直列に通してTOUTへ入り、TOUTは100kでGNDに落ちている。1/3の分圧なのでPORT1 pin1が3.3VのときA0の入力は約1.1V。PORT0側にアナログ入力は無い', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: 'GroveコネクタへのVCCである3V3Bは、GPIO15をHIGHにするとONになる。GPIO15は10kでプルダウンされているため、HIGHにしない限りGroveコネクタに電源は来ない', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: '青のLEDは3V3から2kを通してGPIO2に入っているのでGPIO2をLOWにすると点灯する（GPIO2は10kプルアップ）。赤のLEDは3V3B直結でGroveへの給電表示', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: 'FUNCボタンはGPIO0（10kプルアップ）、RSTボタンはRSTに繋がる。GPIO16は100ΩでRSTに接続されていてdeep sleepからの復帰に使う', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: 'micro USBは給電専用で、UARTもUSBシリアル変換チップも載っていない。GPIO12、GPIO13、GPIO14はテストパッド行きで利用者が使える端子ではない', source: SEEED_WIO_NODE_SCHEMATIC },
      { text: '動作電圧は2.5Vから3.6V、I/O 1本あたりのDC電流は最大12mA、High入力電圧の最大は3.6Vなので5Vを直接加えると定格を超える。GPIO0、GPIO2、GPIO15はブートモードの選択にも使われ、U0TXD（GPIO1）は電源投入時に外部からLowに引いてはならない。A0のTOUTは入力専用で、外部接続時の入力電圧範囲は0Vから1.0V', source: ESP8266_DATASHEET },
    ] }],
]);
// Pin labels are not written by hand: compiler/tools/generate-board-pins.mjs reads them out of the
// PlatformIO variant header this machine builds with and writes compiler/boards/<env>.pins.json.
// Only the committed JSON is read here, so a request never touches the PlatformIO install.
// Most boards are their own PlatformIO env, so the board id is the env name; a board that shares
// another's build settings names it in `env` (CoreS3-SE rides CoreS3's). pioEnv is that name.
const pioEnv = (id, b) => b.env ?? id;
const boardPins = env => JSON.parse(readFileSync(path.join(here, 'boards', `${env}.pins.json`), 'utf8'));
// Public board facts (no paths). Same object shape the browser hands to the AI as boardDetails.
// incompatibleLibraries is the browser's only copy of the table: the Libraries view, the Build
// output and the AI's board sentence all read it from the selected board's entry here.
// The route's record travels with every board that rides it, as the names of the boards actually
// flashed on it. It is the maintainers' ledger: /boards carries it, the UI does not show it.
const routeFacts = (b) => ({ flashRoute: b.flashRoute, routeLabel: FLASH_ROUTES[b.flashRoute].label,
  routeVerified: FLASH_ROUTES[b.flashRoute].verifiedBy.length > 0,
  routeVerifiedBy: FLASH_ROUTES[b.flashRoute].verifiedBy.map(id => BOARDS.get(id).name) });
const PUBLIC_BOARDS = [...BOARDS].map(([id, b]) => ({ id, name: b.name, vendor: b.vendor, family: b.family, platform: b.platform, framework: b.framework, core: b.core, coreNote: b.coreNote ?? null,
  artifact: b.artifact, browserFlash: b.browserFlash, serial: b.serial, wireless: b.wireless, ...routeFacts(b), flashHint: b.flashHint, flashGuide: b.flashGuide,
  pins: boardPins(pioEnv(id, b)), pinTableNote: b.pinTableNote ?? null, pinNotes: b.pinNotes,
  // A board M5 has stopped selling still builds the same, so it stays in the list; this is the
  // one sentence the manual shows for it (what happened, and what the vendor points at instead).
  statusNote: b.statusNote ?? null,
  // A board whose radio is not on the board itself (Stamp-P4 gets Wi-Fi only from an add-on
  // module). Same shape as statusNote — one sentence, shown in the manual's own section for that
  // board and nowhere else — because it is a different fact from "the vendor stopped selling it".
  wirelessNote: b.wirelessNote ?? null,
  incompatibleLibraries: incompatFor({ id, platform: b.platform }).map(({ library, reason, alternative }) => ({ library, reason, alternative })) }));
const WEB_DIR = path.join(here, '..', 'web');
const PIO_BIN = process.env.PIO_BIN ?? path.join(process.env.HOME ?? '', '.local', 'bin', 'pio');
const PORT = Number(process.env.PORT ?? 3100);
// Loopback by default (a development server on the machine that runs the browser). The Docker
// image sets 0.0.0.0, because a published container port never reaches a loopback listener.
const BIND_HOST = process.env.BIND_HOST ?? '127.0.0.1';
// Long enough for a cold ESP32-C5 build (40 s measured), short enough that the server, not the
// reverse proxy in front of it, is what gives up first (Cloudflare's edge cuts at 100 s).
const TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS ?? 90_000);
// Origins allowed to call this server from a browser. Empty (the default) means no CORS headers
// at all, which is what a same-origin install wants; '*' is never sent.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
// The esp8266 platform and pioarduino's espressif32 both install a package named tool-esptoolpy,
// at incompatible versions, into whatever PlatformIO core dir they are given; the loser then tries
// to fetch its own copy on every build (and fails outright with no network). Pointing esp8266
// builds at their own core dir keeps the two apart. Unset = one shared core dir, as before.
const PIO_CORE_DIR_ESP8266 = process.env.PIO_CORE_DIR_ESP8266 ?? '';

const MAX_SOURCE = 256 * 1024;

// How many builds may run at once. Each build gets its own temporary project directory, so
// nothing of the build itself is shared; what is shared is PlatformIO's own package store
// (~/.platformio), and PlatformIO takes a file lock around every install / download there.
// The cap exists because `pio run` already spreads one build over every core: stacking more
// builds than that only makes them contend. Half the cores is the default, and also what a
// MAX_CONCURRENT_BUILDS that is not a number falls back to (NaN would let no build start).
const DEFAULT_MAX_BUILDS = Math.max(1, Math.floor(os.cpus().length / 2));
const MAX_BUILDS = Math.max(1, Math.floor(Number(process.env.MAX_CONCURRENT_BUILDS)) || DEFAULT_MAX_BUILDS);

// A plain counting semaphore. A finishing build hands its slot straight to the next waiter
// instead of releasing it, so the count can never drift above MAX_BUILDS.
let running = 0;
const waiting = [];
function acquireSlot() {
  if (running < MAX_BUILDS) { running++; return Promise.resolve(); }
  return new Promise(resolve => waiting.push(resolve));
}
function releaseSlot() {
  const next = waiting.shift();
  if (next) next();
  else running--;
}
async function limited(fn) {
  await acquireSlot();
  try { return await fn(); } finally { releaseSlot(); }
}

// platform is the BOARDS entry's `platform` (not its `family`): esp32 and esp8266 are two
// platforms of the same family, and it is the platform that decides the core dir.
function runPio(env, project, platform) {
  return new Promise((resolve) => {
    const childEnv = platform === 'esp8266' && PIO_CORE_DIR_ESP8266
      ? { ...process.env, PLATFORMIO_CORE_DIR: PIO_CORE_DIR_ESP8266 }
      : process.env;
    const child = spawn(PIO_BIN, ['run', '-e', env], { cwd: project, env: childEnv });
    let log = '';
    const onData = (d) => { log += d.toString(); if (log.length > 1_000_000) log = log.slice(-500_000); };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    const timer = setTimeout(() => { child.kill('SIGKILL'); log += `\n[timeout after ${TIMEOUT_MS} ms]`; }, TIMEOUT_MS);
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, log }); });
    child.on('error', (err) => { clearTimeout(timer); resolve({ code: -1, log: log + '\n' + String(err) }); });
  });
}

function publicLog(log, project = '') {
  for (const prefix of [project, here, process.env.HOME].filter(Boolean)) log = log.split(prefix).join('[local]');
  return log.replace(/https?:\/\/[^\s)]+/g, '[URL]').slice(-20_000);
}
async function compile(env, source, libraries) {
  return limited(async () => {
    const board = BOARDS.get(env);
    // The PlatformIO env to build; the same one for two boards that share their build settings.
    const target = pioEnv(env, board);
    // The semaphore as this build starts: how many builds are running (this one included) and
    // how many requests are still queued behind them.
    const queue = { running, waiting: waiting.length };
    const r = await build(env, board, target, source, libraries);
    // One line of JSON per build on stdout (JSON Lines), so `docker logs` is the build record:
    // which board, how long, how big, how busy the server was. The log carries no user source.
    console.log(JSON.stringify({ t: new Date().toISOString(), env, target, ok: r.ok,
      stage: r.ok ? null : r.stage, ms: r.durationMs, bytes: r.ok ? r.artifact.length : null,
      libs: libraries.length, running: queue.running, waiting: queue.waiting }));
    return r;
  });
}

// One build, in its own temporary project directory. The caller holds the semaphore slot.
async function build(env, board, target, source, libraries) {
  const started = Date.now();
  try { await verifyLibraries(libraries); }
  catch (error) { return { ok: false, log: error.message, stage: 'dependencies', durationMs: Date.now() - started }; }
  // A fresh source/config/libdeps/build tree for every request, including zero dependencies.
  // Only PlatformIO's package download cache and toolchains are shared.
  const project = await mkdtemp(path.join(os.tmpdir(), 'digicode-build-'));
  try {
    await mkdir(path.join(project, 'src'));
    await writeFile(path.join(project, 'src', 'main.cpp'), source, 'utf8');
    const template = await readFile(path.join(board.project, 'platformio.ini'), 'utf8');
    const config = '[platformio]\nlib_dir = lib\ngloballib_dir = global-lib\nlibdeps_dir = .pio/libdeps\n\n[env]\nlib_deps =\n' +
      libraries.map(p => `    ${p.owner}/${p.name}@${p.version}`).join('\n') + '\n\n' + template;
    await writeFile(path.join(project, 'platformio.ini'), config);
    if (board.family === 'esp') {
      for (const script of ['portable_paths.py', 'package_firmware.py'])
        await copyFile(path.join(ESP_SHARED, script), path.join(project, script));
    }
    // A template project may carry its own board definitions (compiler/pio-*/boards/*.json) for
    // boards the platform does not define. PlatformIO looks for them under the *build* project's
    // boards/ directory, and the build runs in the fresh temporary one, so they are copied too.
    const boardDefs = await readdir(path.join(board.project, 'boards')).catch(() => []);
    if (boardDefs.length) {
      await mkdir(path.join(project, 'boards'));
      for (const name of boardDefs.filter(n => n.endsWith('.json')))
        await copyFile(path.join(board.project, 'boards', name), path.join(project, 'boards', name));
    }
    // The same holds for a variant the core does not carry (compiler/pio-*/variants/<variant>/):
    // the env names it with board_build.variants_dir, which the framework resolves against the
    // *build* project's directory, so the whole variants/ tree is copied into the fresh one too.
    const variants = await readdir(path.join(board.project, 'variants'), { withFileTypes: true }).catch(() => []);
    for (const entry of variants.filter(e => e.isDirectory())) {
      await mkdir(path.join(project, 'variants', entry.name), { recursive: true });
      for (const file of await readdir(path.join(board.project, 'variants', entry.name)))
        await copyFile(path.join(board.project, 'variants', entry.name, file), path.join(project, 'variants', entry.name, file));
    }
    const { code, log } = await runPio(target, project, board.platform);
    const durationMs = Date.now() - started;
    if (code !== 0) return { ok: false, log: publicLog(log, project),
      stage: /(?:PackageException|UnknownPackageError|HTTPClientError|Could not install|Could not find the package)/i.test(log) ? 'dependencies' : 'compile', durationMs };
    const artifact = await readFile(path.join(project, '.pio', 'build', target, board.family === 'esp' ? 'flashset.json' : `firmware.${board.extension}`));
    return { ok: true, artifact, board, durationMs };
  } finally { await rm(project, { recursive: true, force: true }); }
}

// Over the limit the request is answered (the caller turns the rejection into 400), but the rest
// of the body is still read and thrown away rather than destroying the socket: a client that is
// mid-upload should see the 400, not a broken connection (through a proxy that becomes a 5xx).
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; let over = false; const chunks = [];
    req.on('data', (c) => {
      if (over) return;
      size += c.length;
      if (size > limit) { over = true; chunks.length = 0; reject(new Error('body too large')); }
      else chunks.push(c);
    });
    req.on('end', () => { if (!over) resolve(Buffer.concat(chunks).toString('utf8')); });
    req.on('error', (err) => { if (!over) reject(err); });
  });
}

// CORS, in one place. The headers are put on the response before any route runs, so every
// writeHead below (json(), the /compile success response, /assets, /) carries them: writeHead
// merges what setHeader has already set. Nothing is added unless the request's Origin is one of
// ALLOWED_ORIGINS, so the default (empty) server answers exactly as it did before.
// expose-headers is needed because the browser reads the two x- headers off a /compile response.
function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return false;
  res.setHeader('access-control-allow-origin', origin);
  res.setHeader('vary', 'origin');
  res.setHeader('access-control-expose-headers', 'x-compile-duration-ms, x-artifact-sha256');
  return true;
}

function json(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  try {
    const cors = applyCors(req, res);
    // The preflight is answered for any path: the browser sends it before the request that would
    // have told us whether the path exists. Without an allowed Origin it is a bare 204.
    if (req.method === 'OPTIONS') {
      if (cors) {
        res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
        res.setHeader('access-control-allow-headers', 'content-type');
        res.setHeader('access-control-max-age', '86400');
      }
      res.writeHead(204);
      return res.end();
    }
    const url = new URL(req.url, 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/libraries/search') {
      try { return json(res, 200, await searchLibraries(url.searchParams.get('q'), Number(url.searchParams.get('page') || 1))); }
      catch (error) { return json(res, 502, { error: error.message }); }
    }
    if (req.method === 'GET' && url.pathname === '/libraries/details') {
      try {
        const details = await libraryDetails(url.searchParams.get('owner'), url.searchParams.get('name'));
        // board is optional. Without it, or where no row names that board or its platform, the
        // response is exactly what it has always been; the key is never added empty.
        const id = url.searchParams.get('board');
        const board = BOARDS.get(id);
        const row = board && findIncompat(details, { id, platform: board.platform });
        return json(res, 200, row ? { ...details, incompatible: { reason: row.reason, alternative: row.alternative } } : details);
      }
      catch (error) { return json(res, 502, { error: error.message }); }
    }
    if (req.method === 'GET' && url.pathname === '/libraries/incompat') return json(res, 200, LIBRARY_INCOMPAT);
    if (req.method === 'GET' && req.url === '/boards') return json(res, 200, PUBLIC_BOARDS);
    if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true });
    if (req.method === 'GET' && req.url.startsWith('/assets/')) {
      const name = req.url.slice('/assets/'.length);
      // Only generated flat assets are public; never expose the repo or node_modules.
      if (!/^[a-zA-Z0-9_.-]+\.(js|css|ttf)$/.test(name)) return json(res, 404, { error: 'not found' });
      try {
        const asset = await readFile(path.join(WEB_DIR, 'dist', name));
        const types = { '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf' };
        res.writeHead(200, { 'content-type': types[path.extname(name)], 'cache-control': 'no-cache' });
        return res.end(asset);
      } catch (err) {
        if (err.code === 'ENOENT') return json(res, 404, { error: 'asset missing; run npm run build:web' });
        throw err;
      }
    }
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      const html = await readFile(path.join(WEB_DIR, 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(html);
    }
    if (req.method === 'POST' && req.url === '/compile') {
      let body, libraries;
      try {
        body = JSON.parse(await readBody(req, MAX_SOURCE + 16_384));
        if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.source !== 'string' ||
            (body.env !== undefined && typeof body.env !== 'string') ||
            (body.projectId !== undefined && (typeof body.projectId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.projectId))) ||
            (body.projectRevision !== undefined && (!Number.isSafeInteger(body.projectRevision) || body.projectRevision < 0))) throw new Error('不正なBuild要求です');
        libraries = validateLibraries(body.libraries);
      } catch (error) { return json(res, 400, { error: error instanceof SyntaxError ? '不正なJSONです' : error.message }); }
      const env = body.env ?? 'xiao_rp2040', source = body.source;
      if (!BOARDS.has(env)) return json(res, 400, { error: 'unknown env' });
      if (!source.trim() || Buffer.byteLength(source) > MAX_SOURCE) return json(res, 400, { error: 'source is empty or exceeds 256 KiB' });
      const r = await compile(env, source, libraries);
      if (!r.ok) return json(res, 422, { error: r.stage === 'dependencies' ? 'ライブラリ取得・確認に失敗しました' : 'コンパイルに失敗しました', stage: r.stage, log: r.log, durationMs: r.durationMs });
      res.writeHead(200, {
        'content-type': r.board.contentType,
        // UF2 is downloaded by the browser; the ESP flash set is internal data for browser flashing.
        ...(r.board.family === 'rp2040' ? { 'content-disposition': `attachment; filename="firmware-${env}.${r.board.extension}"` } : {}),
        'x-compile-duration-ms': String(r.durationMs),
        'x-artifact-sha256': createHash('sha256').update(r.artifact).digest('hex'),
      });
      return res.end(r.artifact);
    }
    json(res, 404, { error: 'not found' });
  } catch (err) {
    json(res, 500, { error: 'サーバー処理に失敗しました。再試行してください' });
  }
});

server.listen(PORT, BIND_HOST, () => {
  console.log(`digicode-text compiler listening on http://${BIND_HOST}:${PORT}  (pio: ${PIO_BIN}, 同時build: ${MAX_BUILDS}, CORS: ${ALLOWED_ORIGINS.join(' ') || 'なし'})`);
});
