// @board esp32_devkitc_v4
// @lib bogde/HX711@0.7.5
// @lib marcoschwartz/LiquidCrystal_I2C@1.1.4
// @desc HX711 で計った重量を I2C LCD に表示し、シリアルの tare コマンドを受ける

#include <Arduino.h>
#include <Wire.h>
#include <HX711.h>
#include <LiquidCrystal_I2C.h>

static const int LOADCELL_DOUT_PIN = 32;
static const int LOADCELL_SCK_PIN = 33;

HX711 scale;
LiquidCrystal_I2C lcd(0x27, 16, 2);

static float peak = 0.0f;
static uint32_t lastUpdate = 0;

void setup() {
  Serial.begin(115200);
  delay(200);

  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Scale booting");

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(420.0f);
  if (scale.wait_ready_timeout(3000)) {
    scale.tare(20);
    lcd.setCursor(0, 1);
    lcd.print("tare done");
  } else {
    lcd.setCursor(0, 1);
    lcd.print("HX711 missing");
  }
  delay(800);
  lcd.clear();
}

void loop() {
  if (Serial.available() > 0) {
    const char c = (char)Serial.read();
    if (c == 't') {
      scale.tare(20);
      peak = 0.0f;
      Serial.println("tared");
    } else if (c == 'z') {
      peak = 0.0f;
    }
  }

  const uint32_t now = millis();
  if (now - lastUpdate < 400) return;
  lastUpdate = now;

  if (!scale.wait_ready_timeout(300)) {
    lcd.setCursor(0, 0);
    lcd.print("no sensor       ");
    return;
  }

  const float grams = scale.get_units(3);
  if (grams > peak) peak = grams;

  lcd.setCursor(0, 0);
  lcd.print("W ");
  lcd.print(grams, 1);
  lcd.print("g        ");

  lcd.setCursor(0, 1);
  lcd.print("peak ");
  lcd.print(peak, 1);
  lcd.print("g      ");

  Serial.print(grams, 2);
  Serial.print(" g, peak ");
  Serial.println(peak, 2);
}
