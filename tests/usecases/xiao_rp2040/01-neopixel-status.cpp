// @board xiao_rp2040
// @lib adafruit/Adafruit NeoPixel@1.15.5
// @desc 内蔵 NeoPixel を虹色に回しながら、色と明るさをシリアルへ出す

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>

// XIAO RP2040 の内蔵 NeoPixel: データ GPIO12、電源イネーブル GPIO11。
// earlephilhower コアの variant が PIN_NEOPIXEL / NEOPIXEL_POWER をマクロで定義しているので、
// 同じ名前を自分で宣言せずそのまま使う。
#ifndef PIN_NEOPIXEL
#define PIN_NEOPIXEL (12u)
#endif
#ifndef NEOPIXEL_POWER
#define NEOPIXEL_POWER (11u)
#endif

static const uint16_t PIXEL_COUNT = 1;

Adafruit_NeoPixel pixel(PIXEL_COUNT, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);

static uint16_t hue = 0;
static uint8_t brightness = 10;
static int8_t brightnessStep = 5;

void setup() {
  Serial.begin(115200);
  pinMode(NEOPIXEL_POWER, OUTPUT);
  digitalWrite(NEOPIXEL_POWER, HIGH);

  pixel.begin();
  pixel.setBrightness(brightness);
  pixel.clear();
  pixel.show();
  Serial.println("neopixel ready");
}

void loop() {
  hue += 768;
  brightness += brightnessStep;
  if (brightness >= 60 || brightness <= 10) brightnessStep = -brightnessStep;

  const uint32_t color = Adafruit_NeoPixel::ColorHSV(hue, 255, 255);
  pixel.setBrightness(brightness);
  pixel.setPixelColor(0, Adafruit_NeoPixel::gamma32(color));
  pixel.show();

  Serial.print("hue=");
  Serial.print(hue);
  Serial.print(" brightness=");
  Serial.print(brightness);
  Serial.print(" color=0x");
  Serial.println(color, HEX);
  delay(40);
}
