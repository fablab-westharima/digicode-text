// @board xiao_rp2040
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @lib adafruit/RTClib@2.1.4
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib bblanchon/ArduinoJson@7.4.3
// @desc DS18B20 の温度に DS3231 の時刻を付けて JSON 1 行ログとして Serial へ流す

#include <Arduino.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <RTClib.h>
#include <ArduinoJson.h>

static const uint8_t ONEWIRE_PIN = 29;  // D3 / GP29
static const uint32_t LOG_INTERVAL_MS = 5000;

OneWire oneWire(ONEWIRE_PIN);
DallasTemperature sensors(&oneWire);
RTC_DS3231 rtc;

static bool rtcReady = false;
static uint8_t deviceCount = 0;
static uint32_t lastLog = 0;
static uint32_t recordId = 0;

void setup() {
  Serial.begin(115200);
  delay(200);

  Wire.setSDA(6);
  Wire.setSCL(7);
  Wire.begin();

  rtcReady = rtc.begin(&Wire);
  if (rtcReady && rtc.lostPower()) {
    // 電池切れなら compile 時刻で仮に合わせる。
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }

  sensors.begin();
  sensors.setResolution(11);
  deviceCount = sensors.getDeviceCount();
}

void loop() {
  const uint32_t now = millis();
  if (now - lastLog < LOG_INTERVAL_MS) return;
  lastLog = now;

  sensors.requestTemperatures();

  JsonDocument doc;
  doc["id"] = recordId++;
  doc["uptimeMs"] = now;

  if (rtcReady) {
    const DateTime stamp = rtc.now();
    char buffer[25] = "YYYY-MM-DDThh:mm:ss";
    doc["timestamp"] = stamp.toString(buffer);
    doc["unixtime"] = stamp.unixtime();
    doc["rtcTempC"] = rtc.getTemperature();
  } else {
    doc["timestamp"] = nullptr;
  }

  JsonArray probes = doc["probes"].to<JsonArray>();
  for (uint8_t i = 0; i < deviceCount; i++) {
    const float c = sensors.getTempCByIndex(i);
    JsonObject probe = probes.add<JsonObject>();
    probe["index"] = i;
    if (c == DEVICE_DISCONNECTED_C) {
      probe["ok"] = false;
    } else {
      probe["ok"] = true;
      probe["tempC"] = c;
    }
  }

  serializeJson(doc, Serial);
  Serial.println();
}
