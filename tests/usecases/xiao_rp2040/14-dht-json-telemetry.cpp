// @board xiao_rp2040
// @lib adafruit/DHT sensor library@1.4.7
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib bblanchon/ArduinoJson@7.4.3
// @desc DHT11 の温湿度と体感温度を JSON にして Serial へ出す

#include <Arduino.h>
#include <DHT.h>
#include <ArduinoJson.h>

static const uint8_t DHT_PIN = 2;  // D8 / GP2

DHT dht(DHT_PIN, DHT11);
static uint32_t failures = 0;

void setup() {
  Serial.begin(115200);
  delay(200);
  dht.begin();
  Serial.println("{\"ready\":true,\"sensor\":\"DHT11\"}");
}

void loop() {
  const float humidity = dht.readHumidity();
  const float tempC = dht.readTemperature();

  JsonDocument doc;
  doc["uptimeMs"] = millis();

  if (isnan(humidity) || isnan(tempC)) {
    failures++;
    doc["ok"] = false;
    doc["failures"] = failures;
  } else {
    doc["ok"] = true;
    doc["tempC"] = tempC;
    doc["tempF"] = dht.convertCtoF(tempC);
    doc["humidity"] = humidity;
    doc["heatIndexC"] = dht.computeHeatIndex(tempC, humidity, false);
    doc["failures"] = failures;
  }

  serializeJson(doc, Serial);
  Serial.println();
  delay(2000);
}
