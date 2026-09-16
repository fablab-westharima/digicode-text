// @board xiao_rp2040
// @lib bogde/HX711@0.7.5
// @lib bblanchon/ArduinoJson@7.4.3
// @desc HX711 の重量を移動平均つきで JSON 化し、Serial の JSON コマンドで tare / 校正する

#include <Arduino.h>
#include <HX711.h>
#include <ArduinoJson.h>

static const uint8_t HX711_DOUT = 26;
static const uint8_t HX711_SCK = 27;
static const uint8_t WINDOW = 8;

HX711 scale;
static float window[WINDOW];
static uint8_t windowIndex = 0;
static bool windowFilled = false;
static String inbox;

static float average() {
  const uint8_t count = windowFilled ? WINDOW : windowIndex;
  if (count == 0) return 0.0f;
  float sum = 0.0f;
  for (uint8_t i = 0; i < count; i++) sum += window[i];
  return sum / count;
}

static void handle(const String& line) {
  JsonDocument cmd;
  if (deserializeJson(cmd, line)) {
    Serial.println("{\"ok\":false,\"reason\":\"bad json\"}");
    return;
  }
  const char* action = cmd["action"] | "";
  if (strcmp(action, "tare") == 0) {
    scale.tare(cmd["times"] | 10);
    Serial.print("{\"ok\":true,\"offset\":");
    Serial.print(scale.get_offset());
    Serial.println("}");
  } else if (strcmp(action, "calibrate") == 0) {
    const float knownGrams = cmd["grams"] | 100.0f;
    const double value = scale.get_value(10);
    if (knownGrams > 0.0f) scale.set_scale((float)(value / knownGrams));
    Serial.print("{\"ok\":true,\"scale\":");
    Serial.print(scale.get_scale(), 3);
    Serial.println("}");
  } else {
    Serial.println("{\"ok\":false,\"reason\":\"unknown action\"}");
  }
}

void setup() {
  Serial.begin(115200);
  inbox.reserve(128);
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(420.0f);
  scale.tare(20);
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

  if (!scale.wait_ready_retry(3, 10)) {
    Serial.println("{\"ok\":false,\"reason\":\"hx711 not ready\"}");
    delay(500);
    return;
  }

  window[windowIndex++] = scale.get_units(1);
  if (windowIndex >= WINDOW) {
    windowIndex = 0;
    windowFilled = true;
  }

  JsonDocument doc;
  doc["uptimeMs"] = millis();
  doc["grams"] = average();
  doc["latest"] = window[windowIndex == 0 ? WINDOW - 1 : windowIndex - 1];
  doc["offset"] = scale.get_offset();
  doc["scale"] = scale.get_scale();
  doc["samples"] = windowFilled ? WINDOW : windowIndex;
  serializeJson(doc, Serial);
  Serial.println();
  delay(200);
}
