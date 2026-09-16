// @board wio_node
// @lib emelianov/modbus-esp8266@4.1.0
// @desc modbus-esp8266 の ModbusTCP server で A0 と Grove 電源をレジスタ/コイルとして公開

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ModbusIP_ESP8266.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

static const uint16_t IREG_ADC = 0;
static const uint16_t IREG_UPTIME_S = 1;
static const uint16_t IREG_HEAP_KB = 2;
static const uint16_t HREG_INTERVAL = 0;
static const uint16_t COIL_GROVE_POWER = 0;
static const uint16_t ISTS_WIFI = 0;

static const uint8_t GROVE_POWER = 15;
static const uint8_t STATUS_LED = 2; // アクティブ LOW

ModbusTCP mb;

static uint32_t updateIntervalMs = 500;
static uint32_t lastUpdate = 0;

static uint16_t onIntervalWrite(TRegister* reg, uint16_t val) {
  (void)reg;
  updateIntervalMs = val < 100 ? 100 : val;
  return val;
}

static uint16_t onGroveWrite(TRegister* reg, uint16_t val) {
  (void)reg;
  digitalWrite(GROVE_POWER, val ? HIGH : LOW);
  digitalWrite(STATUS_LED, val ? LOW : HIGH);
  return val;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, HIGH);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.print("ip ");
  Serial.println(WiFi.localIP());

  mb.server();
  mb.addIreg(IREG_ADC, 0);
  mb.addIreg(IREG_UPTIME_S, 0);
  mb.addIreg(IREG_HEAP_KB, 0);
  mb.addHreg(HREG_INTERVAL, (uint16_t)updateIntervalMs);
  mb.addCoil(COIL_GROVE_POWER, true);
  mb.addIsts(ISTS_WIFI, false);
  mb.onSetHreg(HREG_INTERVAL, onIntervalWrite);
  mb.onSetCoil(COIL_GROVE_POWER, onGroveWrite);
}

void loop() {
  mb.task();

  const uint32_t now = millis();
  if (now - lastUpdate >= updateIntervalMs) {
    lastUpdate = now;
    mb.Ireg(IREG_ADC, (uint16_t)analogRead(A0));
    mb.Ireg(IREG_UPTIME_S, (uint16_t)(now / 1000));
    mb.Ireg(IREG_HEAP_KB, (uint16_t)(ESP.getFreeHeap() / 1024));
    mb.Ists(ISTS_WIFI, WiFi.status() == WL_CONNECTED);
  }
  yield();
}
