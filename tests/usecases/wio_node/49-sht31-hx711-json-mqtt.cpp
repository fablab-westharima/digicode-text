// @board wio_node
// @lib adafruit/Adafruit SHT31 Library@2.2.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib bogde/HX711@0.7.5
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc PORT1 の SHT31 と PORT0 の HX711 を 1 つの JSON にまとめて MQTT へ送る

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <HX711.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* TOPIC_TELEMETRY = "digicode/wio-node/bench";
static const char* TOPIC_COMMAND = "digicode/wio-node/bench/set";

static const uint8_t GROVE_POWER = 15;
static const int LOADCELL_DOUT_PIN = 12; // Wio Node D6
static const int LOADCELL_SCK_PIN = 13;  // Wio Node D7
static const uint8_t SHT31_ADDR = 0x44;

Adafruit_SHT31 sht31;
HX711 scale;
WiFiClient net;
PubSubClient mqtt(net);

static bool sensorReady = false;
static float calibration = 420.0f;
static uint32_t publishIntervalMs = 5000;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static void onCommand(char* topic, uint8_t* payload, unsigned int length) {
  (void)topic;
  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) return;
  publishIntervalMs = doc["intervalMs"] | publishIntervalMs;
  if (publishIntervalMs < 1000) publishIntervalMs = 1000;
  if (doc["calibration"].is<float>()) {
    calibration = doc["calibration"];
    scale.set_scale(calibration);
  }
  if (doc["tare"] | false) {
    scale.tare();
    Serial.println("tare done");
  }
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
    String id = "wio-bench-";
    id += String(ESP.getChipId(), HEX);
    if (!mqtt.connect(id.c_str())) return false;
    mqtt.subscribe(TOPIC_COMMAND);
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(400);

  Wire.begin(4, 5);
  sensorReady = sht31.begin(SHT31_ADDR);
  Serial.println(sensorReady ? "sht31 ready" : "sht31 missing");

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(calibration);
  if (scale.is_ready()) scale.tare();
  else Serial.println("HX711 not responding");

  WiFi.persistent(false);
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

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = now;
  doc["heap"] = ESP.getFreeHeap();
  doc["rssi"] = WiFi.RSSI();

  if (sensorReady) {
    const float t = sht31.readTemperature();
    const float h = sht31.readHumidity();
    if (!isnan(t)) doc["temperatureC"] = t;
    if (!isnan(h)) doc["humidityPct"] = h;
  }

  JsonObject load = doc["load"].to<JsonObject>();
  load["ready"] = scale.is_ready();
  load["calibration"] = calibration;
  if (scale.is_ready()) {
    load["grams"] = scale.get_units(5);
    load["raw"] = scale.read();
  }

  char payload[384];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(TOPIC_TELEMETRY, (const uint8_t*)payload, n, false);
  Serial.println(payload);
  yield();
}
