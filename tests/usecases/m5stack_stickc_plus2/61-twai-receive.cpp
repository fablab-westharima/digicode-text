// @board m5stack_stickc_plus2
// @desc ESP32-PICO-V3-02 内蔵 TWAI (CAN) コントローラで受信する。外部ライブラリは使わない

#include <Arduino.h>
#include <driver/twai.h>

// ESP32-PICO-V3-02 は TWAI を 1 チャンネル持つ。GPIO26 を TX、GPIO36 を RX にして
// 外付けの CAN トランシーバ (SN65HVD230 など) へ繋ぐ前提。
static const gpio_num_t TWAI_TX_PIN = GPIO_NUM_26;
static const gpio_num_t TWAI_RX_PIN = GPIO_NUM_36;

static bool driverReady = false;
static uint32_t received = 0;
static uint32_t lastStatus = 0;

static void printMessage(const twai_message_t& msg) {
  Serial.print(msg.extd ? "ext id=0x" : "std id=0x");
  Serial.print(msg.identifier, HEX);
  Serial.print(" dlc=");
  Serial.print(msg.data_length_code);
  if (msg.rtr) {
    Serial.println(" rtr");
    return;
  }
  Serial.print(" data=");
  for (uint8_t i = 0; i < msg.data_length_code; i++) {
    if (msg.data[i] < 0x10) Serial.print('0');
    Serial.print(msg.data[i], HEX);
    Serial.print(' ');
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  twai_general_config_t general = TWAI_GENERAL_CONFIG_DEFAULT(TWAI_TX_PIN, TWAI_RX_PIN, TWAI_MODE_NORMAL);
  general.rx_queue_len = 16;
  twai_timing_config_t timing = TWAI_TIMING_CONFIG_500KBITS();
  twai_filter_config_t filter = TWAI_FILTER_CONFIG_ACCEPT_ALL();

  if (twai_driver_install(&general, &timing, &filter) != ESP_OK) {
    Serial.println("twai_driver_install failed");
    return;
  }
  if (twai_start() != ESP_OK) {
    Serial.println("twai_start failed");
    twai_driver_uninstall();
    return;
  }
  driverReady = true;
  Serial.println("twai running at 500kbps");
}

void loop() {
  if (!driverReady) {
    delay(1000);
    return;
  }

  twai_message_t msg;
  // 100ms だけ待つ。何も来なければ status だけ見て戻る。
  if (twai_receive(&msg, pdMS_TO_TICKS(100)) == ESP_OK) {
    received++;
    printMessage(msg);
  }

  const uint32_t now = millis();
  if (now - lastStatus < 5000) return;
  lastStatus = now;

  twai_status_info_t status;
  if (twai_get_status_info(&status) != ESP_OK) return;
  Serial.printf("received=%lu state=%d rx_q=%lu bus_err=%lu rx_missed=%lu\n",
                (unsigned long)received, (int)status.state,
                (unsigned long)status.msgs_to_rx,
                (unsigned long)status.bus_error_count,
                (unsigned long)status.rx_missed_count);

  if (status.state == TWAI_STATE_BUS_OFF) {
    Serial.println("bus off; recovering");
    twai_initiate_recovery();
  }
}
