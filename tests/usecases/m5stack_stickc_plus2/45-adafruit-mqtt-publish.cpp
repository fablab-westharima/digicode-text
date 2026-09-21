// @board m5stack_stickc_plus2
// @lib adafruit/Adafruit MQTT Library@2.6.6
// @desc Adafruit MQTT Library で publish / subscribe する (PubSubClient の代替)

#include <Arduino.h>
#include <WiFi.h>
#include <Adafruit_MQTT.h>
#include <Adafruit_MQTT_Client.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* MQTT_CLIENT_ID = "stickc-plus2-adafruit";
static const char* MQTT_USER = "digicode";
static const char* MQTT_PASS = "not-a-real-key";
static const char* TOPIC_STATE = "digicode/stickc-plus2/state";
static const char* TOPIC_UPTIME = "digicode/stickc-plus2/uptime";
static const char* TOPIC_COMMAND = "digicode/stickc-plus2/command";

// このボードにユーザー LED は無いので、LED_PIN は GPIO25 に外付けした LED のつもり。
static const uint8_t LED_PIN = 26;
static const uint8_t ADC_PIN = 33;  // StickC Plus2: GPIO33 は ADC1

WiFiClient net;
Adafruit_MQTT_Client mqtt(&net, MQTT_HOST, MQTT_PORT, MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS);
Adafruit_MQTT_Publish statePub(&mqtt, TOPIC_STATE);
Adafruit_MQTT_Publish uptimePub(&mqtt, TOPIC_UPTIME);
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
  if (strcmp(body, "on") == 0) digitalWrite(LED_PIN, HIGH);
  else if (strcmp(body, "off") == 0) digitalWrite(LED_PIN, LOW);
  else if (strcmp(body, "ping") == 0) mqtt.ping();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
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
           "{\"seq\":%lu,\"adc\":%d,\"rssi\":%d,\"led\":%d}",
           (unsigned long)sequence++, analogRead(ADC_PIN), (int)WiFi.RSSI(),
           digitalRead(LED_PIN) == HIGH ? 1 : 0);
  if (!statePub.publish(payload)) Serial.println("state publish failed");
  if (!uptimePub.publish((uint32_t)(now / 1000))) Serial.println("uptime publish failed");
  Serial.println(payload);
}
