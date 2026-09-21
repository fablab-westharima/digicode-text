// @board m5stack_stickc_plus2
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bblanchon/ArduinoJson@7.4.3
// @lib dawidchyrzynski/home-assistant-integration@2.1.0
// @lib knolleary/PubSubClient@2.8
// @desc Modbus の複数レジスタを JSON へ整えてから ArduinoHA の 4 エンティティへ配り、availability も出す

#include <Arduino.h>
#include <WiFi.h>
#include <ModbusMaster.h>
#include <ArduinoJson.h>
#include <ArduinoHA.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* DEVICE_ID = "digicode-stickc-plus2-modbus";

static const int8_t RS485_RX = 36;
static const int8_t RS485_TX = 26;
static const uint8_t RS485_DE = 0;
static const uint8_t SLAVE_ID = 1;
static const uint16_t REG_BASE = 0x0000;
static const uint16_t REG_COUNT = 4;
static const uint32_t POLL_INTERVAL_MS = 10000;

ModbusMaster node;
WiFiClient net;
HADevice device(DEVICE_ID);
HAMqtt mqtt(net, device, 4);

HASensorNumber temperature("temp", HASensorNumber::PrecisionP1);
HASensorNumber humidity("hum", HASensorNumber::PrecisionP1);
HASensorNumber pressure("press", HASensorNumber::PrecisionP0);
HASensor rawJson("raw");

static uint32_t lastPoll = 0;
static uint32_t failures = 0;
static char rawPayload[192];

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

// Modbus の生レジスタを一度 JSON にしてから HA へ配る。
// JSON 側は「何を読んだか」をそのまま残すログとしても使う。
static bool pollToJson(JsonDocument& doc) {
  const uint8_t result = node.readInputRegisters(REG_BASE, REG_COUNT);
  doc["slave"] = SLAVE_ID;
  doc["uptimeMs"] = millis();
  if (result != node.ku8MBSuccess) {
    failures++;
    doc["ok"] = false;
    doc["errorCode"] = result;
    return false;
  }
  doc["ok"] = true;
  doc["temperatureC"] = (int16_t)node.getResponseBuffer(0) / 10.0f;
  doc["humidityPct"] = node.getResponseBuffer(1) / 10.0f;
  doc["pressureHpa"] = node.getResponseBuffer(2);
  doc["statusBits"] = node.getResponseBuffer(3);
  node.clearResponseBuffer();
  return true;
}

static void onMqttConnected() {
  Serial.println("mqtt connected");
  device.setAvailability(true);
}

static void onMqttDisconnected() {
  Serial.println("mqtt disconnected");
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

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  device.setName("DigiCode Modbus Gateway");
  device.setManufacturer("DigiCode");
  device.setModel("m5stack-stickc-plus2");
  device.setSoftwareVersion("0.1.0");
  device.enableExtendedUniqueIds();
  device.enableSharedAvailability();
  device.enableLastWill();

  temperature.setName("Process temperature");
  temperature.setDeviceClass("temperature");
  temperature.setStateClass("measurement");
  temperature.setUnitOfMeasurement("C");

  humidity.setName("Process humidity");
  humidity.setDeviceClass("humidity");
  humidity.setStateClass("measurement");
  humidity.setUnitOfMeasurement("%");

  pressure.setName("Process pressure");
  pressure.setDeviceClass("pressure");
  pressure.setStateClass("measurement");
  pressure.setUnitOfMeasurement("hPa");

  rawJson.setName("Last Modbus frame");
  rawJson.setIcon("mdi:code-json");

  mqtt.onConnected(onMqttConnected);
  mqtt.onDisconnected(onMqttDisconnected);
  mqtt.setBufferSize(1024);
  mqtt.begin(MQTT_HOST, MQTT_PORT);
}

void loop() {
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPoll < POLL_INTERVAL_MS) return;
  lastPoll = now;

  JsonDocument doc;
  const bool ok = pollToJson(doc);
  serializeJson(doc, rawPayload, sizeof(rawPayload));
  Serial.println(rawPayload);

  // 読めなかった周期は HA 側でも「使えない」と見えるようにする。
  device.setAvailability(ok);
  rawJson.setValue(rawPayload);
  if (!ok) {
    Serial.printf("poll failed (total %lu)\n", (unsigned long)failures);
    return;
  }

  temperature.setValue((float)doc["temperatureC"]);
  humidity.setValue((float)doc["humidityPct"]);
  pressure.setValue((uint16_t)doc["pressureHpa"]);
}
