// @board xiao_rp2040
// @lib autowp/autowp-mcp2515@1.3.1
// @desc SPI 接続の MCP2515 を 500kbps の listen only にし、受信フレームを Serial へ出す

#include <Arduino.h>
#include <SPI.h>
#include <mcp2515.h>

// SPI0: D8=GP2 SCK, D10=GP3 MOSI, D9=GP4 MISO。CS は D2=GP28、INT は D3=GP29。
static const uint8_t CAN_SCK = 2;
static const uint8_t CAN_MOSI = 3;
static const uint8_t CAN_MISO = 4;
static const uint8_t CAN_CS = 28;
static const uint8_t CAN_INT = 29;
static const uint32_t SPI_CLOCK_HZ = 10000000;

// SPIClass* を渡すコンストラクタは内部で SPI.begin() を呼ばない。
// arduino-pico では setSCK/setTX/setRX を begin より前に済ませたいのでこちらを使う。
MCP2515 mcp2515(CAN_CS, SPI_CLOCK_HZ, &SPI);

static struct can_frame frame;
static uint32_t received = 0;
static uint32_t errorEvents = 0;
static uint32_t lastReport = 0;
static bool canReady = false;

static void printFrame(const struct can_frame& f) {
  Serial.print("id=0x");
  Serial.print(f.can_id & CAN_SFF_MASK, HEX);
  Serial.print(" dlc=");
  Serial.print(f.can_dlc);
  Serial.print(" data=");
  for (uint8_t i = 0; i < f.can_dlc; i++) {
    if (f.data[i] < 0x10) Serial.print('0');
    Serial.print(f.data[i], HEX);
    Serial.print(' ');
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  pinMode(CAN_INT, INPUT_PULLUP);

  SPI.setSCK(CAN_SCK);
  SPI.setTX(CAN_MOSI);
  SPI.setRX(CAN_MISO);
  SPI.begin();

  // 外付けクリスタルが 8MHz のモジュールを想定する。16MHz 品なら MCP_16MHZ にする。
  canReady = mcp2515.reset() == MCP2515::ERROR_OK
             && mcp2515.setBitrate(CAN_500KBPS, MCP_8MHZ) == MCP2515::ERROR_OK
             && mcp2515.setListenOnlyMode() == MCP2515::ERROR_OK;
  Serial.println(canReady ? "mcp2515 listening at 500kbps" : "mcp2515 init failed");
}

void loop() {
  if (!canReady) {
    delay(1000);
    return;
  }

  // INT が LOW のときだけ SPI を叩く。
  if (digitalRead(CAN_INT) == LOW) {
    while (mcp2515.readMessage(&frame) == MCP2515::ERROR_OK) {
      received++;
      printFrame(frame);
    }
    const uint8_t flags = mcp2515.getErrorFlags();
    if (flags != 0) {
      errorEvents++;
      Serial.print("eflg=0x");
      Serial.println(flags, HEX);
      mcp2515.clearRXnOVRFlags();
    }
    mcp2515.clearInterrupts();
  }

  const uint32_t now = millis();
  if (now - lastReport < 5000) return;
  lastReport = now;
  Serial.print("received=");
  Serial.print(received);
  Serial.print(" errorEvents=");
  Serial.println(errorEvents);
}
