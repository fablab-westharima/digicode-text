// @board wio_node
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc BME280 を LWT 付き MQTT で publish する ESP8266 環境モニタ

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const char* TOPIC_ENV = "digicode/wio-node/env";
static const char* TOPIC_STATUS = "digicode/wio-node/env/status";
static const uint8_t GROVE_POWER = 15;

Adafruit_BME280 bme;
WiFiClient net;
PubSubClient mqtt(net);

static bool sensorReady = false;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static bool ensureLink() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    const uint32_t deadline = millis() + 6000;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(200);
    if (WiFi.status() != WL_CONNECTED) return false;
  }
  if (!mqtt.connected()) {
    String id = "wio-env-";
    id += String(ESP.getChipId(), HEX);
    if (!mqtt.connect(id.c_str(), TOPIC_STATUS, 1, true, "offline")) return false;
    mqtt.publish(TOPIC_STATUS, "online", true);
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  Wire.begin(4, 5);
  sensorReady = bme.begin(0x76, &Wire);
  if (sensorReady) {
    bme.setSampling(Adafruit_BME280::MODE_NORMAL,
                    Adafruit_BME280::SAMPLING_X2,
                    Adafruit_BME280::SAMPLING_X16,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::FILTER_X16,
                    Adafruit_BME280::STANDBY_MS_500);
  }
  WiFi.persistent(false);
  mqtt.setServer(MQTT_HOST, 1883);
  mqtt.setBufferSize(512);
}

void loop() {
  if (!ensureLink()) {
    delay(2000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPublish < 10000) return;
  lastPublish = now;

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = now;
  doc["rssi"] = WiFi.RSSI();
  doc["heap"] = ESP.getFreeHeap();
  doc["sensor"] = sensorReady ? "bme280" : "none";
  if (sensorReady) {
    doc["temperatureC"] = bme.readTemperature();
    doc["pressureHpa"] = bme.readPressure() / 100.0;
    doc["humidity"] = bme.readHumidity();
  }

  char payload[352];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(TOPIC_ENV, (const uint8_t*)payload, n, false);
  Serial.println(payload);
}
