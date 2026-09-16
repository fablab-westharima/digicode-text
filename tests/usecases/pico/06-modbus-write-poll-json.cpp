// @board pico
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Serial から来た JSON コマンドで Modbus レジスタ / コイルへ書き、結果を JSON で返す

#include <Arduino.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const uint8_t RS485_DE = 2;
static const uint8_t SLAVE_ID = 2;

ModbusMaster node;
static String inbox;

static void preTransmission() {
  digitalWrite(RS485_DE, HIGH);
}

static void postTransmission() {
  digitalWrite(RS485_DE, LOW);
}

static void reply(const char* action, uint8_t code, uint16_t address, uint16_t value) {
  JsonDocument doc;
  doc["action"] = action;
  doc["address"] = address;
  doc["value"] = value;
  doc["ok"] = code == ModbusMaster::ku8MBSuccess;
  doc["code"] = code;
  serializeJson(doc, Serial);
  Serial.println();
}

static void handle(const String& line) {
  JsonDocument cmd;
  const DeserializationError err = deserializeJson(cmd, line);
  if (err) {
    Serial.print("{\"error\":\"");
    Serial.print(err.c_str());
    Serial.println("\"}");
    return;
  }

  const char* action = cmd["action"] | "";
  const uint16_t address = cmd["address"] | 0;
  const uint16_t value = cmd["value"] | 0;

  if (strcmp(action, "writeRegister") == 0) {
    reply(action, node.writeSingleRegister(address, value), address, value);
  } else if (strcmp(action, "writeCoil") == 0) {
    reply(action, node.writeSingleCoil(address, value ? 1 : 0), address, value);
  } else if (strcmp(action, "writeBlock") == 0) {
    JsonArray values = cmd["values"].as<JsonArray>();
    uint8_t index = 0;
    for (JsonVariant v : values) {
      if (index >= 8) break;
      node.setTransmitBuffer(index++, v.as<uint16_t>());
    }
    reply(action, node.writeMultipleRegisters(address, index), address, index);
    node.clearTransmitBuffer();
  } else {
    Serial.println("{\"error\":\"unknown action\"}");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  inbox.reserve(160);

  Serial1.begin(9600);
  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
}

void loop() {
  while (Serial.available() > 0) {
    const char ch = (char)Serial.read();
    if (ch == '\n') {
      handle(inbox);
      inbox = "";
    } else if (inbox.length() < 150) {
      inbox += ch;
    }
  }

  static uint32_t lastPoll = 0;
  if (millis() - lastPoll >= 2000) {
    lastPoll = millis();
    const uint8_t result = node.readCoils(0x0000, 8);
    JsonDocument doc;
    doc["poll"] = "coils";
    doc["ok"] = result == node.ku8MBSuccess;
    if (result == node.ku8MBSuccess) {
      doc["bits"] = node.getResponseBuffer(0);
    }
    node.clearResponseBuffer();
    serializeJson(doc, Serial);
    Serial.println();
  }
}
