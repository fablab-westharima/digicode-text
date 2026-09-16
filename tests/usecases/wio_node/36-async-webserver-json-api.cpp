// @board wio_node
// @lib ESP32Async/ESPAsyncWebServer@3.12.1
// @lib ESP32Async/ESPAsyncTCP@2.0.0
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ESP8266 で ESPAsyncWebServer を使い Grove 電源と GPIO を JSON API で操作する

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

static const uint8_t GROVE_POWER = 15;
static const uint8_t MANAGED_PINS[] = { 12, 13, 14 };
static const size_t MANAGED_COUNT = sizeof(MANAGED_PINS) / sizeof(MANAGED_PINS[0]);

AsyncWebServer server(80);
static uint32_t requestCount = 0;

static bool isManaged(uint8_t pin) {
  for (size_t i = 0; i < MANAGED_COUNT; i++) {
    if (MANAGED_PINS[i] == pin) return true;
  }
  return false;
}

static String statusJson() {
  JsonDocument doc;
  doc["node"] = "wio-node";
  doc["uptimeMs"] = millis();
  doc["heap"] = ESP.getFreeHeap();
  doc["rssi"] = WiFi.RSSI();
  doc["a0"] = analogRead(A0);
  doc["grovePower"] = digitalRead(GROVE_POWER) == HIGH;
  doc["requests"] = requestCount;
  JsonObject pins = doc["pins"].to<JsonObject>();
  for (size_t i = 0; i < MANAGED_COUNT; i++) {
    pins[String(MANAGED_PINS[i])] = digitalRead(MANAGED_PINS[i]) == HIGH;
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
  if (doc["grovePower"].is<bool>()) {
    digitalWrite(GROVE_POWER, doc["grovePower"] ? HIGH : LOW);
  }
  if (doc["pin"].is<int>()) {
    const uint8_t pin = doc["pin"];
    if (!isManaged(pin)) {
      sendError(request, 400, "pin not managed");
      return;
    }
    digitalWrite(pin, (doc["value"] | false) ? HIGH : LOW);
  }
  request->send(200, "application/json", statusJson());
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  for (size_t i = 0; i < MANAGED_COUNT; i++) {
    pinMode(MANAGED_PINS[i], OUTPUT);
    digitalWrite(MANAGED_PINS[i], LOW);
  }

  WiFi.persistent(false);
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
