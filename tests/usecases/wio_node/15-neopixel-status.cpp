// @board wio_node
// @lib adafruit/Adafruit NeoPixel@1.15.5
// @desc Grove 給電の WS2812 ストリップを ESP8266 から HSV で回し、シリアルでモードを切り替える

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>

static const uint16_t PIXEL_COUNT = 10;
static const uint8_t PIXEL_PIN = 13; // Wio Node D7 = GPIO13
static const uint8_t GROVE_POWER = 15;

Adafruit_NeoPixel strip(PIXEL_COUNT, PIXEL_PIN, NEO_GRB + NEO_KHZ800);

enum Mode { MODE_RAINBOW, MODE_CHASE, MODE_OFF };
static Mode mode = MODE_RAINBOW;
static uint16_t hue = 0;
static uint16_t chaseIndex = 0;
static uint32_t lastFrame = 0;

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(200);

  strip.begin();
  strip.setBrightness(48);
  strip.clear();
  strip.show();
  Serial.printf("pixels=%u\n", strip.numPixels());
}

void loop() {
  if (Serial.available() > 0) {
    switch (Serial.read()) {
      case 'r': mode = MODE_RAINBOW; break;
      case 'c': mode = MODE_CHASE; break;
      case 'o': mode = MODE_OFF; break;
      default: break;
    }
  }

  const uint32_t now = millis();
  if (now - lastFrame < 40) return;
  lastFrame = now;

  switch (mode) {
    case MODE_RAINBOW:
      for (uint16_t i = 0; i < PIXEL_COUNT; i++) {
        strip.setPixelColor(i, strip.gamma32(strip.ColorHSV(hue + i * (65536 / PIXEL_COUNT), 255, 200)));
      }
      hue += 700;
      break;
    case MODE_CHASE:
      strip.clear();
      strip.setPixelColor(chaseIndex, strip.Color(0, 160, 255));
      strip.setPixelColor((chaseIndex + 1) % PIXEL_COUNT, strip.Color(0, 60, 96));
      chaseIndex = (uint16_t)((chaseIndex + 1) % PIXEL_COUNT);
      break;
    case MODE_OFF:
      strip.clear();
      break;
  }
  strip.show();
  yield();
}
