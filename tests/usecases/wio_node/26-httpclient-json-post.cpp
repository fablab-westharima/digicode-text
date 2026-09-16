// @board wio_node
// @lib bblanchon/ArduinoJson@7.4.3
// @desc コア同梱 ESP8266HTTPClient で JSON を POST し、応答 JSON を解析する

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* ENDPOINT = "http://192.168.10.10:8080/ingest";
static const uint8_t GROVE_POWER = 15;

static uint32_t sequence = 0;
static uint32_t lastPost = 0;

static void postTelemetry() {
  WiFiClient client;
  HTTPClient http;
  if (!http.begin(client, ENDPOINT)) {
    Serial.println("http begin failed");
    return;
  }
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  JsonDocument request;
  request["seq"] = sequence++;
  request["uptimeMs"] = millis();
  request["rssi"] = WiFi.RSSI();
  request["chipId"] = ESP.getChipId();
  request["heap"] = ESP.getFreeHeap();
  request["a0"] = analogRead(A0);

  String payload;
  serializeJson(request, payload);

  const int code = http.POST(payload);
  Serial.printf("HTTP %d\n", code);
  if (code > 0) {
    JsonDocument response;
    const DeserializationError err = deserializeJson(response, http.getString());
    if (err) Serial.printf("response parse error: %s\n", err.c_str());
    else Serial.printf("server status: %s\n", (const char*)(response["status"] | "unknown"));
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
}

void loop() {
  const uint32_t now = millis();
  if (now - lastPost < 10000) return;
  lastPost = now;
  if (WiFi.status() == WL_CONNECTED) postTelemetry();
  else Serial.println("offline");
}
