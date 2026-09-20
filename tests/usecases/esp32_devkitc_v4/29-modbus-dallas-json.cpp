// @board esp32_devkitc_v4
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Modbus RTU のレジスタと 1-Wire 温度を 1 つの JSON レコードにまとめる

#include <Arduino.h>
#include <ModbusMaster.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>

static const int8_t RS485_RX = 33;
static const int8_t RS485_TX = 32;
static const uint8_t RS485_DE = 4;
static const uint8_t ONE_WIRE_PIN = 13;
static const uint8_t SLAVE_ID = 2;

ModbusMaster node;
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

static uint8_t probeCount = 0;
static uint32_t sequence = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  Serial1.begin(19200, SERIAL_8E1, RS485_RX, RS485_TX);
  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  sensors.begin();
  sensors.setWaitForConversion(true);
  probeCount = sensors.getDeviceCount();
  Serial.print("1-wire probes: ");
  Serial.println(probeCount);
}

void loop() {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();

  JsonObject modbus = doc["modbus"].to<JsonObject>();
  modbus["slave"] = SLAVE_ID;
  const uint8_t result = node.readHoldingRegisters(0x0000, 4);
  if (result == node.ku8MBSuccess) {
    modbus["ok"] = true;
    JsonArray regs = modbus["registers"].to<JsonArray>();
    for (uint8_t i = 0; i < 4; i++) regs.add(node.getResponseBuffer(i));
    node.clearResponseBuffer();
  } else {
    modbus["ok"] = false;
    modbus["errorCode"] = result;
  }

  sensors.requestTemperatures();
  JsonArray probes = doc["probes"].to<JsonArray>();
  for (uint8_t i = 0; i < probeCount; i++) {
    const float c = sensors.getTempCByIndex(i);
    JsonObject p = probes.add<JsonObject>();
    p["index"] = i;
    if (c == DEVICE_DISCONNECTED_C) p["error"] = "disconnected";
    else p["temperatureC"] = c;
  }

  serializeJson(doc, Serial);
  Serial.println();
  delay(5000);
}
