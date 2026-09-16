// @board xiao_rp2040
// @lib greiman/SdFat@2.3.1
// @desc microSD へ CSV を追記する。SPI の pin は earlephilhower の SPI.setSCK/setTX/setRX で指定する

#include <Arduino.h>
#include <SPI.h>
#include <SdFat.h>

// XIAO RP2040 の SPI0: D8=GP2 SCK, D10=GP3 MOSI, D9=GP4 MISO, D2=GP28 を CS にする。
static const uint8_t SD_SCK = 2;
static const uint8_t SD_MOSI = 3;
static const uint8_t SD_MISO = 4;
static const uint8_t SD_CS = 28;

static const char* LOG_PATH = "telemetry.csv";
static const uint32_t FLUSH_INTERVAL_MS = 10000;

SdFat sd;
static bool mounted = false;
static uint32_t rows = 0;
static uint32_t lastFlush = 0;

static bool appendRow() {
  FsFile file = sd.open(LOG_PATH, FILE_WRITE);
  if (!file) return false;

  file.print(millis());
  file.print(',');
  file.print(analogRead(A0));
  file.print(',');
  file.print(analogRead(A1));
  file.print(',');
  file.println(analogReadTemp(), 2);

  file.sync();
  file.close();
  return true;
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  SPI.setSCK(SD_SCK);
  SPI.setTX(SD_MOSI);
  SPI.setRX(SD_MISO);
  SPI.setCS(SD_CS);

  analogReadResolution(12);

  // SHARED_SPI にしておくと SdFat が転送のたびに beginTransaction する。
  if (!sd.begin(SdSpiConfig(SD_CS, SHARED_SPI, SD_SCK_MHZ(8)))) {
    sd.initErrorPrint(&Serial);
    return;
  }
  mounted = true;

  Serial.print("fatType=");
  Serial.println(sd.fatType());

  if (!sd.exists(LOG_PATH)) {
    FsFile header = sd.open(LOG_PATH, FILE_WRITE);
    if (header) {
      header.println("millis,a0,a1,coreTempC");
      header.close();
    }
  }
}

void loop() {
  if (!mounted) {
    delay(2000);
    return;
  }

  if (appendRow()) {
    rows++;
  } else {
    Serial.println("append failed");
    sd.errorPrint(&Serial);
  }

  if (millis() - lastFlush >= FLUSH_INTERVAL_MS) {
    lastFlush = millis();
    Serial.print("rows=");
    Serial.print(rows);
    Serial.print(" freeClusters=");
    Serial.println(sd.freeClusterCount());
  }

  delay(1000);
}
