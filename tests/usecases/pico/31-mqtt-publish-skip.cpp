// @board pico
// @skip 対象外: MQTT は WiFi 前提。無印 Pico では Client を用意できない
// @desc 参考: PubSubClient は Client 実装を渡せば compile は通るが、この board では現実的でない

#include <Arduino.h>

// PubSubClient(knolleary) は Client& を受け取るだけなので形式上は compile できるが、
// 無印 Pico には TCP を張る手段が無い。実機で動かない構成を ok として残さないため対象外。
// なお現状 knolleary/PubSubClient は /libraries/details が 502 になり compile まで届かない。

void setup() {
  Serial.begin(115200);
  Serial.println("mqtt is out of scope for pico");
}

void loop() {
  delay(1000);
}
