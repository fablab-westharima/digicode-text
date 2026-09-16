// @board wio_node
// @lib adafruit/RTClib@2.1.4
// @desc Grove I2C の DS3231 を読み書きし、TimeSpan と温度を扱う

#include <Arduino.h>
#include <Wire.h>
#include <RTClib.h>

static const uint8_t GROVE_POWER = 15;
static const char* DAYS[] = { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };

RTC_DS3231 rtc;
static bool ready = false;

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  Wire.begin(4, 5);
  ready = rtc.begin(&Wire);
  if (!ready) {
    Serial.println("DS3231 not found");
    return;
  }
  if (rtc.lostPower()) {
    Serial.println("RTC lost power, setting build time");
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }
  rtc.disable32K();
  rtc.writeSqwPinMode(DS3231_OFF);
}

void loop() {
  if (!ready) {
    delay(5000);
    return;
  }
  const DateTime now = rtc.now();
  Serial.printf("%04d-%02d-%02d %02d:%02d:%02d %s unix=%lu temp=%.2fC\n",
                now.year(), now.month(), now.day(),
                now.hour(), now.minute(), now.second(),
                DAYS[now.dayOfTheWeek()], (unsigned long)now.unixtime(),
                rtc.getTemperature());

  const DateTime next = now + TimeSpan(0, 0, 15, 0);
  Serial.print("next sample window: ");
  Serial.println(next.timestamp(DateTime::TIMESTAMP_TIME));
  delay(3000);
}
