// @board m5stack_atoms3
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @lib adafruit/Adafruit MQTT Library@2.6.6
// @desc Golden Scenario の MQTT 側を Adafruit MQTT Library に差し替えた版

#include <Arduino.h>
#include <WiFi.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <Adafruit_MQTT.h>
#include <Adafruit_MQTT_Client.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* MQTT_CLIENT_ID = "atoms3-modbus-af";
static const char* MQTT_USER = "digicode";
static const char* MQTT_PASS = "not-a-real-key";
static const char* TOPIC_TELEMETRY = "digicode/atoms3/modbus/af";
static const char* TOPIC_COMMAND = "digicode/atoms3/modbus/af/set";

static const int8_t RS485_RX = 5;
static const int8_t RS485_TX = 6;
static const uint8_t RS485_DE = 7;
static const uint8_t SLAVE_ID = 1;

ModbusMaster node;
WiFiClient net;
Adafruit_MQTT_Client mqtt(&net, MQTT_HOST, MQTT_PORT, MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS);
Adafruit_MQTT_Publish telemetry(&mqtt, TOPIC_TELEMETRY);
Adafruit_MQTT_Subscribe command(&mqtt, TOPIC_COMMAND);

static uint16_t baseRegister = 0x0000;
static uint8_t registerCount = 4;
static uint32_t publishIntervalMs = 5000;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

static void applyCommand(const char* body) {
  JsonDocument doc;
  if (deserializeJson(doc, body)) {
    Serial.println("bad command json");
    return;
  }
  baseRegister = doc["base"] | baseRegister;
  registerCount = doc["count"] | registerCount;
  if (registerCount > 16) registerCount = 16;
  publishIntervalMs = doc["intervalMs"] | publishIntervalMs;
  if (publishIntervalMs < 1000) publishIntervalMs = 1000;
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
    const int8_t ret = mqtt.connect();
    if (ret != 0) {
      Serial.println(mqtt.connectErrorString(ret));
      mqtt.disconnect();
      return false;
    }
  }
  return true;
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
  mqtt.subscribe(&command);
}

void loop() {
  if (!ensureLink()) {
    delay(2000);
    return;
  }

  Adafruit_MQTT_Subscribe* subscription;
  while ((subscription = mqtt.readSubscription(100))) {
    if (subscription == &command) applyCommand((char*)command.lastread);
  }

  const uint32_t now = millis();
  if (now - lastPublish < publishIntervalMs) return;
  lastPublish = now;

  const uint8_t result = node.readHoldingRegisters(baseRegister, registerCount);
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = now;
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

  char payload[384];
  serializeJson(doc, payload, sizeof(payload));
  if (!telemetry.publish(payload)) Serial.println("publish failed");
  else Serial.println(payload);
}
