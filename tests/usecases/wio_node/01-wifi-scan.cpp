// @board wio_node
// @desc コア同梱の ESP8266WiFi だけで AP スキャンと接続を試す (追加ライブラリなし)

#include <Arduino.h>
#include <ESP8266WiFi.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

// Wio Node: Grove ポートの電源は GPIO15、青 LED は GPIO2。
static const uint8_t GROVE_POWER = 15;
static const uint8_t STATUS_LED = 2;

static void scanOnce() {
  const int found = WiFi.scanNetworks();
  if (found <= 0) {
    Serial.println("no networks");
    return;
  }
  for (int i = 0; i < found; i++) {
    Serial.printf("%d: %s ch=%d rssi=%d enc=%d hidden=%d\n",
                  i, WiFi.SSID(i).c_str(), WiFi.channel(i), WiFi.RSSI(i),
                  (int)WiFi.encryptionType(i), WiFi.isHidden(i) ? 1 : 0);
  }
  WiFi.scanDelete();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, HIGH); // アクティブ LOW なので消灯

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  Serial.println();
  Serial.print("mac: ");
  Serial.println(WiFi.macAddress());
  Serial.print("chip id: ");
  Serial.println(ESP.getChipId(), HEX);
  Serial.print("free heap: ");
  Serial.println(ESP.getFreeHeap());

  scanOnce();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("ip: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("not connected (expected without a real AP)");
  }
}

void loop() {
  digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
  Serial.printf("status=%d rssi=%d heap=%u\n",
                (int)WiFi.status(), WiFi.RSSI(), (unsigned)ESP.getFreeHeap());
  delay(2000);
}
