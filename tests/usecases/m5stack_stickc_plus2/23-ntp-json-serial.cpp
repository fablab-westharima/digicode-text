// @board m5stack_stickc_plus2
// @lib arduino-libraries/NTPClient@3.2.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc NTP で取った時刻を含むタイムスタンプ付き JSON レコードをシリアルに流す

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

WiFiUDP udp;
NTPClient ntp(udp, "pool.ntp.org", 9 * 3600, 60000);

// StickC Plus2: この variant は A0 から An のマクロを定義しないので、ADC の GPIO 番号を並べておく。
static const uint8_t ADC_PINS[4] = { 36, 32, 33, 26 };

static uint32_t sequence = 0;
static uint32_t lastRecord = 0;

static void emitRecord() {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["epoch"] = ntp.getEpochTime();
  doc["timeSet"] = ntp.isTimeSet();
  doc["localTime"] = ntp.getFormattedTime();
  doc["weekday"] = ntp.getDay();

  JsonObject net = doc["net"].to<JsonObject>();
  net["connected"] = WiFi.status() == WL_CONNECTED;
  net["rssi"] = WiFi.RSSI();
  net["ip"] = WiFi.localIP().toString();

  JsonArray samples = doc["samples"].to<JsonArray>();
  for (uint8_t i = 0; i < 4; i++) {
    JsonObject s = samples.add<JsonObject>();
    s["ch"] = i;
    s["raw"] = analogRead(ADC_PINS[i]);
  }

  serializeJson(doc, Serial);
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  analogReadResolution(12);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);

  ntp.begin();
  ntp.forceUpdate();
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) ntp.update();
  const uint32_t now = millis();
  if (now - lastRecord >= 5000) {
    lastRecord = now;
    emitRecord();
  }
}
