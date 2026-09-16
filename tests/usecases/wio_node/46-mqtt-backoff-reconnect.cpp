// @board wio_node
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc WiFi/MQTT の再接続を指数バックオフで行い、状態を analogWrite の LED 明滅で示す

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* TOPIC_STATE = "digicode/wio-node/link";

static const uint8_t STATUS_LED = 2; // アクティブ LOW
static const uint8_t GROVE_POWER = 15;
static const uint32_t BACKOFF_MIN_MS = 1000;
static const uint32_t BACKOFF_MAX_MS = 60000;

WiFiClient net;
PubSubClient mqtt(net);

static uint32_t backoffMs = BACKOFF_MIN_MS;
static uint32_t nextAttempt = 0;
static uint32_t wifiFailures = 0;
static uint32_t mqttFailures = 0;
static uint32_t reconnects = 0;
static uint32_t lastPublish = 0;

// アクティブ LOW なので duty を反転して渡す
static void setLed(uint16_t duty) {
  analogWrite(STATUS_LED, 1023 - duty);
}

static void noteFailure() {
  backoffMs *= 2;
  if (backoffMs > BACKOFF_MAX_MS) backoffMs = BACKOFF_MAX_MS;
  nextAttempt = millis() + backoffMs;
  Serial.printf("backoff -> %lu ms (wifi=%lu mqtt=%lu)\n",
                (unsigned long)backoffMs, (unsigned long)wifiFailures,
                (unsigned long)mqttFailures);
}

static bool tryConnect() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    const uint32_t deadline = millis() + 6000;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(200);
    if (WiFi.status() != WL_CONNECTED) {
      wifiFailures++;
      return false;
    }
  }
  if (!mqtt.connected()) {
    String id = "wio-link-";
    id += String(ESP.getChipId(), HEX);
    if (!mqtt.connect(id.c_str())) {
      mqttFailures++;
      Serial.printf("mqtt state=%d\n", mqtt.state());
      return false;
    }
  }
  return true;
}

static void publishLinkState() {
  JsonDocument doc;
  doc["uptimeMs"] = millis();
  doc["rssi"] = WiFi.RSSI();
  doc["ip"] = WiFi.localIP().toString();
  doc["heap"] = ESP.getFreeHeap();
  doc["wifiFailures"] = wifiFailures;
  doc["mqttFailures"] = mqttFailures;
  doc["reconnects"] = reconnects;
  doc["backoffMs"] = backoffMs;

  char payload[256];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(TOPIC_STATE, (const uint8_t*)payload, n, false);
  Serial.println(payload);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(STATUS_LED, OUTPUT);
  analogWriteRange(1023);
  setLed(0);

  WiFi.persistent(false);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setKeepAlive(30);
}

void loop() {
  const uint32_t now = millis();

  if (!mqtt.connected()) {
    setLed((now / 100) % 2 ? 900 : 60);
    if (now < nextAttempt) {
      delay(50);
      return;
    }
    if (tryConnect()) {
      backoffMs = BACKOFF_MIN_MS;
      nextAttempt = 0;
      reconnects++;
      Serial.println("link restored");
    } else {
      noteFailure();
    }
    return;
  }

  setLed(120);
  mqtt.loop();
  if (now - lastPublish >= 10000) {
    lastPublish = now;
    publishLinkState();
  }
  delay(20);
}
