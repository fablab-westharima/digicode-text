// @board xiao_esp32c3
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @desc 同じ I2C バス上の BME280 を読み、SSD1306 に温湿度気圧を大きく表示する

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_BME280.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);
Adafruit_BME280 bme;

static bool oledReady = false;
static bool bmeReady = false;
static uint32_t lastDraw = 0;
static uint8_t page = 0;

static void drawValue(const char* label, float value, const char* unit) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(label);
  display.setTextSize(3);
  display.setCursor(0, 20);
  display.print(value, 1);
  display.setTextSize(1);
  display.print(unit);
  display.drawLine(0, 55, 127, 55, SSD1306_WHITE);
  display.setCursor(0, 56);
  display.print(F("up "));
  display.print(millis() / 1000);
  display.print(F("s"));
  display.display();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin(6, 7);

  oledReady = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  bmeReady = bme.begin(0x76, &Wire);
  Serial.print("oled=");
  Serial.print(oledReady);
  Serial.print(" bme=");
  Serial.println(bmeReady);

  if (oledReady && !bmeReady) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println(F("BME280 not found"));
    display.display();
  }
}

void loop() {
  if (!oledReady || !bmeReady) {
    delay(2000);
    return;
  }
  const uint32_t now = millis();
  if (now - lastDraw < 2000) return;
  lastDraw = now;

  switch (page) {
    case 0: drawValue("Temperature", bme.readTemperature(), "C"); break;
    case 1: drawValue("Humidity", bme.readHumidity(), "%"); break;
    default: drawValue("Pressure", bme.readPressure() / 100.0f, "hPa"); break;
  }
  page = (uint8_t)((page + 1) % 3);
}
