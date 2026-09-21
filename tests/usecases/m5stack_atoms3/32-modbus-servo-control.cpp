// @board m5stack_atoms3
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib madhephaestus/ESP32Servo@3.2.1
// @desc Modbus RTU の保持レジスタの値をバルブ開度としてサーボに反映する

#include <Arduino.h>
#include <ModbusMaster.h>
#include <ESP32Servo.h>

static const int8_t RS485_RX = 5;
static const int8_t RS485_TX = 6;
static const uint8_t RS485_DE = 7;
static const uint8_t SLAVE_ID = 3;
static const int VALVE_PIN = 8;
static const uint16_t SETPOINT_REGISTER = 0x0040;
static const uint16_t FEEDBACK_REGISTER = 0x0041;

ModbusMaster node;
Servo valve;

static int currentAngle = 0;
static uint32_t lastPoll = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  Serial1.begin(9600, SERIAL_8N1, RS485_RX, RS485_TX);
  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  ESP32PWM::allocateTimer(0);
  valve.setPeriodHertz(50);
  valve.attach(VALVE_PIN, 500, 2400);
  valve.write(currentAngle);
}

void loop() {
  const uint32_t now = millis();
  if (now - lastPoll < 1000) return;
  lastPoll = now;

  const uint8_t result = node.readHoldingRegisters(SETPOINT_REGISTER, 1);
  if (result != node.ku8MBSuccess) {
    Serial.print("poll failed 0x");
    Serial.println(result, HEX);
    return;
  }

  // レジスタは 0..1000 の開度 (0.1% 単位)。0..180 度にマップする。
  const uint16_t permille = node.getResponseBuffer(0);
  node.clearResponseBuffer();
  const int target = (int)map(constrain(permille, (uint16_t)0, (uint16_t)1000), 0, 1000, 0, 180);

  while (currentAngle != target) {
    currentAngle += (currentAngle < target) ? 1 : -1;
    valve.write(currentAngle);
    delay(10);
  }

  node.setTransmitBuffer(0, (uint16_t)map(currentAngle, 0, 180, 0, 1000));
  const uint8_t wrote = node.writeMultipleRegisters(FEEDBACK_REGISTER, 1);
  Serial.print("angle=");
  Serial.print(currentAngle);
  Serial.print(" feedback=0x");
  Serial.println(wrote, HEX);
}
