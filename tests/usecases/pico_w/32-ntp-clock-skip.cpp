// @board pico_w
// @desc コア同梱の NTP (lwIP SNTP) で時計を合わせ、JST の時刻を Serial に出す (追加ライブラリなし)

#include <Arduino.h>
#include <WiFi.h>
#include <time.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

// arduino-pico の NTP クラスは WiFi ライブラリ同梱で、lwIP の SNTP を呼ぶだけの薄い皮。
// タイムゾーンは扱わないので、UTC の epoch に自分で JST の 9 時間を足して gmtime_r に渡す。
static const char* NTP_PRIMARY = "ntp.nict.jp";
static const char* NTP_SECONDARY = "pool.ntp.org";
static const time_t JST_OFFSET_SEC = 9 * 3600;

// LED はリンク状態の目印。Pico W のユーザー LED は RP2040 の GPIO25 ではなく無線チップ
// CYW43439 側にある。core が擬似ピン 64 を LED_BUILTIN に割り当てるので、番号ではなく
// LED_BUILTIN を使う。
static uint32_t lastPrint = 0;
static uint32_t resyncs = 0;

static bool wifiUp() {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  return WiFi.status() == WL_CONNECTED;
}

static void printClock() {
  const time_t utc = time(nullptr);
  // epoch が 1970 のままなら SNTP がまだ返ってきていない。
  const bool set = utc > 1000000000;

  struct tm jst;
  const time_t shifted = utc + JST_OFFSET_SEC;
  gmtime_r(&shifted, &jst);

  Serial.printf("set=%d epoch=%lu jst=%04d-%02d-%02dT%02d:%02d:%02d resyncs=%lu rssi=%d\n",
                set ? 1 : 0, (unsigned long)utc,
                jst.tm_year + 1900, jst.tm_mon + 1, jst.tm_mday,
                jst.tm_hour, jst.tm_min, jst.tm_sec,
                (unsigned long)resyncs, (int)WiFi.RSSI());

  digitalWrite(LED_BUILTIN, set ? HIGH : LOW);
}

void setup() {
  Serial.begin(115200);
  const uint32_t serialDeadline = millis() + 3000;
  while (!Serial && millis() < serialDeadline) delay(10);

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  Serial.println(wifiUp() ? "wifi ok" : "wifi failed");

  NTP.begin(NTP_PRIMARY, NTP_SECONDARY);
  // waitSet は epoch が入るまで待つ。AP が無い環境では timeout して false で戻る。
  Serial.println(NTP.waitSet(10000) ? "ntp set" : "ntp not set yet");
  resyncs++;
}

void loop() {
  if (!wifiUp()) {
    Serial.println("wifi down; waiting");
    delay(2000);
    return;
  }

  // リンクが落ちて上がり直したあとは SNTP を張り直す。
  if (!NTP.running()) {
    NTP.begin(NTP_PRIMARY, NTP_SECONDARY);
    resyncs++;
  }

  const uint32_t now = millis();
  if (now - lastPrint >= 2000) {
    lastPrint = now;
    printClock();
  }
}
