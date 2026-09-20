// @board m5stamp_c5
// @lib adafruit/Adafruit NeoPixel@1.15.5
// @lib adafruit/DHT sensor library@1.4.7
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @desc DHT22 の温度に応じて NeoPixel の色を青-緑-赤に変え、閾値超えで点滅させる

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>
#include <DHT.h>

static const uint8_t DHT_PIN = 0;
static const uint8_t PIXEL_PIN = 25;
static const uint16_t PIXEL_COUNT = 8;
static const float ALARM_C = 30.0f;

DHT dht(DHT_PIN, DHT22);
Adafruit_NeoPixel strip(PIXEL_COUNT, PIXEL_PIN, NEO_GRB + NEO_KHZ800);

static float lastTemp = NAN;
static uint32_t lastRead = 0;
static uint32_t lastFrame = 0;

static uint32_t colorForTemp(float c) {
  if (isnan(c)) return strip.Color(32, 0, 32); // 紫 = 読めていない
  const float clamped = constrain(c, 10.0f, 35.0f);
  // 10C を青 (hue 43690) から 35C を赤 (hue 0) へ回す
  const uint16_t hue = (uint16_t)(43690.0f * (35.0f - clamped) / 25.0f);
  return strip.gamma32(strip.ColorHSV(hue, 255, 200));
}

void setup() {
  Serial.begin(115200);
  delay(200);
  dht.begin();
  strip.begin();
  strip.setBrightness(60);
  strip.clear();
  strip.show();
}

void loop() {
  const uint32_t now = millis();

  if (now - lastRead >= 2500) {
    lastRead = now;
    const float t = dht.readTemperature();
    const float h = dht.readHumidity();
    if (!isnan(t)) {
      lastTemp = t;
      Serial.print(t, 1);
      Serial.print("C ");
      Serial.print(h, 1);
      Serial.println("%");
    } else {
      Serial.println("dht read failed");
    }
  }

  if (now - lastFrame < 50) return;
  lastFrame = now;

  const bool alarming = !isnan(lastTemp) && lastTemp >= ALARM_C;
  if (alarming && (now / 200) % 2 == 0) {
    strip.clear();
  } else {
    strip.fill(colorForTemp(lastTemp), 0, PIXEL_COUNT);
  }
  strip.show();
}
