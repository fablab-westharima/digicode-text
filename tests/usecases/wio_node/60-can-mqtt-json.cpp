// @board wio_node
// @lib autowp/autowp-mcp2515@1.3.1
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc MCP2515 で受けた CAN フレームを ID ごとに集約し、JSON にして MQTT へ publish する

#include <Arduino.h>
#include <SPI.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <mcp2515.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* CLIENT_ID = "digicode-wio-can";
static const char* TOPIC = "digicode/wio-node/can/frames";

// ハード SPI: SCK=GPIO14 MISO=GPIO12 MOSI=GPIO13、CS は GPIO16。
static const uint8_t CAN_CS = 16;
static const uint8_t SLOT_COUNT = 6;
static const uint32_t PUBLISH_INTERVAL_MS = 5000;

MCP2515 mcp2515(CAN_CS, 8000000, &SPI);
WiFiClient net;
PubSubClient mqtt(net);

// 直近に見た ID を最大 6 種類だけ覚えておき、まとめて 1 通の JSON にする。
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
static uint32_t lastPublish = 0;
static bool canReady = false;
static struct can_frame frame;

static Slot* findSlot(uint32_t id) {
  for (uint8_t i = 0; i < slotUsed; i++) {
    if (slots[i].id == id) return &slots[i];
  }
  if (slotUsed >= SLOT_COUNT) return NULL;
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

static bool ensureLink() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    const uint32_t deadline = millis() + 8000;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
    if (WiFi.status() != WL_CONNECTED) return false;
  }
  if (!mqtt.connected() && !mqtt.connect(CLIENT_ID)) return false;
  return true;
}

static void publishSnapshot() {
  JsonDocument doc;
  doc["node"] = CLIENT_ID;
  doc["uptimeMs"] = millis();
  doc["totalFrames"] = totalFrames;
  doc["heap"] = ESP.getFreeHeap();

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

  char payload[640];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  if (!mqtt.publish(TOPIC, (const uint8_t*)payload, n, false)) Serial.println("publish failed");
  Serial.println(payload);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(1024);

  SPI.begin();
  canReady = mcp2515.reset() == MCP2515::ERROR_OK
             && mcp2515.setBitrate(CAN_250KBPS, MCP_8MHZ) == MCP2515::ERROR_OK
             && mcp2515.setNormalMode() == MCP2515::ERROR_OK;
  Serial.println(canReady ? "mcp2515 ready at 250kbps" : "mcp2515 init failed");
}

void loop() {
  if (canReady) {
    while (mcp2515.checkReceive()) {
      if (mcp2515.readMessage(&frame) != MCP2515::ERROR_OK) break;
      absorb(frame);
      yield();
    }
  }

  const uint32_t now = millis();
  if (now - lastPublish < PUBLISH_INTERVAL_MS) {
    delay(5);
    return;
  }
  lastPublish = now;

  if (!ensureLink()) {
    Serial.println("link down");
    return;
  }
  mqtt.loop();
  publishSnapshot();
}
