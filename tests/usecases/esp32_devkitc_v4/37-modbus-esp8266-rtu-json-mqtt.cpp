// @board esp32_devkitc_v4
// @lib emelianov/modbus-esp8266@4.1.0
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc Golden Scenario を modbus-esp8266 で組む: RTU 非同期読み -> JSON -> MQTT publish

#include <Arduino.h>
#include <WiFi.h>
#include <ModbusRTU.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* TOPIC_TELEMETRY = "digicode/esp32-devkitc/rtu";

static const int8_t RS485_RX = 33;
static const int8_t RS485_TX = 32;
static const int16_t RS485_DE = 4;
static const uint8_t SLAVE_ID = 1;
static const uint16_t FIRST_IREG = 0x3100;
static const uint16_t IREG_COUNT = 6;

ModbusRTU mb;
WiFiClient net;
PubSubClient mqtt(net);

static uint16_t regs[IREG_COUNT];
static bool haveFresh = false;
static uint8_t lastResult = 0;
static uint32_t lastPoll = 0;
static uint32_t sequence = 0;

static bool onResult(Modbus::ResultCode event, uint16_t transactionId, void* data) {
  (void)transactionId;
  (void)data;
  lastResult = (uint8_t)event;
  haveFresh = true;
  return true;
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
    String id = "esp32-devkitc-rtu-";
    id += String((uint32_t)ESP.getEfuseMac(), HEX);
    if (!mqtt.connect(id.c_str())) return false;
  }
  return true;
}

static void publishFresh() {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["slave"] = SLAVE_ID;
  doc["base"] = FIRST_IREG;
  doc["result"] = lastResult;
  doc["ok"] = (lastResult == Modbus::EX_SUCCESS);
  if (lastResult == Modbus::EX_SUCCESS) {
    JsonArray arr = doc["registers"].to<JsonArray>();
    for (uint16_t i = 0; i < IREG_COUNT; i++) arr.add(regs[i]);
  }

  char payload[384];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(TOPIC_TELEMETRY, (const uint8_t*)payload, n, false);
  Serial.println(payload);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial1.begin(19200, SERIAL_8N1, RS485_RX, RS485_TX);
  mb.begin(&Serial1, RS485_DE);
  mb.master();

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(512);
}

void loop() {
  mb.task();

  const uint32_t now = millis();
  if (!mb.slave() && now - lastPoll >= 5000) {
    lastPoll = now;
    mb.readIreg(SLAVE_ID, FIRST_IREG, regs, IREG_COUNT, onResult);
  }

  if (!ensureLink()) {
    delay(1000);
    return;
  }
  mqtt.loop();

  if (haveFresh) {
    haveFresh = false;
    publishFresh();
  }
  yield();
}
