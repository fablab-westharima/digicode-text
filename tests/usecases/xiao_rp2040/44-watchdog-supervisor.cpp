// @board xiao_rp2040
// @desc コア同梱の watchdog でタスク監視を組む。期限を過ぎたタスクがあれば餌やりを止めて再起動させる

#include <Arduino.h>

// 8.3 秒が RP2040 の watchdog の上限。余裕をみて 6 秒で仕掛ける。
static const uint32_t WDT_TIMEOUT_MS = 6000;

struct Task {
  const char* name;
  uint32_t periodMs;
  uint32_t deadlineMs;
  uint32_t lastRunMs;
  uint32_t runs;
  uint32_t worstLatencyMs;
};

static Task tasks[] = {
  {"sample", 100, 500, 0, 0, 0},
  {"report", 1000, 3000, 0, 0, 0},
  {"selftest", 5000, 5500, 0, 0, 0},
};
static const uint8_t TASK_COUNT = sizeof(tasks) / sizeof(tasks[0]);

static uint32_t lastA0 = 0;
static bool starving = false;

static void runSample() {
  lastA0 = analogRead(A0);
}

static void runReport() {
  Serial.print("a0=");
  Serial.print(lastA0);
  Serial.print(" coreTempC=");
  Serial.print(analogReadTemp(), 1);
  Serial.print(" freeHeap=");
  Serial.print(rp2040.getFreeHeap());
  for (uint8_t i = 0; i < TASK_COUNT; i++) {
    Serial.print(' ');
    Serial.print(tasks[i].name);
    Serial.print('=');
    Serial.print(tasks[i].runs);
    Serial.print('/');
    Serial.print(tasks[i].worstLatencyMs);
  }
  Serial.println();
}

static void runSelftest() {
  // ヒープが痩せてきたら回復の見込みが無いので watchdog に落とさせる。
  if (rp2040.getFreeHeap() < 8192) {
    Serial.println("heap exhausted; stopping the watchdog feed");
    starving = true;
  }
}

static void dispatch(uint8_t index, uint32_t now) {
  Task& t = tasks[index];
  if (now - t.lastRunMs < t.periodMs) return;

  const uint32_t latency = now - t.lastRunMs - t.periodMs;
  if (latency > t.worstLatencyMs) t.worstLatencyMs = latency;
  t.lastRunMs = now;
  t.runs++;

  switch (index) {
    case 0: runSample(); break;
    case 1: runReport(); break;
    default: runSelftest(); break;
  }
}

void setup() {
  Serial.begin(115200);
  const uint32_t deadline = millis() + 3000;
  while (!Serial && millis() < deadline) delay(10);

  analogReadResolution(12);
  pinMode(PIN_LED_G, OUTPUT);
  digitalWrite(PIN_LED_G, HIGH);

  const uint32_t now = millis();
  for (uint8_t i = 0; i < TASK_COUNT; i++) tasks[i].lastRunMs = now;

  rp2040.wdt_begin(WDT_TIMEOUT_MS);
  Serial.print("watchdog armed at ");
  Serial.print(WDT_TIMEOUT_MS);
  Serial.println(" ms");
}

void loop() {
  const uint32_t now = millis();
  for (uint8_t i = 0; i < TASK_COUNT; i++) dispatch(i, now);

  // すべてのタスクが期限内に回っているときだけ餌をやる。
  bool healthy = !starving;
  for (uint8_t i = 0; i < TASK_COUNT; i++) {
    if (now - tasks[i].lastRunMs > tasks[i].deadlineMs) {
      Serial.print("task overdue: ");
      Serial.println(tasks[i].name);
      healthy = false;
    }
  }

  if (healthy) {
    rp2040.wdt_reset();
    digitalWrite(PIN_LED_G, (now / 500) % 2 ? LOW : HIGH);
  } else {
    digitalWrite(PIN_LED_G, LOW);
  }

  delay(10);
}
