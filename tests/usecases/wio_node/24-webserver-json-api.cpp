// @board wio_node
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ESP8266WebServer だけで Grove ポートの GPIO を操作する JSON API を作る

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

// Wio Node: Grove に出ている GPIO12/13/14 と Grove 電源の GPIO15。
static const uint8_t MANAGED_PINS[] = { 12, 13, 14, 15 };
static const size_t MANAGED_COUNT = sizeof(MANAGED_PINS) / sizeof(MANAGED_PINS[0]);

ESP8266WebServer server(80);
static uint32_t requestCount = 0;

static bool isManaged(uint8_t pin) {
  for (size_t i = 0; i < MANAGED_COUNT; i++) if (MANAGED_PINS[i] == pin) return true;
  return false;
}

static void sendJson(int code, const JsonDocument& doc) {
  String body;
  serializeJson(doc, body);
  server.send(code, "application/json", body);
}

static void handlePins() {
  requestCount++;
  JsonDocument doc;
  doc["requests"] = requestCount;
  doc["uptimeMs"] = millis();
  doc["heap"] = ESP.getFreeHeap();
  JsonArray pins = doc["pins"].to<JsonArray>();
  for (size_t i = 0; i < MANAGED_COUNT; i++) {
    JsonObject p = pins.add<JsonObject>();
    p["gpio"] = MANAGED_PINS[i];
    p["level"] = digitalRead(MANAGED_PINS[i]);
  }
  sendJson(200, doc);
}

static void handleSetPin() {
  requestCount++;
  JsonDocument body;
  if (deserializeJson(body, server.arg("plain"))) {
    JsonDocument err;
    err["error"] = "invalid json";
    sendJson(400, err);
    return;
  }
  const uint8_t gpio = body["gpio"] | 255;
  if (!isManaged(gpio)) {
    JsonDocument err;
    err["error"] = "gpio not managed";
    err["gpio"] = gpio;
    sendJson(422, err);
    return;
  }
  const bool level = body["level"] | false;
  digitalWrite(gpio, level ? HIGH : LOW);
  JsonDocument ok;
  ok["gpio"] = gpio;
  ok["level"] = digitalRead(gpio);
  sendJson(200, ok);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  for (size_t i = 0; i < MANAGED_COUNT; i++) {
    pinMode(MANAGED_PINS[i], OUTPUT);
    digitalWrite(MANAGED_PINS[i], MANAGED_PINS[i] == 15 ? HIGH : LOW);
  }

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.localIP());

  server.on("/api/pins", HTTP_GET, handlePins);
  server.on("/api/pins", HTTP_POST, handleSetPin);
  server.on("/api/pins", HTTP_DELETE, []() {
    for (size_t i = 0; i < MANAGED_COUNT; i++) {
      if (MANAGED_PINS[i] != 15) digitalWrite(MANAGED_PINS[i], LOW);
    }
    JsonDocument doc;
    doc["reset"] = true;
    sendJson(200, doc);
  });
  server.onNotFound([]() {
    JsonDocument doc;
    doc["error"] = "not found";
    doc["uri"] = server.uri();
    sendJson(404, doc);
  });
  server.begin();
}

void loop() {
  server.handleClient();
}
