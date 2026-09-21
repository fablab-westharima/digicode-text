#ifndef Pins_Arduino_h
#define Pins_Arduino_h

// M5Stack Stamp-P4 (S013). core 自身の esp32p4 variant を元に、この板の配線へ直したもの。
// 元の esp32p4 variant は ESP32-P4 Function EV Board のもので、Ethernet PHY・SD スロット・
// SDIO（Wi-Fi）の番号がその板のものになっている。Stamp-P4 には PHY も SD スロットも載って
// いないので、その 2 つは持ってこない。残した A0..A13 / T0..T13 はチップの ADC・タッチの
// 割り当てそのもので、esp32p4_es の soc/adc_channel.h（ADC1 = GPIO16..23、ADC2 = GPIO49..54）
// と一致することを確かめてある。
// 出所: M5 の PinMap 画像 S013-stamp-p4-pinmap.jpg と回路図 SCH_Stamp-P4_2026_03_16。

#include <stdint.h>
#include "soc/soc_caps.h"

// BOOT_MODE 35
// BOOT_MODE2 36 pullup

static const uint8_t TX = 37;
static const uint8_t RX = 38;

// M5 の PinMap が SDA/SCL と書く 2 本。LPG11 / LPG9 は GPIO11 / GPIO9 のこと
// （回路図のネット名も LPG11_SDA / LPG9_SCL）。汎用の esp32p4 variant の 7/8 ではない。
static const uint8_t SDA = 11;
static const uint8_t SCL = 9;

// この板は SPI の割り当てを決めていない（M5 の PinMap に SPI の行が無く、汎用の esp32p4
// variant が使う GPIO26/27/32/33/36 は、この板では USB1 と RMII に行っている）。
// -1 は「この variant は割り当てない」という core 自身の書き方で、SPI.begin() にピンを渡す。
static const uint8_t SS = -1;
static const uint8_t MOSI = -1;
static const uint8_t MISO = -1;
static const uint8_t SCK = -1;

static const uint8_t A0 = 16;
static const uint8_t A1 = 17;
static const uint8_t A2 = 18;
static const uint8_t A3 = 19;
static const uint8_t A4 = 20;
static const uint8_t A5 = 21;
static const uint8_t A6 = 22;
static const uint8_t A7 = 23;
static const uint8_t A8 = 49;
static const uint8_t A9 = 50;
static const uint8_t A10 = 51;
static const uint8_t A11 = 52;
static const uint8_t A12 = 53;
static const uint8_t A13 = 54;

static const uint8_t T0 = 2;
static const uint8_t T1 = 3;
static const uint8_t T2 = 4;
static const uint8_t T3 = 5;
static const uint8_t T4 = 6;
static const uint8_t T5 = 7;
static const uint8_t T6 = 8;
static const uint8_t T7 = 9;
static const uint8_t T8 = 10;
static const uint8_t T9 = 11;
static const uint8_t T10 = 12;
static const uint8_t T11 = 13;
static const uint8_t T12 = 14;
static const uint8_t T13 = 15;

// On-chip GP LDO: GPIO39..48 の IO バンク（VDD_IO_5）はチップ内蔵の LDO VO4 から取る。
// core の esp32p4 / esp32p4_core_board variant が同じ 4 行を持っていて、下の SDIO の 7 本は
// すべてこの範囲に入る。実機では未確認（板が届いてから）。
#define BOARD_PERIMAN_IO_LDO_AUTO        1
#define BOARD_PERIMAN_IO_LDO0_CHANNEL    4
#define BOARD_PERIMAN_IO_LDO0_GPIO_MIN   39
#define BOARD_PERIMAN_IO_LDO0_GPIO_MAX   48
#define BOARD_PERIMAN_IO_LDO0_VOLTAGE_MV 3300

// WIFI - Stamp-AddOn C6 For P4（ESP32-C6-MINI-1-N4）を裏面の 20 ピン BTB に載せたときの SDIO。
// 番号は M5 の PinMap の SDIO の欄と、M5 自身の Arduino の Wi-Fi 例が WiFi.setPins() に渡す
// 値と同じ。ここで定義しておくと、その setPins() を書かなくても WiFi がこの配線で開く。
#define BOARD_HAS_SDIO_ESP_HOSTED
#define BOARD_SDIO_ESP_HOSTED_CLK   43
#define BOARD_SDIO_ESP_HOSTED_CMD   44
#define BOARD_SDIO_ESP_HOSTED_D0    45
#define BOARD_SDIO_ESP_HOSTED_D1    46
#define BOARD_SDIO_ESP_HOSTED_D2    47
#define BOARD_SDIO_ESP_HOSTED_D3    48
#define BOARD_SDIO_ESP_HOSTED_RESET 42

#endif /* Pins_Arduino_h */
