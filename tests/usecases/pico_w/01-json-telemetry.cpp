// @board pico_w
// @lib bblanchon/ArduinoJson@7.4.3
// @desc arduino-pico コア上で ArduinoJson の直列化・逆直列化とフィルタを回す

#include <Arduino.h>
#include <ArduinoJson.h>

static uint32_t sequence = 0;
static uint32_t lastSend = 0;

static void publishReading() {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();

  JsonObject board = doc["board"].to<JsonObject>();
  board["id"] = "pico_w";
  board["core"] = "mbed";

  JsonArray channels = doc["channels"].to<JsonArray>();
  for (int i = 0; i < NUM_ANALOG_INPUTS - 1; i++) {
    JsonObject ch = channels.add<JsonObject>();
    ch["pin"] = i;
    const int raw = analogRead(A0 + i);
    ch["raw"] = raw;
    ch["volts"] = (raw * 3.3f) / 1023.0f;
  }

  serializeJson(doc, Serial);
  Serial.println();
}

// 大きな受信 JSON から必要な項目だけ取り出す (ArduinoJson のフィルタ機能)。
static void parseConfig(const char* payload) {
  JsonDocument filter;
  filter["config"]["intervalMs"] = true;
  filter["config"]["label"] = true;

  JsonDocument doc;
  const DeserializationError err =
      deserializeJson(doc, payload, DeserializationOption::Filter(filter));
  if (err) {
    Serial.print("filter parse failed: ");
    Serial.println(err.c_str());
    return;
  }

  const uint32_t intervalMs = doc["config"]["intervalMs"] | 1000;
  const char* label = doc["config"]["label"] | "unnamed";
  Serial.print("config intervalMs=");
  Serial.print(intervalMs);
  Serial.print(" label=");
  Serial.println(label);
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) {
    delay(10);
  }
  parseConfig("{\"config\":{\"intervalMs\":500,\"label\":\"bench\",\"ignored\":[1,2,3]},\"noise\":true}");
}

void loop() {
  const uint32_t now = millis();
  if (now - lastSend >= 1000) {
    lastSend = now;
    publishReading();
  }
}
