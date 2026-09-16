// @board pico
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc RS485 変換器経由の Modbus RTU master。Mbed コアの Serial1 は GP0/GP1 固定で pin を移せない

#include <Arduino.h>
#include <ModbusMaster.h>

// Pico の Mbed コアは variant の PIN_SERIAL_TX/RX (GP0/GP1) で Serial1 が固定される。
// earlephilhower の setTX/setRX に相当する API は無い。
static const uint8_t RS485_DE = 2;  // GP2 で MAX485 の DE/RE を駆動
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
