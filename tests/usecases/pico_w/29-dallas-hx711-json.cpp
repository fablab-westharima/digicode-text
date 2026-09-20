// @board pico_w
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @lib bogde/HX711@0.7.5
// @lib bblanchon/ArduinoJson@7.4.3
// @desc 発酵タンクの重量と温度をまとめて 1 本の JSON にし、しきい値超過を判定する

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <HX711.h>
#include <ArduinoJson.h>

static const uint8_t ONEWIRE_PIN = 16;  // GP16
static const uint8_t HX711_DOUT = 14;   // GP14
static const uint8_t HX711_SCK = 15;    // GP15
static const uint8_t ALARM_PIN = 22;    // GP22

static const float TEMP_LIMIT_C = 28.0f;
static const float WEIGHT_LIMIT_G = 5000.0f;

OneWire oneWire(ONEWIRE_PIN);
DallasTemperature probes(&oneWire);
HX711 scale;

static uint32_t sample = 0;

void setup() {
  Serial.begin(115200);
  pinMode(ALARM_PIN, OUTPUT);
  digitalWrite(ALARM_PIN, LOW);

  probes.begin();
  probes.setResolution(11);
  probes.setWaitForConversion(true);

  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(420.0f);
  if (scale.wait_ready_timeout(2000)) scale.tare(15);
}

void loop() {
  probes.requestTemperatures();
  const float tempC = probes.getTempCByIndex(0);
  const bool scaleReady = scale.wait_ready_timeout(500);
  const float grams = scaleReady ? scale.get_units(4) : NAN;

  const bool tempAlarm = tempC != DEVICE_DISCONNECTED_C && tempC > TEMP_LIMIT_C;
  const bool weightAlarm = scaleReady && grams > WEIGHT_LIMIT_G;
  digitalWrite(ALARM_PIN, (tempAlarm || weightAlarm) ? HIGH : LOW);

  JsonDocument doc;
  doc["sample"] = sample++;
  doc["uptimeMs"] = millis();

  JsonObject temperature = doc["temperature"].to<JsonObject>();
  temperature["ok"] = tempC != DEVICE_DISCONNECTED_C;
  temperature["valueC"] = tempC;
  temperature["limitC"] = TEMP_LIMIT_C;
  temperature["alarm"] = tempAlarm;

  JsonObject weight = doc["weight"].to<JsonObject>();
  weight["ok"] = scaleReady;
  if (scaleReady) weight["grams"] = grams;
  weight["limitG"] = WEIGHT_LIMIT_G;
  weight["alarm"] = weightAlarm;

  doc["alarm"] = tempAlarm || weightAlarm;
  serializeJson(doc, Serial);
  Serial.println();
  delay(1000);
}
