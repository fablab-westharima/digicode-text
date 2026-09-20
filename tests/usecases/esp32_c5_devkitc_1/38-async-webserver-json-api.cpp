// @board esp32_c5_devkitc_1
// @lib ESP32Async/ESPAsyncWebServer@3.12.1
// @lib ESP32Async/AsyncTCP@3.5.0
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ESPAsyncWebServer で GPIO 制御の JSON API (GET/POST body) を非同期に提供

#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

// 汎用の GPIO0 / GPIO7 / GPIO25 と、汎用ピン
// (GPIO23) を出力ピンにする。
static const uint8_t OUTPUT_PINS[] = { 0, 7, 25, 23 };
static const size_t OUTPUT_COUNT = sizeof(OUTPUT_PINS) / sizeof(OUTPUT_PINS[0]);

AsyncWebServer server(80);
static uint32_t requestCount = 0;

static bool isManaged(uint8_t pin) {
  for (size_t i = 0; i < OUTPUT_COUNT; i++) {
    if (OUTPUT_PINS[i] == pin) return true;
  }
  return false;
}

static String statusJson() {
  JsonDocument doc;
  doc["node"] = "c5-devkitc";
  doc["uptimeMs"] = millis();
  doc["heap"] = ESP.getFreeHeap();
  doc["rssi"] = WiFi.RSSI();
  doc["requests"] = requestCount;
  JsonObject pins = doc["pins"].to<JsonObject>();
  for (size_t i = 0; i < OUTPUT_COUNT; i++) {
    pins[String(OUTPUT_PINS[i])] = digitalRead(OUTPUT_PINS[i]) == HIGH;
  }
  String out;
  serializeJson(doc, out);
  return out;
}

static void sendError(AsyncWebServerRequest* request, int code, const char* message) {
  JsonDocument doc;
  doc["ok"] = false;
  doc["error"] = message;
  String out;
  serializeJson(doc, out);
  request->send(code, "application/json", out);
}

static void handleSetBody(AsyncWebServerRequest* request, uint8_t* data, size_t len,
                          size_t index, size_t total) {
  if (index != 0 || len != total) {
    sendError(request, 413, "chunked body not supported");
    return;
  }
  JsonDocument doc;
  if (deserializeJson(doc, data, len)) {
    sendError(request, 400, "invalid json");
    return;
  }
  const uint8_t pin = doc["pin"] | 255;
  if (!isManaged(pin)) {
    sendError(request, 400, "pin not managed");
    return;
  }
  const bool value = doc["value"] | false;
  digitalWrite(pin, value ? HIGH : LOW);
  request->send(200, "application/json", statusJson());
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
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.print("ip ");
  Serial.println(WiFi.localIP());

  server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest* request) {
    requestCount++;
    request->send(200, "application/json", statusJson());
  });

  server.on("/api/toggle", HTTP_GET, [](AsyncWebServerRequest* request) {
    requestCount++;
    if (!request->hasParam("pin")) {
      sendError(request, 400, "pin required");
      return;
    }
    auto* param = request->getParam("pin");
    const uint8_t pin = (uint8_t)param->value().toInt();
    if (!isManaged(pin)) {
      sendError(request, 400, "pin not managed");
      return;
    }
    digitalWrite(pin, digitalRead(pin) == HIGH ? LOW : HIGH);
    request->send(200, "application/json", statusJson());
  });

  server.on("/api/set", HTTP_POST,
            [](AsyncWebServerRequest* request) { requestCount++; },
            NULL, handleSetBody);

  server.onNotFound([](AsyncWebServerRequest* request) {
    sendError(request, 404, "not found");
  });

  server.begin();
  Serial.println("async server started");
}

void loop() {
  delay(1000);
}
