// @board xiao_rp2040
// @skip 対象外: WebServer は WiFi 前提。RP2040 単体では待ち受けできない
// @desc 参考: この board の UI は Serial か I2C ディスプレイ側で見る (18-ssd1306-ui.cpp)

#include <Arduino.h>

// earlephilhower コアには WebServer が同梱されているが、lwIP のバックエンド
// (CYW43 / ESPHost / 有線 Ethernet) が要る。XIAO RP2040 単体では成立しないため対象外。

void setup() {
  Serial.begin(115200);
  Serial.println("webserver is out of scope for xiao_rp2040");
}

void loop() {
  delay(1000);
}
