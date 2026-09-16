// @board xiao_rp2040
// @lib 4-20ma/ModbusMaster@2.0.1
// @desc 保持/入力レジスタとコイルの複数レンジを 1 周期で順に読み、レンジごとに成否を持つ

#include <Arduino.h>
#include <ModbusMaster.h>

static const uint8_t RS485_TX = 0;  // D6 / GP0
static const uint8_t RS485_RX = 1;  // D7 / GP1
static const uint8_t RS485_DE = 28; // D2 / GP28
static const uint8_t SLAVE_ID = 1;

// ModbusMaster の応答バッファは 64 レジスタ。1 レンジはそれ以下に切る。
static const uint8_t MAX_PER_READ = 32;

enum RangeKind : uint8_t {
  KIND_HOLDING,
  KIND_INPUT,
  KIND_COIL,
};

struct Range {
  const char* label;
  RangeKind kind;
  uint16_t start;
  uint8_t count;
};

static const Range RANGES[] = {
  {"status", KIND_HOLDING, 0x0000, 8},
  {"process", KIND_HOLDING, 0x0100, MAX_PER_READ},
  {"analog-in", KIND_INPUT, 0x0000, 16},
  {"digital-out", KIND_COIL, 0x0000, 16},
};
static const uint8_t RANGE_COUNT = sizeof(RANGES) / sizeof(RANGES[0]);

ModbusMaster node;
static uint8_t lastResult[RANGE_COUNT];
static uint32_t okCount[RANGE_COUNT];
static uint32_t ngCount[RANGE_COUNT];

static void preTransmission() { digitalWrite(RS485_DE, HIGH); }
static void postTransmission() { digitalWrite(RS485_DE, LOW); }

static uint8_t readRange(const Range& r) {
  switch (r.kind) {
    case KIND_HOLDING: return node.readHoldingRegisters(r.start, r.count);
    case KIND_INPUT: return node.readInputRegisters(r.start, r.count);
    default: return node.readCoils(r.start, r.count);
  }
}

static void dumpRange(const Range& r) {
  Serial.print(r.label);
  Serial.print(':');
  // コイルは 1 ワードに 16 点詰まって返るので語数が違う。
  const uint8_t words = (r.kind == KIND_COIL) ? (uint8_t)((r.count + 15) / 16) : r.count;
  for (uint8_t i = 0; i < words; i++) {
    Serial.print(' ');
    Serial.print(node.getResponseBuffer(i));
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  pinMode(RS485_DE, OUTPUT);
  digitalWrite(RS485_DE, LOW);

  Serial1.setTX(RS485_TX);
  Serial1.setRX(RS485_RX);
  Serial1.begin(38400, SERIAL_8N1);

  node.begin(SLAVE_ID, Serial1);
  node.preTransmission(preTransmission);
  node.postTransmission(postTransmission);

  for (uint8_t i = 0; i < RANGE_COUNT; i++) {
    lastResult[i] = node.ku8MBSuccess;
    okCount[i] = 0;
    ngCount[i] = 0;
  }
  Serial.print("polling ranges=");
  Serial.println(RANGE_COUNT);
}

void loop() {
  const uint32_t started = millis();

  for (uint8_t i = 0; i < RANGE_COUNT; i++) {
    const Range& r = RANGES[i];
    node.clearResponseBuffer();
    lastResult[i] = readRange(r);

    if (lastResult[i] == node.ku8MBSuccess) {
      okCount[i]++;
      dumpRange(r);
    } else {
      ngCount[i]++;
      Serial.print(r.label);
      Serial.print(" failed 0x");
      Serial.println(lastResult[i], HEX);
    }
    // slave に息を継がせる。連続要求は 3.5 文字時間以上あけるのが RTU の作法。
    delay(20);
  }

  Serial.print("cycleMs=");
  Serial.print(millis() - started);
  for (uint8_t i = 0; i < RANGE_COUNT; i++) {
    Serial.print(' ');
    Serial.print(RANGES[i].label);
    Serial.print('=');
    Serial.print(okCount[i]);
    Serial.print('/');
    Serial.print(okCount[i] + ngCount[i]);
  }
  Serial.println();

  delay(1000);
}
