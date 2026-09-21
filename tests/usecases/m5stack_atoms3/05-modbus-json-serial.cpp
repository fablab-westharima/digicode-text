// @board m5stack_atoms3
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Golden Scenario 前半: Modbus RTU の入力レジスタを読んで JSON にしてシリアルへ出す

#include <Arduino.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const int8_t RS485_RX = 5;
static const int8_t RS485_TX = 6;
static const uint8_t RS485_DE = 7;
static const uint8_t SLAVE_ID = 1;
static const uint16_t BASE_REGISTER = 0x3100;
static const uint8_t REGISTER_COUNT = 8;

ModbusMaster node;
static uint32_t sequence = 0;
static uint32_t errorCount = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

static void emit(uint8_t result) {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["slave"] = SLAVE_ID;
  doc["base"] = BASE_REGISTER;

  if (result == node.ku8MBSuccess) {
    doc["ok"] = true;
    JsonArray regs = doc["registers"].to<JsonArray>();
    for (uint8_t i = 0; i < REGISTER_COUNT; i++) regs.add(node.getResponseBuffer(i));
    // EPSolar 系は 0x3100 が電圧 0.01V 単位、0x3102 が電流 0.01A 単位。
    JsonObject scaled = doc["scaled"].to<JsonObject>();
    scaled["voltage"] = node.getResponseBuffer(0) / 100.0f;
    scaled["current"] = node.getResponseBuffer(2) / 100.0f;
    node.clearResponseBuffer();
  } else {
    doc["ok"] = false;
    doc["errorCode"] = result;
    doc["errorCount"] = ++errorCount;
  }

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
}

void loop() {
  emit(node.readInputRegisters(BASE_REGISTER, REGISTER_COUNT));
  delay(3000);
}
