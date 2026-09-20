// @board pico_w
// @desc Serial1 (UART0) と Serial2 (UART1) の pin を setTX/setRX で指定し、両者を中継する

#include <Arduino.h>

// arduino-pico コアは UART0/UART1 とも複数のパッドに出せる。Pico W はヘッダに 26 本
// (GP0-GP22 と GP26-GP28) が出ていて UART の既定 pin はどちらもその中なので、
// 素直な組み合わせをそのまま選ぶ。
//   Serial1 = UART0: GP0 (TX) / GP1 (RX)  … 現場機器 (RS485 変換器など)
//   Serial2 = UART1: GP8 (TX) / GP9 (RX)  … 上位のゲートウェイ
static const uint8_t FIELD_TX = 0;
static const uint8_t FIELD_RX = 1;
static const uint8_t HOST_TX = 8;
static const uint8_t HOST_RX = 9;

static const uint32_t FIELD_BAUD = 9600;
static const uint32_t HOST_BAUD = 115200;
static const size_t LINE_MAX = 120;

static uint32_t fieldToHost = 0;
static uint32_t hostToField = 0;
static uint32_t overflows = 0;
static char lineBuf[LINE_MAX];
static size_t lineLen = 0;

static void emitLine() {
  lineBuf[lineLen] = '\0';
  // 中継したうえで USB Serial にも同じ行を写して、現場側の生データを見えるようにする。
  Serial2.print("FIELD ");
  Serial2.println(lineBuf);
  Serial.print("FIELD ");
  Serial.println(lineBuf);
  lineLen = 0;
}

void setup() {
  Serial.begin(115200);

  Serial1.setTX(FIELD_TX);
  Serial1.setRX(FIELD_RX);
  Serial1.setFIFOSize(256);
  Serial1.begin(FIELD_BAUD, SERIAL_8N1);

  Serial2.setTX(HOST_TX);
  Serial2.setRX(HOST_RX);
  Serial2.setFIFOSize(512);
  Serial2.begin(HOST_BAUD, SERIAL_8N1);

  // Pico W のユーザー LED は RP2040 の GPIO25 ではなく無線チップ CYW43439 側にある。
  // core が擬似ピン 64 を LED_BUILTIN に割り当てるので、番号ではなく LED_BUILTIN を使う。
  pinMode(LED_BUILTIN, OUTPUT);

  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);
  Serial.print("bridge uart0=GP");
  Serial.print(FIELD_TX);
  Serial.print("/GP");
  Serial.print(FIELD_RX);
  Serial.print(" uart1=GP");
  Serial.print(HOST_TX);
  Serial.print("/GP");
  Serial.println(HOST_RX);
}

void loop() {
  // 現場 -> 上位。行単位に組み直してから流す。
  while (Serial1.available() > 0) {
    const char ch = (char)Serial1.read();
    fieldToHost++;
    if (ch == '\n') {
      emitLine();
    } else if (ch != '\r') {
      if (lineLen < LINE_MAX - 1) {
        lineBuf[lineLen++] = ch;
      } else {
        overflows++;
        lineLen = 0;
      }
    }
  }

  // 上位 -> 現場。こちらはそのままバイト列で渡す。
  while (Serial2.available() > 0) {
    Serial1.write((uint8_t)Serial2.read());
    hostToField++;
  }

  static uint32_t lastReport = 0;
  if (millis() - lastReport >= 5000) {
    lastReport = millis();
    digitalWrite(LED_BUILTIN, (fieldToHost % 2) ? HIGH : LOW);

    Serial.print("fieldToHost=");
    Serial.print(fieldToHost);
    Serial.print(" hostToField=");
    Serial.print(hostToField);
    Serial.print(" overflows=");
    Serial.print(overflows);
    Serial.print(" pending=");
    Serial.println(lineLen);
  }
}
