// @board m5stack_atoms3
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc Modbus RTU で読んだ計測値を 128x64 OLED の計測ダッシュボードとして描く

#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// I2C は GPIO21 (SDA) / GPIO22 (SCL)、RS485 は Serial1 を GPIO33 (RX) / GPIO32 (TX) に出す。
static const uint8_t OLED_SDA = 2;
static const uint8_t OLED_SCL = 1;
static const int8_t RS485_RX = 5;
static const int8_t RS485_TX = 6;
static const uint8_t RS485_DE = 7;
static const uint8_t SLAVE_ID = 1;
static const uint16_t REG_BASE = 0x0000;
static const uint16_t REG_COUNT = 3;
static const uint8_t SCREEN_WIDTH = 128;
static const uint8_t SCREEN_HEIGHT = 64;
static const uint8_t TREND_POINTS = 64;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
ModbusMaster node;

static bool displayReady = false;
static float temperatureC = 0.0f;
static float humidityPct = 0.0f;
static uint16_t pressureHpa = 0;
static uint8_t lastStatus = 0xFF;
static uint32_t polls = 0;
static uint32_t failures = 0;
static uint32_t lastPoll = 0;
static int8_t trend[TREND_POINTS];
static uint8_t trendCount = 0;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

static void pushTrend(float value) {
  const int8_t scaled = (int8_t)constrain((int)value, -40, 80);
  if (trendCount < TREND_POINTS) {
    trend[trendCount++] = scaled;
    return;
  }
  for (uint8_t i = 1; i < TREND_POINTS; i++) trend[i - 1] = trend[i];
  trend[TREND_POINTS - 1] = scaled;
}

static void drawDashboard() {
  if (!displayReady) return;
  display.clearDisplay();

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(F("DigiCode / slave "));
  display.println(SLAVE_ID);
  display.drawFastHLine(0, 10, SCREEN_WIDTH, SSD1306_WHITE);

  display.setCursor(0, 14);
  display.setTextSize(2);
  display.print(temperatureC, 1);
  display.println(F(" C"));

  display.setTextSize(1);
  display.setCursor(0, 32);
  display.print(humidityPct, 1);
  display.print(F(" %RH   "));
  display.print(pressureHpa);
  display.println(F(" hPa"));

  display.setCursor(0, 42);
  display.print(lastStatus == node.ku8MBSuccess ? F("link ok  ") : F("link err "));
  display.print(polls);
  display.print('/');
  display.println(failures);

  // 直近の温度トレンドを 64 点ぶん折れ線で描く。
  for (uint8_t i = 1; i < trendCount; i++) {
    const int16_t y0 = 63 - map(trend[i - 1], -40, 80, 0, 10);
    const int16_t y1 = 63 - map(trend[i], -40, 80, 0, 10);
    display.drawLine((i - 1) * 2, y0, i * 2, y1, SSD1306_WHITE);
  }

  display.display();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  Serial1.begin(9600, SERIAL_8N1, RS485_RX, RS485_TX);
  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  Wire.begin(OLED_SDA, OLED_SCL);
  displayReady = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (!displayReady) {
    Serial.println("ssd1306 not found");
    return;
  }
  display.setTextColor(SSD1306_WHITE);
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("DigiCode Text"));
  display.println(F("modbus dashboard"));
  display.display();
  delay(600);
}

void loop() {
  const uint32_t now = millis();
  if (now - lastPoll >= 2000) {
    lastPoll = now;
    polls++;
    lastStatus = node.readInputRegisters(REG_BASE, REG_COUNT);
    if (lastStatus == node.ku8MBSuccess) {
      temperatureC = (int16_t)node.getResponseBuffer(0) / 10.0f;
      humidityPct = node.getResponseBuffer(1) / 10.0f;
      pressureHpa = node.getResponseBuffer(2);
      node.clearResponseBuffer();
      pushTrend(temperatureC);
    } else {
      failures++;
      Serial.printf("modbus failed 0x%02X\n", lastStatus);
    }
  }

  drawDashboard();
  delay(100);
}
