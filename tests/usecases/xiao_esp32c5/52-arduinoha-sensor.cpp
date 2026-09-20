// @board xiao_esp32c5
// @lib dawidchyrzynski/home-assistant-integration@2.1.0
// @lib knolleary/PubSubClient@2.8
// @desc ArduinoHA (HADevice + HAMqtt + HASensorNumber) で温度センサ 1 本を HA へ自動登録する

#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoHA.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* MQTT_USER = "digicode";
static const char* MQTT_PASS = "not-a-real-password";
static const char* DEVICE_ID = "digicode-xiao-c5";

static const uint8_t ADC_PIN = 1;
static const uint32_t PUBLISH_INTERVAL_MS = 15000;

WiFiClient net;
HADevice device(DEVICE_ID);
// 使う device type は 1 種類だけなので上限も 1 にしておく (ArduinoHA は上限ぶんの配列を確保する)。
HAMqtt mqtt(net, device, 1);
HASensorNumber temperature("temp", HASensorNumber::PrecisionP1);

static uint32_t lastPublish = 0;

static float readTemperatureC() {
  // NTC 分圧の代わりに ADC の生値を線形写像する。実機では変換式を差し替える。
  const int raw = analogRead(ADC_PIN);
  return 10.0f + (raw * 30.0f) / 4095.0f;
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
  analogReadResolution(12);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  device.setName("DigiCode XIAO ESP32C5");
  device.setManufacturer("DigiCode");
  device.setModel("text-vertical-slice");
  device.setSoftwareVersion("0.1.0");
  device.enableSharedAvailability();
  device.enableLastWill();

  temperature.setName("Room temperature");
  temperature.setDeviceClass("temperature");
  temperature.setStateClass("measurement");
  temperature.setUnitOfMeasurement("C");
  temperature.setIcon("mdi:thermometer");

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

  const float value = readTemperatureC();
  const bool published = temperature.setValue(value);
  Serial.printf("temp=%.1f published=%d state=%d\n", value, published ? 1 : 0, (int)mqtt.getState());
}
