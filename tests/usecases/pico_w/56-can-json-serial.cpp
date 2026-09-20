// @board pico_w
// @lib autowp/autowp-mcp2515@1.3.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc 受信した CAN フレームを ID ごとに集約し、1 行 1 JSON にして USB Serial へ流す

#include <Arduino.h>
#include <SPI.h>
#include <ArduinoJson.h>
#include <mcp2515.h>

// SPI0: GP18 SCK, GP19 MOSI, GP16 MISO。CS は GP17、INT は GP20。
static const uint8_t CAN_SCK = 18;
static const uint8_t CAN_MOSI = 19;
static const uint8_t CAN_MISO = 16;
static const uint8_t CAN_CS = 17;
static const uint8_t CAN_INT = 20;
static const uint8_t SLOT_COUNT = 8;
static const uint32_t REPORT_INTERVAL_MS = 2000;

MCP2515 mcp2515(CAN_CS, 10000000, &SPI);

// 直近に見た ID を最大 8 種類だけ覚えておき、まとめて 1 行の JSON にする。
struct Slot {
  uint32_t id;
  uint8_t dlc;
  uint8_t data[8];
  uint32_t count;
  uint32_t lastMs;
};

static Slot slots[SLOT_COUNT];
static uint8_t slotUsed = 0;
static uint32_t totalFrames = 0;
static uint32_t overflow = 0;
static uint32_t lastReport = 0;
static bool canReady = false;
static struct can_frame frame;

static Slot* findSlot(uint32_t id) {
  for (uint8_t i = 0; i < slotUsed; i++) {
    if (slots[i].id == id) return &slots[i];
  }
  if (slotUsed >= SLOT_COUNT) {
    overflow++;
    return NULL;
  }
  Slot* s = &slots[slotUsed++];
  s->id = id;
  s->count = 0;
  return s;
}

static void absorb(const struct can_frame& f) {
  totalFrames++;
  Slot* s = findSlot(f.can_id & CAN_SFF_MASK);
  if (s == NULL) return;
  s->dlc = f.can_dlc;
  memcpy(s->data, f.data, sizeof(s->data));
  s->count++;
  s->lastMs = millis();
}

static void emitJson() {
  JsonDocument doc;
  doc["board"] = "pico_w";
  doc["uptimeMs"] = millis();
  doc["totalFrames"] = totalFrames;
  doc["slotOverflow"] = overflow;

  JsonArray frames = doc["frames"].to<JsonArray>();
  for (uint8_t i = 0; i < slotUsed; i++) {
    JsonObject o = frames.add<JsonObject>();
    char idText[8];
    snprintf(idText, sizeof(idText), "%03lX", (unsigned long)slots[i].id);
    o["id"] = idText;
    o["dlc"] = slots[i].dlc;
    o["count"] = slots[i].count;
    o["ageMs"] = millis() - slots[i].lastMs;
    JsonArray bytes = o["data"].to<JsonArray>();
    for (uint8_t b = 0; b < slots[i].dlc && b < 8; b++) bytes.add(slots[i].data[b]);
  }

  serializeJson(doc, Serial);
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  pinMode(CAN_INT, INPUT_PULLUP);

  SPI.setSCK(CAN_SCK);
  SPI.setTX(CAN_MOSI);
  SPI.setRX(CAN_MISO);
  SPI.begin();

  canReady = mcp2515.reset() == MCP2515::ERROR_OK
             && mcp2515.setBitrate(CAN_250KBPS, MCP_8MHZ) == MCP2515::ERROR_OK
             && mcp2515.setNormalMode() == MCP2515::ERROR_OK;
  Serial.println(canReady ? "mcp2515 ready at 250kbps" : "mcp2515 init failed");
}

void loop() {
  if (canReady && digitalRead(CAN_INT) == LOW) {
    while (mcp2515.readMessage(&frame) == MCP2515::ERROR_OK) absorb(frame);
    mcp2515.clearInterrupts();
  }

  const uint32_t now = millis();
  if (now - lastReport < REPORT_INTERVAL_MS) return;
  lastReport = now;
  emitJson();
}
