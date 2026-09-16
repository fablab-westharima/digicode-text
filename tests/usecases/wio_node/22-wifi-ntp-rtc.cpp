// @board wio_node
// @lib arduino-libraries/NTPClient@3.2.1
// @lib adafruit/RTClib@2.1.4
// @desc ESP8266 で NTP から時刻を取り、ずれていれば DS3231 に書き戻す

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <Wire.h>
#include <NTPClient.h>
#include <RTClib.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const long JST_OFFSET_SEC = 9 * 3600;
static const uint8_t GROVE_POWER = 15;

WiFiUDP ntpUdp;
NTPClient ntp(ntpUdp, "ntp.nict.jp", JST_OFFSET_SEC, 60000);
RTC_DS3231 rtc;

static bool rtcReady = false;
static uint32_t lastSync = 0;

static void syncFromNtp() {
  if (!ntp.update()) return;
  if (!ntp.isTimeSet()) {
    Serial.println("ntp time not set");
    return;
  }
  const DateTime fromNtp((uint32_t)ntp.getEpochTime());
  if (!rtcReady) {
    Serial.print("ntp only: ");
    Serial.println(ntp.getFormattedTime());
    return;
  }
  const long drift = (long)fromNtp.unixtime() - (long)rtc.now().unixtime();
  Serial.printf("drift=%lds\n", drift);
  if (drift > 2 || drift < -2) {
    rtc.adjust(fromNtp);
    Serial.println("rtc adjusted");
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  Wire.begin(4, 5);
  rtcReady = rtc.begin(&Wire);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  ntp.begin();
  ntp.setUpdateInterval(60000);
}

void loop() {
  const uint32_t now = millis();
  if (now - lastSync >= 30000) {
    lastSync = now;
    if (WiFi.status() == WL_CONNECTED) syncFromNtp();
  }
  if (rtcReady) {
    const DateTime t = rtc.now();
    Serial.printf("rtc %02d:%02d:%02d / ntp %02d:%02d:%02d\n",
                  t.hour(), t.minute(), t.second(),
                  ntp.getHours(), ntp.getMinutes(), ntp.getSeconds());
  }
  delay(2000);
}
