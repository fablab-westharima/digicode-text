// @board m5stack_cores3
// @lib emelianov/modbus-esp8266@4.1.0
// @desc modbus-esp8266 の ModbusRTU master で保持レジスタを非同期読み取り (ModbusMaster の代替)

#include <Arduino.h>
#include <ModbusRTU.h>

static const int8_t RS485_RX = 18;
static const int8_t RS485_TX = 17;
static const int16_t RS485_DE = 5;   // 送信中だけ HIGH。ライブラリが自動で駆動する
static const uint8_t SLAVE_ID = 1;
static const uint16_t FIRST_HREG = 0x0000;
static const uint16_t HREG_COUNT = 8;
static const uint32_t POLL_INTERVAL_MS = 1000;

ModbusRTU mb;

static uint16_t regs[HREG_COUNT];
static uint32_t lastPoll = 0;
static uint32_t okCount = 0;
static uint32_t errCount = 0;
static uint8_t lastError = 0;

static bool onResult(Modbus::ResultCode event, uint16_t transactionId, void* data) {
  (void)transactionId;
  (void)data;
  if (event == Modbus::EX_SUCCESS) {
    okCount++;
    Serial.print("hreg:");
    for (uint16_t i = 0; i < HREG_COUNT; i++) {
      Serial.print(' ');
      Serial.print(regs[i]);
    }
    Serial.println();
  } else {
    errCount++;
    lastError = (uint8_t)event;
    Serial.printf("modbus result 0x%02X\n", (unsigned)event);
  }
  return true;
}

static void reportStats() {
  Serial.printf("poll ok=%lu err=%lu lastError=0x%02X uptime=%lums\n",
                (unsigned long)okCount, (unsigned long)errCount,
                (unsigned)lastError, (unsigned long)millis());
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("ModbusRTU master (modbus-esp8266)");

  Serial1.begin(9600, SERIAL_8N1, RS485_RX, RS485_TX);
  mb.begin(&Serial1, RS485_DE);
  mb.master();
}

void loop() {
  const uint32_t now = millis();
  if (!mb.slave() && now - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = now;
    if (!mb.readHreg(SLAVE_ID, FIRST_HREG, regs, HREG_COUNT, onResult)) {
      Serial.println("readHreg rejected (busy)");
    }
    if ((okCount + errCount) % 10 == 0) reportStats();
  }
  mb.task();
  yield();
}
