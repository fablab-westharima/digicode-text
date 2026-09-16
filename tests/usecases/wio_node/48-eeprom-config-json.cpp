// @board wio_node
// @lib bblanchon/ArduinoJson@7.4.3
// @desc 設定を JSON 文字列のまま EEPROM に保存し、Serial からの JSON で書き換える

#include <Arduino.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

static const int EEPROM_SIZE = 512;
static const int CONFIG_ADDR = 0;
static const size_t MAX_CONFIG = 400;
static const uint16_t MAGIC = 0xD161;
static const uint8_t GROVE_POWER = 15;

struct Header {
  uint16_t magic;
  uint16_t length;
};

static char configText[MAX_CONFIG + 1];
static uint32_t intervalMs = 5000;
static float threshold = 2.5f;
static String nodeName = "wio-node";
static uint32_t bootCount = 0;
static uint32_t lastTick = 0;

static void applyJson(const JsonDocument& doc) {
  intervalMs = doc["intervalMs"] | intervalMs;
  if (intervalMs < 500) intervalMs = 500;
  threshold = doc["threshold"] | threshold;
  const char* name = doc["name"] | (const char*)nullptr;
  if (name != nullptr) nodeName = name;
  bootCount = doc["bootCount"] | bootCount;
}

static void buildJson(JsonDocument& doc) {
  doc["intervalMs"] = intervalMs;
  doc["threshold"] = threshold;
  doc["name"] = nodeName;
  doc["bootCount"] = bootCount;
}

static void saveConfig() {
  JsonDocument doc;
  buildJson(doc);
  const size_t n = serializeJson(doc, configText, sizeof(configText));

  Header header = { MAGIC, (uint16_t)n };
  EEPROM.put(CONFIG_ADDR, header);
  for (size_t i = 0; i < n; i++) {
    EEPROM.write(CONFIG_ADDR + sizeof(Header) + i, (uint8_t)configText[i]);
  }
  if (EEPROM.commit()) Serial.println("config saved");
  else Serial.println("commit failed");
}

static bool loadConfig() {
  Header header;
  EEPROM.get(CONFIG_ADDR, header);
  if (header.magic != MAGIC || header.length == 0 || header.length > MAX_CONFIG) return false;
  for (uint16_t i = 0; i < header.length; i++) {
    configText[i] = (char)EEPROM.read(CONFIG_ADDR + sizeof(Header) + i);
  }
  configText[header.length] = '\0';

  JsonDocument doc;
  if (deserializeJson(doc, configText)) {
    Serial.println("stored config is not valid json");
    return false;
  }
  applyJson(doc);
  return true;
}

static void printConfig() {
  JsonDocument doc;
  buildJson(doc);
  doc["uptimeMs"] = millis();
  doc["heap"] = ESP.getFreeHeap();
  serializeJson(doc, Serial);
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  EEPROM.begin(EEPROM_SIZE);
  if (loadConfig()) Serial.println("config restored");
  else Serial.println("using defaults");
  bootCount++;
  saveConfig();
  printConfig();
  Serial.println("send JSON to update, e.g. {\"intervalMs\":2000}");
}

void loop() {
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      JsonDocument doc;
      if (deserializeJson(doc, line)) {
        Serial.println("invalid json");
      } else {
        applyJson(doc);
        saveConfig();
        printConfig();
      }
    }
  }

  const uint32_t now = millis();
  if (now - lastTick >= intervalMs) {
    lastTick = now;
    const float volts = analogRead(A0) * 3.3f / 1024.0f;
    Serial.printf("%s a0=%.3fV over=%d\n", nodeName.c_str(), volts,
                  volts > threshold ? 1 : 0);
  }
  yield();
}
