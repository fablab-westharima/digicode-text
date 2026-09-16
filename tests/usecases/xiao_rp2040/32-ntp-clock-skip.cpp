// @board xiao_rp2040
// @skip 対象外: NTP は WiFi 前提。RP2040 単体では時刻同期できない
// @desc 参考: この board で時刻を持つなら RTC (DS3231) を使う。22-rtclib-ds3231.cpp を見る

#include <Arduino.h>

// NTP はネットワークが前提。無線の無い XIAO RP2040 では成立しないため対象外。
// 同じ目的 (時刻を持つ) は RTC で満たす。

void setup() {
  Serial.begin(115200);
  Serial.println("ntp is out of scope for xiao_rp2040");
}

void loop() {
  delay(1000);
}
