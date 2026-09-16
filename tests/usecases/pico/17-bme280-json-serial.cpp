// @board pico
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib bblanchon/ArduinoJson@7.4.3
// @desc BME280 を Unified Sensor の event で読み、JSON 1 行にして Serial へ出す

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>

Adafruit_BME280 bme;
static Adafruit_Sensor* tempSensor = nullptr;
static Adafruit_Sensor* humiditySensor = nullptr;
static Adafruit_Sensor* pressureSensor = nullptr;
static bool ready = false;

void setup() {
  Serial.begin(115200);
  Wire.begin();

  ready = bme.begin(0x76, &Wire);
  if (ready) {
    tempSensor = bme.getTemperatureSensor();
    humiditySensor = bme.getHumiditySensor();
    pressureSensor = bme.getPressureSensor();
  }
}

void loop() {
  JsonDocument doc;
  doc["uptimeMs"] = millis();
  doc["ok"] = ready;

  if (ready) {
    sensors_event_t event;

    tempSensor->getEvent(&event);
    doc["tempC"] = event.temperature;

    humiditySensor->getEvent(&event);
    doc["humidity"] = event.relative_humidity;

    pressureSensor->getEvent(&event);
    doc["pressureHPa"] = event.pressure;

    JsonObject meta = doc["meta"].to<JsonObject>();
    sensor_t info;
    tempSensor->getSensor(&info);
    meta["driver"] = info.name;
    meta["minDelayUs"] = info.min_delay;
  }

  serializeJson(doc, Serial);
  Serial.println();
  delay(2000);
}
