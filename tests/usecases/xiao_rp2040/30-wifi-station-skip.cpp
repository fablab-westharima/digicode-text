// @board xiao_rp2040
// @skip 対象外: RP2040 単体に無線が無い。WiFi は今回の縦串の範囲外
// @desc 参考: XIAO RP2040 で WiFi を使うには外付けモジュール (ESP-Hosted / W5500 など) が要る

#include <Arduino.h>

// XIAO RP2040 の MCU には無線が載っていない。earlephilhower コアの WiFi.h は
// CYW43 (Pico W) か ESPHost を前提にするため、この board では成立しない。
// 無線が要る用途は xiao_esp32c3 / wio_node 側のケースで見る。

void setup() {
  Serial.begin(115200);
  Serial.println("wifi is out of scope for xiao_rp2040");
}

void loop() {
  delay(1000);
}
