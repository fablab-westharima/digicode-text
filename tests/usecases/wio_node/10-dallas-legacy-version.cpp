// @board wio_node
// @lib paulstoffregen/OneWire@2.3.7
// @lib milesburton/DallasTemperature@3.11.0
// @desc 旧版の OneWire 2.3.7 + DallasTemperature 3.11.0 が ESP8266 で build できるか確かめる

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

static const uint8_t ONE_WIRE_PIN = 12;
static const uint8_t GROVE_POWER = 15;

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);
DeviceAddress probe;
static bool haveProbe = false;

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(200);

  sensors.begin();
  haveProbe = sensors.getAddress(probe, 0);
  if (haveProbe) {
    sensors.setResolution(probe, 10);
    Serial.printf("resolution=%u\n", sensors.getResolution(probe));
  } else {
    Serial.println("no probe at index 0");
  }
  sensors.setWaitForConversion(false);
}

void loop() {
  sensors.requestTemperatures();
  delay(400); // 10bit は約 187ms、余裕を見て待つ
  const float c = haveProbe ? sensors.getTempC(probe) : sensors.getTempCByIndex(0);
  Serial.printf("tempC=%.3f connected=%d\n", c, haveProbe ? (sensors.isConnected(probe) ? 1 : 0) : -1);
  delay(1600);
}
