// @board pico
// @lib greiman/SdFat@2.3.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc microSD の config.json を起動時に読み、変更したら書き戻す。FsFile を Stream として渡す

#include <Arduino.h>
#include <SPI.h>
#include <SdFat.h>
#include <ArduinoJson.h>

static const uint8_t SD_SCK = 18;
static const uint8_t SD_MOSI = 19;
static const uint8_t SD_MISO = 16;
static const uint8_t SD_CS = 17;

static const char* CONFIG_PATH = "config.json";
static const char* BACKUP_PATH = "config.bak";

struct Config {
  uint32_t sampleMs;
  float scale;
  char siteId[24];
  bool verbose;
};

SdFat sd;
static Config config = {1000, 1.0f, "unset", false};
static bool mounted = false;
static uint32_t writes = 0;

static bool loadConfig() {
  FsFile file = sd.open(CONFIG_PATH);
  if (!file) return false;

  JsonDocument doc;
  // FsFile は Stream なので ArduinoJson へそのまま渡せる。全文を RAM に置かずに済む。
  const DeserializationError err = deserializeJson(doc, file);
  file.close();
  if (err) {
    Serial.print("config parse error: ");
    Serial.println(err.c_str());
    return false;
  }

  config.sampleMs = doc["sampleMs"] | config.sampleMs;
  config.scale = doc["scale"] | config.scale;
  config.verbose = doc["verbose"] | config.verbose;
  strlcpy(config.siteId, doc["siteId"] | config.siteId, sizeof(config.siteId));
  return true;
}

static bool saveConfig(const char* path) {
  FsFile file = sd.open(path, O_WRONLY | O_CREAT | O_TRUNC);
  if (!file) return false;

  JsonDocument doc;
  doc["sampleMs"] = config.sampleMs;
  doc["scale"] = config.scale;
  doc["siteId"] = config.siteId;
  doc["verbose"] = config.verbose;
  doc["writes"] = ++writes;

  serializeJsonPretty(doc, file);
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

  if (!sd.begin(SdSpiConfig(SD_CS, SHARED_SPI, SD_SCK_MHZ(8)))) {
    sd.initErrorPrint(&Serial);
    return;
  }
  mounted = true;

  if (!loadConfig()) {
    Serial.println("falling back to defaults and writing a fresh config");
    saveConfig(CONFIG_PATH);
  }

  Serial.print("siteId=");
  Serial.print(config.siteId);
  Serial.print(" sampleMs=");
  Serial.print(config.sampleMs);
  Serial.print(" scale=");
  Serial.println(config.scale, 3);
}

void loop() {
  if (!mounted) {
    delay(2000);
    return;
  }

  const float value = analogRead(A0) * config.scale;
  if (config.verbose) {
    JsonDocument doc;
    doc["siteId"] = config.siteId;
    doc["value"] = value;
    doc["uptimeMs"] = millis();
    serializeJson(doc, Serial);
    Serial.println();
  }

  // 1 分ごとに現在値つきのバックアップを残し、SD が生きているかも同時に確かめる。
  static uint32_t lastBackup = 0;
  if (millis() - lastBackup >= 60000) {
    lastBackup = millis();
    if (!saveConfig(BACKUP_PATH)) {
      Serial.println("backup failed");
      sd.errorPrint(&Serial);
    }
  }

  delay(config.sampleMs);
}
