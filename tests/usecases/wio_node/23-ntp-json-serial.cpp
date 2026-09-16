// @board wio_node
// @lib arduino-libraries/NTPClient@3.2.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc NTP のエポックを付けた JSON レコードをシリアルへ流す

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <NTPClient.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint8_t GROVE_POWER = 15;

WiFiUDP udp;
NTPClient ntp(udp, "pool.ntp.org", 9 * 3600, 60000);

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
  net["mac"] = WiFi.macAddress();

  JsonObject chip = doc["chip"].to<JsonObject>();
  chip["id"] = ESP.getChipId();
  chip["heap"] = ESP.getFreeHeap();
  chip["a0"] = analogRead(A0);

  serializeJson(doc, Serial);
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  WiFi.persistent(false);
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
  yield();
}
