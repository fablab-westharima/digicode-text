// @board esp32_devkitc_v4
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc Golden Scenario 一式: Modbus RTU 読み取り -> JSON -> WiFi 経由で MQTT publish

#include <Arduino.h>
#include <WiFi.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* TOPIC_TELEMETRY = "digicode/esp32-devkitc/modbus";
static const char* TOPIC_COMMAND = "digicode/esp32-devkitc/modbus/set";

static const int8_t RS485_RX = 33;
static const int8_t RS485_TX = 32;
static const uint8_t RS485_DE = 4;
static const uint8_t SLAVE_ID = 1;

ModbusMaster node;
WiFiClient net;
PubSubClient mqtt(net);

static uint16_t baseRegister = 0x3100;
static uint8_t registerCount = 6;
static uint32_t publishIntervalMs = 5000;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

static void onCommand(char* topic, uint8_t* payload, unsigned int length) {
  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) {
    Serial.println("bad command json");
    return;
  }
  baseRegister = doc["base"] | baseRegister;
  registerCount = doc["count"] | registerCount;
  if (registerCount > 16) registerCount = 16;
  publishIntervalMs = doc["intervalMs"] | publishIntervalMs;
  if (publishIntervalMs < 1000) publishIntervalMs = 1000;
  Serial.print("command applied on ");
  Serial.println(topic);
}

static bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  return WiFi.status() == WL_CONNECTED;
}

static bool ensureMqtt() {
  if (mqtt.connected()) return true;
  String clientId = "esp32-devkitc-modbus-";
  clientId += String((uint32_t)ESP.getEfuseMac(), HEX);
  if (!mqtt.connect(clientId.c_str())) return false;
  mqtt.subscribe(TOPIC_COMMAND);
  return true;
}

static void publishReading() {
  const uint8_t result = node.readInputRegisters(baseRegister, registerCount);

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["rssi"] = WiFi.RSSI();
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
  if (!mqtt.publish(TOPIC_TELEMETRY, (const uint8_t*)payload, n, false)) {
    Serial.println("publish failed");
  } else {
    Serial.println(payload);
  }
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

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onCommand);
  mqtt.setBufferSize(768);
}

void loop() {
  if (!ensureWifi() || !ensureMqtt()) {
    delay(2000);
    return;
  }
  mqtt.loop();
  const uint32_t now = millis();
  if (now - lastPublish >= publishIntervalMs) {
    lastPublish = now;
    publishReading();
  }
}
