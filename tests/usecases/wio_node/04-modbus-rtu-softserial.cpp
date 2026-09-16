// @board wio_node
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc コア同梱 SoftwareSerial 上で Modbus RTU マスタを動かし、レジスタを読み書きする

#include <Arduino.h>
#include <SoftwareSerial.h>
#include <ModbusMaster.h>

// Wio Node: Grove 端子に出せる GPIO12/13 を RS485 の RX/TX、GPIO14 を DE/RE に使う。
static const int8_t RS485_RX = 13;
static const int8_t RS485_TX = 12;
static const uint8_t RS485_DE = 14;
static const uint8_t GROVE_POWER = 15;
static const uint8_t SLAVE_ID = 1;

SoftwareSerial rs485(RS485_RX, RS485_TX);
ModbusMaster node;

static void preTransmission() {
  digitalWrite(RS485_DE, HIGH);
  delayMicroseconds(50);
}

static void postTransmission() {
  rs485.flush();
  delayMicroseconds(50);
  digitalWrite(RS485_DE, LOW);
}

static void show(const char* what, uint8_t result, uint8_t count) {
  if (result != node.ku8MBSuccess) {
    Serial.printf("%s failed 0x%02X\n", what, result);
    return;
  }
  Serial.print(what);
  Serial.print(':');
  for (uint8_t i = 0; i < count; i++) {
    Serial.print(' ');
    Serial.print(node.getResponseBuffer(i));
  }
  Serial.println();
  node.clearResponseBuffer();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  rs485.begin(9600, SWSERIAL_8N1);
  node.begin(SLAVE_ID, rs485);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  Serial.println("modbus rtu over software serial");
}

void loop() {
  show("holding", node.readHoldingRegisters(0x0000, 4), 4);
  delay(300);
  show("input", node.readInputRegisters(0x0010, 2), 2);
  delay(300);

  const uint8_t coil = node.writeSingleCoil(0x0002, (millis() / 5000) % 2);
  if (coil != node.ku8MBSuccess) Serial.printf("coil write failed 0x%02X\n", coil);

  delay(3000);
}
