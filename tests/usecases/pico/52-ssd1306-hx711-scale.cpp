// @board pico
// @lib bogde/HX711@0.7.5
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc HX711 の重量を OLED に大きな数字とゼロ点バーで出し、ボタンで風袋引きする

#include <Arduino.h>
#include <Wire.h>
#include <HX711.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Pico: I2C0 の既定 pin である GP4 (SDA) / GP5 (SCL) を setSDA/setSCL で明示する。
// HX711: GP14 が DOUT、GP15 が SCK。
static const uint8_t HX711_DOUT = 14;
static const uint8_t HX711_SCK = 15;
static const uint8_t TARE_BUTTON = 20;
static const float CALIBRATION_FACTOR = 420.0f;
static const uint8_t SCREEN_WIDTH = 128;
static const uint8_t SCREEN_HEIGHT = 64;

HX711 scale;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

static bool displayReady = false;
static float grams = 0.0f;
static float peak = 0.0f;
static uint32_t samples = 0;
static bool lastButton = HIGH;

static void draw() {
  if (!displayReady) return;
  display.clearDisplay();

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("DigiCode scale"));
  display.drawFastHLine(0, 10, SCREEN_WIDTH, SSD1306_WHITE);

  display.setTextSize(3);
  display.setCursor(0, 16);
  display.print(grams, 0);
  display.setTextSize(1);
  display.println(F(" g"));

  display.setCursor(0, 44);
  display.print(F("peak "));
  display.print(peak, 0);
  display.print(F(" g  n="));
  display.println(samples);

  // 0-2000g を 1 本のバーで見せる。
  const int16_t width = (int16_t)constrain((long)(grams / 2000.0f * 124.0f), 0L, 124L);
  display.drawRect(0, 56, SCREEN_WIDTH, 8, SSD1306_WHITE);
  display.fillRect(2, 58, width, 4, SSD1306_WHITE);

  display.display();
}

void setup() {
  Serial.begin(115200);
  const uint32_t serialDeadline = millis() + 3000;
  while (!Serial && millis() < serialDeadline) delay(10);

  pinMode(TARE_BUTTON, INPUT_PULLUP);

  Wire.setSDA(4);
  Wire.setSCL(5);
  Wire.begin();
  displayReady = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (displayReady) {
    display.setTextColor(SSD1306_WHITE);
    display.clearDisplay();
    display.display();
  } else {
    Serial.println("ssd1306 not found");
  }

  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(CALIBRATION_FACTOR);
  scale.tare(20);
  Serial.println("scale ready");
}

void loop() {
  const bool button = digitalRead(TARE_BUTTON);
  if (lastButton == HIGH && button == LOW) {
    Serial.println("tare");
    scale.tare(10);
    peak = 0.0f;
    delay(200);
  }
  lastButton = button;

  if (scale.is_ready()) {
    grams = scale.get_units(5);
    if (grams > peak) peak = grams;
    samples++;
    Serial.print("grams=");
    Serial.println(grams, 1);
  }

  draw();
  delay(100);
}
