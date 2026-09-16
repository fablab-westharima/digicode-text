// @board wio_node
// @lib adafruit/Adafruit MAX31855 library@1.4.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc Grove 給電した MAX31855 をソフト SPI で読み、fault ビットを分類する

#include <Arduino.h>
#include <Adafruit_MAX31855.h>

// Wio Node: SCK=GPIO14(D5) MISO=GPIO12(D6) を流用し、CS は GPIO16(D0)。
static const int8_t MAX_CLK = 14;
static const int8_t MAX_CS = 16;
static const int8_t MAX_DO = 12;
static const uint8_t GROVE_POWER = 15;
static const uint32_t READ_INTERVAL_MS = 1000;
static const float ALARM_C = 250.0f;

Adafruit_MAX31855 thermocouple(MAX_CLK, MAX_CS, MAX_DO);

static bool ready = false;
static uint32_t lastRead = 0;
static uint32_t faultCount = 0;

static void describeError(uint8_t error) {
  if (error & MAX31855_FAULT_OPEN) Serial.println("fault: open circuit");
  if (error & MAX31855_FAULT_SHORT_GND) Serial.println("fault: short to GND");
  if (error & MAX31855_FAULT_SHORT_VCC) Serial.println("fault: short to VCC");
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  ready = thermocouple.begin();
  Serial.println(ready ? "MAX31855 ready" : "MAX31855 begin failed");
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

  Serial.printf("tc=%.2fC cold-junction=%.2fC faults=%lu heap=%u\n",
                celsius, internal, (unsigned long)faultCount,
                (unsigned)ESP.getFreeHeap());
  if (celsius > ALARM_C) Serial.println("ALARM: over temperature");
}
