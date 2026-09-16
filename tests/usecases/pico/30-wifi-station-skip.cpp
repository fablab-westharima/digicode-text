// @board pico
// @skip 対象外: 無印 Pico に無線が無い。WiFi は今回の縦串の範囲外
// @desc 参考: Mbed コアの WiFi.h は Nano RP2040 Connect (NINA) 前提。無印 Pico には載っていない

#include <Arduino.h>

// framework-arduino-mbed の WiFi ライブラリは NINA-W102 を積んだ board 用。
// RASPBERRY_PI_PICO variant には無線モジュールが無いため対象外。

void setup() {
  Serial.begin(115200);
  Serial.println("wifi is out of scope for pico");
}

void loop() {
  delay(1000);
}
