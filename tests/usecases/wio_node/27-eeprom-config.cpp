// @board wio_node
// @desc コア同梱 EEPROM (flash エミュレーション) に構造体で設定を保存し、起動ごとに読み戻す (追加ライブラリなし)

#include <Arduino.h>
#include <EEPROM.h>

static const int EEPROM_SIZE = 256;
static const int CONFIG_ADDR = 0;
static const uint32_t MAGIC = 0x44494749; // "DIGI"
static const uint8_t GROVE_POWER = 15;

struct Config {
  uint32_t magic;
  uint32_t bootCount;
  uint32_t intervalMs;
  uint16_t threshold;
  char name[20];
};

static Config config;
static uint32_t lastTick = 0;

static void saveConfig() {
  EEPROM.put(CONFIG_ADDR, config);
  if (EEPROM.commit()) Serial.println("config committed");
  else Serial.println("commit failed");
}

static void loadConfig() {
  EEPROM.get(CONFIG_ADDR, config);
  if (config.magic != MAGIC) {
    Serial.println("no valid config, writing defaults");
    config.magic = MAGIC;
    config.bootCount = 0;
    config.intervalMs = 2000;
    config.threshold = 512;
    strncpy(config.name, "wio-node", sizeof(config.name) - 1);
    config.name[sizeof(config.name) - 1] = '\0';
  }
  config.bootCount++;
  saveConfig();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);

  EEPROM.begin(EEPROM_SIZE);
  loadConfig();
  Serial.printf("boot #%lu name=%s interval=%lu threshold=%u\n",
                (unsigned long)config.bootCount, config.name,
                (unsigned long)config.intervalMs, config.threshold);
}

void loop() {
  if (Serial.available() > 0) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.startsWith("interval ")) {
      config.intervalMs = (uint32_t)line.substring(9).toInt();
      if (config.intervalMs < 200) config.intervalMs = 200;
      saveConfig();
    } else if (line.startsWith("threshold ")) {
      config.threshold = (uint16_t)line.substring(10).toInt();
      saveConfig();
    } else if (line.startsWith("name ")) {
      strncpy(config.name, line.substring(5).c_str(), sizeof(config.name) - 1);
      config.name[sizeof(config.name) - 1] = '\0';
      saveConfig();
    }
  }

  const uint32_t now = millis();
  if (now - lastTick < config.intervalMs) return;
  lastTick = now;

  const int raw = analogRead(A0);
  Serial.printf("%s a0=%d %s\n", config.name, raw, raw > config.threshold ? "OVER" : "ok");
}
