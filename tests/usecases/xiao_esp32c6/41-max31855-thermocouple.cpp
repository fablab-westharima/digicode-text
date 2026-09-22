// @board xiao_esp32c6
// @lib adafruit/Adafruit MAX31855 library@1.4.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc MAX31855 熱電対アンプをソフト SPI で読み、エラービットを分類して表示

#include <Arduino.h>
#include <Adafruit_MAX31855.h>

// XIAO ESP32C6: SCK=GPIO19 / MISO=GPIO20 / CS は D7=GPIO17 を使う
static const int8_t MAX_CLK = 8;
static const int8_t MAX_CS = 17;
static const int8_t MAX_DO = 9;
static const uint32_t READ_INTERVAL_MS = 1000;
static const float ALARM_C = 250.0f;

Adafruit_MAX31855 thermocouple(MAX_CLK, MAX_CS, MAX_DO);

static bool ready = false;
static uint32_t lastRead = 0;
static uint32_t faultCount = 0;
static float lastCelsius = NAN;

static void describeError(uint8_t error) {
  if (error & MAX31855_FAULT_OPEN) Serial.println("fault: open circuit");
  if (error & MAX31855_FAULT_SHORT_GND) Serial.println("fault: short to GND");
  if (error & MAX31855_FAULT_SHORT_VCC) Serial.println("fault: short to VCC");
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("MAX31855 thermocouple");
  ready = thermocouple.begin();
  if (!ready) Serial.println("MAX31855 begin failed");
  delay(500);
}

void loop() {
  const uint32_t now = millis();
  if (!ready || now - lastRead < READ_INTERVAL_MS) {
    delay(20);
    return;
  }
  lastRead = now;

  const uint8_t error = thermocouple.readError();
  if (error) {
    faultCount++;
    describeError(error);
    return;
  }

  const double celsius = thermocouple.readCelsius();
  const double internal = thermocouple.readInternal();
  if (isnan(celsius)) {
    faultCount++;
    Serial.println("read returned NaN");
    return;
  }

  lastCelsius = (float)celsius;
  Serial.printf("tc=%.2fC cold-junction=%.2fC faults=%lu\n",
                celsius, internal, (unsigned long)faultCount);
  if (lastCelsius > ALARM_C) Serial.println("ALARM: over temperature");
}
