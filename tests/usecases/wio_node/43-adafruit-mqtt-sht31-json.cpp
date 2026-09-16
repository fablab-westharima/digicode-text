// @board wio_node
// @lib adafruit/Adafruit SHT31 Library@2.2.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib bblanchon/ArduinoJson@7.4.3
// @lib adafruit/Adafruit MQTT Library@2.6.6
// @desc PORT1 (GPIO4/5) の SHT31 を読み、JSON を Adafruit MQTT Library で publish

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <ArduinoJson.h>
#include <Adafruit_MQTT.h>
#include <Adafruit_MQTT_Client.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* MQTT_CLIENT_ID = "wio-node-sht31";
static const char* MQTT_USER = "digicode";
static const char* MQTT_PASS = "not-a-real-key";
static const char* TOPIC_TELEMETRY = "digicode/wio-node/sht31";
static const char* TOPIC_COMMAND = "digicode/wio-node/sht31/set";

static const uint8_t GROVE_POWER = 15;
static const uint8_t SHT31_ADDR = 0x44;

WiFiClient net;
Adafruit_SHT31 sht31;
Adafruit_MQTT_Client mqtt(&net, MQTT_HOST, MQTT_PORT, MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS);
Adafruit_MQTT_Publish telemetry(&mqtt, TOPIC_TELEMETRY);
Adafruit_MQTT_Subscribe command(&mqtt, TOPIC_COMMAND);

static bool sensorReady = false;
static uint32_t publishIntervalMs = 5000;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;
static float humidityAlarm = 80.0f;

static void applyCommand(const char* body) {
  JsonDocument doc;
  if (deserializeJson(doc, body)) {
    Serial.println("bad command json");
    return;
  }
  publishIntervalMs = doc["intervalMs"] | publishIntervalMs;
  if (publishIntervalMs < 1000) publishIntervalMs = 1000;
  humidityAlarm = doc["humidityAlarm"] | humidityAlarm;
  if (doc["heater"].is<bool>()) sht31.heater(doc["heater"]);
}

static bool ensureLink() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    const uint32_t deadline = millis() + 8000;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
    if (WiFi.status() != WL_CONNECTED) return false;
  }
  if (!mqtt.connected()) {
    const int8_t ret = mqtt.connect();
    if (ret != 0) {
      Serial.println(mqtt.connectErrorString(ret));
      mqtt.disconnect();
      return false;
    }
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  Wire.begin(4, 5); // Wio Node PORT1: SDA=GPIO4 SCL=GPIO5
  sensorReady = sht31.begin(SHT31_ADDR);
  Serial.println(sensorReady ? "sht31 ready" : "sht31 missing");

  WiFi.persistent(false);
  mqtt.subscribe(&command);
}

void loop() {
  if (!ensureLink()) {
    delay(2000);
    return;
  }

  Adafruit_MQTT_Subscribe* subscription;
  while ((subscription = mqtt.readSubscription(100))) {
    if (subscription == &command) applyCommand((char*)command.lastread);
  }

  const uint32_t now = millis();
  if (now - lastPublish < publishIntervalMs) return;
  lastPublish = now;

  const float t = sensorReady ? sht31.readTemperature() : NAN;
  const float h = sensorReady ? sht31.readHumidity() : NAN;

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = now;
  doc["heap"] = ESP.getFreeHeap();
  doc["ready"] = sensorReady;
  doc["heater"] = sensorReady ? sht31.isHeaterEnabled() : false;
  if (!isnan(t)) doc["temperatureC"] = t;
  if (!isnan(h)) {
    doc["humidityPct"] = h;
    doc["alarm"] = h > humidityAlarm;
  }

  char payload[256];
  serializeJson(doc, payload, sizeof(payload));
  if (!telemetry.publish(payload)) Serial.println("publish failed");
  else Serial.println(payload);
}
