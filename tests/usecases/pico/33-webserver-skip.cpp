// @board pico
// @skip 対象外: WebServer は WiFi 前提。無印 Pico では待ち受けできない
// @desc 参考: この board の UI は Serial か I2C ディスプレイ側で見る (18-ssd1306-ui.cpp)

#include <Arduino.h>

// arduino-pico の WebServer は WiFi (Pico W) / Ethernet のバックエンドが要る。
// 無印 Pico 単体では成立しないため対象外。

void setup() {
  Serial.begin(115200);
  Serial.println("webserver is out of scope for pico");
}

void loop() {
  delay(1000);
}
