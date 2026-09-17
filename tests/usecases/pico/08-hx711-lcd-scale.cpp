// @board pico
// @lib bogde/HX711@0.7.5
// @lib marcoschwartz/LiquidCrystal_I2C@1.1.4
// @desc HX711 の重量を I2C キャラクタ LCD に表示する。Wire は既定の GP4/GP5 を使う

#include <Arduino.h>
#include <Wire.h>
#include <HX711.h>
#include <LiquidCrystal_I2C.h>

static const uint8_t HX711_DOUT = 14;   // GP14
static const uint8_t HX711_SCK = 15;    // GP15
static const uint8_t TARE_BUTTON = 20;  // GP20
static const uint8_t LCD_ADDRESS = 0x27;

HX711 scale;
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);

void setup() {
  Serial.begin(115200);
  pinMode(TARE_BUTTON, INPUT_PULLUP);

  // arduino-pico には Wire.setSDA/setSCL があるが、ここでは variant 既定の
  // PIN_WIRE0_SDA/SCL (GP4 = SDA / GP5 = SCL) をそのまま使う。
  Wire.begin();
  Wire.setClock(100000);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("DigiCode scale");

  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(420.0f);
  scale.tare(20);
  delay(500);
  lcd.clear();
}

void loop() {
  if (digitalRead(TARE_BUTTON) == LOW) {
    lcd.setCursor(0, 1);
    lcd.print("taring...      ");
    scale.tare(10);
    delay(300);
  }

  const float grams = scale.get_units(3);

  lcd.setCursor(0, 0);
  lcd.print("Weight:         ");
  lcd.setCursor(0, 1);
  lcd.print(grams, 1);
  lcd.print(" g            ");

  Serial.print("grams=");
  Serial.println(grams, 1);
  delay(300);
}
