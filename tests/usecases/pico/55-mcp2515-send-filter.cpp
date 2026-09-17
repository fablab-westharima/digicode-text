// @board pico
// @lib autowp/autowp-mcp2515@1.3.1
// @desc MCP2515 に受信フィルタを張って 2 つの ID だけ通し、同時に 100ms 周期でフレームを送る

#include <Arduino.h>
#include <SPI.h>
#include <mcp2515.h>

// SPI0: GP18 SCK, GP19 MOSI, GP16 MISO。CS は GP17、INT は GP20。
static const uint8_t CAN_SCK = 18;
static const uint8_t CAN_MOSI = 19;
static const uint8_t CAN_MISO = 16;
static const uint8_t CAN_CS = 17;
static const uint8_t CAN_INT = 20;

// 通したい ID は 0x100 と 0x101 の 2 本だけ。マスクは下位 11bit を全部見る。
static const uint32_t ACCEPT_ID_A = 0x100;
static const uint32_t ACCEPT_ID_B = 0x101;
static const uint32_t SFF_FULL_MASK = 0x7FF;
static const uint32_t TX_ID = 0x200;
static const uint32_t TX_INTERVAL_MS = 100;

MCP2515 mcp2515(CAN_CS, 10000000, &SPI);

static struct can_frame rxFrame;
static struct can_frame txFrame;
static uint32_t sent = 0;
static uint32_t dropped = 0;
static uint32_t received = 0;
static uint32_t lastTx = 0;
static bool canReady = false;

// RXB0 と RXB1 の両方にマスクを入れないと、片方が素通しになって
// フィルタが効いていないように見える。
static bool installFilters() {
  if (mcp2515.setFilterMask(MCP2515::MASK0, false, SFF_FULL_MASK) != MCP2515::ERROR_OK) return false;
  if (mcp2515.setFilterMask(MCP2515::MASK1, false, SFF_FULL_MASK) != MCP2515::ERROR_OK) return false;
  if (mcp2515.setFilter(MCP2515::RXF0, false, ACCEPT_ID_A) != MCP2515::ERROR_OK) return false;
  if (mcp2515.setFilter(MCP2515::RXF1, false, ACCEPT_ID_B) != MCP2515::ERROR_OK) return false;
  if (mcp2515.setFilter(MCP2515::RXF2, false, ACCEPT_ID_A) != MCP2515::ERROR_OK) return false;
  if (mcp2515.setFilter(MCP2515::RXF3, false, ACCEPT_ID_B) != MCP2515::ERROR_OK) return false;
  return true;
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

  if (mcp2515.reset() != MCP2515::ERROR_OK) {
    Serial.println("mcp2515 reset failed");
    return;
  }
  if (mcp2515.setBitrate(CAN_500KBPS, MCP_8MHZ) != MCP2515::ERROR_OK) {
    Serial.println("mcp2515 setBitrate failed");
    return;
  }
  // フィルタは config mode のうちに書く。
  if (!installFilters()) {
    Serial.println("mcp2515 filter setup failed");
    return;
  }
  if (mcp2515.setNormalMode() != MCP2515::ERROR_OK) {
    Serial.println("mcp2515 setNormalMode failed");
    return;
  }

  txFrame.can_id = TX_ID;
  txFrame.can_dlc = 8;
  canReady = true;
  Serial.println("mcp2515 ready: filter 0x100/0x101, tx 0x200");
}

void loop() {
  if (!canReady) {
    delay(1000);
    return;
  }

  if (digitalRead(CAN_INT) == LOW) {
    while (mcp2515.readMessage(&rxFrame) == MCP2515::ERROR_OK) {
      received++;
      Serial.print("rx 0x");
      Serial.print(rxFrame.can_id & CAN_SFF_MASK, HEX);
      Serial.print(" dlc=");
      Serial.println(rxFrame.can_dlc);
    }
    mcp2515.clearInterrupts();
  }

  const uint32_t now = millis();
  if (now - lastTx < TX_INTERVAL_MS) return;
  lastTx = now;

  // 8 バイトのうち先頭 4 バイトに連番、残りに uptime の下位を入れる。
  txFrame.data[0] = (uint8_t)(sent >> 24);
  txFrame.data[1] = (uint8_t)(sent >> 16);
  txFrame.data[2] = (uint8_t)(sent >> 8);
  txFrame.data[3] = (uint8_t)sent;
  txFrame.data[4] = (uint8_t)(now >> 24);
  txFrame.data[5] = (uint8_t)(now >> 16);
  txFrame.data[6] = (uint8_t)(now >> 8);
  txFrame.data[7] = (uint8_t)now;

  const MCP2515::ERROR result = mcp2515.sendMessage(&txFrame);
  if (result == MCP2515::ERROR_OK) {
    sent++;
  } else {
    dropped++;
    Serial.print("tx failed rc=");
    Serial.println((int)result);
  }

  if ((sent % 50) == 0) {
    Serial.print("sent=");
    Serial.print(sent);
    Serial.print(" dropped=");
    Serial.print(dropped);
    Serial.print(" received=");
    Serial.println(received);
  }
}
