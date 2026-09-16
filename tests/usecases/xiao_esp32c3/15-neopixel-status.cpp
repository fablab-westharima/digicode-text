// @board xiao_esp32c3
// @lib adafruit/Adafruit NeoPixel@1.15.5
// @desc WS2812 リングを状態表示に使い、HSV レインボーと点滅パターンを切り替える

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>

static const uint16_t PIXEL_COUNT = 12;
static const uint8_t PIXEL_PIN = 10; // XIAO ESP32C3 D10 = GPIO10

Adafruit_NeoPixel strip(PIXEL_COUNT, PIXEL_PIN, NEO_GRB + NEO_KHZ800);

enum Mode { MODE_RAINBOW, MODE_PULSE, MODE_ALARM };
static Mode mode = MODE_RAINBOW;
static uint16_t hueOffset = 0;
static uint32_t lastStep = 0;

static void rainbow() {
  for (uint16_t i = 0; i < PIXEL_COUNT; i++) {
    const uint16_t hue = hueOffset + (i * 65536UL / PIXEL_COUNT);
    strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(hue, 255, 180)));
  }
  hueOffset += 512;
  strip.show();
}

static void pulse() {
  const uint8_t level = (uint8_t)(128 + 127 * sin(millis() / 400.0));
  strip.fill(strip.Color(0, level, level / 2), 0, PIXEL_COUNT);
  strip.show();
}

static void alarm() {
  const bool on = (millis() / 250) % 2 == 0;
  strip.fill(on ? strip.Color(255, 0, 0) : strip.Color(0, 0, 0), 0, PIXEL_COUNT);
  strip.show();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  strip.begin();
  strip.setBrightness(64);
  strip.clear();
  strip.show();
  Serial.print("pixels=");
  Serial.println(strip.numPixels());
}

void loop() {
  if (Serial.available() > 0) {
    switch (Serial.read()) {
      case 'r': mode = MODE_RAINBOW; break;
      case 'p': mode = MODE_PULSE; break;
      case 'a': mode = MODE_ALARM; break;
      default: break;
    }
  }
  const uint32_t now = millis();
  if (now - lastStep < 20) return;
  lastStep = now;

  switch (mode) {
    case MODE_RAINBOW: rainbow(); break;
    case MODE_PULSE: pulse(); break;
    case MODE_ALARM: alarm(); break;
  }
}
