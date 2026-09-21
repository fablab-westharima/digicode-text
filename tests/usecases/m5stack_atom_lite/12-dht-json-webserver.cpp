// @board m5stack_atom_lite
// @lib adafruit/DHT sensor library@1.4.7
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib bblanchon/ArduinoJson@7.4.3
// @desc コア同梱 WebServer で DHT22 の値を JSON API として返し、設定を POST で受ける

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint8_t DHT_PIN = 21;

DHT dht(DHT_PIN, DHT22);
WebServer server(80);

static float lastTemp = NAN;
static float lastHumidity = NAN;
static uint32_t lastSample = 0;
static uint32_t sampleIntervalMs = 3000;

static void sample() {
  const float h = dht.readHumidity();
  const float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    lastHumidity = h;
    lastTemp = t;
  }
}

static void handleReadings() {
  JsonDocument doc;
  doc["uptimeMs"] = millis();
  doc["intervalMs"] = sampleIntervalMs;
  doc["rssi"] = WiFi.RSSI();
  JsonObject dhtObj = doc["dht22"].to<JsonObject>();
  if (isnan(lastTemp)) {
    dhtObj["valid"] = false;
  } else {
    dhtObj["valid"] = true;
    dhtObj["temperatureC"] = lastTemp;
    dhtObj["humidity"] = lastHumidity;
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
  server.send(200, "application/json", "{\"ok\":true}");
}

static void handleNotFound() {
  String message = "not found: ";
  message += server.uri();
  server.send(404, "text/plain", message);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.localIP());

  server.on("/api/readings", HTTP_GET, handleReadings);
  server.on("/api/config", handleConfig);
  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", "<html><body><h1>ATOM Lite</h1><a href=\"/api/readings\">readings</a></body></html>");
  });
  server.onNotFound(handleNotFound);
  server.begin();
}

void loop() {
  server.handleClient();
  const uint32_t now = millis();
  if (now - lastSample >= sampleIntervalMs) {
    lastSample = now;
    sample();
  }
}
