// @board wio_node
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc SoftwareSerial の RS485 で保持/入力レジスタの複数レンジを順に読み、JSON で出す

#include <Arduino.h>
#include <SoftwareSerial.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const int8_t RS485_RX = 13;
static const int8_t RS485_TX = 12;
static const uint8_t RS485_DE = 14;
static const uint8_t GROVE_POWER = 15;
static const uint8_t SLAVE_ID = 1;
static const uint32_t SCAN_INTERVAL_MS = 4000;

enum RangeKind : uint8_t { HOLDING_REG, INPUT_REG };

struct Range {
  const char* name;
  RangeKind kind;
  uint16_t start;
  uint8_t count;
  float scale;
};

static const Range RANGES[] = {
  { "status", HOLDING_REG, 0x0000, 4, 1.0f },
  { "setpoint", HOLDING_REG, 0x0100, 2, 0.1f },
  { "process", INPUT_REG, 0x3100, 4, 0.1f },
};
static const size_t RANGE_COUNT = sizeof(RANGES) / sizeof(RANGES[0]);

SoftwareSerial rs485(RS485_RX, RS485_TX);
ModbusMaster node;

static uint32_t lastScan = 0;
static uint32_t scanCount = 0;
static uint32_t errorCount = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { rs485.flush(); digitalWrite(RS485_DE, LOW); }

static uint8_t readRange(const Range& range) {
  if (range.kind == HOLDING_REG) return node.readHoldingRegisters(range.start, range.count);
  return node.readInputRegisters(range.start, range.count);
}

static void scan() {
  JsonDocument doc;
  doc["scan"] = ++scanCount;
  doc["uptimeMs"] = millis();
  doc["heap"] = ESP.getFreeHeap();
  doc["slave"] = SLAVE_ID;
  JsonObject blocks = doc["blocks"].to<JsonObject>();

  for (size_t i = 0; i < RANGE_COUNT; i++) {
    const Range& range = RANGES[i];
    JsonObject block = blocks[range.name].to<JsonObject>();
    block["start"] = range.start;
    block["kind"] = range.kind == HOLDING_REG ? "holding" : "input";

    const uint8_t result = readRange(range);
    if (result == node.ku8MBSuccess) {
      block["ok"] = true;
      JsonArray values = block["values"].to<JsonArray>();
      for (uint8_t r = 0; r < range.count; r++) {
        const uint16_t raw = node.getResponseBuffer(r);
        if (range.scale == 1.0f) values.add(raw);
        else values.add(raw * range.scale);
      }
    } else {
      block["ok"] = false;
      block["errorCode"] = result;
      errorCount++;
    }
    node.clearResponseBuffer();
    delay(60);
    yield();
  }

  doc["errors"] = errorCount;
  serializeJson(doc, Serial);
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  delay(300);

  rs485.begin(9600, SWSERIAL_8N1);
  node.begin(SLAVE_ID, rs485);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  Serial.println("multi-range modbus scan");
}

void loop() {
  const uint32_t now = millis();
  if (now - lastScan < SCAN_INTERVAL_MS) {
    delay(20);
    return;
  }
  lastScan = now;
  scan();
}
