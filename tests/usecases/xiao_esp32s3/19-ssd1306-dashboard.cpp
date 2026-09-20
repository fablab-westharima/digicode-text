// @board xiao_esp32s3
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc 128x64 の SSD1306 OLED にテキストとバーグラフのダッシュボードを描く

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

static const uint8_t SCREEN_WIDTH = 128;
static const uint8_t SCREEN_HEIGHT = 64;
static const uint8_t OLED_ADDR = 0x3C;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
static bool ready = false;
static uint32_t lastDraw = 0;
static uint16_t history[SCREEN_WIDTH];
static uint8_t head = 0;

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin(5, 6);

  ready = display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR);
  if (!ready) {
    Serial.println("SSD1306 allocation failed");
    return;
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("DigiCode Text"));
  display.println(F("XIAO ESP32S3"));
  display.display();
  delay(800);
}

void loop() {
  if (!ready) {
    delay(2000);
    return;
  }
  const uint32_t now = millis();
  if (now - lastDraw < 100) return;
  lastDraw = now;

  const int raw = analogRead(A0);
  history[head] = (uint16_t)raw;
  head = (uint8_t)((head + 1) % SCREEN_WIDTH);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print(F("A0 "));
  display.print(raw);
  display.print(F(" "));
  display.print(raw * 3.3f / 4095.0f, 2);
  display.println(F("V"));

  display.setCursor(0, 10);
  display.print(F("up "));
  display.print(now / 1000);
  display.println(F("s"));

  // 下半分に直近の波形を描く
  display.drawRect(0, 22, SCREEN_WIDTH, SCREEN_HEIGHT - 22, SSD1306_WHITE);
  for (uint8_t x = 0; x < SCREEN_WIDTH - 2; x++) {
    const uint16_t sample = history[(head + x) % SCREEN_WIDTH];
    const uint8_t h = (uint8_t)map(sample, 0, 4095, 0, SCREEN_HEIGHT - 26);
    display.drawFastVLine(x + 1, SCREEN_HEIGHT - 3 - h, h, SSD1306_WHITE);
  }
  display.display();
}
