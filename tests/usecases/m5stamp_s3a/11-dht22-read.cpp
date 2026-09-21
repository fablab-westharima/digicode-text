// @board m5stamp_s3a
// @lib adafruit/DHT sensor library@1.4.7
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @desc DHT22 の温湿度を読み、体感温度と露点を計算してシリアルへ出す

#include <Arduino.h>
#include <DHT.h>

static const uint8_t DHT_PIN = 3; // M5StampS3A: 汎用の GPIO3 を DHT のデータ線に使う
static const uint8_t DHT_TYPE = DHT22;

DHT dht(DHT_PIN, DHT_TYPE);
static uint32_t lastRead = 0;
static uint32_t failures = 0;

static float dewPoint(float tempC, float humidity) {
  const float a = 17.62f;
  const float b = 243.12f;
  const float gamma = (a * tempC) / (b + tempC) + log(humidity / 100.0f);
  return (b * gamma) / (a - gamma);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  dht.begin();
  Serial.println("DHT22 on GPIO4");
}

void loop() {
  const uint32_t now = millis();
  if (now - lastRead < 2500) return; // DHT22 は 2 秒以上あける
  lastRead = now;

  const float humidity = dht.readHumidity();
  const float tempC = dht.readTemperature();
  const float tempF = dht.readTemperature(true);

  if (isnan(humidity) || isnan(tempC)) {
    failures++;
    Serial.print("read failed (");
    Serial.print(failures);
    Serial.println(" total)");
    return;
  }

  const float heatIndex = dht.computeHeatIndex(tempF, humidity);
  Serial.print("t=");
  Serial.print(tempC, 1);
  Serial.print("C rh=");
  Serial.print(humidity, 1);
  Serial.print("% hi=");
  Serial.print(dht.convertFtoC(heatIndex), 1);
  Serial.print("C dew=");
  Serial.print(dewPoint(tempC, humidity), 1);
  Serial.println("C");
}
