// @board xiao_rp2040
// @desc UART0 の pin を GP0/GP1 と GP28/GP29 で切り替えながら USB Serial と橋渡しする

#include <Arduino.h>

// XIAO RP2040 で UART0 に割り当てられるパッドは 2 組ある。
//   組 A: D6=GP0 (TX) / D7=GP1 (RX)  … 既定の Serial1
//   組 B: D2=GP28 (TX) / D3=GP29 (RX) … 同じ UART0 を別パッドへ出す
// UART1 の TX/RX (GP4/GP5, GP8/GP9, ...) は XIAO では片側がパッドに出ていないため使わない。
struct PinPair {
  const char* label;
  uint8_t tx;
  uint8_t rx;
};

static const PinPair PAIRS[] = {
  {"A:GP0/GP1", 0, 1},
  {"B:GP28/GP29", 28, 29},
};
static const uint8_t PAIR_COUNT = sizeof(PAIRS) / sizeof(PAIRS[0]);
static const uint32_t LINK_BAUD = 115200;
static const uint32_t PROBE_TIMEOUT_MS = 2000;

static uint8_t active = 0;
static uint32_t bytesUp = 0;
static uint32_t bytesDown = 0;
static uint32_t switches = 0;

static void applyPins(uint8_t index) {
  const PinPair& p = PAIRS[index];
  // setTX/setRX は begin の前でないと効かないので、必ず end してから差し替える。
  Serial1.end();
  Serial1.setTX(p.tx);
  Serial1.setRX(p.rx);
  Serial1.setFIFOSize(512);
  Serial1.begin(LINK_BAUD, SERIAL_8N1);

  Serial.print("uart0 pins -> ");
  Serial.println(p.label);
}

static bool probeLink() {
  while (Serial1.available() > 0) Serial1.read();
  Serial1.print("PING\n");
  Serial1.flush();

  const uint32_t deadline = millis() + PROBE_TIMEOUT_MS;
  while (millis() < deadline) {
    if (Serial1.available() > 0) return true;
    delay(5);
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  applyPins(active);
  if (!probeLink()) {
    active = (active + 1) % PAIR_COUNT;
    switches++;
    applyPins(active);
  }
  Serial.println("bridge ready");
}

void loop() {
  while (Serial.available() > 0) {
    Serial1.write((uint8_t)Serial.read());
    bytesDown++;
  }
  while (Serial1.available() > 0) {
    Serial.write((uint8_t)Serial1.read());
    bytesUp++;
  }

  // 30 秒まったく上りが無ければ配線側のパッドを疑って組を入れ替える。
  static uint32_t lastReport = 0;
  static uint32_t lastUp = 0;
  if (millis() - lastReport >= 30000) {
    if (bytesUp == lastUp) {
      active = (active + 1) % PAIR_COUNT;
      switches++;
      applyPins(active);
    }
    lastUp = bytesUp;
    lastReport = millis();

    Serial.print("pins=");
    Serial.print(PAIRS[active].label);
    Serial.print(" up=");
    Serial.print(bytesUp);
    Serial.print(" down=");
    Serial.print(bytesDown);
    Serial.print(" switches=");
    Serial.println(switches);
  }
}
