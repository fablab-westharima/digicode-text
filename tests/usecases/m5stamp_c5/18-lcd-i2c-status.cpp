// @board m5stamp_c5
// @lib marcoschwartz/LiquidCrystal_I2C@1.1.4
// @desc I2C の 16x2 キャラクタ LCD に稼働状態とアナログ値を表示する

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

static const uint8_t LCD_ADDR = 0x27;
static const uint8_t LCD_COLS = 16;
static const uint8_t LCD_ROWS = 2;

LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);

static uint8_t degreeGlyph[8] = { 0x06, 0x09, 0x09, 0x06, 0x00, 0x00, 0x00, 0x00 };
static uint32_t lastUpdate = 0;
static bool backlightOn = true;

void setup() {
  Serial.begin(115200);
  delay(200);

  Wire.begin(23, 24); // M5StampC5: SDA=GPIO23 SCL=GPIO24
  lcd.init();
  lcd.backlight();
  lcd.createChar(0, degreeGlyph);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("DigiCode Text");
  lcd.setCursor(0, 1);
  lcd.print("M5StampC5");
  delay(1000);
}

void loop() {
  const uint32_t now = millis();
  if (now - lastUpdate < 500) return;
  lastUpdate = now;

  const int raw = analogRead(A0);
  const float volts = raw * 3.3f / 4095.0f;

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("A0 ");
  lcd.print(raw);
  lcd.print(" ");
  lcd.print(volts, 2);
  lcd.print("V");

  lcd.setCursor(0, 1);
  lcd.print("up ");
  lcd.print(now / 1000);
  lcd.print("s ");
  lcd.write((uint8_t)0);
  lcd.print("C");

  if ((now / 10000) % 2 == 0) {
    if (!backlightOn) { lcd.backlight(); backlightOn = true; }
  } else if (backlightOn) {
    lcd.noBacklight();
    backlightOn = false;
  }
}
