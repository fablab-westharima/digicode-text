// @board xiao_rp2040
// @lib autowp/autowp-mcp2515@1.3.1
// @lib adafruit/Adafruit SSD1306@2.5.17
// @lib adafruit/Adafruit GFX Library@1.12.6
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc CAN バスの直近フレームと流量を OLED に出す簡易モニタ

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <mcp2515.h>

// XIAO RP2040: I2C0 を D4=GP6 (SDA) / D5=GP7 (SCL) に出す。
// SPI0: D8=GP2 SCK, D10=GP3 MOSI, D9=GP4 MISO。CS は D2=GP28、INT は D3=GP29。
static const uint8_t CAN_SCK = 2;
static const uint8_t CAN_MOSI = 3;
static const uint8_t CAN_MISO = 4;
static const uint8_t CAN_CS = 28;
static const uint8_t CAN_INT = 29;
static const uint8_t SCREEN_WIDTH = 128;
static const uint8_t SCREEN_HEIGHT = 64;
static const uint8_t ROW_COUNT = 4;

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
MCP2515 mcp2515(CAN_CS, 10000000, &SPI);

struct Row {
  uint32_t id;
  uint8_t dlc;
  uint8_t data[8];
  uint32_t count;
};

static Row rows[ROW_COUNT];
static uint8_t rowUsed = 0;
static uint32_t totalFrames = 0;
static uint32_t windowFrames = 0;
static uint32_t framesPerSec = 0;
static uint32_t lastWindow = 0;
static uint32_t lastDraw = 0;
static bool displayReady = false;
static bool canReady = false;
static struct can_frame frame;

static void absorb(const struct can_frame& f) {
  totalFrames++;
  windowFrames++;
  const uint32_t id = f.can_id & CAN_SFF_MASK;
  for (uint8_t i = 0; i < rowUsed; i++) {
    if (rows[i].id != id) continue;
    rows[i].dlc = f.can_dlc;
    memcpy(rows[i].data, f.data, sizeof(rows[i].data));
    rows[i].count++;
    return;
  }
  // 空きが無ければ一番古い行を捨てて詰める。
  if (rowUsed >= ROW_COUNT) {
    for (uint8_t i = 1; i < ROW_COUNT; i++) rows[i - 1] = rows[i];
    rowUsed = ROW_COUNT - 1;
  }
  Row& r = rows[rowUsed++];
  r.id = id;
  r.dlc = f.can_dlc;
  memcpy(r.data, f.data, sizeof(r.data));
  r.count = 1;
}

static void draw() {
  if (!displayReady) return;
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(F("CAN "));
  display.print(framesPerSec);
  display.print(F(" f/s  total "));
  display.println(totalFrames);
  display.drawFastHLine(0, 10, SCREEN_WIDTH, SSD1306_WHITE);

  for (uint8_t i = 0; i < rowUsed; i++) {
    display.setCursor(0, 14 + i * 12);
    display.print(F("0x"));
    display.print(rows[i].id, HEX);
    display.print(' ');
    for (uint8_t b = 0; b < rows[i].dlc && b < 4; b++) {
      if (rows[i].data[b] < 0x10) display.print('0');
      display.print(rows[i].data[b], HEX);
    }
    display.print(F(" x"));
    display.print(rows[i].count);
  }

  if (!canReady) {
    display.setCursor(0, 56);
    display.print(F("mcp2515 init failed"));
  }
  display.display();
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  pinMode(CAN_INT, INPUT_PULLUP);

  Wire.setSDA(6);
  Wire.setSCL(7);
  Wire.begin();
  displayReady = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (displayReady) {
    display.setTextColor(SSD1306_WHITE);
    display.clearDisplay();
    display.display();
  } else {
    Serial.println("ssd1306 not found");
  }

  SPI.setSCK(CAN_SCK);
  SPI.setTX(CAN_MOSI);
  SPI.setRX(CAN_MISO);
  SPI.begin();

  canReady = mcp2515.reset() == MCP2515::ERROR_OK
             && mcp2515.setBitrate(CAN_500KBPS, MCP_8MHZ) == MCP2515::ERROR_OK
             && mcp2515.setListenOnlyMode() == MCP2515::ERROR_OK;
  Serial.println(canReady ? "can monitor ready" : "mcp2515 init failed");
  lastWindow = millis();
}

void loop() {
  if (canReady && digitalRead(CAN_INT) == LOW) {
    while (mcp2515.readMessage(&frame) == MCP2515::ERROR_OK) absorb(frame);
    mcp2515.clearInterrupts();
  }

  const uint32_t now = millis();
  if (now - lastWindow >= 1000) {
    lastWindow = now;
    framesPerSec = windowFrames;
    windowFrames = 0;
  }
  if (now - lastDraw < 200) return;
  lastDraw = now;
  draw();
}
