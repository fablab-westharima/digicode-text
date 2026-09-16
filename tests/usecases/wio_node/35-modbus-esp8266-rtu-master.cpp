// @board wio_node
// @lib emelianov/modbus-esp8266@4.1.0
// @desc ESP8266 の UART0 を RS485 に使い ModbusRTU master で読む。ログは UART1 (GPIO2) へ

#include <Arduino.h>
#include <ModbusRTU.h>

static const int16_t RS485_DE = 14;   // Wio Node D5 = GPIO14
static const uint8_t SLAVE_ID = 1;
static const uint16_t FIRST_HREG = 0x0000;
static const uint16_t HREG_COUNT = 6;
static const uint32_t POLL_INTERVAL_MS = 1000;
static const uint8_t GROVE_POWER = 15;

ModbusRTU mb;

static uint16_t regs[HREG_COUNT];
static uint32_t lastPoll = 0;
static uint32_t okCount = 0;
static uint32_t errCount = 0;

static bool onResult(Modbus::ResultCode event, uint16_t transactionId, void* data) {
  (void)transactionId;
  (void)data;
  if (event == Modbus::EX_SUCCESS) {
    okCount++;
    Serial1.print("hreg:");
    for (uint16_t i = 0; i < HREG_COUNT; i++) {
      Serial1.print(' ');
      Serial1.print(regs[i]);
    }
    Serial1.println();
  } else {
    errCount++;
    Serial1.printf("modbus result 0x%02X (ok=%lu err=%lu)\n",
                   (unsigned)event, (unsigned long)okCount, (unsigned long)errCount);
  }
  return true;
}

void setup() {
  // UART1 は TX 専用 (GPIO2)。RS485 が UART0 を占有するのでログはこちらへ出す。
  Serial1.begin(115200);
  Serial1.println("ModbusRTU master on UART0");

  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  Serial.begin(9600, SERIAL_8N1);
  mb.begin(&Serial, RS485_DE);
  mb.master();
}

void loop() {
  const uint32_t now = millis();
  if (!mb.slave() && now - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = now;
    if (!mb.readHreg(SLAVE_ID, FIRST_HREG, regs, HREG_COUNT, onResult)) {
      Serial1.println("readHreg rejected (busy)");
    }
  }
  mb.task();
  yield();
}
