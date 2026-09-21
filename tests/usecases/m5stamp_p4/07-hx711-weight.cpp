// @board m5stamp_p4
// @lib bogde/HX711@0.7.5
// @desc HX711 ロードセル ADC を tare / set_scale / get_units で読み、平均と生値を出す

#include <Arduino.h>
#include <HX711.h>

// Stamp-P4: スタンプ穴の GPIO14 と GPIO15 を使う。ストラッピングピン (GPIO34 から GPIO38) と USB の GPIO24/GPIO25 は避ける。
static const int LOADCELL_DOUT_PIN = 14;
static const int LOADCELL_SCK_PIN = 15;
static const float CALIBRATION_FACTOR = 420.0f;

HX711 scale;
static uint32_t lastRead = 0;

void setup() {
  Serial.begin(115200);
  delay(200);

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  const uint32_t deadline = millis() + 3000;
  while (!scale.is_ready() && millis() < deadline) delay(50);

  if (!scale.is_ready()) {
    Serial.println("HX711 not found");
    return;
  }

  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(20);
  Serial.print("tare offset=");
  Serial.println(scale.get_offset());
  Serial.print("scale=");
  Serial.println(scale.get_scale());
}

void loop() {
  const uint32_t now = millis();
  if (now - lastRead < 500) return;
  lastRead = now;

  if (!scale.is_ready()) {
    Serial.println("not ready");
    return;
  }

  const long raw = scale.read();
  const long averaged = scale.read_average(5);
  const float grams = scale.get_units(5);

  Serial.print("raw=");
  Serial.print(raw);
  Serial.print(" avg=");
  Serial.print(averaged);
  Serial.print(" g=");
  Serial.println(grams, 2);

  if (grams > 5000.0f) {
    scale.power_down();
    delay(100);
    scale.power_up();
    Serial.println("overload, power cycled");
  }
}
