// @board xiao_rp2040
// @desc analogWriteFreq / analogWriteRange で PWM の周波数と分解能を変え、可聴域を避けた駆動を作る

#include <Arduino.h>

// XIAO RP2040 のパッドから 2 本を PWM 出力に、1 本を帰還の ADC に使う。
static const uint8_t PWM_MOTOR = 26;  // D0 / GP26
static const uint8_t PWM_VALVE = 27;  // D1 / GP27
static const uint8_t FEEDBACK = A2;   // D2 / GP28

// モータは可聴域を避けて 20 kHz、バルブはゆっくり 500 Hz で開閉させたい。
// RP2040 の PWM は全 slice で同じ wrap を共有するため analogWriteFreq は全体に効く。
// そこで周期の異なる 2 つを 1 枚で扱うときは、周波数を切り替えながら交互に出す。
static const uint32_t MOTOR_HZ = 20000;
static const uint32_t VALVE_HZ = 500;
static const uint32_t PWM_RANGE = 1000;

static uint32_t currentHz = 0;
static uint16_t motorDuty = 0;
static int16_t motorStep = 25;
static uint16_t valveDuty = 0;

static void useFrequency(uint32_t hz) {
  if (hz == currentHz) return;
  analogWriteFreq(hz);
  currentHz = hz;
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  analogReadResolution(12);
  // analogWriteRange は duty の分母を決める。1000 にすると 0.1% 刻みになる。
  analogWriteRange(PWM_RANGE);
  useFrequency(MOTOR_HZ);

  pinMode(PWM_MOTOR, OUTPUT);
  pinMode(PWM_VALVE, OUTPUT);
  analogWrite(PWM_MOTOR, 0);
  analogWrite(PWM_VALVE, 0);

  Serial.print("range=");
  Serial.print(PWM_RANGE);
  Serial.print(" motorHz=");
  Serial.print(MOTOR_HZ);
  Serial.print(" valveHz=");
  Serial.println(VALVE_HZ);
}

void loop() {
  motorDuty = (uint16_t)constrain((int)motorDuty + motorStep, 0, (int)PWM_RANGE);
  if (motorDuty == 0 || motorDuty == PWM_RANGE) motorStep = -motorStep;

  useFrequency(MOTOR_HZ);
  analogWrite(PWM_MOTOR, motorDuty);
  delay(20);

  const uint16_t feedback = analogRead(FEEDBACK);

  // バルブは 1 秒に 1 度だけ低い周波数で更新する。切り替えの間はモータ側の
  // 周波数も動くので、モータの duty はその前後で必ず入れ直す。
  static uint32_t lastValve = 0;
  if (millis() - lastValve >= 1000) {
    lastValve = millis();
    valveDuty = (uint16_t)map(feedback, 0, 4095, 0, (long)PWM_RANGE);

    useFrequency(VALVE_HZ);
    analogWrite(PWM_VALVE, valveDuty);
    analogWrite(PWM_MOTOR, motorDuty);
    delay(5);
    useFrequency(MOTOR_HZ);
    analogWrite(PWM_MOTOR, motorDuty);

    Serial.print("motorDuty=");
    Serial.print(motorDuty);
    Serial.print(" valveDuty=");
    Serial.print(valveDuty);
    Serial.print(" feedback=");
    Serial.print(feedback);
    Serial.print(" pct=");
    Serial.print(100.0f * motorDuty / PWM_RANGE, 1);
    Serial.print(" hz=");
    Serial.println(currentHz);
  }
}
