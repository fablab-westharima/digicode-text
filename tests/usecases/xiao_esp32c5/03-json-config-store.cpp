// @board xiao_esp32c5
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ArduinoJson 7 だけで設定 JSON を解析し、状態 JSON を組み立ててシリアルへ出す

#include <Arduino.h>
#include <ArduinoJson.h>

// XIAO ESP32C5: 側面パッドに出ている ADC は A0 = D0 = GPIO1 の 1 本だけ。
// A1..A4 のマクロが指すのは基板裏の JTAG パッド (GPIO2/3/4) と、Seeed の
// ピン表に無い GPIO5 なので、3 チャンネルぶんは同じ A0 を読み直して埋める。
static const uint8_t ANALOG_INPUT = A0;

struct Config {
  uint32_t intervalMs;
  char nodeId[24];
  bool verbose;
  float scale;
};

static Config config = { 2000, "xiao-c5-01", false, 1.0f };
static uint32_t lastReport = 0;
static uint32_t sequence = 0;

static bool applyConfig(const char* json) {
  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, json);
  if (err) {
    Serial.print("config parse error: ");
    Serial.println(err.c_str());
    return false;
  }
  config.intervalMs = doc["intervalMs"] | config.intervalMs;
  if (config.intervalMs < 200) config.intervalMs = 200;
  config.verbose = doc["verbose"] | config.verbose;
  config.scale = doc["scale"] | config.scale;
  const char* id = doc["nodeId"];
  if (id != nullptr) strlcpy(config.nodeId, id, sizeof(config.nodeId));
  return true;
}

static void report() {
  JsonDocument doc;
  doc["nodeId"] = config.nodeId;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();

  JsonArray raw = doc["adc"].to<JsonArray>();
  JsonArray volts = doc["volts"].to<JsonArray>();
  for (uint8_t i = 0; i < 3; i++) {
    const int value = analogRead(ANALOG_INPUT);
    raw.add(value);
    volts.add(serialized(String(value * 3.3f / 4095.0f * config.scale, 4)));
  }

  if (config.verbose) {
    JsonObject chip = doc["chip"].to<JsonObject>();
    chip["model"] = ESP.getChipModel();
    chip["cores"] = ESP.getChipCores();
    chip["freeHeap"] = ESP.getFreeHeap();
  }

  serializeJson(doc, Serial);
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  analogReadResolution(12);
  applyConfig("{\"intervalMs\":1500,\"verbose\":true,\"scale\":1.02,\"nodeId\":\"bench-c5\"}");
}

void loop() {
  if (Serial.available() > 0) {
    const String line = Serial.readStringUntil('\n');
    if (line.length() > 1) applyConfig(line.c_str());
  }
  const uint32_t now = millis();
  if (now - lastReport >= config.intervalMs) {
    lastReport = now;
    report();
  }
}
