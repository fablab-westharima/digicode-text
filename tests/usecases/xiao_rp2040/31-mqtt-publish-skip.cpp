// @board xiao_rp2040
// @skip 対象外: MQTT は WiFi 前提。RP2040 単体では Client を用意できない
// @desc 参考: PubSubClient は Client 実装を渡せば compile は通るが、この board では現実的でない

#include <Arduino.h>

// PubSubClient(knolleary) は Client& を受け取るだけなので、形式上は無線が無くても
// compile できてしまう。しかし XIAO RP2040 単体には TCP を張る手段が無く、
// 実機で動かない構成を ok として残すことになるため対象外にする。
// なお現状 knolleary/PubSubClient は /libraries/details が 502 になり compile まで届かない。

void setup() {
  Serial.begin(115200);
  Serial.println("mqtt is out of scope for xiao_rp2040");
}

void loop() {
  delay(1000);
}
