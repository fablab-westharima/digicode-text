// @board espr_developer_c5
// @desc コア同梱 Preferences (NVS) に設定を保存し、起動ごとに読み戻す (追加ライブラリなし)

#include <Arduino.h>
#include <Preferences.h>

Preferences prefs;

struct Settings {
  uint32_t bootCount;
  uint32_t intervalMs;
  float threshold;
  String nodeName;
};

static Settings settings;
static uint32_t lastTick = 0;

static void load() {
  prefs.begin("digicode", false);
  settings.bootCount = prefs.getUInt("boots", 0) + 1;
  settings.intervalMs = prefs.getUInt("interval", 2000);
  settings.threshold = prefs.getFloat("threshold", 2.5f);
  settings.nodeName = prefs.getString("name", "espr-c5");
  prefs.putUInt("boots", settings.bootCount);
  prefs.end();
}

static void save() {
  prefs.begin("digicode", false);
  prefs.putUInt("interval", settings.intervalMs);
  prefs.putFloat("threshold", settings.threshold);
  prefs.putString("name", settings.nodeName);
  prefs.end();
  Serial.println("settings saved");
}

void setup() {
  Serial.begin(115200);
  delay(200);
  analogReadResolution(12);
  load();
  Serial.printf("boot #%lu name=%s interval=%lu threshold=%.2f\n",
                (unsigned long)settings.bootCount, settings.nodeName.c_str(),
                (unsigned long)settings.intervalMs, settings.threshold);
}

void loop() {
  if (Serial.available() > 0) {
    const String line = Serial.readStringUntil('\n');
    if (line.startsWith("interval ")) {
      settings.intervalMs = (uint32_t)line.substring(9).toInt();
      if (settings.intervalMs < 200) settings.intervalMs = 200;
      save();
    } else if (line.startsWith("name ")) {
      settings.nodeName = line.substring(5);
      settings.nodeName.trim();
      save();
    } else if (line.startsWith("clear")) {
      prefs.begin("digicode", false);
      prefs.clear();
      prefs.end();
      Serial.println("nvs cleared");
    }
  }

  const uint32_t now = millis();
  if (now - lastTick < settings.intervalMs) return;
  lastTick = now;

  const float volts = analogRead(A0) * 3.3f / 4095.0f;
  Serial.printf("%s volts=%.3f %s\n", settings.nodeName.c_str(), volts,
                volts > settings.threshold ? "OVER" : "ok");
}
