// @board pico
// @desc ライブラリ無しで arduino-pico の素の API (ADC 分解能・PWM・ループ周期) を測る

#include <Arduino.h>

// arduino-pico には rp2040.* ヘルパ (getFreeHeap / wdt_begin など) があるが、
// ここはあえて ArduinoCore-API の範囲だけで書く。rp2040.* は 44-watchdog-supervisor.cpp で使う。
static uint32_t loops = 0;
static uint32_t worstJitterUs = 0;
static uint32_t lastTick = 0;

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  pinMode(LED_BUILTIN, OUTPUT);
  analogReadResolution(12);
  analogWriteResolution(8);

  Serial.print("digitalPins=");
  Serial.print(NUM_DIGITAL_PINS);
  Serial.print(" analogInputs=");
  Serial.print(NUM_ANALOG_INPUTS);
  Serial.print(" adcBits=");
  Serial.println(ADC_RESOLUTION);

  lastTick = micros();
}

void loop() {
  const uint32_t now = micros();
  const uint32_t delta = now - lastTick;
  lastTick = now;
  if (loops > 0) {
    const uint32_t jitter = delta > 100000 ? delta - 100000 : 100000 - delta;
    if (jitter > worstJitterUs) worstJitterUs = jitter;
  }
  loops++;

  digitalWrite(LED_BUILTIN, (loops % 2) ? HIGH : LOW);
  analogWrite(LED_BUILTIN, (loops * 8) & 0xFF);

  Serial.print("loops=");
  Serial.print(loops);
  Serial.print(" deltaUs=");
  Serial.print(delta);
  Serial.print(" worstJitterUs=");
  Serial.print(worstJitterUs);
  for (uint8_t i = 0; i < NUM_ANALOG_INPUTS - 1; i++) {
    Serial.print(" a");
    Serial.print(i);
    Serial.print('=');
    Serial.print(analogRead(A0 + i));
  }
  Serial.println();
  delay(100);
}
