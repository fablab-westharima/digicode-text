// @board wio_node
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @desc 1 本の Grove I2C に SSD1306 と BME280 を並べ、3 ページを切り替え表示する

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_BME280.h>

static const uint8_t GROVE_POWER = 15;

Adafruit_SSD1306 display(128, 64, &Wire, -1);
Adafruit_BME280 bme;

static bool oledReady = false;
static bool bmeReady = false;
static uint8_t page = 0;
static uint32_t lastDraw = 0;

static void drawValue(const __FlashStringHelper* label, float value, const __FlashStringHelper* unit) {
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
  display.print(F("heap "));
  display.print(ESP.getFreeHeap());
  display.display();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  Wire.begin(4, 5);
  oledReady = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  bmeReady = bme.begin(0x76, &Wire);
  Serial.printf("oled=%d bme=%d\n", oledReady ? 1 : 0, bmeReady ? 1 : 0);
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
    case 0: drawValue(F("Temperature"), bme.readTemperature(), F("C")); break;
    case 1: drawValue(F("Humidity"), bme.readHumidity(), F("%")); break;
    default: drawValue(F("Pressure"), bme.readPressure() / 100.0f, F("hPa")); break;
  }
  page = (uint8_t)((page + 1) % 3);
  yield();
}
