// @board esp32_c5_devkitc_1
// @lib arduino-libraries/NTPClient@3.2.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc NTP で取った epoch を RFC3339 の文字列にして、1 行 1 JSON のログとして Serial へ流す

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint8_t ADC_PIN = 1;
static const uint32_t LOG_INTERVAL_MS = 5000;

WiFiUDP udp;
// ログの時刻は UTC で持ち、表示側で寄せる。offset は 0。
NTPClient ntp(udp, "ntp.nict.jp", 0, 60000);

static uint32_t lastLog = 0;
static uint32_t recordId = 0;
static uint32_t bootEpoch = 0;

// epoch から "YYYY-MM-DDThh:mm:ssZ" を作る。gmtime_r は newlib 側にある。
static void formatRfc3339(uint32_t epoch, char* out, size_t size) {
  const time_t t = (time_t)epoch;
  struct tm parts;
  gmtime_r(&t, &parts);
  snprintf(out, size, "%04d-%02d-%02dT%02d:%02d:%02dZ",
           parts.tm_year + 1900, parts.tm_mon + 1, parts.tm_mday,
           parts.tm_hour, parts.tm_min, parts.tm_sec);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  analogReadResolution(12);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  ntp.begin();
  if (ntp.forceUpdate()) {
    bootEpoch = (uint32_t)ntp.getEpochTime() - millis() / 1000;
    Serial.print("ntp ok, boot epoch=");
    Serial.println(bootEpoch);
  } else {
    Serial.println("ntp failed; timestamps will be relative");
  }
}

void loop() {
  ntp.update();

  const uint32_t now = millis();
  if (now - lastLog < LOG_INTERVAL_MS) return;
  lastLog = now;

  // NTP が取れていればその epoch、取れていなければ起動時 epoch + 経過秒で埋める。
  const bool synced = ntp.isTimeSet();
  const uint32_t epoch = synced ? (uint32_t)ntp.getEpochTime() : bootEpoch + now / 1000;

  char timestamp[32];
  formatRfc3339(epoch, timestamp, sizeof(timestamp));

  JsonDocument doc;
  doc["ts"] = timestamp;
  doc["id"] = recordId++;
  doc["synced"] = synced;
  doc["uptimeMs"] = now;
  doc["adc"] = analogRead(ADC_PIN);
  doc["rssi"] = WiFi.RSSI();

  serializeJson(doc, Serial);
  Serial.println();
}
