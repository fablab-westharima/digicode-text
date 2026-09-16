// @board xiao_rp2040
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc Modbus の例外応答を「再試行する/しない」に分類し、指数バックオフで粘る

#include <Arduino.h>
#include <ModbusMaster.h>

static const uint8_t RS485_TX = 0;  // D6 / GP0
static const uint8_t RS485_RX = 1;  // D7 / GP1
static const uint8_t RS485_DE = 28; // D2 / GP28
static const uint8_t SLAVE_ID = 1;

static const uint8_t MAX_ATTEMPTS = 4;
static const uint32_t BACKOFF_BASE_MS = 50;

ModbusMaster node;

struct Stats {
  uint32_t success;
  uint32_t retried;
  uint32_t giveUp;
  uint32_t permanent;
};

static Stats stats = {0, 0, 0, 0};

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { digitalWrite(RS485_DE, LOW); }

static const char* describe(uint8_t rc) {
  if (rc == node.ku8MBSuccess) return "success";
  if (rc == node.ku8MBIllegalFunction) return "illegal-function";
  if (rc == node.ku8MBIllegalDataAddress) return "illegal-data-address";
  if (rc == node.ku8MBIllegalDataValue) return "illegal-data-value";
  if (rc == node.ku8MBSlaveDeviceFailure) return "slave-device-failure";
  if (rc == node.ku8MBInvalidSlaveID) return "invalid-slave-id";
  if (rc == node.ku8MBInvalidFunction) return "invalid-function";
  if (rc == node.ku8MBResponseTimedOut) return "response-timed-out";
  if (rc == node.ku8MBInvalidCRC) return "invalid-crc";
  return "unknown";
}

// 線やタイミングの問題は再試行で直る。アドレスや機能コードの誤りは何度やっても直らない。
static bool worthRetrying(uint8_t rc) {
  return rc == node.ku8MBResponseTimedOut ||
         rc == node.ku8MBInvalidCRC ||
         rc == node.ku8MBSlaveDeviceFailure ||
         rc == node.ku8MBInvalidSlaveID;
}

static uint8_t readWithRetry(uint16_t address, uint8_t count) {
  uint8_t rc = node.ku8MBResponseTimedOut;

  for (uint8_t attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    node.clearResponseBuffer();
    rc = node.readHoldingRegisters(address, count);

    if (rc == node.ku8MBSuccess) {
      if (attempt > 1) stats.retried++;
      stats.success++;
      return rc;
    }

    if (!worthRetrying(rc)) {
      stats.permanent++;
      Serial.print("permanent failure: ");
      Serial.println(describe(rc));
      return rc;
    }

    const uint32_t wait = BACKOFF_BASE_MS << (attempt - 1);
    Serial.print("attempt ");
    Serial.print(attempt);
    Serial.print(' ');
    Serial.print(describe(rc));
    Serial.print(" backoffMs=");
    Serial.println(wait);
    delay(wait);
  }

  stats.giveUp++;
  return rc;
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  Serial1.setTX(RS485_TX);
  Serial1.setRX(RS485_RX);
  Serial1.begin(9600, SERIAL_8N1);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  Serial.println("modbus retry policy ready");
}

void loop() {
  // 実在するはずのレンジと、わざと外したレンジを交互に叩いて分類を確かめる。
  static bool probeBad = false;
  const uint16_t address = probeBad ? 0x7FF0 : 0x0000;
  probeBad = !probeBad;

  const uint8_t rc = readWithRetry(address, 4);

  Serial.print("addr=0x");
  Serial.print(address, HEX);
  Serial.print(" rc=");
  Serial.print(describe(rc));
  if (rc == node.ku8MBSuccess) {
    Serial.print(" reg0=");
    Serial.print(node.getResponseBuffer(0));
  }
  Serial.print(" success=");
  Serial.print(stats.success);
  Serial.print(" retried=");
  Serial.print(stats.retried);
  Serial.print(" giveUp=");
  Serial.print(stats.giveUp);
  Serial.print(" permanent=");
  Serial.println(stats.permanent);

  delay(2000);
}
