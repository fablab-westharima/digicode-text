// @board m5stack_cores3
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc DS18B20 の温度を OLED に折れ線グラフとして描き続ける

#include <Arduino.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

static const uint8_t ONE_WIRE_PIN = 6;
static const uint8_t GRAPH_WIDTH = 128;

OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

static float history[GRAPH_WIDTH];
static uint8_t count = 0;
static bool oledReady = false;
static uint32_t lastSample = 0;

static void pushSample(float c) {
  if (count < GRAPH_WIDTH) {
    history[count++] = c;
    return;
  }
  for (uint8_t i = 1; i < GRAPH_WIDTH; i++) history[i - 1] = history[i];
  history[GRAPH_WIDTH - 1] = c;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Wire.begin(2, 1);
  oledReady = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  sensors.begin();
  sensors.setResolution(11);
  Serial.print("devices=");
  Serial.println(sensors.getDeviceCount());
}

void loop() {
  const uint32_t now = millis();
  if (now - lastSample < 1000) return;
  lastSample = now;

  sensors.requestTemperatures();
  const float c = sensors.getTempCByIndex(0);
  if (c == DEVICE_DISCONNECTED_C) {
    Serial.println("probe disconnected");
    return;
  }
  pushSample(c);
  Serial.println(c, 2);

  if (!oledReady) return;

  float minV = history[0], maxV = history[0];
  for (uint8_t i = 1; i < count; i++) {
    if (history[i] < minV) minV = history[i];
    if (history[i] > maxV) maxV = history[i];
  }
  if (maxV - minV < 1.0f) maxV = minV + 1.0f;

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print(c, 2);
  display.print(F("C  "));
  display.print(minV, 1);
  display.print(F(".."));
  display.print(maxV, 1);

  for (uint8_t i = 1; i < count; i++) {
    const int y0 = 63 - (int)((history[i - 1] - minV) / (maxV - minV) * 40.0f);
    const int y1 = 63 - (int)((history[i] - minV) / (maxV - minV) * 40.0f);
    display.drawLine(i - 1, y0, i, y1, SSD1306_WHITE);
  }
  display.display();
}
