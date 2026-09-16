// @board xiao_rp2040
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc BME280 を強制測定モードで叩き、気圧から海面更正と推定高度も出す

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>

static const uint8_t BME280_I2C_ADDRESS = 0x76;
static const float SEA_LEVEL_HPA = 1013.25f;

Adafruit_BME280 bme;
static bool ready = false;

void setup() {
  Serial.begin(115200);
  delay(200);

  Wire.setSDA(6);
  Wire.setSCL(7);
  Wire.begin();

  ready = bme.begin(BME280_I2C_ADDRESS, &Wire);
  if (!ready) {
    Serial.println("bme280 not found");
    return;
  }

  // 省電力の強制測定モード。読むときだけ 1 回変換させる。
  bme.setSampling(Adafruit_BME280::MODE_FORCED,
                  Adafruit_BME280::SAMPLING_X1,
                  Adafruit_BME280::SAMPLING_X1,
                  Adafruit_BME280::SAMPLING_X1,
                  Adafruit_BME280::FILTER_OFF);

  Adafruit_Sensor* temp = bme.getTemperatureSensor();
  sensor_t info;
  temp->getSensor(&info);
  Serial.print("driver=");
  Serial.print(info.name);
  Serial.print(" version=");
  Serial.println(info.version);
}

void loop() {
  if (!ready) {
    delay(1000);
    return;
  }

  if (!bme.takeForcedMeasurement()) {
    Serial.println("forced measurement failed");
    delay(1000);
    return;
  }

  const float tempC = bme.readTemperature();
  const float hPa = bme.readPressure() / 100.0f;
  const float rh = bme.readHumidity();

  Serial.print("tempC=");
  Serial.print(tempC, 2);
  Serial.print(" hPa=");
  Serial.print(hPa, 2);
  Serial.print(" rh=");
  Serial.print(rh, 1);
  Serial.print(" altitudeM=");
  Serial.print(bme.readAltitude(SEA_LEVEL_HPA), 1);
  Serial.print(" seaLevelHPa=");
  Serial.println(bme.seaLevelForAltitude(12.0f, hPa), 2);

  delay(2000);
}
