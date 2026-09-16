// @board xiao_rp2040
// @lib bblanchon/ArduinoJson@7.4.3
// @desc アナログ読みを JSON で送信し、シリアルから来た JSON コマンドで送信間隔を変える

#include <Arduino.h>
#include <ArduinoJson.h>

static uint32_t sequence = 0;
static uint32_t intervalMs = 1000;
static uint32_t lastSend = 0;
static String inbox;

static void publishReading() {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["intervalMs"] = intervalMs;

  JsonObject sensor = doc["sensor"].to<JsonObject>();
  const int raw = analogRead(A0);
  sensor["raw"] = raw;
  sensor["volts"] = (raw * 3.3f) / 4095.0f;

  JsonArray window = doc["window"].to<JsonArray>();
  for (int i = 0; i < 4; i++) {
    window.add(analogRead(A0));
    delay(1);
  }

  serializeJson(doc, Serial);
  Serial.println();
}

static void applyCommand(const String& line) {
  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, line);
  if (err) {
    Serial.print("{\"error\":\"");
    Serial.print(err.c_str());
    Serial.println("\"}");
    return;
  }

  const char* action = doc["action"] | "none";
  if (strcmp(action, "setInterval") == 0) {
    const uint32_t next = doc["intervalMs"] | intervalMs;
    intervalMs = constrain(next, (uint32_t)100, (uint32_t)60000);
    Serial.print("{\"ok\":true,\"intervalMs\":");
    Serial.print(intervalMs);
    Serial.println("}");
  } else {
    Serial.println("{\"ok\":false,\"reason\":\"unknown action\"}");
  }
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  inbox.reserve(128);
  Serial.println("{\"ready\":true}");
}

void loop() {
  while (Serial.available() > 0) {
    const char ch = (char)Serial.read();
    if (ch == '\n') {
      applyCommand(inbox);
      inbox = "";
    } else if (inbox.length() < 120) {
      inbox += ch;
    }
  }

  const uint32_t now = millis();
  if (now - lastSend >= intervalMs) {
    lastSend = now;
    publishReading();
  }
}
