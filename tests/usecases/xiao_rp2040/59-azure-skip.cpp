// @board xiao_rp2040
// @lib azure/Azure SDK for C@1.1.8
// @skip 対象外: Azure IoT Hub は TLS + MQTT 前提。XIAO RP2040 単体ではネットワークに出られない
// @desc 参考: SAS token 生成と telemetry publish は xiao_esp32c3 / wio_node の 54 / 55 / 58 で見る

#include <Arduino.h>

// az_iot_hub_client_* 自体はネットワークに依存しない純粋な文字列組み立てなので、
// ライブラリを足すだけなら compile は通る可能性がある。しかし SAS token の se= には
// 実時刻が要り、publish には TLS スタックが要る。XIAO RP2040 単体ではどちらも無いため対象外。
//
// この board で外へ出すなら USB Serial のホスト側で中継する。JSON を作るところまでは
// 04-modbus-json-serial.cpp などで検証している。

static const char* INTENDED_FQDN = "digicode-test.azure-devices.net";

void setup() {
  Serial.begin(115200);
  Serial.print("azure iot is out of scope for xiao_rp2040; intended hub=");
  Serial.println(INTENDED_FQDN);
}

void loop() {
  delay(1000);
}
