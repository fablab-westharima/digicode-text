// @board wio_node
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @desc Grove 端子の 1-Wire バスで DS18B20 を列挙し温度を読む

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

static const uint8_t ONE_WIRE_PIN = 12; // Wio Node D6 = GPIO12
static const uint8_t GROVE_POWER = 15;

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
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(200);

  sensors.begin();
  deviceCount = sensors.getDeviceCount();
  Serial.printf("devices=%u parasite=%d\n", deviceCount, sensors.isParasitePowerMode() ? 1 : 0);

  DeviceAddress addr;
  for (uint8_t i = 0; i < deviceCount; i++) {
    if (!sensors.getAddress(addr, i)) continue;
    Serial.print(i);
    Serial.print(": ");
    printAddress(addr);
    Serial.println();
    sensors.setResolution(addr, 12);
  }
}

void loop() {
  sensors.requestTemperatures();
  for (uint8_t i = 0; i < deviceCount; i++) {
    const float c = sensors.getTempCByIndex(i);
    if (c == DEVICE_DISCONNECTED_C) Serial.printf("sensor %u: disconnected\n", i);
    else Serial.printf("sensor %u: %.2fC\n", i, c);
  }
  if (deviceCount == 0) Serial.println("no DS18B20 on the bus");
  delay(2000);
}
