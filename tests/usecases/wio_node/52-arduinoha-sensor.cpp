// @board wio_node
// @lib dawidchyrzynski/home-assistant-integration@2.1.0
// @lib knolleary/PubSubClient@2.8
// @desc ESP8266 で ArduinoHA を使い、A0 の電圧センサ 1 本を HA へ自動登録する

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoHA.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* MQTT_USER = "digicode";
static const char* MQTT_PASS = "not-a-real-password";
static const char* DEVICE_ID = "digicode-wio-node";
static const uint8_t GROVE_POWER = 15;
static const uint32_t PUBLISH_INTERVAL_MS = 15000;

WiFiClient net;
HADevice device(DEVICE_ID);
// 使う entity は 1 つだけなので上限も 1 にして RAM を節約する。
HAMqtt mqtt(net, device, 1);
HASensorNumber voltage("volt", HASensorNumber::PrecisionP2);

static uint32_t lastPublish = 0;

static float readVolts() {
  // Wio Node の A0 は 0-1V レンジ。Grove の分圧に合わせて 3.3V 換算する。
  return (analogRead(A0) * 3.3f) / 1023.0f;
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
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  device.setName("DigiCode Wio Node");
  device.setManufacturer("DigiCode");
  device.setModel("wio-node");
  device.setSoftwareVersion("0.1.0");
  device.enableSharedAvailability();
  device.enableLastWill();

  voltage.setName("Grove A0 voltage");
  voltage.setDeviceClass("voltage");
  voltage.setStateClass("measurement");
  voltage.setUnitOfMeasurement("V");
  voltage.setIcon("mdi:flash");

  mqtt.onConnected(onMqttConnected);
  mqtt.onDisconnected(onMqttDisconnected);
  mqtt.setKeepAlive(30);
  mqtt.begin(MQTT_HOST, MQTT_PORT, MQTT_USER, MQTT_PASS);
}

void loop() {
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPublish < PUBLISH_INTERVAL_MS) return;
  lastPublish = now;

  const float value = readVolts();
  const bool published = voltage.setValue(value);
  Serial.printf("volts=%.2f published=%d state=%d heap=%u\n",
                value, published ? 1 : 0, (int)mqtt.getState(), ESP.getFreeHeap());
}
