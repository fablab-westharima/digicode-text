// @board wio_node
// @lib marcoschwartz/LiquidCrystal_I2C@1.1.4
// @desc Grove I2C の 16x2 LCD に A0 の値と稼働時間を表示する

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

static const uint8_t GROVE_POWER = 15;
LiquidCrystal_I2C lcd(0x27, 16, 2);

static uint8_t arrowGlyph[8] = { 0x04, 0x0E, 0x1F, 0x04, 0x04, 0x04, 0x04, 0x00 };
static uint32_t lastUpdate = 0;
static int peak = 0;

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  Wire.begin(4, 5);
  lcd.init();
  lcd.backlight();
  lcd.createChar(0, arrowGlyph);
  lcd.setCursor(0, 0);
  lcd.print("DigiCode Text");
  lcd.setCursor(0, 1);
  lcd.print("Wio Node");
  delay(1000);
  lcd.clear();
}

void loop() {
  const uint32_t now = millis();
  if (now - lastUpdate < 500) return;
  lastUpdate = now;

  const int raw = analogRead(A0); // ESP8266 の A0 は 10bit / 0-1.0V
  if (raw > peak) peak = raw;
  const float volts = raw / 1023.0f;

  lcd.setCursor(0, 0);
  lcd.print("A0 ");
  lcd.print(raw);
  lcd.print(" ");
  lcd.print(volts, 3);
  lcd.print("V   ");

  lcd.setCursor(0, 1);
  lcd.write((uint8_t)0);
  lcd.print(peak);
  lcd.print(" up ");
  lcd.print(now / 1000);
  lcd.print("s   ");

  if ((now / 15000) % 2 == 0) lcd.backlight();
  else lcd.noBacklight();
}
