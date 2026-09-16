// @board pico
// @lib arduino-libraries/Servo@1.3.0
// @lib bblanchon/ArduinoJson@7.4.3
// @desc Serial から来た JSON で 2 軸サーボを動かし、現在角を JSON で返す

#include <Arduino.h>
#include <Servo.h>
#include <ArduinoJson.h>

// Mbed コアには Servo が同梱されていないため Registry の arduino-libraries/Servo を足す。
static const uint8_t PAN_PIN = 10;   // GP10
static const uint8_t TILT_PIN = 11;  // GP11

Servo pan;
Servo tilt;
static String inbox;

static void report(const char* event) {
  JsonDocument doc;
  doc["event"] = event;
  doc["uptimeMs"] = millis();
  JsonObject axes = doc["axes"].to<JsonObject>();
  axes["pan"] = pan.read();
  axes["tilt"] = tilt.read();
  axes["panUs"] = pan.readMicroseconds();
  axes["attached"] = pan.attached() && tilt.attached();
  serializeJson(doc, Serial);
  Serial.println();
}

static void handle(const String& line) {
  JsonDocument cmd;
  if (deserializeJson(cmd, line)) {
    Serial.println("{\"ok\":false,\"reason\":\"bad json\"}");
    return;
  }

  if (cmd["pan"].is<int>()) pan.write(constrain(cmd["pan"].as<int>(), 0, 180));
  if (cmd["tilt"].is<int>()) tilt.write(constrain(cmd["tilt"].as<int>(), 0, 180));

  const char* action = cmd["action"] | "";
  if (strcmp(action, "detach") == 0) {
    pan.detach();
    tilt.detach();
  } else if (strcmp(action, "attach") == 0) {
    pan.attach(PAN_PIN, 544, 2400);
    tilt.attach(TILT_PIN, 544, 2400);
  }
  report("applied");
}

void setup() {
  Serial.begin(115200);
  inbox.reserve(128);
  pan.attach(PAN_PIN, 544, 2400);
  tilt.attach(TILT_PIN, 544, 2400);
  pan.write(90);
  tilt.write(90);
  delay(300);
  report("ready");
}

void loop() {
  while (Serial.available() > 0) {
    const char ch = (char)Serial.read();
    if (ch == '\n') {
      handle(inbox);
      inbox = "";
    } else if (inbox.length() < 120) {
      inbox += ch;
    }
  }

  static uint32_t last = 0;
  if (millis() - last >= 2000) {
    last = millis();
    report("tick");
  }
}
