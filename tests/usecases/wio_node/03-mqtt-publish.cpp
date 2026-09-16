// @board wio_node
// @lib knolleary/PubSubClient@2.8
// @desc ESP8266WiFi + PubSubClient で MQTT へ publish し、Grove 電源をコマンドで切り替える

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* TOPIC_STATE = "digicode/wio-node/state";
static const char* TOPIC_COMMAND = "digicode/wio-node/command";

// Wio Node: Grove の電源は GPIO15、青 LED は GPIO2 (アクティブ LOW)。
static const uint8_t GROVE_POWER = 15;
static const uint8_t STATUS_LED = 2;

WiFiClient net;
PubSubClient mqtt(net);

static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static void onMessage(char* topic, uint8_t* payload, unsigned int length) {
  String body;
  body.reserve(length);
  for (unsigned int i = 0; i < length; i++) body += (char)payload[i];
  Serial.printf("recv %s: %s\n", topic, body.c_str());

  if (body == "grove:on") digitalWrite(GROVE_POWER, HIGH);
  else if (body == "grove:off") digitalWrite(GROVE_POWER, LOW);
  else if (body == "blink") {
    for (uint8_t i = 0; i < 6; i++) {
      digitalWrite(STATUS_LED, i % 2);
      delay(120);
    }
    digitalWrite(STATUS_LED, HIGH);
  }
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
    String id = "wio-node-";
    id += String(ESP.getChipId(), HEX);
    if (!mqtt.connect(id.c_str())) {
      Serial.printf("mqtt connect failed, state=%d\n", mqtt.state());
      return false;
    }
    mqtt.subscribe(TOPIC_COMMAND);
    Serial.println("mqtt connected");
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, HIGH);

  WiFi.persistent(false);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMessage);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(30);
}

void loop() {
  if (!ensureLink()) {
    delay(2000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPublish < 5000) return;
  lastPublish = now;

  char payload[160];
  snprintf(payload, sizeof(payload),
           "{\"seq\":%lu,\"uptimeMs\":%lu,\"rssi\":%d,\"heap\":%u,\"a0\":%d}",
           (unsigned long)sequence++, (unsigned long)now, WiFi.RSSI(),
           (unsigned)ESP.getFreeHeap(), analogRead(A0));
  if (!mqtt.publish(TOPIC_STATE, payload)) Serial.println("publish failed");
  else Serial.println(payload);
}
