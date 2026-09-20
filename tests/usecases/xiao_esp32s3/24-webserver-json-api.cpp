// @board xiao_esp32s3
// @lib bblanchon/ArduinoJson@7.4.3
// @desc コア同梱 WebServer だけで GPIO 制御の JSON API を作り、GET/POST/DELETE を扱う

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

// XIAO ESP32S3 の安全に使える出力ピン (パッドに出ている D0=GPIO1 から D3=GPIO4)
static const uint8_t OUTPUT_PINS[] = { 1, 2, 3, 4 };
static const size_t OUTPUT_COUNT = sizeof(OUTPUT_PINS) / sizeof(OUTPUT_PINS[0]);

WebServer server(80);
static uint32_t requestCount = 0;

static bool isManaged(uint8_t pin) {
  for (size_t i = 0; i < OUTPUT_COUNT; i++) if (OUTPUT_PINS[i] == pin) return true;
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
  JsonArray pins = doc["pins"].to<JsonArray>();
  for (size_t i = 0; i < OUTPUT_COUNT; i++) {
    JsonObject p = pins.add<JsonObject>();
    p["gpio"] = OUTPUT_PINS[i];
    p["level"] = digitalRead(OUTPUT_PINS[i]);
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
  const bool level = body["level"] | false;
  if (!isManaged(gpio)) {
    JsonDocument err;
    err["error"] = "gpio not managed";
    err["gpio"] = gpio;
    sendJson(422, err);
    return;
  }
  digitalWrite(gpio, level ? HIGH : LOW);
  JsonDocument ok;
  ok["gpio"] = gpio;
  ok["level"] = level;
  sendJson(200, ok);
}

static void handleReset() {
  requestCount++;
  for (size_t i = 0; i < OUTPUT_COUNT; i++) digitalWrite(OUTPUT_PINS[i], LOW);
  JsonDocument doc;
  doc["reset"] = true;
  doc["count"] = (uint32_t)OUTPUT_COUNT;
  sendJson(200, doc);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  for (size_t i = 0; i < OUTPUT_COUNT; i++) {
    pinMode(OUTPUT_PINS[i], OUTPUT);
    digitalWrite(OUTPUT_PINS[i], LOW);
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.localIP());

  server.on("/api/pins", HTTP_GET, handlePins);
  server.on("/api/pins", HTTP_POST, handleSetPin);
  server.on("/api/pins", HTTP_DELETE, handleReset);
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
  delay(2);
}
