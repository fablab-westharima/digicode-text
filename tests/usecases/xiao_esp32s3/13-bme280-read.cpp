// @board xiao_esp32s3
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc I2C の BME280 を weather station 設定で読み、気温・気圧・湿度・推定高度を出す

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BME280.h>

static const float SEALEVEL_HPA = 1013.25f;
static const uint8_t BME280_ADDR = 0x76;

Adafruit_BME280 bme;
static bool ready = false;

void setup() {
  Serial.begin(115200);
  delay(200);

  // XIAO ESP32S3: SDA=D4(GPIO5) SCL=D5(GPIO6)
  Wire.begin(5, 6);

  ready = bme.begin(BME280_ADDR, &Wire);
  if (!ready) {
    Serial.print("BME280 not found, sensorID=0x");
    Serial.println(bme.sensorID(), HEX);
    return;
  }

  bme.setSampling(Adafruit_BME280::MODE_FORCED,
                  Adafruit_BME280::SAMPLING_X1,  // temperature
                  Adafruit_BME280::SAMPLING_X1,  // pressure
                  Adafruit_BME280::SAMPLING_X1,  // humidity
                  Adafruit_BME280::FILTER_OFF);
  Serial.println("BME280 ready (forced mode)");
}

void loop() {
  if (!ready) {
    Serial.println("no sensor");
    delay(5000);
    return;
  }

  if (!bme.takeForcedMeasurement()) {
    Serial.println("forced measurement failed");
    delay(2000);
    return;
  }

  Serial.print("t=");
  Serial.print(bme.readTemperature(), 2);
  Serial.print("C p=");
  Serial.print(bme.readPressure() / 100.0f, 2);
  Serial.print("hPa rh=");
  Serial.print(bme.readHumidity(), 2);
  Serial.print("% alt=");
  Serial.print(bme.readAltitude(SEALEVEL_HPA), 1);
  Serial.println("m");
  delay(5000);
}
