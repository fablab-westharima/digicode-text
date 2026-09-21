// @board m5stack_atoms3
// @lib adafruit/Adafruit MAX31855 library@1.4.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc MAX31855 の熱電対温度を移動平均して JSON にし、MQTT へ publish

#include <Arduino.h>
#include <WiFi.h>
#include <Adafruit_MAX31855.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* TOPIC_TELEMETRY = "digicode/atoms3/thermocouple";
static const char* TOPIC_COMMAND = "digicode/atoms3/thermocouple/set";

static const int8_t MAX_CLK = 5;
static const int8_t MAX_CS = 38;
static const int8_t MAX_DO = 6;
static const size_t WINDOW = 8;

Adafruit_MAX31855 thermocouple(MAX_CLK, MAX_CS, MAX_DO);
WiFiClient net;
PubSubClient mqtt(net);

static float window[WINDOW];
static size_t filled = 0;
static size_t cursor = 0;
static uint32_t publishIntervalMs = 5000;
static float alarmC = 300.0f;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;
static bool ready = false;

static void onCommand(char* topic, uint8_t* payload, unsigned int length) {
  (void)topic;
  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) return;
  publishIntervalMs = doc["intervalMs"] | publishIntervalMs;
  if (publishIntervalMs < 1000) publishIntervalMs = 1000;
  alarmC = doc["alarmC"] | alarmC;
}

static void push(float value) {
  window[cursor] = value;
  cursor = (cursor + 1) % WINDOW;
  if (filled < WINDOW) filled++;
}

static float average() {
  if (filled == 0) return NAN;
  float sum = 0;
  for (size_t i = 0; i < filled; i++) sum += window[i];
  return sum / (float)filled;
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
    String id = "atoms3-tc-";
    id += String((uint32_t)ESP.getEfuseMac(), HEX);
    if (!mqtt.connect(id.c_str())) return false;
    mqtt.subscribe(TOPIC_COMMAND);
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  ready = thermocouple.begin();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onCommand);
  mqtt.setBufferSize(512);
}

void loop() {
  if (!ensureLink()) {
    delay(2000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPublish < publishIntervalMs) return;
  lastPublish = now;

  const uint8_t error = ready ? thermocouple.readError() : 0xFF;
  const double celsius = error ? NAN : thermocouple.readCelsius();
  if (!isnan(celsius)) push((float)celsius);

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = now;
  doc["ready"] = ready;
  doc["error"] = error;
  doc["samples"] = filled;
  if (!isnan(celsius)) doc["temperatureC"] = celsius;
  const float avg = average();
  if (!isnan(avg)) {
    doc["averageC"] = avg;
    doc["alarm"] = avg > alarmC;
  }
  doc["internalC"] = ready ? thermocouple.readInternal() : 0.0;

  char payload[320];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(TOPIC_TELEMETRY, (const uint8_t*)payload, n, false);
  Serial.println(payload);
}
