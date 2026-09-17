// @board xiao_rp2040
// @lib arduino-libraries/NTPClient@3.2.1
// @skip 対象外: NTPClient は UDP 実装を要求する。XIAO RP2040 には UDP を張る手段が無い
// @desc 参考: NTP での時刻取得は xiao_esp32c3 / wio_node の 56 / 57 / 58 で見る

#include <Arduino.h>

// NTPClient のコンストラクタは UDP& を取るだけなので、ダミーの UDP 実装を書けば
// 形式上は compile できてしまう。しかし XIAO RP2040 にはネットワークが無く、
// 実機で時刻を取れない構成を ok として残すことになるため対象外にする。
//
// この board で時刻を持つなら RTC (DS3231) を使う。22-rtclib-ds3231.cpp を見る。

static const char* INTENDED_POOL = "ntp.nict.jp";

void setup() {
  Serial.begin(115200);
  Serial.print("ntp is out of scope for xiao_rp2040; intended pool=");
  Serial.println(INTENDED_POOL);
}

void loop() {
  delay(1000);
}
