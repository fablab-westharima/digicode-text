// @board xiao_rp2040
// @lib adafruit/DHT sensor library@1.4.7
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @desc DHT22 を Unified Sensor API で読み、センサ情報と最短取得間隔を守って表示する

#include <Arduino.h>
#include <DHT.h>
#include <DHT_U.h>

static const uint8_t DHT_PIN = 2;  // D8 / GP2

DHT_Unified dht(DHT_PIN, DHT22);
static uint32_t delayMs = 2000;

void setup() {
  Serial.begin(115200);
  delay(200);
  dht.begin();

  sensor_t sensor;
  dht.temperature().getSensor(&sensor);
  Serial.print("sensor=");
  Serial.print(sensor.name);
  Serial.print(" range=");
  Serial.print(sensor.min_value);
  Serial.print("..");
  Serial.print(sensor.max_value);
  Serial.print(" resolution=");
  Serial.println(sensor.resolution);

  // ライブラリが要求する最短間隔 (us) を ms に直して守る。
  delayMs = sensor.min_delay / 1000;
  if (delayMs < 2000) delayMs = 2000;
}

void loop() {
  sensors_event_t event;

  dht.temperature().getEvent(&event);
  if (isnan(event.temperature)) {
    Serial.println("temperature read failed");
  } else {
    Serial.print("tempC=");
    Serial.print(event.temperature, 1);
  }

  dht.humidity().getEvent(&event);
  if (isnan(event.relative_humidity)) {
    Serial.println(" humidity read failed");
  } else {
    Serial.print(" rh=");
    Serial.println(event.relative_humidity, 1);
  }

  delay(delayMs);
}
