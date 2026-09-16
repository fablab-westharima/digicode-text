// @board xiao_rp2040
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc RS485 変換器経由の Modbus RTU master。Serial1 の pin を earlephilhower の setTX/setRX で指定する

#include <Arduino.h>
#include <ModbusMaster.h>

// XIAO RP2040: D6=GP0 が UART0 TX、D7=GP1 が UART0 RX。
// MAX485 の DE/RE を束ねて D2=GP28 で駆動する。
static const uint8_t RS485_TX = 0;
static const uint8_t RS485_RX = 1;
static const uint8_t RS485_DE = 28;
static const uint8_t SLAVE_ID = 1;

ModbusMaster node;

static void preTransmission() {
  digitalWrite(RS485_DE, HIGH);
}

static void postTransmission() {
  digitalWrite(RS485_DE, LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  // earlephilhower コアは begin の前なら Serial1 の pin を差し替えられる。
  Serial1.setTX(RS485_TX);
  Serial1.setRX(RS485_RX);
  Serial1.begin(9600, SERIAL_8N1);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  Serial.println("modbus rtu master ready");
}

void loop() {
  const uint8_t result = node.readHoldingRegisters(0x0000, 4);
  if (result == node.ku8MBSuccess) {
    for (uint8_t i = 0; i < 4; i++) {
      Serial.print("holding[");
      Serial.print(i);
      Serial.print("]=");
      Serial.println(node.getResponseBuffer(i));
    }
  } else if (result == node.ku8MBResponseTimedOut) {
    Serial.println("timeout");
  } else {
    Serial.print("modbus error 0x");
    Serial.println(result, HEX);
  }
  node.clearResponseBuffer();
  delay(1000);
}
