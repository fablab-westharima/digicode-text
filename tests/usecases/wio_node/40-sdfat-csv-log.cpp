// @board wio_node
// @lib greiman/SdFat@2.3.1
// @desc ESP8266 のハード SPI に繋いだ SD へ SdFat で CSV を追記し、サイズでローテーションする

#include <Arduino.h>
#include <SPI.h>
#include <SdFat.h>

// Wio Node のハード SPI: SCK=GPIO14 MISO=GPIO12 MOSI=GPIO13。
// GPIO15 は Grove 電源に使われているので CS は GPIO16 を使う。
static const uint8_t SD_CS = 16;
static const uint8_t GROVE_POWER = 15;
static const char* LOG_PATH = "wio.csv";
static const uint32_t MAX_BYTES = 32UL * 1024UL;
static const uint32_t SAMPLE_INTERVAL_MS = 2000;

SdFat sd;
static bool mounted = false;
static uint32_t rows = 0;
static uint32_t lastSample = 0;

static void writeHeaderIfNeeded() {
  if (sd.exists(LOG_PATH)) return;
  FsFile file = sd.open(LOG_PATH, O_RDWR | O_CREAT | O_AT_END);
  if (!file) return;
  file.println("uptimeMs,a0,heap");
  file.close();
}

static void rotateIfLarge() {
  FsFile file = sd.open(LOG_PATH, O_RDONLY);
  if (!file) return;
  const uint32_t size = (uint32_t)file.fileSize();
  file.close();
  if (size < MAX_BYTES) return;
  sd.remove("wio.old");
  if (sd.rename(LOG_PATH, "wio.old")) {
    Serial.println("log rotated");
    writeHeaderIfNeeded();
  }
}

static bool appendRow(uint32_t now) {
  FsFile file = sd.open(LOG_PATH, O_RDWR | O_CREAT | O_AT_END);
  if (!file) {
    Serial.println("open failed");
    return false;
  }
  file.print(now);
  file.print(',');
  file.print(analogRead(A0));
  file.print(',');
  file.println(ESP.getFreeHeap());
  file.sync();
  file.close();
  rows++;
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  SPI.begin();
  mounted = sd.begin(SD_CS, SD_SCK_MHZ(8));
  if (!mounted) {
    Serial.println("sd mount failed");
    return;
  }
  Serial.println("sd mounted");
  writeHeaderIfNeeded();
  rotateIfLarge();
}

void loop() {
  const uint32_t now = millis();
  if (!mounted || now - lastSample < SAMPLE_INTERVAL_MS) {
    delay(50);
    return;
  }
  lastSample = now;
  if (appendRow(now)) Serial.printf("rows=%lu\n", (unsigned long)rows);
  if (rows % 32 == 0) rotateIfLarge();
  yield();
}
