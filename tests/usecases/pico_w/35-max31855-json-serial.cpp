// @board pico_w
// @lib adafruit/Adafruit MAX31855 library@1.4.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib bblanchon/ArduinoJson@7.4.3
// @desc 熱電対 3 系統を移動平均して JSON 1 行にまとめ、閾値超過を alarm 配列で出す

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_MAX31855.h>
#include <ArduinoJson.h>

static const uint8_t TC_SCK = 10;
static const uint8_t TC_DO = 12;
static const uint8_t TC_CS_A = 11;
static const uint8_t TC_CS_B = 13;
static const uint8_t TC_CS_C = 14;

static const float ALARM_C = 250.0f;
static const uint8_t WINDOW = 8;
static const uint8_t CHANNEL_COUNT = 3;

Adafruit_MAX31855 tcA(TC_SCK, TC_CS_A, TC_DO);
Adafruit_MAX31855 tcB(TC_SCK, TC_CS_B, TC_DO);
Adafruit_MAX31855 tcC(TC_SCK, TC_CS_C, TC_DO);

struct Channel {
  Adafruit_MAX31855* device;
  const char* name;
  float samples[WINDOW];
  uint8_t filled;
  uint8_t cursor;
  uint8_t lastFault;
};

static Channel channels[CHANNEL_COUNT] = {
  {&tcA, "zone-a", {0}, 0, 0, 0},
  {&tcB, "zone-b", {0}, 0, 0, 0},
  {&tcC, "exhaust", {0}, 0, 0, 0},
};

static float pushSample(Channel& ch, float value) {
  ch.samples[ch.cursor] = value;
  ch.cursor = (ch.cursor + 1) % WINDOW;
  if (ch.filled < WINDOW) ch.filled++;

  float sum = 0.0f;
  for (uint8_t i = 0; i < ch.filled; i++) sum += ch.samples[i];
  return sum / ch.filled;
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
    if (!channels[i].device->begin()) {
      Serial.print("{\"error\":\"begin failed\",\"channel\":\"");
      Serial.print(channels[i].name);
      Serial.println("\"}");
    }
  }
}

void loop() {
  JsonDocument doc;
  doc["uptimeMs"] = millis();
  doc["coldC"] = tcA.readInternal();

  JsonArray readings = doc["readings"].to<JsonArray>();
  JsonArray alarms = doc["alarms"].to<JsonArray>();

  for (uint8_t i = 0; i < CHANNEL_COUNT; i++) {
    Channel& ch = channels[i];
    JsonObject item = readings.add<JsonObject>();
    item["name"] = ch.name;

    ch.lastFault = ch.device->readError();
    if (ch.lastFault) {
      item["fault"] = ch.lastFault;
      item["ok"] = false;
      alarms.add(ch.name);
      continue;
    }

    const double raw = ch.device->readCelsius();
    if (isnan(raw)) {
      item["ok"] = false;
      item["fault"] = 0xFF;
      alarms.add(ch.name);
      continue;
    }

    const float avg = pushSample(ch, (float)raw);
    item["ok"] = true;
    item["rawC"] = (float)raw;
    item["avgC"] = avg;
    item["window"] = ch.filled;
    if (avg > ALARM_C) alarms.add(ch.name);
  }

  doc["alarmCount"] = alarms.size();
  serializeJson(doc, Serial);
  Serial.println();
  delay(2000);
}
