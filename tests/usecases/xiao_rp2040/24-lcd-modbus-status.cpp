// @board xiao_rp2040
// @lib marcoschwartz/LiquidCrystal_I2C@1.1.4
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc Modbus RTU で読んだ流量と積算を LCD に出し、通信エラーは行を切り替えて知らせる

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ModbusMaster.h>

static const uint8_t RS485_DE = 28;  // D2 / GP28
static const uint8_t SLAVE_ID = 1;

LiquidCrystal_I2C lcd(0x27, 16, 2);
ModbusMaster node;
static uint16_t errorCount = 0;

static void preTransmission() {
  digitalWrite(RS485_DE, HIGH);
}

static void postTransmission() {
  digitalWrite(RS485_DE, LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  Wire.setSDA(6);
  Wire.setSCL(7);
  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Modbus monitor");

  Serial1.setTX(0);
  Serial1.setRX(1);
  Serial1.begin(9600, SERIAL_8N1);
  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);
  delay(500);
  lcd.clear();
}

void loop() {
  const uint8_t result = node.readInputRegisters(0x0000, 3);

  lcd.setCursor(0, 0);
  if (result == node.ku8MBSuccess) {
    const float flow = node.getResponseBuffer(0) / 10.0f;
    const uint32_t total = ((uint32_t)node.getResponseBuffer(1) << 16) | node.getResponseBuffer(2);

    lcd.print("Flow ");
    lcd.print(flow, 1);
    lcd.print(" L/m    ");
    lcd.setCursor(0, 1);
    lcd.print("Tot ");
    lcd.print(total);
    lcd.print(" L        ");

    Serial.print("flow=");
    Serial.print(flow, 1);
    Serial.print(" total=");
    Serial.println(total);
  } else {
    errorCount++;
    lcd.print("COMM ERROR      ");
    lcd.setCursor(0, 1);
    lcd.print("code 0x");
    lcd.print(result, HEX);
    lcd.print(" n=");
    lcd.print(errorCount);
    lcd.print("    ");
    Serial.print("modbus error 0x");
    Serial.println(result, HEX);
  }

  node.clearResponseBuffer();
  delay(1000);
}
