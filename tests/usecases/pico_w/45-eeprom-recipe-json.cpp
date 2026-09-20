// @board pico_w
// @lib bblanchon/ArduinoJson@7.4.3
// @desc arduino-pico コア同梱の EEPROM (フラッシュ擬似) に段取りを 4 枠ぶん put/get し、JSON で出し入れする

#include <Arduino.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

static const size_t EEPROM_SIZE = 4096;
static const uint8_t SLOT_COUNT = 4;
static const uint16_t MAGIC = 0xD1CE;

struct Recipe {
  uint16_t magic;
  uint16_t crc;
  char name[20];
  float targetC;
  float toleranceC;
  uint32_t holdSeconds;
  uint8_t rampStepC;
};

static const uint16_t SLOT_SIZE = sizeof(Recipe);
static Recipe slots[SLOT_COUNT];
static String inbox;

// CRC はヘッダ 4 バイトを除いた本体にかける。
static uint16_t crc16(const uint8_t* data, size_t len) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (uint8_t bit = 0; bit < 8; bit++) {
      crc = (crc & 1) ? (uint16_t)((crc >> 1) ^ 0xA001) : (uint16_t)(crc >> 1);
    }
  }
  return crc;
}

static uint16_t recipeCrc(const Recipe& r) {
  const uint8_t* body = (const uint8_t*)&r + 4;
  return crc16(body, sizeof(Recipe) - 4);
}

static void resetSlot(Recipe& r, uint8_t index) {
  memset(&r, 0, sizeof(Recipe));
  r.magic = MAGIC;
  snprintf(r.name, sizeof(r.name), "slot-%u", (unsigned)index);
  r.targetC = 180.0f;
  r.toleranceC = 3.0f;
  r.holdSeconds = 600;
  r.rampStepC = 5;
  r.crc = recipeCrc(r);
}

static void loadSlots() {
  for (uint8_t i = 0; i < SLOT_COUNT; i++) {
    EEPROM.get(i * SLOT_SIZE, slots[i]);
    if (slots[i].magic != MAGIC || slots[i].crc != recipeCrc(slots[i])) {
      resetSlot(slots[i], i);
      EEPROM.put(i * SLOT_SIZE, slots[i]);
    }
    slots[i].name[sizeof(slots[i].name) - 1] = '\0';
  }
  EEPROM.commit();
}

static void emitSlots() {
  JsonDocument doc;
  JsonArray arr = doc["recipes"].to<JsonArray>();
  for (uint8_t i = 0; i < SLOT_COUNT; i++) {
    JsonObject o = arr.add<JsonObject>();
    o["slot"] = i;
    o["name"] = slots[i].name;
    o["targetC"] = slots[i].targetC;
    o["toleranceC"] = slots[i].toleranceC;
    o["holdSeconds"] = slots[i].holdSeconds;
    o["rampStepC"] = slots[i].rampStepC;
  }
  serializeJson(doc, Serial);
  Serial.println();
}

// {"slot":1,"name":"bake","targetC":210,"holdSeconds":900} の形で受ける。
static void applyCommand(const String& line) {
  JsonDocument cmd;
  if (deserializeJson(cmd, line)) {
    Serial.println("{\"error\":\"bad json\"}");
    return;
  }
  const int slot = cmd["slot"] | -1;
  if (slot < 0 || slot >= SLOT_COUNT) {
    Serial.println("{\"error\":\"slot out of range\"}");
    return;
  }

  Recipe& r = slots[slot];
  strlcpy(r.name, cmd["name"] | r.name, sizeof(r.name));
  r.targetC = cmd["targetC"] | r.targetC;
  r.toleranceC = cmd["toleranceC"] | r.toleranceC;
  r.holdSeconds = cmd["holdSeconds"] | r.holdSeconds;
  r.rampStepC = cmd["rampStepC"] | r.rampStepC;
  r.magic = MAGIC;
  r.crc = recipeCrc(r);

  EEPROM.put(slot * SLOT_SIZE, r);
  Serial.print("{\"saved\":");
  Serial.print(EEPROM.commit() ? "true" : "false");
  Serial.print(",\"slot\":");
  Serial.print(slot);
  Serial.println("}");
}

void setup() {
  Serial.begin(115200);
  inbox.reserve(200);
  EEPROM.begin(EEPROM_SIZE);
  loadSlots();
  emitSlots();
}

void loop() {
  while (Serial.available() > 0) {
    const char ch = (char)Serial.read();
    if (ch == '\n') {
      if (inbox.length() > 0) applyCommand(inbox);
      inbox = "";
    } else if (inbox.length() < 190) {
      inbox += ch;
    }
  }

  static uint32_t last = 0;
  if (millis() - last >= 10000) {
    last = millis();
    emitSlots();
  }
}
