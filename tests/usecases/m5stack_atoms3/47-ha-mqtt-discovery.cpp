// @board m5stack_atoms3
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc Modbus の値を Home Assistant MQTT Discovery の config + state topic で公開

#include <Arduino.h>
#include <WiFi.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* NODE_ID = "digicode-atoms3";
static const char* STATE_TOPIC = "digicode/atoms3/ha/state";
static const char* AVAILABILITY_TOPIC = "digicode/atoms3/ha/status";

static const int8_t RS485_RX = 5;
static const int8_t RS485_TX = 6;
static const uint8_t RS485_DE = 7;
static const uint8_t SLAVE_ID = 1;
static const uint16_t REG_TEMPERATURE = 0x0000;
static const uint16_t REG_HUMIDITY = 0x0001;

ModbusMaster node;
WiFiClient net;
PubSubClient mqtt(net);

static bool discoveryPublished = false;
static uint32_t lastState = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

static void addDevice(JsonDocument& doc) {
  JsonObject device = doc["device"].to<JsonObject>();
  JsonArray ids = device["identifiers"].to<JsonArray>();
  ids.add(NODE_ID);
  device["name"] = "DigiCode ATOMS3";
  device["manufacturer"] = "DigiCode";
  device["model"] = "text-vertical-slice";
}

static bool publishDiscovery(const char* objectId, const char* name,
                             const char* unit, const char* deviceClass,
                             const char* valueTemplate) {
  JsonDocument doc;
  doc["name"] = name;
  doc["unique_id"] = String(NODE_ID) + "_" + objectId;
  doc["state_topic"] = STATE_TOPIC;
  doc["availability_topic"] = AVAILABILITY_TOPIC;
  doc["unit_of_measurement"] = unit;
  doc["device_class"] = deviceClass;
  doc["state_class"] = "measurement";
  doc["value_template"] = valueTemplate;
  addDevice(doc);

  char topic[128];
  snprintf(topic, sizeof(topic), "homeassistant/sensor/%s/%s/config", NODE_ID, objectId);
  char payload[640];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  return mqtt.publish(topic, (const uint8_t*)payload, n, true);
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
    if (!mqtt.connect(NODE_ID, NULL, NULL, AVAILABILITY_TOPIC, 0, true, "offline")) return false;
    mqtt.publish(AVAILABILITY_TOPIC, "online", true);
    discoveryPublished = false;
  }
  if (!discoveryPublished) {
    const bool a = publishDiscovery("temperature", "DigiCode Temperature", "C",
                                    "temperature", "{{ value_json.temperatureC }}");
    const bool b = publishDiscovery("humidity", "DigiCode Humidity", "%",
                                    "humidity", "{{ value_json.humidityPct }}");
    discoveryPublished = a && b;
    Serial.println(discoveryPublished ? "discovery published" : "discovery failed");
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

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(1024);
}

void loop() {
  if (!ensureLink()) {
    delay(3000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastState < 15000) return;
  lastState = now;

  JsonDocument doc;
  doc["uptimeMs"] = now;
  doc["rssi"] = WiFi.RSSI();
  const uint8_t result = node.readInputRegisters(REG_TEMPERATURE, 2);
  if (result == node.ku8MBSuccess) {
    doc["temperatureC"] = node.getResponseBuffer(0) / 10.0f;
    doc["humidityPct"] = node.getResponseBuffer(1) / 10.0f;
    node.clearResponseBuffer();
  } else {
    doc["errorCode"] = result;
  }
  (void)REG_HUMIDITY;

  char payload[256];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(STATE_TOPIC, (const uint8_t*)payload, n, false);
  Serial.println(payload);
}
