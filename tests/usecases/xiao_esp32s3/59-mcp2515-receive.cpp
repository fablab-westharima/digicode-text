// @board xiao_esp32s3
// @lib autowp/autowp-mcp2515@1.3.1
// @desc SPI 接続の MCP2515 を 500kbps で listen only にし、受信フレームを Serial へ出す

#include <Arduino.h>
#include <SPI.h>
#include <mcp2515.h>

// XIAO ESP32S3: SCK=GPIO7 MISO=GPIO8 MOSI=GPIO9 (D8/D9/D10) CS=GPIO4(D3) INT=GPIO3(D2)
static const uint8_t SPI_SCK = 7;
static const uint8_t SPI_MISO = 8;
static const uint8_t SPI_MOSI = 9;
static const uint8_t CAN_CS = 4;
static const uint8_t CAN_INT = 3;
static const uint32_t SPI_CLOCK_HZ = 10000000;

// SPIClass* を渡すコンストラクタは内部で SPI.begin() を呼ばない。
// pin を指定してから自分で begin したいのでこちらを使う。
MCP2515 mcp2515(CAN_CS, SPI_CLOCK_HZ, &SPI);

static struct can_frame frame;
static uint32_t received = 0;
static uint32_t dropped = 0;

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
  delay(200);
  pinMode(CAN_INT, INPUT_PULLUP);

  SPI.begin(SPI_SCK, SPI_MISO, SPI_MOSI, CAN_CS);

  if (mcp2515.reset() != MCP2515::ERROR_OK) {
    Serial.println("mcp2515 reset failed");
    return;
  }
  // 外付けクリスタルが 8MHz のモジュールを想定する。16MHz 品なら MCP_16MHZ にする。
  if (mcp2515.setBitrate(CAN_500KBPS, MCP_8MHZ) != MCP2515::ERROR_OK) {
    Serial.println("mcp2515 setBitrate failed");
    return;
  }
  if (mcp2515.setListenOnlyMode() != MCP2515::ERROR_OK) {
    Serial.println("mcp2515 setListenOnlyMode failed");
    return;
  }
  Serial.println("mcp2515 listening at 500kbps");
}

void loop() {
  // INT が LOW のときだけ SPI を叩く。ポーリングだけでも動くが無駄が多い。
  if (digitalRead(CAN_INT) == HIGH) {
    delay(2);
    return;
  }

  while (mcp2515.readMessage(&frame) == MCP2515::ERROR_OK) {
    received++;
    printFrame(frame);
  }

  const uint8_t errorFlags = mcp2515.getErrorFlags();
  if (errorFlags != 0) {
    dropped++;
    Serial.print("eflg=0x");
    Serial.println(errorFlags, HEX);
    mcp2515.clearRXnOVRFlags();
  }
  mcp2515.clearInterrupts();

  if ((received % 50) == 0 && received > 0) {
    Serial.print("received=");
    Serial.print(received);
    Serial.print(" errors=");
    Serial.println(dropped);
  }
}
