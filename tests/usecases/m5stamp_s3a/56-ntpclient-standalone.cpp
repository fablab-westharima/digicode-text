// @board m5stamp_s3a
// @lib arduino-libraries/NTPClient@3.2.1
// @desc NTPClient 単体。NTP サーバを順に試し、update / forceUpdate / isTimeSet の挙動を Serial で確かめる

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const long JST_OFFSET_SEC = 9 * 3600;
static const uint32_t POOL_SWITCH_MS = 60000;

static const char* NTP_POOL[] = {"ntp.nict.jp", "pool.ntp.org", "time.cloudflare.com"};
static const uint8_t POOL_SIZE = sizeof(NTP_POOL) / sizeof(NTP_POOL[0]);

WiFiUDP udp;
NTPClient ntp(udp, NTP_POOL[0], JST_OFFSET_SEC, 30000);

static uint8_t poolIndex = 0;
static uint32_t lastSwitch = 0;
static uint32_t updates = 0;
static uint32_t failures = 0;

static void switchPool() {
  poolIndex = (uint8_t)((poolIndex + 1) % POOL_SIZE);
  ntp.setPoolServerName(NTP_POOL[poolIndex]);
  Serial.print("switching ntp pool to ");
  Serial.println(NTP_POOL[poolIndex]);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  ntp.begin();
  ntp.setTimeOffset(JST_OFFSET_SEC);
  ntp.setUpdateInterval(30000);

  // 初回だけは間隔を無視して取りに行く。
  if (ntp.forceUpdate()) {
    updates++;
    Serial.print("first sync: ");
    Serial.println(ntp.getFormattedTime());
  } else {
    failures++;
    Serial.println("first sync failed");
  }
  lastSwitch = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("wifi down; waiting");
    delay(2000);
    return;
  }

  if (ntp.update()) {
    updates++;
  } else if (!ntp.isTimeSet()) {
    failures++;
    // 取れないまま一定時間が経ったら別のサーバに切り替える。
    if (millis() - lastSwitch > POOL_SWITCH_MS) {
      lastSwitch = millis();
      switchPool();
    }
  }

  Serial.printf("set=%d epoch=%lu %02d:%02d:%02d day=%d updates=%lu failures=%lu\n",
                ntp.isTimeSet() ? 1 : 0,
                (unsigned long)ntp.getEpochTime(),
                ntp.getHours(), ntp.getMinutes(), ntp.getSeconds(), ntp.getDay(),
                (unsigned long)updates, (unsigned long)failures);
  delay(2000);
}
