// @board wio_node
// @lib adafruit/DHT sensor library@1.4.7
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @desc Grove の DHT22 を読み、露点と体感温度を計算して LED で状態を示す

#include <Arduino.h>
#include <DHT.h>

static const uint8_t DHT_PIN = 12;
static const uint8_t GROVE_POWER = 15;
static const uint8_t STATUS_LED = 2; // アクティブ LOW

DHT dht(DHT_PIN, DHT22);
static uint32_t lastRead = 0;
static uint32_t failures = 0;

static float dewPoint(float tempC, float humidity) {
  const float a = 17.62f, b = 243.12f;
  const float gamma = (a * tempC) / (b + tempC) + log(humidity / 100.0f);
  return (b * gamma) / (a - gamma);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, HIGH);
  delay(300);
  dht.begin();
}

void loop() {
  const uint32_t now = millis();
  if (now - lastRead < 2500) return;
  lastRead = now;

  const float h = dht.readHumidity();
  const float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    failures++;
    digitalWrite(STATUS_LED, HIGH);
    Serial.printf("read failed (%lu)\n", (unsigned long)failures);
    return;
  }

  digitalWrite(STATUS_LED, LOW); // 読めている間は点灯
  const float hiF = dht.computeHeatIndex(dht.readTemperature(true), h);
  Serial.printf("t=%.1fC rh=%.1f%% hi=%.1fC dew=%.1fC\n",
                t, h, dht.convertFtoC(hiF), dewPoint(t, h));
}
