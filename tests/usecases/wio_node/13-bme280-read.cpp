// @board wio_node
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc Grove I2C の BME280 を forced mode で読む

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BME280.h>

static const float SEALEVEL_HPA = 1013.25f;
static const uint8_t GROVE_POWER = 15;

Adafruit_BME280 bme;
static bool ready = false;

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  Wire.begin(4, 5); // Wio Node: SDA=GPIO4 SCL=GPIO5
  ready = bme.begin(0x76, &Wire);
  if (!ready) {
    Serial.printf("BME280 not found, sensorID=0x%02X\n", bme.sensorID());
    return;
  }
  bme.setSampling(Adafruit_BME280::MODE_FORCED,
                  Adafruit_BME280::SAMPLING_X1,
                  Adafruit_BME280::SAMPLING_X1,
                  Adafruit_BME280::SAMPLING_X1,
                  Adafruit_BME280::FILTER_OFF);
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
  Serial.printf("t=%.2fC p=%.2fhPa rh=%.2f%% alt=%.1fm\n",
                bme.readTemperature(), bme.readPressure() / 100.0f,
                bme.readHumidity(), bme.readAltitude(SEALEVEL_HPA));
  delay(5000);
}
