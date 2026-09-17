// @board wio_node
// @lib autowp/autowp-mcp2515@1.3.1
// @desc ESP8266 のハード SPI に繋いだ MCP2515 を listen only で回し、受信フレームを Serial へ出す

#include <Arduino.h>
#include <SPI.h>
#include <mcp2515.h>

// Wio Node のハード SPI: SCK=GPIO14 MISO=GPIO12 MOSI=GPIO13。
// GPIO15 は Grove 電源に使われているので CS は GPIO16 を使う。
// GPIO16 は割り込みを張れないため INT は使わずポーリングする。
static const uint8_t CAN_CS = 16;
static const uint8_t GROVE_POWER = 15;
static const uint32_t SPI_CLOCK_HZ = 8000000;

// SPIClass* を渡すコンストラクタは内部で SPI.begin() を呼ばない。
MCP2515 mcp2515(CAN_CS, SPI_CLOCK_HZ, &SPI);

static struct can_frame frame;
static uint32_t received = 0;
static uint32_t overflows = 0;
static uint32_t lastReport = 0;
static bool canReady = false;

static void printFrame(const struct can_frame& f) {
  Serial.printf("id=0x%03lX dlc=%u data=", (unsigned long)(f.can_id & CAN_SFF_MASK), f.can_dlc);
  for (uint8_t i = 0; i < f.can_dlc; i++) Serial.printf("%02X ", f.data[i]);
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  SPI.begin();

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

  // 受信バッファに何か入っているかを先に見てから読み出す。
  while (mcp2515.checkReceive()) {
    if (mcp2515.readMessage(&frame) != MCP2515::ERROR_OK) break;
    received++;
    printFrame(frame);
    yield();
  }

  const uint8_t flags = mcp2515.getErrorFlags();
  if (flags != 0) {
    overflows++;
    mcp2515.clearRXnOVRFlags();
  }

  const uint32_t now = millis();
  if (now - lastReport < 5000) {
    delay(5);
    return;
  }
  lastReport = now;
  Serial.printf("received=%lu eflg_events=%lu heap=%u\n",
                (unsigned long)received, (unsigned long)overflows, ESP.getFreeHeap());
}
