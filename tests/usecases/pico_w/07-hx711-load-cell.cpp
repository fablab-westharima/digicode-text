// @board pico_w
// @lib bogde/HX711@0.7.5
// @desc ロードセル + HX711 を tare / スケール校正して重量を Serial へ出す

#include <Arduino.h>
#include <HX711.h>

static const uint8_t HX711_DOUT = 14;  // GP14
static const uint8_t HX711_SCK = 15;   // GP15
static const float CALIBRATION_FACTOR = 420.0f;

HX711 scale;

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  scale.begin(HX711_DOUT, HX711_SCK);

  if (scale.wait_ready_timeout(2000)) {
    scale.set_scale(CALIBRATION_FACTOR);
    scale.tare(20);
    Serial.print("tare offset=");
    Serial.println(scale.get_offset());
  } else {
    Serial.println("hx711 not found");
  }
}

void loop() {
  if (!scale.is_ready()) {
    delay(20);
    return;
  }

  const long raw = scale.read_average(5);
  const float grams = scale.get_units(5);

  Serial.print("raw=");
  Serial.print(raw);
  Serial.print(" grams=");
  Serial.print(grams, 1);
  Serial.print(" scale=");
  Serial.println(scale.get_scale(), 2);

  static uint32_t lastSleep = 0;
  if (millis() - lastSleep >= 5000) {
    lastSleep = millis();
    scale.power_down();
    delay(50);
    scale.power_up();
  }
  delay(250);
}
