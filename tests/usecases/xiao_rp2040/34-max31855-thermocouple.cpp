// @board xiao_rp2040
// @lib adafruit/Adafruit MAX31855 library@1.4.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc K 型熱電対アンプ MAX31855 をソフト SPI で読み、冷接点温度と断線・地絡・天絡を分類する

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_MAX31855.h>

// XIAO RP2040 の SPI0 パッドをそのまま使う。MAX31855 は読み出し専用なので MOSI は要らない。
// D8=GP2 が SCK、D9=GP4 が MISO、D3=GP29 を CS に割り当てる。
static const uint8_t TC_SCK = 2;
static const uint8_t TC_CS = 29;
static const uint8_t TC_DO = 4;

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

  // ソフト SPI 実装なので SPI.begin() は要らないが、同じパッドを共有する
  // 他デバイスと混ぜないことをはっきりさせるために CS を先に上げておく。
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
    printFault(fault);
    delay(1000);
    return;
  }

  const double hotC = thermocouple.readCelsius();
  const double coldC = thermocouple.readInternal();
  if (isnan(hotC)) {
    // 変換中に外れた場合。readError では拾えないことがある。
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
