// @board xiao_rp2040
// @desc ライブラリ無しで RP2040 固有 API (ヒープ・チップ ID・watchdog・RGB LED) を触る

#include <Arduino.h>

static uint32_t loops = 0;

void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(PIN_LED_R, OUTPUT);
  pinMode(PIN_LED_G, OUTPUT);
  pinMode(PIN_LED_B, OUTPUT);
  // XIAO RP2040 の RGB LED はアノードコモン。HIGH で消灯。
  digitalWrite(PIN_LED_R, HIGH);
  digitalWrite(PIN_LED_G, HIGH);
  digitalWrite(PIN_LED_B, HIGH);

  analogReadResolution(12);

  Serial.print("chipId=");
  Serial.println(rp2040.getChipID());
  Serial.print("cpuHz=");
  Serial.println(F_CPU);
  Serial.print("totalHeap=");
  Serial.println(rp2040.getTotalHeap());

  // 8 秒応答が無ければ再起動する watchdog。
  rp2040.wdt_begin(8000);
}

void loop() {
  rp2040.wdt_reset();
  loops++;

  digitalWrite(PIN_LED_G, (loops % 2) ? LOW : HIGH);

  Serial.print("loops=");
  Serial.print(loops);
  Serial.print(" freeHeap=");
  Serial.print(rp2040.getFreeHeap());
  Serial.print(" usedHeap=");
  Serial.print(rp2040.getUsedHeap());
  Serial.print(" cycles=");
  Serial.print((uint32_t)rp2040.getCycleCount64());
  Serial.print(" a0=");
  Serial.println(analogRead(A0));
  delay(1000);
}
