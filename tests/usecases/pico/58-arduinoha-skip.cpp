// @board pico
// @lib dawidchyrzynski/home-assistant-integration@2.1.0
// @skip 対象外: ArduinoHA は HAMqtt に Client& を渡す設計で、Raspberry Pi Pico には TCP を張る手段が無い
// @desc 参考: Home Assistant への自動登録は ESP 系 board のケース (52 / 53) で見る

#include <Arduino.h>

// HAMqtt(Client&, HADevice&) は Client 実装を受け取るだけなので、ダミーの Client を
// 書けば形式上は compile できてしまう。しかし Raspberry Pi Pico には無線も Ethernet も無く、
// 実機で接続できない構成を ok として残すことになるため対象外にする。
//
// discovery payload を組み立てる処理自体は 40-modbus-ha-discovery-json.cpp で
// Serial 出力として検証している。

static const char* INTENDED_DEVICE_ID = "digicode-pico";

void setup() {
  Serial.begin(115200);
  Serial.print("arduinoha is out of scope for pico; intended device id=");
  Serial.println(INTENDED_DEVICE_ID);
}

void loop() {
  delay(1000);
}
