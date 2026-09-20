// @board pico_w
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc OLED にステータス画面とバーグラフを描き、ボタンで画面を切り替える

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

static const uint8_t BUTTON_PIN = 20;  // GP20

Adafruit_SSD1306 display(128, 64, &Wire, -1);
static uint8_t page = 0;
static bool lastButton = HIGH;

static void drawStatusPage() {
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("Raspberry Pi Pico W"));
  display.drawFastHLine(0, 10, 128, SSD1306_WHITE);
  display.setCursor(0, 14);
  display.print(F("uptime "));
  display.print(millis() / 1000);
  display.println(F(" s"));
  display.setCursor(0, 26);
  display.print(F("A0 raw "));
  display.println(analogRead(A0));
}

static void drawGaugePage() {
  const int raw = analogRead(A0);
  const int width = map(raw, 0, 4095, 0, 124);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("A0 gauge"));
  display.drawRect(0, 20, 128, 16, SSD1306_WHITE);
  display.fillRect(2, 22, width, 12, SSD1306_WHITE);
  display.setCursor(0, 44);
  display.print((raw * 3.3f) / 4095.0f, 3);
  display.println(F(" V"));
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  analogReadResolution(12);

  Wire.begin();

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("ssd1306 not found");
  }
  display.setTextColor(SSD1306_WHITE);
  display.clearDisplay();
  display.display();
}

void loop() {
  const bool button = digitalRead(BUTTON_PIN);
  if (lastButton == HIGH && button == LOW) {
    page = (page + 1) % 2;
    Serial.print("page=");
    Serial.println(page);
    delay(50);
  }
  lastButton = button;

  display.clearDisplay();
  if (page == 0) drawStatusPage();
  else drawGaugePage();
  display.display();
  delay(100);
}
