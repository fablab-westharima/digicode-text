// @board xiao_rp2040
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Modbus RTU で保持レジスタを読み、JSON に組み立てて Serial へ出す

#include <Arduino.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const uint8_t RS485_DE = 28;  // D2 / GP28
static const uint8_t SLAVE_ID = 1;
static const uint16_t BASE_ADDRESS = 0x0000;
static const uint16_t REGISTER_COUNT = 6;

ModbusMaster node;
static uint32_t sequence = 0;

static void preTransmission() {
  digitalWrite(RS485_DE, HIGH);
}

static void postTransmission() {
  digitalWrite(RS485_DE, LOW);
}

static const char* statusText(uint8_t code) {
  switch (code) {
    case ModbusMaster::ku8MBSuccess: return "ok";
    case ModbusMaster::ku8MBResponseTimedOut: return "timeout";
    case ModbusMaster::ku8MBInvalidCRC: return "crc";
    case ModbusMaster::ku8MBIllegalDataAddress: return "illegal-address";
    default: return "error";
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  Serial1.setTX(0);
  Serial1.setRX(1);
  Serial1.begin(19200, SERIAL_8E1);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
}

void loop() {
  const uint8_t result = node.readHoldingRegisters(BASE_ADDRESS, REGISTER_COUNT);

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["slave"] = SLAVE_ID;
  doc["status"] = statusText(result);

  if (result == node.ku8MBSuccess) {
    JsonArray regs = doc["registers"].to<JsonArray>();
    for (uint16_t i = 0; i < REGISTER_COUNT; i++) {
      regs.add(node.getResponseBuffer(i));
    }
    // 上位 16 bit + 下位 16 bit の 32 bit 積算値として読み直す。
    const uint32_t total = ((uint32_t)node.getResponseBuffer(0) << 16) | node.getResponseBuffer(1);
    doc["totalizer"] = total;
    doc["temperatureC"] = (int16_t)node.getResponseBuffer(2) / 10.0f;
  } else {
    doc["errorCode"] = result;
  }

  node.clearResponseBuffer();
  serializeJson(doc, Serial);
  Serial.println();
  delay(1000);
}
