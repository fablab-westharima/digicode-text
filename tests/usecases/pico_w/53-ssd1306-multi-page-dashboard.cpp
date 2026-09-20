// @board pico_w
// @lib 4-20ma/ModbusMaster@2.0.1
// @lib bogde/HX711@0.7.5
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc BME280 / HX711 / Modbus の 3 系統を 1 台の OLED に 3 ページで出し、5 秒ごとに切り替える

#include <Arduino.h>
#include <Wire.h>
#include <ModbusMaster.h>
#include <HX711.h>
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Pico W: I2C0 の既定 pin である GP4 (SDA) / GP5 (SCL) を setSDA/setSCL で明示する。
// HX711: GP14 が DOUT、GP15 が SCK。
// RS485 は UART0 の既定 pin GP0 (TX) / GP1 (RX)、DE/RE は GP2 で駆動する。
static const uint8_t HX711_DOUT = 14;
static const uint8_t HX711_SCK = 15;
static const uint8_t RS485_DE = 2;
static const uint8_t SLAVE_ID = 1;
static const uint8_t BME280_I2C_ADDRESS = 0x76;
static const uint8_t SCREEN_WIDTH = 128;
static const uint8_t SCREEN_HEIGHT = 64;
static const uint32_t PAGE_INTERVAL_MS = 5000;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_BME280 bme;
HX711 scale;
ModbusMaster node;

static bool displayReady = false;
static bool bmeReady = false;
static uint8_t page = 0;
static uint32_t lastPage = 0;
static uint32_t lastSample = 0;
static float temperatureC = 0.0f;
static float humidityPct = 0.0f;
static float pressureHpa = 0.0f;
static float grams = 0.0f;
static uint16_t holding[4] = {0, 0, 0, 0};
static uint8_t modbusStatus = 0xFF;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { Serial1.flush(); digitalWrite(RS485_DE, LOW); }

static void header(const __FlashStringHelper* title) {
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(title);
  display.print(F("  "));
  display.print(page + 1);
  display.println(F("/3"));
  display.drawFastHLine(0, 10, SCREEN_WIDTH, SSD1306_WHITE);
}

static void drawEnvironment() {
  header(F("environment"));
  display.setCursor(0, 16);
  if (!bmeReady) {
    display.println(F("bme280 not found"));
    return;
  }
  display.setTextSize(2);
  display.print(temperatureC, 1);
  display.println(F(" C"));
  display.setTextSize(1);
  display.setCursor(0, 36);
  display.print(humidityPct, 1);
  display.println(F(" %RH"));
  display.print(pressureHpa, 1);
  display.println(F(" hPa"));
}

static void drawWeight() {
  header(F("load cell"));
  display.setTextSize(2);
  display.setCursor(0, 16);
  display.print(grams, 0);
  display.println(F(" g"));
  display.setTextSize(1);
  display.setCursor(0, 40);
  display.print(F("ready="));
  display.println(scale.is_ready() ? F("yes") : F("no"));
  const int16_t width = (int16_t)constrain((long)(grams / 2000.0f * 124.0f), 0L, 124L);
  display.drawRect(0, 52, SCREEN_WIDTH, 10, SSD1306_WHITE);
  display.fillRect(2, 54, width, 6, SSD1306_WHITE);
}

static void drawModbus() {
  header(F("modbus"));
  display.setCursor(0, 16);
  if (modbusStatus != node.ku8MBSuccess) {
    display.print(F("error 0x"));
    display.println(modbusStatus, HEX);
    return;
  }
  for (uint8_t i = 0; i < 4; i++) {
    display.print(F("h["));
    display.print(i);
    display.print(F("]="));
    display.println(holding[i]);
  }
}

void setup() {
  Serial.begin(115200);
  const uint32_t serialDeadline = millis() + 3000;
  while (!Serial && millis() < serialDeadline) delay(10);

  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  Serial1.setTX(0);
  Serial1.setRX(1);
  Serial1.begin(9600, SERIAL_8N1);
  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  Wire.setSDA(4);
  Wire.setSCL(5);
  Wire.begin();
  Wire.setClock(400000);

  displayReady = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (displayReady) {
    display.setTextColor(SSD1306_WHITE);
    display.clearDisplay();
    display.display();
  }
  bmeReady = bme.begin(BME280_I2C_ADDRESS, &Wire);
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(420.0f);
  scale.tare(10);

  Serial.print("display=");
  Serial.print(displayReady);
  Serial.print(" bme=");
  Serial.println(bmeReady);
}

void loop() {
  const uint32_t now = millis();

  if (now - lastSample >= 1000) {
    lastSample = now;
    if (bmeReady) {
      temperatureC = bme.readTemperature();
      humidityPct = bme.readHumidity();
      pressureHpa = bme.readPressure() / 100.0f;
    }
    if (scale.is_ready()) grams = scale.get_units(3);
    modbusStatus = node.readHoldingRegisters(0x0000, 4);
    if (modbusStatus == node.ku8MBSuccess) {
      for (uint8_t i = 0; i < 4; i++) holding[i] = node.getResponseBuffer(i);
      node.clearResponseBuffer();
    }
  }

  if (now - lastPage >= PAGE_INTERVAL_MS) {
    lastPage = now;
    page = (uint8_t)((page + 1) % 3);
  }

  if (displayReady) {
    display.clearDisplay();
    if (page == 0) drawEnvironment();
    else if (page == 1) drawWeight();
    else drawModbus();
    display.display();
  }
  delay(100);
}
