// @board xiao_rp2040
// @lib adafruit/Adafruit MAX31855 library@1.4.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc 熱電対で炉温を測り、Modbus RTU slave の設定値と突き合わせて補正値を書き戻す

#include <Arduino.h>
#include <SPI.h>
#include <Adafruit_MAX31855.h>
#include <ModbusMaster.h>

static const uint8_t TC_SCK = 2;   // D8 / GP2
static const uint8_t TC_CS = 29;   // D3 / GP29
static const uint8_t TC_DO = 4;    // D9 / GP4

static const uint8_t RS485_TX = 0;  // D6 / GP0 (UART0 TX)
static const uint8_t RS485_RX = 1;  // D7 / GP1 (UART0 RX)
static const uint8_t RS485_DE = 28; // D2 / GP28
static const uint8_t SLAVE_ID = 3;

// 温調器側のレジスタ配置 (例)。PV は読み取り専用、SV と補正は保持レジスタ。
static const uint16_t REG_PV = 0x0000;
static const uint16_t REG_SV = 0x0001;
static const uint16_t REG_TRIM = 0x0002;

Adafruit_MAX31855 thermocouple(TC_SCK, TC_CS, TC_DO);
ModbusMaster node;

static bool tcReady = false;

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { digitalWrite(RS485_DE, LOW); }

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  Serial1.setTX(RS485_TX);
  Serial1.setRX(RS485_RX);
  Serial1.begin(19200, SERIAL_8E1);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  tcReady = thermocouple.begin();
  Serial.println(tcReady ? "oven monitor ready" : "thermocouple missing");
}

void loop() {
  if (!tcReady) {
    delay(2000);
    return;
  }

  const uint8_t fault = thermocouple.readError();
  if (fault) {
    Serial.print("thermocouple fault 0x");
    Serial.println(fault, HEX);
    delay(2000);
    return;
  }

  const double measuredC = thermocouple.readCelsius();
  if (isnan(measuredC)) {
    delay(2000);
    return;
  }

  // PV / SV を 1 トランザクションで読む。温調器は 0.1 degC 単位の整数で返す。
  const uint8_t rc = node.readHoldingRegisters(REG_PV, 2);
  if (rc != node.ku8MBSuccess) {
    Serial.print("read failed 0x");
    Serial.println(rc, HEX);
    node.clearResponseBuffer();
    delay(2000);
    return;
  }

  const float ovenPvC = (int16_t)node.getResponseBuffer(0) / 10.0f;
  const float ovenSvC = (int16_t)node.getResponseBuffer(1) / 10.0f;
  node.clearResponseBuffer();

  // 外部熱電対と温調器の内部 PV の差を補正レジスタへ書き戻す。
  const int16_t trim = (int16_t)lroundf(((float)measuredC - ovenPvC) * 10.0f);
  const uint8_t wc = node.writeSingleRegister(REG_TRIM, (uint16_t)trim);

  Serial.print("tcC=");
  Serial.print(measuredC, 1);
  Serial.print(" ovenPvC=");
  Serial.print(ovenPvC, 1);
  Serial.print(" ovenSvC=");
  Serial.print(ovenSvC, 1);
  Serial.print(" trim=");
  Serial.print(trim);
  Serial.print(" write=");
  Serial.println(wc == node.ku8MBSuccess ? "ok" : "ng");

  delay(2000);
}
