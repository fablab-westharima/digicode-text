// @board xiao_esp32c6
// @lib greiman/SdFat@2.3.1
// @desc SdFat で SPI 接続の SD へ CSV を追記し、起動ごとにヘッダとローテーションを扱う

#include <Arduino.h>
#include <SPI.h>
#include <SdFat.h>

// XIAO ESP32C6: SCK=GPIO19 MISO=GPIO20 MOSI=GPIO18 CS=GPIO17 (D7)
static const uint8_t SD_SCK = 19;
static const uint8_t SD_MISO = 20;
static const uint8_t SD_MOSI = 18;
static const uint8_t SD_CS = 17;
static const uint8_t ADC_PIN = 0;
static const char* LOG_PATH = "digicode.csv";
static const uint32_t MAX_BYTES = 64UL * 1024UL;
static const uint32_t SAMPLE_INTERVAL_MS = 2000;

SdFat sd;
static bool mounted = false;
static uint32_t rows = 0;
static uint32_t lastSample = 0;

static void writeHeaderIfNeeded() {
  if (sd.exists(LOG_PATH)) return;
  FsFile file = sd.open(LOG_PATH, O_RDWR | O_CREAT | O_AT_END);
  if (!file) return;
  file.println("uptimeMs,adc,heap");
  file.close();
}

static void rotateIfLarge() {
  FsFile file = sd.open(LOG_PATH, O_RDONLY);
  if (!file) return;
  const uint32_t size = (uint32_t)file.fileSize();
  file.close();
  if (size < MAX_BYTES) return;
  sd.remove("digicode.old");
  if (sd.rename(LOG_PATH, "digicode.old")) {
    Serial.println("log rotated");
    writeHeaderIfNeeded();
  }
}

static bool appendRow(uint32_t now, int adc) {
  FsFile file = sd.open(LOG_PATH, O_RDWR | O_CREAT | O_AT_END);
  if (!file) {
    Serial.println("open failed");
    return false;
  }
  file.print(now);
  file.print(',');
  file.print(adc);
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
  SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
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
  if (appendRow(now, analogRead(ADC_PIN))) {
    Serial.printf("rows=%lu\n", (unsigned long)rows);
  }
  if (rows % 32 == 0) rotateIfLarge();
}
