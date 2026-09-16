// @board wio_node
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ESP8266 の状態を JSON にまとめてシリアルへ出し、受信 JSON を解析する

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>

static const uint8_t GROVE_POWER = 15;
static uint32_t sequence = 0;
static uint32_t lastSend = 0;
static uint32_t intervalMs = 2000;

static void publishState() {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();

  JsonObject chip = doc["chip"].to<JsonObject>();
  chip["id"] = ESP.getChipId();
  chip["freeHeap"] = ESP.getFreeHeap();
  chip["cpuMhz"] = ESP.getCpuFreqMHz();
  chip["sketchSize"] = ESP.getSketchSize();

  JsonObject wifi = doc["wifi"].to<JsonObject>();
  wifi["status"] = (int)WiFi.status();
  wifi["mac"] = WiFi.macAddress();
  wifi["rssi"] = WiFi.RSSI();

  JsonArray analogWindow = doc["analog"].to<JsonArray>();
  for (int i = 0; i < 3; i++) {
    analogWindow.add(analogRead(A0));
    delay(2);
  }

  serializeJson(doc, Serial);
  Serial.println();
}

static void handleCommand(const String& line) {
  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, line);
  if (err) {
    Serial.printf("{\"error\":\"%s\"}\n", err.c_str());
    return;
  }
  const bool power = doc["grovePower"] | true;
  digitalWrite(GROVE_POWER, power ? HIGH : LOW);
  intervalMs = doc["intervalMs"] | intervalMs;
  if (intervalMs < 200) intervalMs = 200;
  Serial.printf("{\"ok\":true,\"grovePower\":%d,\"intervalMs\":%u}\n",
                power ? 1 : 0, (unsigned)intervalMs);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  Serial.println();
  handleCommand("{\"grovePower\":true,\"intervalMs\":1500}");
}

void loop() {
  if (Serial.available() > 0) {
    handleCommand(Serial.readStringUntil('\n'));
  }
  const uint32_t now = millis();
  if (now - lastSend >= intervalMs) {
    lastSend = now;
    publishState();
  }
}
