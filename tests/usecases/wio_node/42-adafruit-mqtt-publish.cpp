// @board wio_node
// @lib adafruit/Adafruit MQTT Library@2.6.6
// @desc ESP8266 で Adafruit MQTT Library を使い publish / subscribe する (PubSubClient の代替)

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Adafruit_MQTT.h>
#include <Adafruit_MQTT_Client.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* MQTT_CLIENT_ID = "wio-node-adafruit";
static const char* MQTT_USER = "digicode";
static const char* MQTT_PASS = "not-a-real-key";
static const char* TOPIC_STATE = "digicode/wio-node/af/state";
static const char* TOPIC_A0 = "digicode/wio-node/af/a0";
static const char* TOPIC_COMMAND = "digicode/wio-node/af/command";

static const uint8_t GROVE_POWER = 15;
static const uint8_t STATUS_LED = 2; // アクティブ LOW

WiFiClient net;
Adafruit_MQTT_Client mqtt(&net, MQTT_HOST, MQTT_PORT, MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS);
Adafruit_MQTT_Publish statePub(&mqtt, TOPIC_STATE);
Adafruit_MQTT_Publish a0Pub(&mqtt, TOPIC_A0);
Adafruit_MQTT_Subscribe commandSub(&mqtt, TOPIC_COMMAND);

static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

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
  const int8_t ret = mqtt.connect();
  if (ret != 0) {
    Serial.print("mqtt connect failed: ");
    Serial.println(mqtt.connectErrorString(ret));
    mqtt.disconnect();
    return false;
  }
  Serial.println("mqtt connected");
  return true;
}

static void handleCommand(const char* body) {
  Serial.print("command ");
  Serial.println(body);
  if (strcmp(body, "grove:on") == 0) digitalWrite(GROVE_POWER, HIGH);
  else if (strcmp(body, "grove:off") == 0) digitalWrite(GROVE_POWER, LOW);
  else if (strcmp(body, "led") == 0) digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
  else if (strcmp(body, "ping") == 0) mqtt.ping();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, HIGH);

  WiFi.persistent(false);
  mqtt.subscribe(&commandSub);
}

void loop() {
  if (!ensureWifi() || !ensureMqtt()) {
    delay(2000);
    return;
  }

  Adafruit_MQTT_Subscribe* subscription;
  while ((subscription = mqtt.readSubscription(200))) {
    if (subscription == &commandSub) handleCommand((char*)commandSub.lastread);
  }

  const uint32_t now = millis();
  if (now - lastPublish < 5000) return;
  lastPublish = now;

  char payload[160];
  snprintf(payload, sizeof(payload),
           "{\"seq\":%lu,\"heap\":%u,\"rssi\":%d,\"grove\":%d}",
           (unsigned long)sequence++, (unsigned)ESP.getFreeHeap(), (int)WiFi.RSSI(),
           digitalRead(GROVE_POWER) == HIGH ? 1 : 0);
  if (!statePub.publish(payload)) Serial.println("state publish failed");
  if (!a0Pub.publish((int32_t)analogRead(A0))) Serial.println("a0 publish failed");
  Serial.println(payload);
}
