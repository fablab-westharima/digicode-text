// @board xiao_esp32c3
// @lib greiman/SdFat@2.3.1
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc I2C の BME280 を読んで SdFat で CSV に落とし、直近の行を Serial にも出す

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <SdFat.h>
#include <Adafruit_BME280.h>

static const uint8_t SD_SCK = 8;
static const uint8_t SD_MISO = 9;
static const uint8_t SD_MOSI = 10;
static const uint8_t SD_CS = 20;
static const char* LOG_PATH = "bme280.csv";
static const float SEALEVEL_HPA = 1013.25f;
static const uint32_t SAMPLE_INTERVAL_MS = 10000;

SdFat sd;
Adafruit_BME280 bme;

static bool mounted = false;
static bool sensorReady = false;
static uint32_t rows = 0;
static uint32_t lastSample = 0;

static void ensureHeader() {
  if (sd.exists(LOG_PATH)) return;
  FsFile file = sd.open(LOG_PATH, O_RDWR | O_CREAT | O_AT_END);
  if (!file) return;
  file.println("uptimeMs,temperatureC,humidityPct,pressureHpa,altitudeM");
  file.close();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  Wire.begin(6, 7);
  sensorReady = bme.begin(0x76, &Wire);
  if (!sensorReady) sensorReady = bme.begin(0x77, &Wire);
  if (sensorReady) {
    bme.setSampling(Adafruit_BME280::MODE_FORCED,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::FILTER_OFF);
  } else {
    Serial.println("bme280 missing");
  }

  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
  mounted = sd.begin(SD_CS, SD_SCK_MHZ(8));
  if (!mounted) {
    Serial.println("sd mount failed");
    return;
  }
  ensureHeader();
  Serial.println("logger ready");
}

void loop() {
  const uint32_t now = millis();
  if (now - lastSample < SAMPLE_INTERVAL_MS) {
    delay(50);
    return;
  }
  lastSample = now;
  if (!sensorReady || !mounted) return;

  bme.takeForcedMeasurement();
  const float t = bme.readTemperature();
  const float h = bme.readHumidity();
  const float p = bme.readPressure() / 100.0f;
  const float alt = bme.readAltitude(SEALEVEL_HPA);
  if (isnan(t) || isnan(p)) {
    Serial.println("bme280 read failed");
    return;
  }

  FsFile file = sd.open(LOG_PATH, O_RDWR | O_CREAT | O_AT_END);
  if (!file) {
    Serial.println("open failed");
    return;
  }
  file.print(now);
  file.print(',');
  file.print(t, 2);
  file.print(',');
  file.print(h, 2);
  file.print(',');
  file.print(p, 2);
  file.print(',');
  file.println(alt, 2);
  file.sync();
  file.close();
  rows++;

  Serial.printf("%lu,%.2f,%.2f,%.2f,%.2f rows=%lu\n",
                (unsigned long)now, t, h, p, alt, (unsigned long)rows);
}
