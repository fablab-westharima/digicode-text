// @board esp32_c5_devkitc_1
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @desc 1-Wire バス上の DS18B20 を列挙し、分解能を設定して温度を読む

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

static const uint8_t ONE_WIRE_PIN = 0; // ESP32-C5-DevKitC-1: 汎用の GPIO0 を使う

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

static uint8_t deviceCount = 0;

static void printAddress(const DeviceAddress addr) {
  for (uint8_t i = 0; i < 8; i++) {
    if (addr[i] < 16) Serial.print('0');
    Serial.print(addr[i], HEX);
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);

  sensors.begin();
  deviceCount = sensors.getDeviceCount();
  Serial.print("devices: ");
  Serial.println(deviceCount);
  Serial.print("parasite power: ");
  Serial.println(sensors.isParasitePowerMode() ? "on" : "off");

  DeviceAddress addr;
  for (uint8_t i = 0; i < deviceCount; i++) {
    if (!sensors.getAddress(addr, i)) continue;
    Serial.print(i);
    Serial.print(": ");
    printAddress(addr);
    Serial.println();
    sensors.setResolution(addr, 12);
  }
  sensors.setWaitForConversion(true);
}

void loop() {
  sensors.requestTemperatures();
  for (uint8_t i = 0; i < deviceCount; i++) {
    const float c = sensors.getTempCByIndex(i);
    Serial.print("sensor ");
    Serial.print(i);
    Serial.print(": ");
    if (c == DEVICE_DISCONNECTED_C) Serial.println("disconnected");
    else {
      Serial.print(c, 2);
      Serial.print("C / ");
      Serial.print(DallasTemperature::toFahrenheit(c), 2);
      Serial.println("F");
    }
  }
  if (deviceCount == 0) Serial.println("no DS18B20 on the bus");
  delay(2000);
}
