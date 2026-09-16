// @board wio_node
// @lib adafruit/DHT sensor library@1.4.7
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ESP8266WebServer で DHT22 の値を JSON API として返す

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <DHT.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint8_t DHT_PIN = 12;
static const uint8_t GROVE_POWER = 15;

DHT dht(DHT_PIN, DHT22);
ESP8266WebServer server(80);

static float lastTemp = NAN;
static float lastHumidity = NAN;
static uint32_t lastSample = 0;
static uint32_t sampleIntervalMs = 3000;

static void handleReadings() {
  JsonDocument doc;
  doc["uptimeMs"] = millis();
  doc["intervalMs"] = sampleIntervalMs;
  doc["heap"] = ESP.getFreeHeap();
  doc["rssi"] = WiFi.RSSI();
  JsonObject sensor = doc["dht22"].to<JsonObject>();
  if (isnan(lastTemp)) {
    sensor["valid"] = false;
  } else {
    sensor["valid"] = true;
    sensor["temperatureC"] = lastTemp;
    sensor["humidity"] = lastHumidity;
  }
  String body;
  serializeJson(doc, body);
  server.send(200, "application/json", body);
}

static void handleConfig() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"POST only\"}");
    return;
  }
  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    server.send(400, "application/json", "{\"error\":\"bad json\"}");
    return;
  }
  sampleIntervalMs = doc["intervalMs"] | sampleIntervalMs;
  if (sampleIntervalMs < 2500) sampleIntervalMs = 2500;
  if (doc["grovePower"].is<bool>()) digitalWrite(GROVE_POWER, doc["grovePower"] ? HIGH : LOW);
  server.send(200, "application/json", "{\"ok\":true}");
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);
  dht.begin();

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.localIP());

  server.on("/api/readings", HTTP_GET, handleReadings);
  server.on("/api/config", handleConfig);
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", F("<html><body><h1>Wio Node</h1><a href='/api/readings'>readings</a></body></html>"));
  });
  server.onNotFound([]() { server.send(404, "text/plain", "not found"); });
  server.begin();
}

void loop() {
  server.handleClient();
  const uint32_t now = millis();
  if (now - lastSample < sampleIntervalMs) return;
  lastSample = now;
  const float h = dht.readHumidity();
  const float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    lastHumidity = h;
    lastTemp = t;
  }
}
