// @board wio_node
// @lib emelianov/modbus-esp8266@4.1.0
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ModbusTCP client として別ノードの保持レジスタを読み、結果を JSON で Serial へ

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ModbusTCP.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint8_t REMOTE_IP[4] = { 192, 168, 10, 50 };
static const uint16_t FIRST_HREG = 0;
static const uint16_t HREG_COUNT = 8;
static const uint32_t POLL_INTERVAL_MS = 2000;
static const uint8_t GROVE_POWER = 15;

ModbusTCP mb;
IPAddress remote(REMOTE_IP[0], REMOTE_IP[1], REMOTE_IP[2], REMOTE_IP[3]);

static uint16_t regs[HREG_COUNT];
static bool pending = false;
static uint8_t lastResult = 0;
static uint32_t lastPoll = 0;
static uint32_t sequence = 0;

static bool onResult(Modbus::ResultCode event, uint16_t transactionId, void* data) {
  (void)transactionId;
  (void)data;
  lastResult = (uint8_t)event;
  pending = false;

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["remote"] = remote.toString();
  doc["result"] = lastResult;
  doc["ok"] = (event == Modbus::EX_SUCCESS);
  if (event == Modbus::EX_SUCCESS) {
    JsonArray arr = doc["registers"].to<JsonArray>();
    for (uint16_t i = 0; i < HREG_COUNT; i++) arr.add(regs[i]);
  }
  serializeJson(doc, Serial);
  Serial.println();
  return true;
}

static bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  return WiFi.status() == WL_CONNECTED;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  WiFi.persistent(false);
  ensureWifi();
  mb.client();
  Serial.println("ModbusTCP client ready");
}

void loop() {
  if (!ensureWifi()) {
    delay(2000);
    return;
  }
  mb.task();

  const uint32_t now = millis();
  if (!pending && now - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = now;
    if (mb.isConnected(remote) || mb.connect(remote)) {
      pending = mb.readHreg(remote, FIRST_HREG, regs, HREG_COUNT, onResult);
      if (!pending) Serial.println("readHreg rejected");
    } else {
      Serial.println("tcp connect failed");
    }
  }
  yield();
}
