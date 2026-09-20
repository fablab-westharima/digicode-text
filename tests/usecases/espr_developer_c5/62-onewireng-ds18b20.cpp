// @board espr_developer_c5
// @lib pstolarz/OneWireNg@0.14.1
// @desc paulstoffregen/OneWire が build できない C5 で、代替の OneWireNg から DS18B20 を読む

// 09 / 10 / 29 / 31 は paulstoffregen/OneWire がこのボードの core のレジスタ定義と合わずに
// 落ちる。この case は、非互換表が代替として挙げる pstolarz/OneWireNg が同じボードで
// build できることを測るためのもの。OneWireNg は OneWire を参照しない別実装。

#include <Arduino.h>
#include "OneWireNg_CurrentPlatform.h"
#include "drivers/DSTherm.h"
#include "utils/Placeholder.h"

static const uint8_t ONE_WIRE_PIN = 0; // ESPr Developer C5: 汎用の GPIO0 を使う

static Placeholder<OneWireNg_CurrentPlatform> ow;

void setup() {
  Serial.begin(115200);
  delay(200);
  // 内蔵プルアップは使わない（第2引数 false）。バスには外付けの 4.7k を付ける前提。
  new (&ow) OneWireNg_CurrentPlatform(ONE_WIRE_PIN, false);
  DSTherm drv(ow);
  drv.writeScratchpadAll(0, 0, DSTherm::RES_12_BIT, false);
  Serial.println("onewireng ds18b20");
}

void loop() {
  DSTherm drv(ow);
  drv.convertTempAll(DSTherm::MAX_CONV_TIME, false);

  Placeholder<DSTherm::Scratchpad> scrpd;
  for (const auto& id : (static_cast<OneWireNg&>(ow))) {
    if (drv.readScratchpad(id, scrpd) != OneWireNg::EC_SUCCESS) continue;
    // getTemp2() は 1/16 度単位の整数。小数を使わずにそのまま出す。
    const long t16 = scrpd->getTemp2();
    Serial.print("temp16=");
    Serial.println(t16);
  }
  delay(2000);
}
