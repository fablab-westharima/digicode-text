// @board wio_node
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc Golden Scenario 一式 (ESP8266 版): Modbus RTU -> JSON -> MQTT publish

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <SoftwareSerial.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const char* TOPIC_TELEMETRY = "digicode/wio-node/modbus";
static const char* TOPIC_COMMAND = "digicode/wio-node/modbus/set";

static const int8_t RS485_RX = 13;
static const int8_t RS485_TX = 12;
static const uint8_t RS485_DE = 14;
static const uint8_t GROVE_POWER = 15;
static const uint8_t SLAVE_ID = 1;

SoftwareSerial rs485(RS485_RX, RS485_TX);
ModbusMaster node;
WiFiClient net;
PubSubClient mqtt(net);

static uint16_t baseRegister = 0x3100;
static uint8_t registerCount = 6;
static uint32_t publishIntervalMs = 5000;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { rs485.flush(); digitalWrite(RS485_DE, LOW); }

static void onCommand(char* topic, uint8_t* payload, unsigned int length) {
  (void)topic;
  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) {
    Serial.println("bad command json");
    return;
  }
  baseRegister = doc["base"] | baseRegister;
  registerCount = doc["count"] | registerCount;
  if (registerCount > 12) registerCount = 12;
  publishIntervalMs = doc["intervalMs"] | publishIntervalMs;
  if (publishIntervalMs < 1000) publishIntervalMs = 1000;
  if (doc["grovePower"].is<bool>()) digitalWrite(GROVE_POWER, doc["grovePower"] ? HIGH : LOW);
}

static bool ensureLink() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    const uint32_t deadline = millis() + 8000;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
    if (WiFi.status() != WL_CONNECTED) return false;
  }
  if (!mqtt.connected()) {
    String id = "wio-modbus-";
    id += String(ESP.getChipId(), HEX);
    if (!mqtt.connect(id.c_str())) return false;
    mqtt.subscribe(TOPIC_COMMAND);
  }
  return true;
}

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

  WiFi.persistent(false);
  mqtt.setServer(MQTT_HOST, 1883);
  mqtt.setCallback(onCommand);
  mqtt.setBufferSize(768);
}

void loop() {
  if (!ensureLink()) {
    delay(2000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPublish < publishIntervalMs) return;
  lastPublish = now;

  const uint8_t result = node.readInputRegisters(baseRegister, registerCount);

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = now;
  doc["rssi"] = WiFi.RSSI();
  doc["heap"] = ESP.getFreeHeap();
  doc["slave"] = SLAVE_ID;
  doc["base"] = baseRegister;
  if (result == node.ku8MBSuccess) {
    doc["ok"] = true;
    JsonArray regs = doc["registers"].to<JsonArray>();
    for (uint8_t i = 0; i < registerCount; i++) regs.add(node.getResponseBuffer(i));
    node.clearResponseBuffer();
  } else {
    doc["ok"] = false;
    doc["errorCode"] = result;
  }

  char payload[512];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(TOPIC_TELEMETRY, (const uint8_t*)payload, n, false);
  Serial.println(payload);
}
