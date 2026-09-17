// @board pico
// @skip 対象外: 無印 Pico に無線が無い。WiFi は今回の縦串の範囲外
// @desc 参考: arduino-pico の WiFi.h は Pico W の CYW43 前提。無印 Pico には無線が載っていない

#include <Arduino.h>

// arduino-pico の WiFi ライブラリは CYW43 を積んだ Pico W / Pico 2 W 用。
// rpipico variant には無線モジュールが無いため対象外。

void setup() {
  Serial.begin(115200);
  Serial.println("wifi is out of scope for pico");
}

void loop() {
  delay(1000);
}
