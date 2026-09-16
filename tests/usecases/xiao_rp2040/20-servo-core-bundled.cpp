// @board xiao_rp2040
// @desc earlephilhower コア同梱の Servo (PIO 実装) を @lib なしで使う

#include <Arduino.h>
#include <Servo.h>

static const uint8_t PAN_PIN = 3;   // D10 / GP3
static const uint8_t TILT_PIN = 2;  // D8 / GP2

Servo pan;
Servo tilt;

static int angle = 90;
static int step = 2;

void setup() {
  Serial.begin(115200);
  // arduino-pico の Servo は PIO を使う。attach(pin, min, max) でパルス幅を明示する。
  pan.attach(PAN_PIN, 1000, 2000);
  tilt.attach(TILT_PIN, 1000, 2000, 90);
  pan.write(angle);
  delay(300);
  Serial.println("servo ready");
}

void loop() {
  angle += step;
  if (angle >= 170 || angle <= 10) step = -step;

  pan.write(angle);
  tilt.writeMicroseconds(1500 + (angle - 90) * 4);

  Serial.print("pan=");
  Serial.print(pan.read());
  Serial.print(" tiltUs=");
  Serial.print(tilt.readMicroseconds());
  Serial.print(" attached=");
  Serial.println(pan.attached() ? 1 : 0);

  if (angle == 90 && step > 0) {
    // 中央を通るたびに一度だけ切り離してトルクを抜く。
    tilt.detach();
    delay(20);
    tilt.attach(TILT_PIN);
  }
  delay(20);
}
