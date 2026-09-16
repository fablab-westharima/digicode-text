// @board wio_node
// @lib knolleary/PubSubClient@2.8
// @lib bblanchon/ArduinoJson@7.4.3
// @desc MQTT のコマンド JSON で Grove ポートを操作し、結果を JSON で返す

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const char* TOPIC_CMD = "digicode/wio-node/cmd";
static const char* TOPIC_ACK = "digicode/wio-node/ack";
static const char* TOPIC_LWT = "digicode/wio-node/online";

static const uint8_t MANAGED_PINS[] = { 12, 13, 14, 15 };

WiFiClient net;
PubSubClient mqtt(net);
static uint32_t handled = 0;

static void respond(const JsonDocument& doc) {
  char buf[256];
  const size_t n = serializeJson(doc, buf, sizeof(buf));
  mqtt.publish(TOPIC_ACK, (const uint8_t*)buf, n, false);
  Serial.write((const uint8_t*)buf, n);
  Serial.println();
}

static void onCommand(char* topic, uint8_t* payload, unsigned int length) {
  JsonDocument in;
  JsonDocument out;
  out["topic"] = topic;
  out["handled"] = ++handled;

  const DeserializationError err = deserializeJson(in, payload, length);
  if (err) {
    out["ok"] = false;
    out["error"] = err.c_str();
    respond(out);
    return;
  }

  const char* action = in["action"] | "";
  if (strcmp(action, "set") == 0) {
    const uint8_t gpio = in["gpio"] | 255;
    bool known = false;
    for (uint8_t p : MANAGED_PINS) if (p == gpio) known = true;
    if (!known) {
      out["ok"] = false;
      out["error"] = "unknown gpio";
    } else {
      digitalWrite(gpio, (in["level"] | false) ? HIGH : LOW);
      out["ok"] = true;
      out["gpio"] = gpio;
      out["level"] = digitalRead(gpio);
    }
  } else if (strcmp(action, "status") == 0) {
    out["ok"] = true;
    out["heap"] = ESP.getFreeHeap();
    out["rssi"] = WiFi.RSSI();
    JsonArray pins = out["pins"].to<JsonArray>();
    for (uint8_t p : MANAGED_PINS) {
      JsonObject o = pins.add<JsonObject>();
      o["gpio"] = p;
      o["level"] = digitalRead(p);
    }
  } else {
    out["ok"] = false;
    out["error"] = "unknown action";
  }
  respond(out);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  for (uint8_t p : MANAGED_PINS) {
    pinMode(p, OUTPUT);
    digitalWrite(p, p == 15 ? HIGH : LOW);
  }
  WiFi.persistent(false);
  mqtt.setServer(MQTT_HOST, 1883);
  mqtt.setCallback(onCommand);
  mqtt.setBufferSize(512);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(2000);
    return;
  }
  if (!mqtt.connected()) {
    String id = "wio-cmd-";
    id += String(ESP.getChipId(), HEX);
    if (mqtt.connect(id.c_str(), TOPIC_LWT, 1, true, "0")) {
      mqtt.publish(TOPIC_LWT, "1", true);
      mqtt.subscribe(TOPIC_CMD, 1);
    } else {
      delay(2000);
      return;
    }
  }
  mqtt.loop();
  delay(10);
}
