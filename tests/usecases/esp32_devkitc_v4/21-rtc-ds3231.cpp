// @board esp32_devkitc_v4
// @lib adafruit/RTClib@2.1.4
// @desc DS3231 RTC を初期化し、現在時刻・内蔵温度・次のイベントまでの TimeSpan を出す

#include <Arduino.h>
#include <Wire.h>
#include <RTClib.h>

RTC_DS3231 rtc;
static bool ready = false;
static const char* DAYS[] = { "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" };

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin(21, 22);

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
  rtc.clearAlarm(1);
  rtc.clearAlarm(2);
  rtc.writeSqwPinMode(DS3231_OFF);
}

void loop() {
  if (!ready) {
    delay(5000);
    return;
  }

  const DateTime now = rtc.now();
  Serial.printf("%04d-%02d-%02d %02d:%02d:%02d %s unix=%lu\n",
                now.year(), now.month(), now.day(),
                now.hour(), now.minute(), now.second(),
                DAYS[now.dayOfTheWeek()], (unsigned long)now.unixtime());

  const DateTime future = now + TimeSpan(0, 1, 30, 0);
  Serial.print("next window at ");
  Serial.println(future.timestamp(DateTime::TIMESTAMP_FULL));

  const TimeSpan remaining = future - now;
  Serial.printf("in %dh%dm%ds (temp %.2fC)\n",
                remaining.hours(), remaining.minutes(), remaining.seconds(),
                rtc.getTemperature());
  delay(3000);
}
