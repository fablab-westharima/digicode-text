// @board xiao_esp32s3
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc 保持レジスタと入力レジスタの複数レンジを 1 周期でまとめて読み、JSON にして Serial へ

#include <Arduino.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const int8_t RS485_RX = 44;
static const int8_t RS485_TX = 43;
static const uint8_t RS485_DE = 2;
static const uint8_t SLAVE_ID = 1;
static const uint32_t SCAN_INTERVAL_MS = 3000;

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
  { "process", INPUT_REG, 0x3100, 6, 0.1f },
  { "energy", INPUT_REG, 0x3200, 4, 1.0f },
};
static const size_t RANGE_COUNT = sizeof(RANGES) / sizeof(RANGES[0]);

ModbusMaster node;
static uint32_t lastScan = 0;
static uint32_t scanCount = 0;
static uint32_t errorCount = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

static uint8_t readRange(const Range& range) {
  if (range.kind == HOLDING_REG) return node.readHoldingRegisters(range.start, range.count);
  return node.readInputRegisters(range.start, range.count);
}

static void scan() {
  JsonDocument doc;
  doc["scan"] = ++scanCount;
  doc["uptimeMs"] = millis();
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
    delay(50); // レンジ間はスレーブを休ませる
  }

  doc["errors"] = errorCount;
  serializeJson(doc, Serial);
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  Serial1.begin(9600, SERIAL_8N1, RS485_RX, RS485_TX);
  node.begin(SLAVE_ID, Serial1);
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
