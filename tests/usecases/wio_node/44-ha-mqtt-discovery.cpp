// @board wio_node
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc Grove 電源を入れて Modbus RTU を読み、Home Assistant MQTT Discovery で公開

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <SoftwareSerial.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* NODE_ID = "digicode-wio-node";
static const char* STATE_TOPIC = "digicode/wio-node/ha/state";
static const char* AVAILABILITY_TOPIC = "digicode/wio-node/ha/status";

static const int8_t RS485_RX = 13;
static const int8_t RS485_TX = 12;
static const uint8_t RS485_DE = 14;
static const uint8_t GROVE_POWER = 15;
static const uint8_t SLAVE_ID = 1;

SoftwareSerial rs485(RS485_RX, RS485_TX);
ModbusMaster node;
WiFiClient net;
PubSubClient mqtt(net);

static bool discoveryPublished = false;
static uint32_t lastState = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { rs485.flush(); digitalWrite(RS485_DE, LOW); }

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
  JsonObject device = doc["device"].to<JsonObject>();
  JsonArray ids = device["identifiers"].to<JsonArray>();
  ids.add(NODE_ID);
  device["name"] = "DigiCode Wio Node";
  device["manufacturer"] = "DigiCode";
  device["model"] = "text-vertical-slice";

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
    const bool a = publishDiscovery("temperature", "Wio Temperature", "C",
                                    "temperature", "{{ value_json.temperatureC }}");
    const bool b = publishDiscovery("pressure", "Wio Pressure", "hPa",
                                    "pressure", "{{ value_json.pressureHpa }}");
    discoveryPublished = a && b;
    Serial.println(discoveryPublished ? "discovery published" : "discovery failed");
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
  delay(300);

  rs485.begin(9600, SWSERIAL_8N1);
  node.begin(SLAVE_ID, rs485);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  WiFi.persistent(false);
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
  doc["heap"] = ESP.getFreeHeap();
  const uint8_t result = node.readInputRegisters(0x3100, 2);
  if (result == node.ku8MBSuccess) {
    doc["temperatureC"] = node.getResponseBuffer(0) / 10.0f;
    doc["pressureHpa"] = node.getResponseBuffer(1) / 10.0f;
    node.clearResponseBuffer();
  } else {
    doc["errorCode"] = result;
  }

  char payload[256];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(STATE_TOPIC, (const uint8_t*)payload, n, false);
  Serial.println(payload);
}
