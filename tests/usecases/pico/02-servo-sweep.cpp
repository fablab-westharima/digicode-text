// @board pico
// @lib arduino-libraries/Servo@1.3.0
// @desc Mbed コアには Servo が同梱されていないため、Registry の Servo を足して 2 軸を振る

#include <Arduino.h>
#include <Servo.h>

static const uint8_t PAN_PIN = 2;
static const uint8_t TILT_PIN = 3;

Servo pan;
Servo tilt;

static int angle = 0;
static int step = 2;

void setup() {
  Serial.begin(115200);
  pan.attach(PAN_PIN, 544, 2400);
  tilt.attach(TILT_PIN);
  pan.write(90);
  tilt.write(90);
  delay(500);
  Serial.println("servo ready");
}

void loop() {
  angle += step;
  if (angle >= 180 || angle <= 0) step = -step;

  pan.write(angle);
  tilt.write(180 - angle);

  Serial.print("pan=");
  Serial.print(pan.read());
  Serial.print(" tilt=");
  Serial.print(tilt.read());
  Serial.print(" attached=");
  Serial.println(pan.attached() ? "yes" : "no");
  delay(20);
}
