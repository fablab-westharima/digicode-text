// @board wio_node
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Golden Scenario 前半: SoftwareSerial の Modbus RTU 読み取りを JSON でシリアルへ出す

#include <Arduino.h>
#include <SoftwareSerial.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const int8_t RS485_RX = 13;
static const int8_t RS485_TX = 12;
static const uint8_t RS485_DE = 14;
static const uint8_t GROVE_POWER = 15;
static const uint8_t SLAVE_ID = 1;
static const uint16_t BASE_REGISTER = 0x3100;
static const uint8_t REGISTER_COUNT = 6;

SoftwareSerial rs485(RS485_RX, RS485_TX);
ModbusMaster node;

static uint32_t sequence = 0;
static uint32_t failures = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { rs485.flush(); digitalWrite(RS485_DE, LOW); }

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  rs485.begin(9600, SWSERIAL_8N1);
  node.begin(SLAVE_ID, rs485);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
}

void loop() {
  const uint8_t result = node.readInputRegisters(BASE_REGISTER, REGISTER_COUNT);

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["heap"] = ESP.getFreeHeap();
  doc["slave"] = SLAVE_ID;
  doc["base"] = BASE_REGISTER;

  if (result == node.ku8MBSuccess) {
    doc["ok"] = true;
    JsonArray regs = doc["registers"].to<JsonArray>();
    for (uint8_t i = 0; i < REGISTER_COUNT; i++) regs.add(node.getResponseBuffer(i));
    JsonObject scaled = doc["scaled"].to<JsonObject>();
    scaled["voltage"] = node.getResponseBuffer(0) / 100.0f;
    scaled["current"] = node.getResponseBuffer(1) / 100.0f;
    node.clearResponseBuffer();
  } else {
    doc["ok"] = false;
    doc["errorCode"] = result;
    doc["failures"] = ++failures;
  }

  serializeJson(doc, Serial);
  Serial.println();
  delay(3000);
}
