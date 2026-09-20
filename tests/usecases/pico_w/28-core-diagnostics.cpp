// @board pico_w
// @desc ライブラリ無しで arduino-pico の素の API (ADC 分解能・PWM・ループ周期) を測る

#include <Arduino.h>

// arduino-pico には rp2040.* ヘルパ (getFreeHeap / wdt_begin など) があるが、
// ここはあえて ArduinoCore-API の範囲だけで書く。rp2040.* は 44-watchdog-supervisor.cpp で使う。
//
// PWM の確認は LED ではなく素の GPIO で行う。Pico W の LED_BUILTIN は RP2040 の GPIO では
// なく擬似ピン 64 (CYW43439 側) なので、analogWrite はピン番号の範囲外として何もしない。
static const uint8_t PWM_PIN = 14;  // GP14
static uint32_t loops = 0;
static uint32_t worstJitterUs = 0;
static uint32_t lastTick = 0;

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  // Pico W のユーザー LED は RP2040 の GPIO25 ではなく無線チップ CYW43439 側にある。
  // core が擬似ピン 64 を LED_BUILTIN に割り当てるので、番号ではなく LED_BUILTIN を使う。
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(PWM_PIN, OUTPUT);
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
  analogWrite(PWM_PIN, (loops * 8) & 0xFF);

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
