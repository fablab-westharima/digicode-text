// @board m5stack_atoms3
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc Serial1 と RS485 トランシーバで Modbus RTU の保持レジスタと入力レジスタを読む

#include <Arduino.h>
#include <ModbusMaster.h>

// ATOMS3: GPIO5 を RX、GPIO6 を TX、GPIO7 を DE/RE 兼用に使う。
static const int8_t RS485_RX = 5;
static const int8_t RS485_TX = 6;
static const uint8_t RS485_DE = 7;
static const uint8_t SLAVE_ID = 1;

ModbusMaster node;

static void preTransmission() {
  digitalWrite(RS485_DE, HIGH);
  delayMicroseconds(50);
}

static void postTransmission() {
  Serial1.flush();
  delayMicroseconds(50);
  digitalWrite(RS485_DE, LOW);
}

static void dumpResult(const char* what, uint8_t result, uint8_t count) {
  if (result != node.ku8MBSuccess) {
    Serial.print(what);
    Serial.print(" failed, code=0x");
    Serial.println(result, HEX);
    return;
  }
  Serial.print(what);
  Serial.print(":");
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

  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  Serial1.begin(9600, SERIAL_8N1, RS485_RX, RS485_TX);
  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  Serial.println("modbus rtu master ready");
}

void loop() {
  dumpResult("holding[0..3]", node.readHoldingRegisters(0x0000, 4), 4);
  delay(200);
  dumpResult("input[0x3100..]", node.readInputRegisters(0x3100, 6), 6);
  delay(200);

  node.setTransmitBuffer(0, (uint16_t)(millis() / 1000));
  const uint8_t wrote = node.writeMultipleRegisters(0x0010, 1);
  if (wrote != node.ku8MBSuccess) {
    Serial.print("write failed, code=0x");
    Serial.println(wrote, HEX);
  }
  delay(2000);
}
