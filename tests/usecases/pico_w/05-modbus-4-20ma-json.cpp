// @board pico_w
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc 入力レジスタの生値を 4-20mA スケールで工業単位に直し、JSON で Serial へ出す

#include <Arduino.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const uint8_t RS485_DE = 2;
static const uint8_t SLAVE_ID = 3;

static const float RAW_MIN = 0.0f;
static const float RAW_MAX = 4095.0f;
static const float UNIT_MIN = 0.0f;
static const float UNIT_MAX = 1.6f;

ModbusMaster node;

static void preTransmission() {
  digitalWrite(RS485_DE, HIGH);
}

static void postTransmission() {
  digitalWrite(RS485_DE, LOW);
}

static float rawToMilliamps(uint16_t raw) {
  return 4.0f + (raw - RAW_MIN) * (20.0f - 4.0f) / (RAW_MAX - RAW_MIN);
}

static float rawToUnit(uint16_t raw) {
  return UNIT_MIN + (raw - RAW_MIN) * (UNIT_MAX - UNIT_MIN) / (RAW_MAX - RAW_MIN);
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  Serial1.begin(9600, SERIAL_8N1);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
}

void loop() {
  const uint8_t result = node.readInputRegisters(0x0010, 2);

  JsonDocument doc;
  doc["uptimeMs"] = millis();
  doc["slave"] = SLAVE_ID;

  if (result == node.ku8MBSuccess) {
    JsonArray channels = doc["channels"].to<JsonArray>();
    for (uint8_t i = 0; i < 2; i++) {
      const uint16_t raw = node.getResponseBuffer(i);
      JsonObject ch = channels.add<JsonObject>();
      ch["index"] = i;
      ch["raw"] = raw;
      ch["mA"] = rawToMilliamps(raw);
      ch["value"] = rawToUnit(raw);
      ch["unit"] = "MPa";
      ch["wireBreak"] = rawToMilliamps(raw) < 3.5f;
    }
    doc["ok"] = true;
  } else {
    doc["ok"] = false;
    doc["errorCode"] = result;
  }

  node.clearResponseBuffer();
  serializeJson(doc, Serial);
  Serial.println();
  delay(500);
}
