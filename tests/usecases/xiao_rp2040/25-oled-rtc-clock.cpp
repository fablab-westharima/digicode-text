// @board xiao_rp2040
// @lib adafruit/RTClib@2.1.4
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc DS3231 の時刻を OLED に大きく描き、秒針代わりの進捗バーを出す

#include <Arduino.h>
#include <Wire.h>
#include <RTClib.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);
RTC_DS3231 rtc;
static bool rtcReady = false;

static const char* const WEEKDAYS[] = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};

void setup() {
  Serial.begin(115200);
  Wire.setSDA(6);
  Wire.setSCL(7);
  Wire.begin();
  Wire.setClock(400000);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) Serial.println("ssd1306 not found");
  display.setTextColor(SSD1306_WHITE);

  rtcReady = rtc.begin(&Wire);
  if (rtcReady && rtc.lostPower()) rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
}

void loop() {
  display.clearDisplay();

  if (!rtcReady) {
    display.setTextSize(1);
    display.setCursor(0, 28);
    display.println(F("RTC not found"));
    display.display();
    delay(1000);
    return;
  }

  const DateTime now = rtc.now();

  char hhmm[6];
  snprintf(hhmm, sizeof(hhmm), "%02u:%02u", now.hour(), now.minute());
  display.setTextSize(3);
  display.setCursor(10, 8);
  display.print(hhmm);

  display.setTextSize(1);
  display.setCursor(10, 36);
  display.print(now.year());
  display.print('-');
  if (now.month() < 10) display.print('0');
  display.print(now.month());
  display.print('-');
  if (now.day() < 10) display.print('0');
  display.print(now.day());
  display.print(' ');
  display.print(WEEKDAYS[now.dayOfTheWeek()]);

  // 秒の進みを下のバーで表す。
  display.drawRect(0, 52, 128, 10, SSD1306_WHITE);
  display.fillRect(2, 54, map(now.second(), 0, 59, 0, 124), 6, SSD1306_WHITE);
  display.display();

  Serial.print("unix=");
  Serial.print(now.unixtime());
  Serial.print(" tempC=");
  Serial.println(rtc.getTemperature(), 2);
  delay(500);
}
