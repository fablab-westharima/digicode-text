// @board xiao_rp2040
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @desc 1 本のバスに繋いだ複数の DS18B20 を分解能 12bit で読み、断線を検出する

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

static const uint8_t ONEWIRE_PIN = 29;  // D3 / GP29

OneWire oneWire(ONEWIRE_PIN);
DallasTemperature sensors(&oneWire);
static uint8_t deviceCount = 0;

void setup() {
  Serial.begin(115200);
  delay(200);

  sensors.begin();
  deviceCount = sensors.getDeviceCount();
  sensors.setResolution(12);
  sensors.setWaitForConversion(true);

  Serial.print("devices=");
  Serial.print(deviceCount);
  Serial.print(" parasite=");
  Serial.println(sensors.isParasitePowerMode() ? "yes" : "no");

  for (uint8_t i = 0; i < deviceCount; i++) {
    DeviceAddress addr;
    if (!sensors.getAddress(addr, i)) continue;
    Serial.print("  #");
    Serial.print(i);
    Serial.print(" rom=");
    for (uint8_t b = 0; b < 8; b++) {
      if (addr[b] < 16) Serial.print('0');
      Serial.print(addr[b], HEX);
    }
    Serial.println();
  }
}

void loop() {
  sensors.requestTemperatures();

  for (uint8_t i = 0; i < deviceCount; i++) {
    const float c = sensors.getTempCByIndex(i);
    Serial.print("sensor");
    Serial.print(i);
    Serial.print("=");
    if (c == DEVICE_DISCONNECTED_C) {
      Serial.println("disconnected");
    } else {
      Serial.print(c, 2);
      Serial.print("C / ");
      Serial.print(DallasTemperature::toFahrenheit(c), 2);
      Serial.println("F");
    }
  }
  delay(2000);
}
