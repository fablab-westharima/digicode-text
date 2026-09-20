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
//                       incompatibleLibraries (rows of the incompatibility table for this board) }]
// GET  /health    -> { ok: true }
//
// No dependencies. Runs `pio run` in the project-local PlatformIO project
// templates. Requests are serialised, each in a fresh temporary project directory.

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
  pins: boardPins(id), pinTableNote: b.pinTableNote ?? null, pinNotes: b.pinNotes,
  incompatibleLibraries: incompatFor({ id, platform: b.platform }).map(({ library, reason, alternative }) => ({ library, reason, alternative })) }));
const WEB_DIR = path.join(here, '..', 'web');
const PIO_BIN = process.env.PIO_BIN ?? path.join(process.env.HOME ?? '', '.local', 'bin', 'pio');
const PORT = Number(process.env.PORT ?? 3100);
const TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS ?? 600_000);

const MAX_SOURCE = 256 * 1024;

let queue = Promise.resolve();
function serialised(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

function runPio(env, project) {
  return new Promise((resolve) => {
    const child = spawn(PIO_BIN, ['run', '-e', env], { cwd: project });
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
  return serialised(async () => {
    const board = BOARDS.get(env);
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
      const { code, log } = await runPio(env, project);
      const durationMs = Date.now() - started;
      if (code !== 0) return { ok: false, log: publicLog(log, project),
        stage: /(?:PackageException|UnknownPackageError|HTTPClientError|Could not install|Could not find the package)/i.test(log) ? 'dependencies' : 'compile', durationMs };
      const artifact = await readFile(path.join(project, '.pio', 'build', env, board.family === 'esp' ? 'flashset.json' : `firmware.${board.extension}`));
      return { ok: true, artifact, board, durationMs };
    } finally { await rm(project, { recursive: true, force: true }); }
  });
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  try {
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

server.listen(PORT, '127.0.0.1', () => {
  console.log(`digicode-text compiler listening on http://127.0.0.1:${PORT}  (pio: ${PIO_BIN})`);
});
