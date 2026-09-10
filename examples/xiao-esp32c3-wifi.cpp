#include <Arduino.h>
#include <WiFi.h>

// Dummy values only. Compile verified; connection to a real network is untested.
const char* SSID = "YOUR_TEST_SSID";
const char* PASSWORD = "YOUR_TEST_PASSWORD";
const unsigned long CONNECT_TIMEOUT_MS = 15000;
unsigned long lastReport = 0;

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  Serial.println("Wi-Fi: connecting (15 second limit)");
  const unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < CONNECT_TIMEOUT_MS) {
    delay(250);
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi timeout; continuing without a connection");
    WiFi.disconnect();
  }
}

void loop() {
  if (millis() - lastReport >= 5000) {
    lastReport = millis();
    Serial.print("Wi-Fi status: ");
    Serial.println(static_cast<int>(WiFi.status()));
  }
  delay(10);
}
