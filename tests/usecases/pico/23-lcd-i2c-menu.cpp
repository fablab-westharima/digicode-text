// @board pico
// @lib marcoschwartz/LiquidCrystal_I2C@1.1.4
// @desc 16x2 キャラクタ LCD に 3 画面のメニューを出し、2 ボタンで送り・決定する

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

static const uint8_t NEXT_BUTTON = 20;    // GP20
static const uint8_t SELECT_BUTTON = 21;  // GP21

LiquidCrystal_I2C lcd(0x27, 16, 2);

static const char* const ITEMS[] = {"1 Live value", "2 Interval", "3 Calibrate"};
static const uint8_t ITEM_COUNT = 3;
static uint8_t cursor = 0;
static uint32_t intervalMs = 1000;

static void draw() {
  lcd.setCursor(0, 0);
  lcd.print("MENU            ");
  lcd.setCursor(0, 1);
  lcd.print(ITEMS[cursor]);
  lcd.print("            ");
}

void setup() {
  Serial.begin(115200);
  pinMode(NEXT_BUTTON, INPUT_PULLUP);
  pinMode(SELECT_BUTTON, INPUT_PULLUP);

  Wire.begin();

  lcd.init();
  lcd.backlight();
  lcd.clear();

  uint8_t degree[8] = {0x06, 0x09, 0x09, 0x06, 0x00, 0x00, 0x00, 0x00};
  lcd.createChar(0, degree);
  draw();
}

void loop() {
  if (digitalRead(NEXT_BUTTON) == LOW) {
    cursor = (cursor + 1) % ITEM_COUNT;
    draw();
    delay(200);
  }

  if (digitalRead(SELECT_BUTTON) == LOW) {
    lcd.clear();
    lcd.setCursor(0, 0);
    if (cursor == 0) {
      lcd.print("A0 ");
      lcd.print(analogRead(A0));
      lcd.write((uint8_t)0);
      lcd.print("C");
    } else if (cursor == 1) {
      intervalMs = intervalMs >= 5000 ? 500 : intervalMs + 500;
      lcd.print("Interval ");
      lcd.print(intervalMs);
    } else {
      lcd.print("Calibrating...");
      lcd.noBacklight();
      delay(300);
      lcd.backlight();
    }
    Serial.print("selected=");
    Serial.println(cursor);
    delay(800);
    lcd.clear();
    draw();
  }
  delay(50);
}
