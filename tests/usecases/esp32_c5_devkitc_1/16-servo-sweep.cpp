// @board esp32_c5_devkitc_1
// @lib madhephaestus/ESP32Servo@3.2.1
// @desc ESP32Servo で LEDC タイマを確保し、2 個のサーボを角度指令で動かす

#include <Arduino.h>
#include <ESP32Servo.h>

// ESP32-C5-DevKitC-1: GPIO0 と GPIO25。SPI の既定 GPIO8/GPIO9/GPIO10 は空けておく。
static const int PAN_PIN = 0;
static const int TILT_PIN = 25;

Servo pan;
Servo tilt;

static int panAngle = 90;
static int tiltAngle = 90;
static int panStep = 2;
static uint32_t lastStep = 0;

static void applyAngles() {
  pan.write(panAngle);
  tilt.write(tiltAngle);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);

  pan.setPeriodHertz(50);
  tilt.setPeriodHertz(50);
  pan.attach(PAN_PIN, 500, 2400);
  tilt.attach(TILT_PIN, 500, 2400);

  applyAngles();
  Serial.println("servo ready");
}

void loop() {
  if (Serial.available() > 0) {
    const int requested = Serial.parseInt();
    if (requested >= 0 && requested <= 180) {
      tiltAngle = requested;
      Serial.print("tilt -> ");
      Serial.println(tiltAngle);
    }
  }

  const uint32_t now = millis();
  if (now - lastStep < 20) return;
  lastStep = now;

  panAngle += panStep;
  if (panAngle >= 170 || panAngle <= 10) panStep = -panStep;
  applyAngles();

  if ((now / 1000) % 5 == 0 && now % 1000 < 20) {
    Serial.print("pan=");
    Serial.print(pan.read());
    Serial.print(" attached=");
    Serial.println(pan.attached() ? 1 : 0);
  }
}
