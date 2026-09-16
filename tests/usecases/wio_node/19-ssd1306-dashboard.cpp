// @board wio_node
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc Grove I2C の SSD1306 に WiFi 状態と A0 の波形を描く

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

static const uint8_t GROVE_POWER = 15;
static const uint8_t SCREEN_WIDTH = 128;
static const uint8_t SCREEN_HEIGHT = 64;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
static bool ready = false;
static uint16_t history[SCREEN_WIDTH];
static uint8_t head = 0;
static uint32_t lastDraw = 0;

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  Wire.begin(4, 5);
  ready = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (!ready) {
    Serial.println("SSD1306 allocation failed");
    return;
  }
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("DigiCode Text"));
  display.println(F("Wio Node"));
  display.display();
  delay(800);
}

void loop() {
  if (!ready) {
    delay(2000);
    return;
  }
  const uint32_t now = millis();
  if (now - lastDraw < 120) return;
  lastDraw = now;

  const int raw = analogRead(A0);
  history[head] = (uint16_t)raw;
  head = (uint8_t)((head + 1) % SCREEN_WIDTH);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print(F("A0 "));
  display.print(raw);
  display.print(F(" heap "));
  display.println(ESP.getFreeHeap());

  display.setCursor(0, 10);
  display.print(F("wifi "));
  display.print((int)WiFi.status());
  display.print(F(" up "));
  display.print(now / 1000);
  display.println(F("s"));

  display.drawRect(0, 22, SCREEN_WIDTH, SCREEN_HEIGHT - 22, SSD1306_WHITE);
  for (uint8_t x = 0; x < SCREEN_WIDTH - 2; x++) {
    const uint16_t sample = history[(head + x) % SCREEN_WIDTH];
    const uint8_t h = (uint8_t)map(sample, 0, 1023, 0, SCREEN_HEIGHT - 26);
    display.drawFastVLine(x + 1, SCREEN_HEIGHT - 3 - h, h, SSD1306_WHITE);
  }
  display.display();
  yield();
}
