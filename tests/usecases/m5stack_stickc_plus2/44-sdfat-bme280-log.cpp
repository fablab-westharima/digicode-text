// @board m5stack_stickc_plus2
// @skip 対象外: 外に出ている GPIO が 5 本しかなく、SD の SPI 4 本と BME280 の I2C 2 本を同時に出せない
// @desc 参考: SD だけなら 43-sdfat-csv-log.cpp が 5 本に収まる (SPI 4 本 + ADC 1 本)

#include <Arduino.h>

// この板が外に出している GPIO は GPIO0、GPIO26、GPIO32、GPIO33、GPIO36 (ヘッダでは GPIO25 と
// 同じ網) の 5 本だけ。SD の SCK/MISO/MOSI/CS で 4 本使うと残りは 1 本で、I2C の SDA と SCL を
// 同時には出せない。実機で配線できない構成を ok として残さないため対象外。

void setup() {
  Serial.begin(115200);
  Serial.println("sd + i2c needs 6 pins; this board exposes 5");
}

void loop() {
  delay(1000);
}
