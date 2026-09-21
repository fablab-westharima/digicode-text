// @board m5stack_atom_lite
// @lib ESP32Async/ESPAsyncWebServer@3.12.1
// @lib ESP32Async/AsyncTCP@3.5.0
// @lib adafruit/Adafruit SHT31 Library@2.2.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib bblanchon/ArduinoJson@7.4.3
// @desc I2C の SHT31 を定期取得し、ESPAsyncWebServer の JSON API と履歴で返す

#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <Adafruit_SHT31.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint8_t SHT31_ADDR = 0x44;
static const size_t HISTORY = 12;

AsyncWebServer server(80);
Adafruit_SHT31 sht31;

static bool sensorReady = false;
static float temperature[HISTORY];
static float humidity[HISTORY];
static size_t writeIndex = 0;
static size_t samples = 0;
static uint32_t lastSample = 0;

static void sample() {
  const float t = sht31.readTemperature();
  const float h = sht31.readHumidity();
  if (isnan(t) || isnan(h)) {
    Serial.println("sht31 read failed");
    return;
  }
  temperature[writeIndex] = t;
  humidity[writeIndex] = h;
  writeIndex = (writeIndex + 1) % HISTORY;
  if (samples < HISTORY) samples++;
}

static String latestJson() {
  JsonDocument doc;
  doc["ready"] = sensorReady;
  doc["samples"] = samples;
  doc["uptimeMs"] = millis();
  doc["heater"] = sht31.isHeaterEnabled();
  if (samples > 0) {
    const size_t last = (writeIndex + HISTORY - 1) % HISTORY;
    doc["temperatureC"] = temperature[last];
    doc["humidityPct"] = humidity[last];
  }
  String out;
  serializeJson(doc, out);
  return out;
}

static String historyJson() {
  JsonDocument doc;
  JsonArray arr = doc["history"].to<JsonArray>();
  for (size_t i = 0; i < samples; i++) {
    const size_t idx = (writeIndex + HISTORY - samples + i) % HISTORY;
    JsonObject row = arr.add<JsonObject>();
    row["t"] = temperature[idx];
    row["h"] = humidity[idx];
  }
  String out;
  serializeJson(doc, out);
  return out;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin(26, 32); // ATOM Lite SDA=GPIO26 SCL=GPIO32
  sensorReady = sht31.begin(SHT31_ADDR);
  Serial.println(sensorReady ? "sht31 ready" : "sht31 missing");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.print("ip ");
  Serial.println(WiFi.localIP());

  server.on("/api/latest", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "application/json", latestJson());
  });
  server.on("/api/history", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "application/json", historyJson());
  });
  server.on("/api/heater", HTTP_GET, [](AsyncWebServerRequest* request) {
    bool on = false;
    if (request->hasParam("on")) {
      auto* param = request->getParam("on");
      on = param->value() == "1" || param->value() == "true";
    }
    sht31.heater(on);
    request->send(200, "application/json", latestJson());
  });
  server.begin();
}

void loop() {
  const uint32_t now = millis();
  if (sensorReady && now - lastSample >= 5000) {
    lastSample = now;
    sample();
  }
  delay(100);
}
