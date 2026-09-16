// @board pico
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc BME280 の値を 128x64 OLED に数値と気圧トレンドのグラフで出す

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

static const uint8_t SCREEN_WIDTH = 128;
static const uint8_t SCREEN_HEIGHT = 64;
static const uint8_t OLED_ADDRESS = 0x3C;
static const uint8_t HISTORY = 64;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_BME280 bme;

static float history[HISTORY];
static uint8_t historyCount = 0;

static void pushHistory(float hPa) {
  if (historyCount < HISTORY) {
    history[historyCount++] = hPa;
    return;
  }
  for (uint8_t i = 1; i < HISTORY; i++) history[i - 1] = history[i];
  history[HISTORY - 1] = hPa;
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  Wire.setClock(400000);

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("ssd1306 not found");
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("DigiCode env"));
  display.display();

  if (!bme.begin(0x76, &Wire)) Serial.println("bme280 not found");
}

void loop() {
  const float tempC = bme.readTemperature();
  const float hPa = bme.readPressure() / 100.0f;
  const float rh = bme.readHumidity();
  pushHistory(hPa);

  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(0, 0);
  display.print(tempC, 1);
  display.print((char)247);
  display.println(F("C"));

  display.setTextSize(1);
  display.setCursor(0, 20);
  display.print(F("RH  "));
  display.print(rh, 1);
  display.println(F(" %"));
  display.print(F("Pa  "));
  display.print(hPa, 1);
  display.println(F(" hPa"));

  float lo = history[0];
  float hi = history[0];
  for (uint8_t i = 1; i < historyCount; i++) {
    if (history[i] < lo) lo = history[i];
    if (history[i] > hi) hi = history[i];
  }
  const float span = (hi - lo) < 1.0f ? 1.0f : (hi - lo);
  for (uint8_t i = 1; i < historyCount; i++) {
    const int16_t y0 = 63 - (int16_t)((history[i - 1] - lo) / span * 18.0f);
    const int16_t y1 = 63 - (int16_t)((history[i] - lo) / span * 18.0f);
    display.drawLine((i - 1) * 2, y0, i * 2, y1, SSD1306_WHITE);
  }
  display.drawRect(0, 44, SCREEN_WIDTH, 20, SSD1306_WHITE);
  display.display();

  Serial.print("tempC=");
  Serial.print(tempC, 2);
  Serial.print(" hPa=");
  Serial.println(hPa, 2);
  delay(1000);
}
