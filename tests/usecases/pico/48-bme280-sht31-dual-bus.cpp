// @board pico
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit SHT31 Library@2.2.2
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc 2 つの湿度計を I2C0 と I2C1 に分け、Wire1 の pin を setSDA/setSCL で指定する

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_SHT31.h>
#include <Adafruit_Sensor.h>

// I2C0 (Wire): GP4 SDA / GP5 SCL
static const uint8_t I2C0_SDA = 4;
static const uint8_t I2C0_SCL = 5;
// I2C1 (Wire1): GP6 SDA / GP7 SCL
static const uint8_t I2C1_SDA = 6;
static const uint8_t I2C1_SCL = 7;

static const uint8_t SHT31_ADDRESS = 0x44;
static const uint8_t BME280_I2C_ADDR = 0x76;
static const float AGREE_LIMIT_RH = 5.0f;

Adafruit_SHT31 sht(&Wire);
Adafruit_BME280 bme;

static bool shtReady = false;
static bool bmeReady = false;
static uint32_t disagreements = 0;

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  Wire.setSDA(I2C0_SDA);
  Wire.setSCL(I2C0_SCL);
  Wire.begin();
  Wire.setClock(100000);

  Wire1.setSDA(I2C1_SDA);
  Wire1.setSCL(I2C1_SCL);
  Wire1.begin();
  Wire1.setClock(100000);

  shtReady = sht.begin(SHT31_ADDRESS);
  bmeReady = bme.begin(BME280_I2C_ADDR, &Wire1);

  Serial.print("sht31=");
  Serial.print(shtReady ? "ok" : "ng");
  Serial.print(" bme280=");
  Serial.println(bmeReady ? "ok" : "ng");

  if (bmeReady) {
    bme.setSampling(Adafruit_BME280::MODE_FORCED,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::FILTER_OFF);

    sensor_t info;
    bme.getHumiditySensor()->getSensor(&info);
    Serial.print("bme humidity driver=");
    Serial.print(info.name);
    Serial.print(" maxValue=");
    Serial.println(info.max_value, 1);
  }
}

void loop() {
  float shtT = NAN;
  float shtRh = NAN;
  float bmeT = NAN;
  float bmeRh = NAN;

  if (shtReady) {
    shtT = sht.readTemperature();
    shtRh = sht.readHumidity();
  }
  if (bmeReady && bme.takeForcedMeasurement()) {
    bmeT = bme.readTemperature();
    bmeRh = bme.readHumidity();
  }

  Serial.print("shtC=");
  Serial.print(shtT, 2);
  Serial.print(" shtRh=");
  Serial.print(shtRh, 1);
  Serial.print(" bmeC=");
  Serial.print(bmeT, 2);
  Serial.print(" bmeRh=");
  Serial.print(bmeRh, 1);

  if (!isnan(shtRh) && !isnan(bmeRh)) {
    const float gap = fabsf(shtRh - bmeRh);
    if (gap > AGREE_LIMIT_RH) disagreements++;
    Serial.print(" gapRh=");
    Serial.print(gap, 1);
    Serial.print(" disagreements=");
    Serial.print(disagreements);
  }

  if (!isnan(bmeT)) {
    Serial.print(" hPa=");
    Serial.print(bme.readPressure() / 100.0f, 2);
  }
  Serial.println();

  delay(2000);
}
