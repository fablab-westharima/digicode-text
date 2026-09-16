// @board pico
// @lib adafruit/Adafruit MAX31855 library@1.4.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc K 型熱電対アンプ MAX31855 をソフト SPI で読み、冷接点温度と断線・地絡・天絡を分類する

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_MAX31855.h>

// Pico は空き GPIO が多いので、SD などが載る SPI0 (GP16-GP19) とは別の 3 本を割り当てる。
static const uint8_t TC_SCK = 10;
static const uint8_t TC_CS = 11;
static const uint8_t TC_DO = 12;

// readError() のビット定義。ライブラリのマクロ名に依存しないよう自前で持つ。
static const uint8_t FAULT_OPEN_CIRCUIT = 0x01;
static const uint8_t FAULT_SHORT_TO_GND = 0x02;
static const uint8_t FAULT_SHORT_TO_VCC = 0x04;

Adafruit_MAX31855 thermocouple(TC_SCK, TC_CS, TC_DO);

static bool ready = false;
static uint32_t faultCount = 0;

static void printFault(uint8_t fault) {
  Serial.print("fault=0x");
  Serial.print(fault, HEX);
  if (fault & FAULT_OPEN_CIRCUIT) Serial.print(" open");
  if (fault & FAULT_SHORT_TO_GND) Serial.print(" short-gnd");
  if (fault & FAULT_SHORT_TO_VCC) Serial.print(" short-vcc");
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  pinMode(LED_BUILTIN, OUTPUT);
  // ソフト SPI 実装なので SPI.begin() は要らないが、CS は先に上げておく。
  pinMode(TC_CS, OUTPUT);
  digitalWrite(TC_CS, HIGH);

  ready = thermocouple.begin();
  if (!ready) {
    Serial.println("max31855 not responding");
    return;
  }
  Serial.println("max31855 ready");
}

void loop() {
  if (!ready) {
    delay(1000);
    return;
  }

  const uint8_t fault = thermocouple.readError();
  if (fault) {
    faultCount++;
    digitalWrite(LED_BUILTIN, HIGH);
    printFault(fault);
    delay(1000);
    return;
  }
  digitalWrite(LED_BUILTIN, LOW);

  const double hotC = thermocouple.readCelsius();
  const double coldC = thermocouple.readInternal();
  if (isnan(hotC)) {
    Serial.println("reading is nan");
    delay(1000);
    return;
  }

  Serial.print("hotC=");
  Serial.print(hotC, 2);
  Serial.print(" coldC=");
  Serial.print(coldC, 2);
  Serial.print(" hotF=");
  Serial.print(thermocouple.readFahrenheit(), 2);
  Serial.print(" deltaC=");
  Serial.print(hotC - coldC, 2);
  Serial.print(" faults=");
  Serial.println(faultCount);

  delay(1000);
}
