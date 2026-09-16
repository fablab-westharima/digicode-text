// @board pico
// @lib adafruit/Adafruit SHT31 Library@2.2.2
// @lib adafruit/Adafruit BusIO@1.17.4
// @desc SHT31 の内蔵ヒータを結露しそうなときだけ入れ、status レジスタで入り切りを確かめる

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>

static const uint8_t SDA_PIN = 4;  // GP4 (I2C0 SDA)
static const uint8_t SCL_PIN = 5;  // GP5 (I2C0 SCL)
static const uint8_t SHT31_ADDRESS = 0x44;

static const float RH_HEATER_ON = 85.0f;
static const float RH_HEATER_OFF = 70.0f;
static const uint32_t HEATER_MAX_MS = 30000;

Adafruit_SHT31 sht(&Wire);

static bool ready = false;
static bool heaterOn = false;
static uint32_t heaterStartedMs = 0;
static uint32_t heaterCycles = 0;

// Magnus 式の露点。ヒータ判断の説明に使う。
static float dewPointC(float tempC, float rh) {
  if (rh <= 0.0f) return NAN;
  const float a = 17.62f;
  const float b = 243.12f;
  const float gamma = (a * tempC) / (b + tempC) + log(rh / 100.0f);
  return (b * gamma) / (a - gamma);
}

static void setHeater(bool on) {
  if (on == heaterOn) return;
  sht.heater(on);
  heaterOn = on;
  if (on) {
    heaterStartedMs = millis();
    heaterCycles++;
  }
  digitalWrite(LED_BUILTIN, on ? HIGH : LOW);
  Serial.print("heater=");
  Serial.println(on ? "on" : "off");
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  pinMode(LED_BUILTIN, OUTPUT);

  Wire.setSDA(SDA_PIN);
  Wire.setSCL(SCL_PIN);
  Wire.begin();
  Wire.setClock(100000);

  ready = sht.begin(SHT31_ADDRESS);
  if (!ready) {
    Serial.println("sht31 not found");
    return;
  }
  sht.reset();
  delay(20);
  setHeater(false);
  Serial.println("sht31 ready");
}

void loop() {
  if (!ready) {
    delay(1000);
    return;
  }

  const float tempC = sht.readTemperature();
  const float rh = sht.readHumidity();
  if (isnan(tempC) || isnan(rh)) {
    Serial.println("read failed");
    delay(1000);
    return;
  }

  if (!heaterOn && rh >= RH_HEATER_ON) {
    setHeater(true);
  } else if (heaterOn && (rh <= RH_HEATER_OFF || millis() - heaterStartedMs >= HEATER_MAX_MS)) {
    // ヒータを入れたままだと温度が読めなくなるので上限で必ず切る。
    setHeater(false);
  }

  Serial.print("tempC=");
  Serial.print(tempC, 2);
  Serial.print(" rh=");
  Serial.print(rh, 1);
  Serial.print(" dewPointC=");
  Serial.print(dewPointC(tempC, rh), 2);
  Serial.print(" heater=");
  Serial.print(sht.isHeaterEnabled() ? 1 : 0);
  Serial.print(" cycles=");
  Serial.print(heaterCycles);
  Serial.print(" status=0x");
  Serial.println(sht.readStatus(), HEX);

  delay(2000);
}
