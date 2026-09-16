// @board pico
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc Modbus RTU の保持レジスタで指令された角度へサーボを動かし、実角度を書き戻す

#include <Arduino.h>
#include <Servo.h>
#include <ModbusMaster.h>

static const uint8_t SERVO_PIN = 10;  // GP10
static const uint8_t RS485_DE = 2;    // GP2
static const uint8_t SLAVE_ID = 5;
static const uint16_t REG_SETPOINT = 0x0100;
static const uint16_t REG_FEEDBACK = 0x0101;

Servo arm;
ModbusMaster node;
static int current = 90;

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

  Serial1.setTX(0);
  Serial1.setRX(1);
  Serial1.begin(9600);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  arm.attach(SERVO_PIN, 544, 2400);
  arm.write(current);
}

void loop() {
  if (node.readHoldingRegisters(REG_SETPOINT, 1) == node.ku8MBSuccess) {
    const int setpoint = constrain((int)node.getResponseBuffer(0), 0, 180);
    // 1 周あたり 3 度までに制限して急な突入を避ける。
    if (setpoint > current) current += min(3, setpoint - current);
    else if (setpoint < current) current -= min(3, current - setpoint);
    arm.write(current);

    node.writeSingleRegister(REG_FEEDBACK, (uint16_t)arm.read());
    Serial.print("setpoint=");
    Serial.print(setpoint);
    Serial.print(" current=");
    Serial.println(current);
  } else {
    Serial.println("modbus read failed");
  }
  node.clearResponseBuffer();
  delay(100);
}
