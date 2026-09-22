// @board xiao_esp32c6
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Modbus 例外応答を分類して再試行し、Task WDT を給餌しつつ統計を NVS に残す

#include <Arduino.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <esp_task_wdt.h>

static const int8_t RS485_RX = 2;
static const int8_t RS485_TX = 21;
static const uint8_t RS485_DE = 1;
static const uint8_t SLAVE_ID = 1;
static const uint16_t FIRST_REG = 0x0000;
static const uint8_t REG_COUNT = 4;
static const uint8_t MAX_ATTEMPTS = 3;
static const uint32_t WDT_TIMEOUT_S = 15;

ModbusMaster node;
Preferences prefs;

static uint32_t successCount = 0;
static uint32_t timeoutCount = 0;
static uint32_t exceptionCount = 0;
static uint32_t lastPoll = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

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

// 例外応答は再試行しても同じ結果になる。再試行するのは通信層の失敗だけ。
static bool worthRetrying(uint8_t code) {
  return code == ModbusMaster::ku8MBResponseTimedOut ||
         code == ModbusMaster::ku8MBInvalidCRC ||
         code == ModbusMaster::ku8MBInvalidSlaveID;
}

static void persistStats() {
  prefs.begin("modbus", false);
  prefs.putUInt("ok", successCount);
  prefs.putUInt("timeout", timeoutCount);
  prefs.putUInt("except", exceptionCount);
  prefs.end();
}

static void pollOnce() {
  uint8_t result = 0;
  uint8_t attempt = 0;
  for (attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    result = node.readHoldingRegisters(FIRST_REG, REG_COUNT);
    esp_task_wdt_reset();
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
    timeoutCount++;
  } else {
    exceptionCount++;
  }
  node.clearResponseBuffer();
  doc["ok"] = successCount;
  doc["timeouts"] = timeoutCount;
  doc["exceptions"] = exceptionCount;

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

  prefs.begin("modbus", true);
  successCount = prefs.getUInt("ok", 0);
  timeoutCount = prefs.getUInt("timeout", 0);
  exceptionCount = prefs.getUInt("except", 0);
  prefs.end();

  // arduino-esp32 3.x (ESP-IDF 5.x) の Task WDT。init は設定構造体を 1 つだけ受け取る。
  // core が先に初期化していると init は ESP_ERR_INVALID_STATE を返すので、その場合は時間を入れ替える。
  const esp_task_wdt_config_t wdtConfig = {
    .timeout_ms = WDT_TIMEOUT_S * 1000,
    .idle_core_mask = 0, // idle task は見ない。見るのはこのタスクだけ
    .trigger_panic = true,
  };
  if (esp_task_wdt_init(&wdtConfig) == ESP_ERR_INVALID_STATE) esp_task_wdt_reconfigure(&wdtConfig);
  esp_task_wdt_add(NULL);
  Serial.println("modbus retry + task wdt");
}

void loop() {
  esp_task_wdt_reset();
  const uint32_t now = millis();
  if (now - lastPoll < 2000) {
    delay(20);
    return;
  }
  lastPoll = now;
  pollOnce();
  if ((successCount + timeoutCount + exceptionCount) % 20 == 0) persistStats();
}
