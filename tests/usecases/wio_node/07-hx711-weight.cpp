// @board wio_node
// @lib bogde/HX711@0.7.5
// @desc Grove 給電した HX711 を読み、tare と校正係数を扱う

#include <Arduino.h>
#include <HX711.h>

static const int LOADCELL_DOUT_PIN = 12; // Wio Node D6
static const int LOADCELL_SCK_PIN = 13;  // Wio Node D7
static const uint8_t GROVE_POWER = 15;
static const float CALIBRATION_FACTOR = 420.0f;

HX711 scale;
static uint32_t lastRead = 0;

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(200); // Grove 側の電源が立ち上がるのを待つ

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  if (!scale.wait_ready_timeout(3000)) {
    Serial.println("HX711 not responding");
    return;
  }
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(20);
  Serial.printf("offset=%ld scale=%.2f\n", scale.get_offset(), scale.get_scale());
}

void loop() {
  const uint32_t now = millis();
  if (now - lastRead < 500) return;
  lastRead = now;

  if (!scale.is_ready()) {
    Serial.println("not ready");
    return;
  }

  const long raw = scale.read_average(3);
  const float grams = scale.get_units(3);
  Serial.printf("raw=%ld grams=%.2f heap=%u\n", raw, grams, (unsigned)ESP.getFreeHeap());

  if (grams < -1000.0f) {
    Serial.println("negative overload, re-taring");
    scale.tare(10);
  }
  yield();
}
