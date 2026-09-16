// @board pico
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Mbed コアには EEPROM ライブラリが無いので、設定は Serial の JSON で受けて RAM に保持する

#include <Arduino.h>
#include <ArduinoJson.h>

// earlephilhower コアの EEPROM (フラッシュ擬似) に相当するものが Mbed コアの
// libraries には無い。ここでは起動時の既定値 + Serial からの上書きだけで運用する。
struct Config {
  uint32_t intervalMs;
  float thresholdC;
  char label[24];
};

static Config config = {1000, 40.0f, "pico-node"};
static String inbox;
static uint32_t applied = 0;

static void printConfig(const char* event) {
  JsonDocument doc;
  doc["event"] = event;
  doc["label"] = config.label;
  doc["intervalMs"] = config.intervalMs;
  doc["thresholdC"] = config.thresholdC;
  doc["applied"] = applied;
  serializeJson(doc, Serial);
  Serial.println();
}

static void handle(const String& line) {
  JsonDocument cmd;
  const DeserializationError err = deserializeJson(cmd, line);
  if (err) {
    Serial.print("{\"ok\":false,\"reason\":\"");
    Serial.print(err.c_str());
    Serial.println("\"}");
    return;
  }

  config.intervalMs = constrain((uint32_t)(cmd["intervalMs"] | config.intervalMs), (uint32_t)100, (uint32_t)60000);
  config.thresholdC = cmd["thresholdC"] | config.thresholdC;
  strlcpy(config.label, cmd["label"] | config.label, sizeof(config.label));
  applied++;
  printConfig("config");
}

void setup() {
  Serial.begin(115200);
  inbox.reserve(160);
  analogReadResolution(12);
  printConfig("boot");
}

void loop() {
  while (Serial.available() > 0) {
    const char ch = (char)Serial.read();
    if (ch == '\n') {
      handle(inbox);
      inbox = "";
    } else if (inbox.length() < 150) {
      inbox += ch;
    }
  }

  static uint32_t last = 0;
  if (millis() - last >= config.intervalMs) {
    last = millis();
    const int raw = analogRead(A0);
    const float volts = (raw * 3.3f) / 4095.0f;

    JsonDocument doc;
    doc["label"] = config.label;
    doc["uptimeMs"] = millis();
    doc["raw"] = raw;
    doc["volts"] = volts;
    doc["overThreshold"] = volts * 30.0f > config.thresholdC;
    serializeJson(doc, Serial);
    Serial.println();
  }
}
