// @board xiao_esp32c3
// @lib bogde/HX711@0.7.5
// @desc HX711 ロードセル ADC を tare / set_scale / get_units で読み、平均と生値を出す

#include <Arduino.h>
#include <HX711.h>

// XIAO ESP32C3: GPIO2/8/9 はストラッピングピンなので避け、D1=GPIO3 と D10=GPIO10 を使う。
static const int LOADCELL_DOUT_PIN = 3;
static const int LOADCELL_SCK_PIN = 10;
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
