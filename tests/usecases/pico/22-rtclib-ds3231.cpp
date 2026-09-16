// @board pico
// @lib adafruit/RTClib@2.1.4
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc DS3231 の時刻・温度を読み、1 分後のアラームを仕掛けて SQW で受ける

#include <Arduino.h>
#include <Wire.h>
#include <RTClib.h>

static const uint8_t SQW_PIN = 21;  // GP21

RTC_DS3231 rtc;
static bool ready = false;

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(SQW_PIN, INPUT_PULLUP);

  Wire.begin();

  ready = rtc.begin(&Wire);
  if (!ready) {
    Serial.println("ds3231 not found");
    return;
  }
  if (rtc.lostPower()) {
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }

  rtc.disable32K();
  rtc.writeSqwPinMode(DS3231_OFF);
  rtc.clearAlarm(1);
  rtc.clearAlarm(2);
  rtc.disableAlarm(2);

  const DateTime now = rtc.now();
  if (!rtc.setAlarm1(now + TimeSpan(60), DS3231_A1_Second)) {
    Serial.println("alarm1 set failed");
  }
}

void loop() {
  if (!ready) {
    delay(1000);
    return;
  }

  const DateTime now = rtc.now();
  char buffer[] = "YYYY-MM-DD hh:mm:ss";
  Serial.print(now.toString(buffer));
  Serial.print(" dow=");
  Serial.print(now.dayOfTheWeek());
  Serial.print(" unix=");
  Serial.print(now.unixtime());
  Serial.print(" rtcTempC=");
  Serial.println(rtc.getTemperature(), 2);

  if (rtc.alarmFired(1)) {
    Serial.println("alarm1 fired");
    rtc.clearAlarm(1);
    rtc.setAlarm1(rtc.now() + TimeSpan(60), DS3231_A1_Second);
  }
  delay(1000);
}
