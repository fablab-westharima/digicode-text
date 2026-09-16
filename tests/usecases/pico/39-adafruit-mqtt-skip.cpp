// @board pico
// @lib adafruit/Adafruit MQTT Library@2.6.6
// @skip 対象外: Adafruit_MQTT_Client は Client& を要求するが無印 Pico に TCP 手段が無い
// @desc 参考: Home Assistant 連携の publish 先は ESP 系 board のケースで見る

#include <Arduino.h>

// Adafruit_MQTT_Client のコンストラクタは Client* を取るだけなので、ダミーの Client を
// 書けば形式上 compile できてしまう。しかし無印 Pico (Pico W ではない) には無線も
// Ethernet も無く、実機で接続できない構成を ok として残すことになるため対象外にする。
//
// 同じ payload を作る処理自体は 40-modbus-ha-discovery-json.cpp で Serial 出力として
// 検証している。MQTT へ実際に流す経路は xiao_esp32c3 / wio_node 側で見る。

static const char* DISCOVERY_TOPIC = "homeassistant/sensor/pico_temp/config";

void setup() {
  Serial.begin(115200);
  Serial.print("mqtt is out of scope for pico; intended topic=");
  Serial.println(DISCOVERY_TOPIC);
}

void loop() {
  delay(1000);
}
