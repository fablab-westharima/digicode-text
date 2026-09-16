// @board wio_node
// @lib bogde/HX711@0.7.5
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc 重量を JSON にして MQTT へ流し、tare / 校正コマンドを subscribe で受ける

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <HX711.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const char* TOPIC_WEIGHT = "digicode/wio-node/weight";
static const char* TOPIC_COMMAND = "digicode/wio-node/weight/cmd";

static const int LOADCELL_DOUT_PIN = 12;
static const int LOADCELL_SCK_PIN = 13;
static const uint8_t GROVE_POWER = 15;

HX711 scale;
WiFiClient net;
PubSubClient mqtt(net);

static float calibration = 420.0f;
static uint32_t intervalMs = 2000;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static void onCommand(char* topic, uint8_t* payload, unsigned int length) {
  (void)topic;
  JsonDocument doc;
  if (deserializeJson(doc, payload, length)) return;
  if (doc["tare"] | false) scale.tare(20);
  if (doc["calibration"].is<float>()) {
    calibration = doc["calibration"].as<float>();
    scale.set_scale(calibration);
  }
  intervalMs = doc["intervalMs"] | intervalMs;
  if (intervalMs < 500) intervalMs = 500;
}

static bool ensureLink() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    const uint32_t deadline = millis() + 6000;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(200);
    if (WiFi.status() != WL_CONNECTED) return false;
  }
  if (!mqtt.connected()) {
    String id = "wio-scale-";
    id += String(ESP.getChipId(), HEX);
    if (!mqtt.connect(id.c_str())) return false;
    mqtt.subscribe(TOPIC_COMMAND);
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(200);

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(calibration);
  if (scale.wait_ready_timeout(2000)) scale.tare(10);

  WiFi.persistent(false);
  mqtt.setServer(MQTT_HOST, 1883);
  mqtt.setCallback(onCommand);
  mqtt.setBufferSize(512);
}

void loop() {
  if (!ensureLink()) {
    delay(2000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPublish < intervalMs) return;
  lastPublish = now;

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = now;
  doc["calibration"] = calibration;
  doc["heap"] = ESP.getFreeHeap();
  if (scale.wait_ready_timeout(500)) {
    doc["ready"] = true;
    doc["raw"] = scale.read_average(3);
    doc["grams"] = scale.get_units(3);
  } else {
    doc["ready"] = false;
  }

  char payload[320];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(TOPIC_WEIGHT, (const uint8_t*)payload, n, false);
  Serial.println(payload);
}
