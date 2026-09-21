// @board m5stamp_p4
// @lib knolleary/PubSubClient@2.8
// @desc WiFi 接続後 MQTT ブローカへ publish し、コマンドトピックを subscribe する

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* TOPIC_STATE = "digicode/stamp-p4/state";
static const char* TOPIC_COMMAND = "digicode/stamp-p4/command";

WiFiClient net;
PubSubClient mqtt(net);

static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static void onMessage(char* topic, uint8_t* payload, unsigned int length) {
  Serial.print("recv ");
  Serial.print(topic);
  Serial.print(": ");
  for (unsigned int i = 0; i < length; i++) Serial.print((char)payload[i]);
  Serial.println();
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
  String clientId = "stamp-p4-";
  clientId += String((uint32_t)ESP.getEfuseMac(), HEX);
  if (!mqtt.connect(clientId.c_str())) {
    Serial.print("mqtt connect failed, state=");
    Serial.println(mqtt.state());
    return false;
  }
  mqtt.subscribe(TOPIC_COMMAND);
  Serial.println("mqtt connected");
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(30);
}

void loop() {
  if (!ensureWifi()) {
    delay(2000);
    return;
  }
  if (!ensureMqtt()) {
    delay(2000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPublish >= 5000) {
    lastPublish = now;
    char payload[128];
    snprintf(payload, sizeof(payload),
             "{\"seq\":%lu,\"uptimeMs\":%lu,\"rssi\":%d}",
             (unsigned long)sequence++, (unsigned long)now, (int)WiFi.RSSI());
    if (!mqtt.publish(TOPIC_STATE, payload)) Serial.println("publish failed");
    else Serial.println(payload);
  }
}
