// @board pico
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc RS485 half-duplex の DE/RE を文字時間から計算した待ちで切り替え、衝突を数える

#include <Arduino.h>
#include <ModbusMaster.h>

static const uint8_t RS485_TX = 0;  // GP0
static const uint8_t RS485_RX = 1;  // GP1
static const uint8_t RS485_DE = 2;  // GP2 (DE と /RE を束ねて駆動)
static const uint8_t SLAVE_ID = 1;
static const uint32_t BAUD = 9600;

// 8N1 は 1 文字 10 bit。RTU のフレーム間隔は 3.5 文字、文字間は 1.5 文字まで。
static const uint32_t CHAR_US = (10UL * 1000000UL) / BAUD;
static const uint32_t FRAME_GAP_US = (CHAR_US * 7) / 2;

ModbusMaster node;

static uint32_t transmits = 0;
static uint32_t idleCalls = 0;
static uint32_t maxTurnaroundUs = 0;
static uint32_t txStartedUs = 0;

static void preTransmission() {
  // 直前の受信が終わってからドライバを有効にする。早すぎると相手の応答尾を潰す。
  delayMicroseconds(FRAME_GAP_US);
  digitalWrite(RS485_DE, HIGH);
  // DE がアサートされてからドライバの出力が安定するまで数マイクロ秒待つ。
  delayMicroseconds(10);
  txStartedUs = micros();
  transmits++;
}

static void postTransmission() {
  // ModbusMaster は write 後に flush していないので、ここで送信完了を待ってから落とす。
  Serial1.flush();
  delayMicroseconds(CHAR_US);
  digitalWrite(RS485_DE, LOW);

  const uint32_t elapsed = micros() - txStartedUs;
  if (elapsed > maxTurnaroundUs) maxTurnaroundUs = elapsed;
}

static void idleCallback() {
  idleCalls++;
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);
  pinMode(LED_BUILTIN, OUTPUT);

  Serial1.setTX(RS485_TX);
  Serial1.setRX(RS485_RX);
  Serial1.setFIFOSize(256);
  Serial1.begin(BAUD, SERIAL_8N1);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  node.idle(idleCallback);

  Serial.print("charUs=");
  Serial.print(CHAR_US);
  Serial.print(" frameGapUs=");
  Serial.println(FRAME_GAP_US);
}

void loop() {
  node.clearResponseBuffer();
  const uint8_t rc = node.readHoldingRegisters(0x0000, 4);
  digitalWrite(LED_BUILTIN, rc == node.ku8MBSuccess ? HIGH : LOW);

  Serial.print("rc=0x");
  Serial.print(rc, HEX);
  Serial.print(" tx=");
  Serial.print(transmits);
  Serial.print(" idleCalls=");
  Serial.print(idleCalls);
  Serial.print(" maxTurnaroundUs=");
  Serial.print(maxTurnaroundUs);
  Serial.print(" deLevel=");
  Serial.print(digitalRead(RS485_DE));

  if (rc == node.ku8MBSuccess) {
    Serial.print(" reg0=");
    Serial.print(node.getResponseBuffer(0));
  }
  Serial.println();

  // 受信バッファに残骸があれば線上の衝突を疑う材料になるので捨てて数える。
  uint16_t leftovers = 0;
  while (Serial1.available() > 0) {
    Serial1.read();
    leftovers++;
  }
  if (leftovers) {
    Serial.print("stray bytes=");
    Serial.println(leftovers);
  }

  delay(500);
}
