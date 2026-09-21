// @board m5stack_cores3
// @desc コア同梱の WiFi だけで AP をスキャンし、一番強い AP に接続を試みる (追加ライブラリなし)

#include <Arduino.h>
#include <WiFi.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

static void scanOnce() {
  Serial.println("scanning...");
  const int found = WiFi.scanNetworks();
  if (found <= 0) {
    Serial.println("no networks");
    return;
  }

  int best = 0;
  for (int i = 0; i < found; i++) {
    if (WiFi.RSSI(i) > WiFi.RSSI(best)) best = i;
    Serial.print(i);
    Serial.print(": ");
    Serial.print(WiFi.SSID(i));
    Serial.print(" ch=");
    Serial.print(WiFi.channel(i));
    Serial.print(" rssi=");
    Serial.print(WiFi.RSSI(i));
    Serial.print(" enc=");
    Serial.println((int)WiFi.encryptionType(i));
  }

  Serial.print("strongest: ");
  Serial.print(WiFi.SSID(best));
  Serial.print(" @ ");
  Serial.println(WiFi.RSSI(best));
  WiFi.scanDelete();
}

static bool connectWithTimeout(uint32_t timeoutMs) {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + timeoutMs;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}

void setup() {
  Serial.begin(115200);
  delay(200);

  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  delay(100);

  Serial.print("mac: ");
  Serial.println(WiFi.macAddress());
  scanOnce();

  if (connectWithTimeout(8000)) {
    Serial.print("connected, ip=");
    Serial.println(WiFi.localIP());
    Serial.print("gateway=");
    Serial.println(WiFi.gatewayIP());
  } else {
    Serial.println("not connected (expected without a real AP)");
  }
}

void loop() {
  Serial.print("status=");
  Serial.print((int)WiFi.status());
  Serial.print(" rssi=");
  Serial.println(WiFi.RSSI());
  delay(5000);
}
