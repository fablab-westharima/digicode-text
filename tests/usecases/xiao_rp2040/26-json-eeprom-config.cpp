// @board xiao_rp2040
// @lib bblanchon/ArduinoJson@7.4.3
// @desc 設定を JSON 文字列のままコア同梱 EEPROM (フラッシュ擬似) に保存し、起動時に読み戻す

#include <Arduino.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

static const size_t EEPROM_SIZE = 512;
static const uint16_t CONFIG_ADDRESS = 0;
static const size_t CONFIG_MAX = 200;

struct Config {
  uint32_t intervalMs;
  float thresholdC;
  char label[24];
};

static Config config = {1000, 40.0f, "unnamed"};
static String inbox;

static void loadConfig() {
  char raw[CONFIG_MAX];
  for (size_t i = 0; i < CONFIG_MAX; i++) raw[i] = EEPROM.read(CONFIG_ADDRESS + i);
  raw[CONFIG_MAX - 1] = '\0';

  JsonDocument doc;
  if (deserializeJson(doc, raw)) {
    Serial.println("{\"config\":\"default\"}");
    return;
  }
  config.intervalMs = doc["intervalMs"] | config.intervalMs;
  config.thresholdC = doc["thresholdC"] | config.thresholdC;
  strlcpy(config.label, doc["label"] | config.label, sizeof(config.label));
  Serial.println("{\"config\":\"restored\"}");
}

static void saveConfig() {
  JsonDocument doc;
  doc["intervalMs"] = config.intervalMs;
  doc["thresholdC"] = config.thresholdC;
  doc["label"] = config.label;

  char raw[CONFIG_MAX];
  const size_t written = serializeJson(doc, raw, sizeof(raw));
  for (size_t i = 0; i < CONFIG_MAX; i++) {
    EEPROM.write(CONFIG_ADDRESS + i, i < written ? raw[i] : 0);
  }
  if (EEPROM.commit()) Serial.println("{\"saved\":true}");
  else Serial.println("{\"saved\":false}");
}

void setup() {
  Serial.begin(115200);
  inbox.reserve(160);
  EEPROM.begin(EEPROM_SIZE);
  loadConfig();
}

void loop() {
  while (Serial.available() > 0) {
    const char ch = (char)Serial.read();
    if (ch == '\n') {
      JsonDocument cmd;
      if (!deserializeJson(cmd, inbox)) {
        config.intervalMs = cmd["intervalMs"] | config.intervalMs;
        config.thresholdC = cmd["thresholdC"] | config.thresholdC;
        strlcpy(config.label, cmd["label"] | config.label, sizeof(config.label));
        saveConfig();
      }
      inbox = "";
    } else if (inbox.length() < 150) {
      inbox += ch;
    }
  }

  static uint32_t last = 0;
  if (millis() - last >= config.intervalMs) {
    last = millis();
    JsonDocument doc;
    doc["label"] = config.label;
    doc["intervalMs"] = config.intervalMs;
    doc["thresholdC"] = config.thresholdC;
    doc["a0"] = analogRead(A0);
    serializeJson(doc, Serial);
    Serial.println();
  }
}
