// @board wio_node
// @lib greiman/SdFat@2.3.1
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @desc DS18B20 を複数本読んで SdFat の CSV に落とし、欠測はそのまま空欄にする

#include <Arduino.h>
#include <SPI.h>
#include <SdFat.h>
#include <OneWire.h>
#include <DallasTemperature.h>

static const uint8_t SD_CS = 16;
static const uint8_t ONE_WIRE_PIN = 4; // Wio Node PORT1 SDA 側 (GPIO4) を 1-Wire に流用
static const uint8_t GROVE_POWER = 15;
static const char* LOG_PATH = "dallas.csv";
static const uint8_t MAX_PROBES = 4;
static const uint32_t SAMPLE_INTERVAL_MS = 10000;

SdFat sd;
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature sensors(&oneWire);

static bool mounted = false;
static uint8_t probeCount = 0;
static uint32_t rows = 0;
static uint32_t lastSample = 0;

static void ensureHeader() {
  if (sd.exists(LOG_PATH)) return;
  FsFile file = sd.open(LOG_PATH, O_RDWR | O_CREAT | O_AT_END);
  if (!file) return;
  file.print("uptimeMs");
  for (uint8_t i = 0; i < MAX_PROBES; i++) {
    file.print(",probe");
    file.print(i);
  }
  file.println();
  file.close();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(300);

  sensors.begin();
  probeCount = sensors.getDeviceCount();
  if (probeCount > MAX_PROBES) probeCount = MAX_PROBES;
  sensors.setResolution(11);
  Serial.printf("probes=%u\n", probeCount);

  SPI.begin();
  mounted = sd.begin(SD_CS, SD_SCK_MHZ(8));
  if (!mounted) {
    Serial.println("sd mount failed");
    return;
  }
  ensureHeader();
}

void loop() {
  const uint32_t now = millis();
  if (!mounted || now - lastSample < SAMPLE_INTERVAL_MS) {
    delay(50);
    return;
  }
  lastSample = now;

  sensors.requestTemperatures();
  FsFile file = sd.open(LOG_PATH, O_RDWR | O_CREAT | O_AT_END);
  if (!file) {
    Serial.println("open failed");
    return;
  }
  file.print(now);
  for (uint8_t i = 0; i < MAX_PROBES; i++) {
    file.print(',');
    if (i >= probeCount) continue;
    const float c = sensors.getTempCByIndex(i);
    if (c == DEVICE_DISCONNECTED_C) {
      Serial.printf("probe %u disconnected\n", i);
      continue;
    }
    file.print(c, 3);
  }
  file.println();
  file.sync();
  file.close();
  rows++;
  Serial.printf("rows=%lu heap=%u\n", (unsigned long)rows, (unsigned)ESP.getFreeHeap());
  yield();
}
