// @board xiao_esp32c3
// @lib arduino-libraries/NTPClient@3.2.1
// @lib adafruit/RTClib@2.1.4
// @desc WiFi 接続後に NTP で時刻を取り、ずれていれば DS3231 に書き戻す

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <Wire.h>
#include <NTPClient.h>
#include <RTClib.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const long JST_OFFSET_SEC = 9 * 3600;

WiFiUDP ntpUdp;
NTPClient ntp(ntpUdp, "ntp.nict.jp", JST_OFFSET_SEC, 60000);
RTC_DS3231 rtc;

static bool rtcReady = false;
static uint32_t lastSync = 0;

static void syncRtcFromNtp() {
  if (!ntp.update()) {
    Serial.println("ntp update skipped/failed");
    return;
  }
  if (!ntp.isTimeSet()) {
    Serial.println("ntp time not set yet");
    return;
  }
  const unsigned long epoch = ntp.getEpochTime();
  if (!rtcReady) {
    Serial.print("ntp only: ");
    Serial.println(ntp.getFormattedTime());
    return;
  }
  const DateTime fromNtp((uint32_t)epoch);
  const DateTime fromRtc = rtc.now();
  const long drift = (long)fromNtp.unixtime() - (long)fromRtc.unixtime();
  Serial.print("drift=");
  Serial.print(drift);
  Serial.println("s");
  if (drift > 2 || drift < -2) {
    rtc.adjust(fromNtp);
    Serial.println("rtc adjusted from ntp");
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin(6, 7);
  rtcReady = rtc.begin(&Wire);

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
    if (WiFi.status() == WL_CONNECTED) syncRtcFromNtp();
  }

  if (rtcReady) {
    const DateTime t = rtc.now();
    Serial.printf("rtc %02d:%02d:%02d ntp %02d:%02d:%02d\n",
                  t.hour(), t.minute(), t.second(),
                  ntp.getHours(), ntp.getMinutes(), ntp.getSeconds());
  }
  delay(2000);
}
