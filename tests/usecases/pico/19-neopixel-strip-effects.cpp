// @board pico
// @lib adafruit/Adafruit NeoPixel@1.15.5
// @desc 外付け 16 球ストリップで虹・追いかけ・呼吸の 3 効果を切り替える (arduino-pico 側の対応確認)

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>

static const uint8_t STRIP_PIN = 18;  // GP18
static const uint16_t PIXELS = 16;

Adafruit_NeoPixel strip(PIXELS, STRIP_PIN, NEO_GRB + NEO_KHZ800);

static uint8_t effect = 0;
static uint16_t frame = 0;

static void rainbow() {
  for (uint16_t i = 0; i < strip.numPixels(); i++) {
    const uint16_t hue = (uint16_t)(frame * 256 + i * (65536 / strip.numPixels()));
    strip.setPixelColor(i, strip.gamma32(Adafruit_NeoPixel::ColorHSV(hue)));
  }
}

static void chase() {
  strip.clear();
  const uint16_t head = frame % strip.numPixels();
  for (uint8_t tail = 0; tail < 4; tail++) {
    const uint16_t index = (head + strip.numPixels() - tail) % strip.numPixels();
    const uint8_t level = 255 >> (tail * 2);
    strip.setPixelColor(index, strip.Color(0, level, level / 2));
  }
}

static void breathe() {
  const uint8_t level = (uint8_t)(128 + 127 * sin(frame / 12.0));
  strip.fill(strip.Color(level, level / 4, 0), 0, strip.numPixels());
}

void setup() {
  Serial.begin(115200);
  strip.begin();
  strip.setBrightness(40);
  strip.clear();
  strip.show();
}

void loop() {
  switch (effect) {
    case 0: rainbow(); break;
    case 1: chase(); break;
    default: breathe(); break;
  }
  strip.show();

  if (++frame % 200 == 0) {
    effect = (effect + 1) % 3;
    Serial.print("effect=");
    Serial.println(effect);
  }
  delay(20);
}
