// @board pico
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Modbus で読んだ値を Home Assistant MQTT Discovery の config/state payload に組んで Serial へ出す

#include <Arduino.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>

static const uint8_t RS485_TX = 0;  // GP0
static const uint8_t RS485_RX = 1;  // GP1
static const uint8_t RS485_DE = 2;  // GP2
static const uint8_t SLAVE_ID = 1;

// 無線が無いので publish はしない。上位のゲートウェイが Serial を読んで
// そのまま MQTT へ載せられる形 (topic + payload の 2 行) で出す。
static const char* NODE_ID = "pico_rtu_01";
static const char* STATE_TOPIC = "digicode/pico_rtu_01/state";

struct Entity {
  const char* key;
  const char* name;
  const char* deviceClass;
  const char* unit;
  uint16_t reg;
  float scale;
};

static const Entity ENTITIES[] = {
  {"temp", "Panel Temperature", "temperature", "°C", 0x0000, 0.1f},
  {"rh", "Panel Humidity", "humidity", "%", 0x0001, 0.1f},
  {"press", "Line Pressure", "pressure", "kPa", 0x0002, 0.01f},
  {"power", "Line Power", "power", "W", 0x0003, 1.0f},
};
static const uint8_t ENTITY_COUNT = sizeof(ENTITIES) / sizeof(ENTITIES[0]);

ModbusMaster node;
static float values[ENTITY_COUNT];
static bool valid[ENTITY_COUNT];

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { digitalWrite(RS485_DE, LOW); }

static void emitDiscovery() {
  for (uint8_t i = 0; i < ENTITY_COUNT; i++) {
    const Entity& e = ENTITIES[i];
    JsonDocument doc;
    doc["name"] = e.name;
    doc["unique_id"] = String(NODE_ID) + "_" + e.key;
    doc["device_class"] = e.deviceClass;
    doc["unit_of_measurement"] = e.unit;
    doc["state_topic"] = STATE_TOPIC;
    doc["value_template"] = String("{{ value_json.") + e.key + " }}";
    doc["availability_topic"] = String(STATE_TOPIC) + "/avail";

    JsonObject device = doc["device"].to<JsonObject>();
    device["identifiers"][0] = NODE_ID;
    device["manufacturer"] = "DigiCode";
    device["model"] = "Raspberry Pi Pico Modbus Gateway";

    Serial.print("TOPIC homeassistant/sensor/");
    Serial.print(NODE_ID);
    Serial.print('_');
    Serial.print(e.key);
    Serial.println("/config");
    Serial.print("PAYLOAD ");
    serializeJson(doc, Serial);
    Serial.println();
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  Serial1.setTX(RS485_TX);
  Serial1.setRX(RS485_RX);
  Serial1.begin(9600, SERIAL_8N1);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);
  emitDiscovery();
}

void loop() {
  const uint8_t rc = node.readInputRegisters(ENTITIES[0].reg, ENTITY_COUNT);
  if (rc == node.ku8MBSuccess) {
    for (uint8_t i = 0; i < ENTITY_COUNT; i++) {
      values[i] = (int16_t)node.getResponseBuffer(i) * ENTITIES[i].scale;
      valid[i] = true;
    }
  } else {
    for (uint8_t i = 0; i < ENTITY_COUNT; i++) valid[i] = false;
  }
  node.clearResponseBuffer();

  JsonDocument state;
  for (uint8_t i = 0; i < ENTITY_COUNT; i++) {
    if (valid[i]) state[ENTITIES[i].key] = values[i];
  }
  state["rc"] = rc;
  state["uptimeMs"] = millis();

  Serial.print("TOPIC ");
  Serial.println(STATE_TOPIC);
  Serial.print("PAYLOAD ");
  serializeJson(state, Serial);
  Serial.println();

  Serial.print("TOPIC ");
  Serial.print(STATE_TOPIC);
  Serial.println("/avail");
  Serial.print("PAYLOAD ");
  Serial.println(rc == node.ku8MBSuccess ? "online" : "offline");

  delay(5000);
}
