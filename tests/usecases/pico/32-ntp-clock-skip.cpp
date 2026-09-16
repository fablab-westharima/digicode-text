// @board pico
// @skip 対象外: NTP は WiFi 前提。無印 Pico では時刻同期できない
// @desc 参考: この board で時刻を持つなら RTC (DS3231) を使う。22-rtclib-ds3231.cpp を見る

#include <Arduino.h>

// NTP はネットワークが前提。無線の無い無印 Pico では成立しないため対象外。

void setup() {
  Serial.begin(115200);
  Serial.println("ntp is out of scope for pico");
}

void loop() {
  delay(1000);
}
