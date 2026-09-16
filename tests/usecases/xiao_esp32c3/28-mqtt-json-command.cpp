// @board xiao_esp32c3
// @lib knolleary/PubSubClient@2.8
// @lib bblanchon/ArduinoJson@7.4.3
// @desc MQTT のコマンド JSON を受けて GPIO を操作し、結果を JSON で応答する

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const char* TOPIC_CMD = "digicode/xiao-c3/cmd";
static const char* TOPIC_ACK = "digicode/xiao-c3/ack";
static const char* TOPIC_LWT = "digicode/xiao-c3/online";

static const uint8_t RELAY_PINS[] = { 3, 4, 5, 10 };

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
    for (uint8_t p : RELAY_PINS) if (p == gpio) known = true;
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
    JsonArray pins = out["pins"].to<JsonArray>();
    for (uint8_t p : RELAY_PINS) {
      JsonObject o = pins.add<JsonObject>();
      o["gpio"] = p;
      o["level"] = digitalRead(p);
    }
    out["freeHeap"] = ESP.getFreeHeap();
  } else {
    out["ok"] = false;
    out["error"] = "unknown action";
  }
  respond(out);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  for (uint8_t p : RELAY_PINS) {
    pinMode(p, OUTPUT);
    digitalWrite(p, LOW);
  }
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
    String id = "xiao-c3-cmd-";
    id += String((uint32_t)ESP.getEfuseMac(), HEX);
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
