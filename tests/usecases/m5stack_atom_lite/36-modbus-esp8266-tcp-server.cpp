// @board m5stack_atom_lite
// @lib emelianov/modbus-esp8266@4.1.0
// @desc modbus-esp8266 の ModbusTCP server として ADC 値を保持/入力レジスタとコイルで公開

#include <Arduino.h>
#include <WiFi.h>
#include <ModbusTCP.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

static const uint16_t HREG_INTERVAL = 0;   // 更新周期 (ms)
static const uint16_t IREG_ADC0 = 0;       // GPIO32 の生値
static const uint16_t IREG_ADC1 = 1;       // GPIO33 の生値
static const uint16_t IREG_UPTIME = 2;     // 起動からの秒数
static const uint16_t COIL_LED = 0;

static const uint8_t ADC0_PIN = 32;  // ATOM Lite: GPIO32 は ADC1
static const uint8_t ADC1_PIN = 33;  // ATOM Lite: GPIO33 も ADC1
static const uint8_t OUTPUT_PIN = 19;

ModbusTCP mb;

static uint32_t lastUpdate = 0;
static uint32_t updateIntervalMs = 500;

static uint16_t onIntervalWrite(TRegister* reg, uint16_t val) {
  (void)reg;
  updateIntervalMs = val < 100 ? 100 : val;
  Serial.printf("interval -> %lu ms\n", (unsigned long)updateIntervalMs);
  return val;
}

static uint16_t onCoilWrite(TRegister* reg, uint16_t val) {
  (void)reg;
  digitalWrite(OUTPUT_PIN, val ? HIGH : LOW);
  return val;
}

static bool connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  return WiFi.status() == WL_CONNECTED;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(OUTPUT_PIN, OUTPUT);
  digitalWrite(OUTPUT_PIN, LOW);

  if (connectWifi()) {
    Serial.print("ip ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("wifi not connected; server still starts");
  }

  mb.server();
  mb.addHreg(HREG_INTERVAL, (uint16_t)updateIntervalMs);
  mb.addIreg(IREG_ADC0, 0);
  mb.addIreg(IREG_ADC1, 0);
  mb.addIreg(IREG_UPTIME, 0);
  mb.addCoil(COIL_LED, false);
  mb.onSetHreg(HREG_INTERVAL, onIntervalWrite);
  mb.onSetCoil(COIL_LED, onCoilWrite);
}

void loop() {
  mb.task();

  const uint32_t now = millis();
  if (now - lastUpdate >= updateIntervalMs) {
    lastUpdate = now;
    mb.Ireg(IREG_ADC0, (uint16_t)analogRead(ADC0_PIN));
    mb.Ireg(IREG_ADC1, (uint16_t)analogRead(ADC1_PIN));
    mb.Ireg(IREG_UPTIME, (uint16_t)(now / 1000));
  }
  yield();
}
