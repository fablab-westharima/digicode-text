// @board wio_node
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Modbus 例外応答を分類して再試行し、ソフト WDT を給餌しながら統計を出す

#include <Arduino.h>
#include <SoftwareSerial.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const int8_t RS485_RX = 13;
static const int8_t RS485_TX = 12;
static const uint8_t RS485_DE = 14;
static const uint8_t GROVE_POWER = 15;
static const uint8_t SLAVE_ID = 1;
static const uint16_t FIRST_REG = 0x0000;
static const uint8_t REG_COUNT = 4;
static const uint8_t MAX_ATTEMPTS = 3;
static const uint32_t WDT_TIMEOUT_MS = 8000;

SoftwareSerial rs485(RS485_RX, RS485_TX);
ModbusMaster node;

static uint32_t successCount = 0;
static uint32_t retryableCount = 0;
static uint32_t exceptionCount = 0;
static uint32_t lastPoll = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { rs485.flush(); digitalWrite(RS485_DE, LOW); }

static const char* describe(uint8_t code) {
  switch (code) {
    case ModbusMaster::ku8MBSuccess: return "success";
    case ModbusMaster::ku8MBIllegalFunction: return "illegal-function";
    case ModbusMaster::ku8MBIllegalDataAddress: return "illegal-data-address";
    case ModbusMaster::ku8MBIllegalDataValue: return "illegal-data-value";
    case ModbusMaster::ku8MBSlaveDeviceFailure: return "slave-device-failure";
    case ModbusMaster::ku8MBInvalidSlaveID: return "invalid-slave-id";
    case ModbusMaster::ku8MBInvalidFunction: return "invalid-function";
    case ModbusMaster::ku8MBResponseTimedOut: return "response-timed-out";
    case ModbusMaster::ku8MBInvalidCRC: return "invalid-crc";
    default: return "unknown";
  }
}

// 例外応答 (0x01-0x04) はスレーブが仕様通りに拒否した結果なので再試行しない。
static bool worthRetrying(uint8_t code) {
  return code == ModbusMaster::ku8MBResponseTimedOut ||
         code == ModbusMaster::ku8MBInvalidCRC ||
         code == ModbusMaster::ku8MBInvalidSlaveID;
}

static void pollOnce() {
  uint8_t result = 0;
  uint8_t attempt = 0;
  for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    result = node.readHoldingRegisters(FIRST_REG, REG_COUNT);
    ESP.wdtFeed();
    yield();
    if (result == node.ku8MBSuccess || !worthRetrying(result)) break;
    delay(120 * attempt);
  }

  JsonDocument doc;
  doc["uptimeMs"] = millis();
  doc["attempts"] = attempt > MAX_ATTEMPTS ? MAX_ATTEMPTS : attempt;
  doc["code"] = result;
  doc["reason"] = describe(result);
  if (result == node.ku8MBSuccess) {
    successCount++;
    JsonArray regs = doc["registers"].to<JsonArray>();
    for (uint8_t i = 0; i < REG_COUNT; i++) regs.add(node.getResponseBuffer(i));
  } else if (worthRetrying(result)) {
    retryableCount++;
  } else {
    exceptionCount++;
  }
  node.clearResponseBuffer();
  doc["ok"] = successCount;
  doc["retryable"] = retryableCount;
  doc["exceptions"] = exceptionCount;
  doc["heap"] = ESP.getFreeHeap();

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

  ESP.wdtDisable();
  ESP.wdtEnable((uint32_t)WDT_TIMEOUT_MS);
  Serial.println("modbus retry + software wdt");
}

void loop() {
  ESP.wdtFeed();
  const uint32_t now = millis();
  if (now - lastPoll < 2000) {
    delay(20);
    return;
  }
  lastPoll = now;
  pollOnce();
}
