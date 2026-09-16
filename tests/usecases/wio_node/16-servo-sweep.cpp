// @board wio_node
// @desc コア同梱 Servo (ESP8266 版) で Grove サーボを往復させ、シリアルで角度を受ける (追加ライブラリなし)

#include <Arduino.h>
#include <Servo.h>

static const uint8_t SERVO_PIN = 14; // Wio Node D5 = GPIO14
static const uint8_t GROVE_POWER = 15;

Servo arm;
static int angle = 90;
static int step = 2;
static bool manual = false;
static uint32_t lastMove = 0;

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(200);

  arm.attach(SERVO_PIN, 544, 2400);
  arm.write(angle);
  Serial.printf("servo attached=%d on GPIO%u\n", arm.attached() ? 1 : 0, SERVO_PIN);
}

void loop() {
  if (Serial.available() > 0) {
    const int requested = Serial.parseInt();
    if (requested >= 0 && requested <= 180) {
      manual = true;
      angle = requested;
      arm.write(angle);
      Serial.printf("manual angle=%d read=%d\n", angle, arm.read());
    } else if (requested < 0) {
      manual = false;
      Serial.println("auto sweep");
    }
  }

  const uint32_t now = millis();
  if (manual || now - lastMove < 20) {
    yield();
    return;
  }
  lastMove = now;

  angle += step;
  if (angle >= 170 || angle <= 10) step = -step;
  arm.write(angle);

  if (angle == 90) arm.writeMicroseconds(1500);
}
