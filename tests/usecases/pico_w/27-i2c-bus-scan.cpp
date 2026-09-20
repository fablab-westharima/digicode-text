// @board pico_w
// @desc ライブラリ無しで I2C バスを走査する。earlephilhower の Wire.setSDA/setSCL で pin を移す

#include <Arduino.h>
#include <Wire.h>

static const uint8_t SDA_PIN = 4;  // GP4 (I2C0 既定)
static const uint8_t SCL_PIN = 5;  // GP5 (I2C0 既定)

static uint8_t scanOnce() {
  uint8_t found = 0;
  for (uint8_t address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    const uint8_t error = Wire.endTransmission();
    if (error == 0) {
      found++;
      Serial.print("found 0x");
      if (address < 16) Serial.print('0');
      Serial.println(address, HEX);
    } else if (error == 4) {
      Serial.print("bus error at 0x");
      Serial.println(address, HEX);
    }
  }
  return found;
}

void setup() {
  Serial.begin(115200);
  delay(500);

  if (!Wire.setSDA(SDA_PIN)) Serial.println("setSDA rejected");
  if (!Wire.setSCL(SCL_PIN)) Serial.println("setSCL rejected");
  Wire.begin();
  Wire.setClock(100000);
  Wire.setTimeout(25);
  Serial.println("i2c scan ready");
}

void loop() {
  Serial.print("scan: ");
  Serial.print(scanOnce());
  Serial.println(" device(s)");
  delay(5000);
}
