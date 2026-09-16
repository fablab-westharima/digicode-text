// @board pico
// @desc ライブラリ無しで I2C バスを走査する。Mbed コアの Wire は GP4/GP5 固定で pin を移せない

#include <Arduino.h>
#include <Wire.h>

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

  // variant の PIN_WIRE_SDA=GP4 / PIN_WIRE_SCL=GP5 が固定で使われる。
  Wire.begin();
  Wire.setClock(100000);
  Serial.print("i2c scan on SDA=");
  Serial.print(PIN_WIRE_SDA);
  Serial.print(" SCL=");
  Serial.println(PIN_WIRE_SCL);
}

void loop() {
  Serial.print("scan: ");
  Serial.print(scanOnce());
  Serial.println(" device(s)");
  delay(5000);
}
