// @board pico_w
// @lib paulstoffregen/OneWire@2.3.8
// @desc OneWire バスを生で走査し、ROM と CRC を確認して DS18B20 のスクラッチパッドを直接読む

#include <Arduino.h>
#include <OneWire.h>

static const uint8_t ONEWIRE_PIN = 16;  // GP16

OneWire bus(ONEWIRE_PIN);

static void printAddress(const uint8_t addr[8]) {
  for (uint8_t i = 0; i < 8; i++) {
    if (addr[i] < 16) Serial.print('0');
    Serial.print(addr[i], HEX);
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("onewire scan");
}

void loop() {
  uint8_t addr[8];
  bus.reset_search();
  delay(250);

  while (bus.search(addr)) {
    Serial.print("rom=");
    printAddress(addr);
    Serial.print(" family=0x");
    Serial.print(addr[0], HEX);
    Serial.print(" crc=");
    Serial.println(OneWire::crc8(addr, 7) == addr[7] ? "ok" : "ng");

    if (addr[0] != 0x28 && addr[0] != 0x10 && addr[0] != 0x22) continue;

    bus.reset();
    bus.select(addr);
    bus.write(0x44, 1);
    delay(800);

    bus.reset();
    bus.select(addr);
    bus.write(0xBE);

    uint8_t data[9];
    for (uint8_t i = 0; i < 9; i++) data[i] = bus.read();

    const int16_t raw = (int16_t)((data[1] << 8) | data[0]);
    Serial.print("  tempC=");
    Serial.println(raw / 16.0f, 2);
  }

  bus.depower();
  delay(2000);
}
