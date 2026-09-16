// @board xiao_esp32c3
// @lib bblanchon/ArduinoJson@7.4.3
// @desc コア同梱 HTTPClient で JSON を POST し、返ってきた JSON を解析する

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* ENDPOINT = "http://192.168.10.10:8080/ingest";

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
  request["mac"] = WiFi.macAddress();
  JsonArray adc = request["adc"].to<JsonArray>();
  for (uint8_t i = 0; i < 3; i++) adc.add(analogRead(A0 + i));

  String payload;
  serializeJson(request, payload);

  const int code = http.POST(payload);
  Serial.print("HTTP ");
  Serial.println(code);
  if (code > 0) {
    JsonDocument response;
    const DeserializationError err = deserializeJson(response, http.getString());
    if (err) {
      Serial.print("response parse error: ");
      Serial.println(err.c_str());
    } else {
      const char* status = response["status"] | "unknown";
      Serial.print("server status: ");
      Serial.println(status);
    }
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(200);
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
