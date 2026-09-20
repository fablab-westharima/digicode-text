// @board espr_developer_c5
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@3.11.0
// @desc 同じ DS18B20 コードを旧版 DallasTemperature 3.11.0 で build できるか確かめる

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

static const uint8_t ONE_WIRE_PIN = 0;

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);
DeviceAddress firstSensor;
static bool haveFirst = false;

void setup() {
  Serial.begin(115200);
  delay(200);
  sensors.begin();
  haveFirst = sensors.getAddress(firstSensor, 0);
  if (haveFirst) {
    sensors.setResolution(firstSensor, 11);
    Serial.print("resolution=");
    Serial.println(sensors.getResolution(firstSensor));
  } else {
    Serial.println("no sensor at index 0");
  }
  sensors.setWaitForConversion(false);
}

void loop() {
  sensors.requestTemperatures();
  delay(750); // 11bit 変換待ち
  if (haveFirst) {
    const float c = sensors.getTempC(firstSensor);
    Serial.print("tempC=");
    Serial.println(c, 3);
  } else {
    Serial.print("indexed tempC=");
    Serial.println(sensors.getTempCByIndex(0), 3);
  }
  delay(1500);
}
