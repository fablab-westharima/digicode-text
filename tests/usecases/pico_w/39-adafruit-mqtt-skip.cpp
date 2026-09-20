// @board pico_w
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
static const char* MQTT_CLIENT_ID = "pico-w-adafruit";
static const char* MQTT_USER = "digicode";
static const char* MQTT_PASS = "not-a-real-key";
static const char* TOPIC_STATE = "digicode/pico-w/state";
static const char* TOPIC_UPTIME = "digicode/pico-w/uptime";
static const char* TOPIC_COMMAND = "digicode/pico-w/command";

// コマンドで点けるのはオンボードの LED。Pico W のユーザー LED は RP2040 の GPIO25 では
// なく無線チップ CYW43439 側にあり、core が擬似ピン 64 を LED_BUILTIN に割り当てる。
// 番号ではなく LED_BUILTIN を使う。
static const uint8_t ADC_PIN = A0;  // GP26

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
  if (strcmp(body, "on") == 0) digitalWrite(LED_BUILTIN, HIGH);
  else if (strcmp(body, "off") == 0) digitalWrite(LED_BUILTIN, LOW);
  else if (strcmp(body, "ping") == 0) mqtt.ping();
}

void setup() {
  Serial.begin(115200);
  const uint32_t serialDeadline = millis() + 3000;
  while (!Serial && millis() < serialDeadline) delay(10);

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  analogReadResolution(12);
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
           digitalRead(LED_BUILTIN) == HIGH ? 1 : 0);
  if (!statePub.publish(payload)) Serial.println("state publish failed");
  if (!uptimePub.publish((uint32_t)(now / 1000))) Serial.println("uptime publish failed");
  Serial.println(payload);
}
