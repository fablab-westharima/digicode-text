// @board pico_w
// @desc setup1/loop1 で core1 を専用サンプラにし、rp2040.fifo で core0 の集計側へ渡す

#include <Arduino.h>

static const uint32_t SAMPLE_INTERVAL_US = 1000;  // core1 は 1 kHz で回す
static const uint16_t REPORT_EVERY = 1000;

// FIFO は 32 bit しか渡せないので、上位 16 bit に連番、下位 12 bit に ADC 値を詰める。
static inline uint32_t pack(uint16_t seq, uint16_t value) {
  return ((uint32_t)seq << 16) | (value & 0x0FFF);
}

// core1 だけが書き、core0 だけが読む統計。volatile で最適化による読み飛ばしを止める。
static volatile uint32_t core1Samples = 0;
static volatile uint32_t core1Drops = 0;
static volatile uint32_t core1WorstJitterUs = 0;

// core0 側の集計
static uint32_t received = 0;
static uint32_t lost = 0;
static uint16_t expectedSeq = 0;
static uint32_t sum = 0;
static uint16_t minValue = 0xFFFF;
static uint16_t maxValue = 0;
static uint16_t batch = 0;

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);
  // Pico W のユーザー LED は RP2040 の GPIO25 ではなく無線チップ CYW43439 側にある。
  // core が擬似ピン 64 を LED_BUILTIN に割り当てるので、番号ではなく LED_BUILTIN を使う。
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("core0 aggregator ready");
}

void setup1() {
  // ADC の初期化は core1 側で閉じる。core0 からは触らない。
  analogReadResolution(12);
}

void loop1() {
  static uint16_t seq = 0;
  static uint32_t nextDueUs = 0;

  const uint32_t now = micros();
  if (nextDueUs == 0) nextDueUs = now;
  if ((int32_t)(now - nextDueUs) < 0) return;

  const uint32_t jitter = now - nextDueUs;
  if (jitter > core1WorstJitterUs) core1WorstJitterUs = jitter;
  nextDueUs += SAMPLE_INTERVAL_US;

  const uint16_t value = (uint16_t)analogRead(A0);
  core1Samples++;

  // FIFO が詰まっていたら捨てる。ここで待つとサンプル周期が崩れる。
  if (!rp2040.fifo.push_nb(pack(seq, value))) {
    core1Drops++;
  }
  seq++;
}

void loop() {
  uint32_t packet = 0;
  while (rp2040.fifo.pop_nb(&packet)) {
    const uint16_t seq = (uint16_t)(packet >> 16);
    const uint16_t value = (uint16_t)(packet & 0x0FFF);

    if (seq != expectedSeq) {
      lost += (uint16_t)(seq - expectedSeq);
    }
    expectedSeq = (uint16_t)(seq + 1);

    received++;
    sum += value;
    if (value < minValue) minValue = value;
    if (value > maxValue) maxValue = value;

    if (++batch >= REPORT_EVERY) {
      digitalWrite(LED_BUILTIN, (received / REPORT_EVERY) % 2 ? HIGH : LOW);

      Serial.print("n=");
      Serial.print(batch);
      Serial.print(" avg=");
      Serial.print(sum / batch);
      Serial.print(" min=");
      Serial.print(minValue);
      Serial.print(" max=");
      Serial.print(maxValue);
      Serial.print(" received=");
      Serial.print(received);
      Serial.print(" lost=");
      Serial.print(lost);
      Serial.print(" core1Samples=");
      Serial.print(core1Samples);
      Serial.print(" core1Drops=");
      Serial.print(core1Drops);
      Serial.print(" worstJitterUs=");
      Serial.println(core1WorstJitterUs);

      batch = 0;
      sum = 0;
      minValue = 0xFFFF;
      maxValue = 0;
    }
  }
}
