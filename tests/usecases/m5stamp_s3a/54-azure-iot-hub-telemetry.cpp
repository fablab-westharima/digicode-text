// @board m5stamp_s3a
// @lib azure/Azure SDK for C@1.1.8
// @lib knolleary/PubSubClient@2.8
// @desc Azure SDK for C で IoT Hub の client id / user name / SAS token を組み立て、PubSubClient + TLS で telemetry を publish する

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <mbedtls/base64.h>
#include <mbedtls/md.h>
#include <string.h>
#include <time.h>

#include <az_core.h>
#include <az_iot.h>
#include <azure_ca.h>

// 実接続はしない。FQDN も device key もダミー。ここで確かめたいのは
// az_iot_hub_client_* と mbedtls の HMAC-SHA256 / base64 がクラシック ESP32 で build できることだけ。
#define AZURE_SDK_CLIENT_USER_AGENT "c%2F" AZ_SDK_VERSION_STRING "(ard;esp32)"

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* IOTHUB_FQDN = "digicode-test.azure-devices.net";
static const char* DEVICE_ID = "digicode-stamps3a";
// 共有アクセスキーの置き場。ここに本物を書かない（公開 repo なので、鍵の形をした
// 文字列自体を置かない）。compile を見るだけのケースなので、中身は何でもよい。
static const char* DEVICE_KEY = "REPLACE_WITH_YOUR_DEVICE_KEY";
static const uint16_t IOTHUB_PORT = AZ_IOT_DEFAULT_MQTT_CONNECT_PORT;
static const uint32_t SAS_DURATION_SEC = 3600;
static const uint32_t TELEMETRY_INTERVAL_MS = 30000;

WiFiClientSecure tls;
PubSubClient mqtt(tls);
static az_iot_hub_client hubClient;

static char sasToken[256];
static uint8_t signatureBuffer[256];
static uint8_t decodedKey[64];
static uint8_t hmacResult[32];
static char b64Signature[64];
static char mqttClientId[128];
static char mqttUserName[160];
static char telemetryTopic[128];
static uint32_t telemetryCount = 0;
static uint32_t lastTelemetry = 0;

static uint32_t epochSeconds() { return (uint32_t)time(NULL); }

// mbedtls で HMAC-SHA256。key / payload はいずれも az_span。
static bool hmacSha256(const uint8_t* key, size_t keyLen, az_span payload, uint8_t* out) {
  const mbedtls_md_info_t* info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  if (info == NULL) return false;

  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  bool ok = mbedtls_md_setup(&ctx, info, 1) == 0
            && mbedtls_md_hmac_starts(&ctx, key, keyLen) == 0
            && mbedtls_md_hmac_update(&ctx, az_span_ptr(payload), (size_t)az_span_size(payload)) == 0
            && mbedtls_md_hmac_finish(&ctx, out) == 0;
  mbedtls_md_free(&ctx);
  return ok;
}

static bool generateSasToken() {
  const uint32_t expiration = epochSeconds() + SAS_DURATION_SEC;

  az_span signature = az_span_create(signatureBuffer, (int32_t)sizeof(signatureBuffer));
  az_span outSignature = AZ_SPAN_EMPTY;
  if (az_result_failed(az_iot_hub_client_sas_get_signature(&hubClient, expiration, signature, &outSignature))) {
    Serial.println("sas: get_signature failed");
    return false;
  }

  size_t decodedLen = 0;
  if (mbedtls_base64_decode(decodedKey, sizeof(decodedKey), &decodedLen,
                            (const unsigned char*)DEVICE_KEY, strlen(DEVICE_KEY)) != 0) {
    Serial.println("sas: device key base64 decode failed");
    return false;
  }

  if (!hmacSha256(decodedKey, decodedLen, outSignature, hmacResult)) {
    Serial.println("sas: hmac failed");
    return false;
  }

  size_t b64Len = 0;
  if (mbedtls_base64_encode((unsigned char*)b64Signature, sizeof(b64Signature), &b64Len,
                            hmacResult, sizeof(hmacResult)) != 0) {
    Serial.println("sas: signature base64 encode failed");
    return false;
  }

  const az_span signedSignature = az_span_create((uint8_t*)b64Signature, (int32_t)b64Len);
  if (az_result_failed(az_iot_hub_client_sas_get_password(&hubClient, expiration, signedSignature,
                                                          AZ_SPAN_EMPTY, sasToken, sizeof(sasToken), NULL))) {
    Serial.println("sas: get_password failed");
    return false;
  }
  return true;
}

static bool initHubClient() {
  az_iot_hub_client_options options = az_iot_hub_client_options_default();
  options.user_agent = AZ_SPAN_FROM_STR(AZURE_SDK_CLIENT_USER_AGENT);

  if (az_result_failed(az_iot_hub_client_init(&hubClient,
                                              az_span_create((uint8_t*)IOTHUB_FQDN, strlen(IOTHUB_FQDN)),
                                              az_span_create((uint8_t*)DEVICE_ID, strlen(DEVICE_ID)),
                                              &options))) {
    Serial.println("hub client init failed");
    return false;
  }

  size_t idLength = 0;
  if (az_result_failed(az_iot_hub_client_get_client_id(&hubClient, mqttClientId, sizeof(mqttClientId) - 1, &idLength))) {
    Serial.println("get_client_id failed");
    return false;
  }
  mqttClientId[idLength] = '\0';

  if (az_result_failed(az_iot_hub_client_get_user_name(&hubClient, mqttUserName, sizeof(mqttUserName), NULL))) {
    Serial.println("get_user_name failed");
    return false;
  }

  Serial.print("client id: ");
  Serial.println(mqttClientId);
  Serial.print("user name: ");
  Serial.println(mqttUserName);
  return true;
}

static void onMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("c2d [");
  Serial.print(topic);
  Serial.print("] ");
  for (unsigned int i = 0; i < length; i++) Serial.print((char)payload[i]);
  Serial.println();
}

// ダミー FQDN なので connect は失敗する。ここでは呼び出しの形だけ通す。
static bool connectToHub() {
  if (mqtt.connected()) return true;
  if (!mqtt.connect(mqttClientId, mqttUserName, sasToken)) {
    Serial.print("mqtt connect failed, state=");
    Serial.println(mqtt.state());
    return false;
  }
  mqtt.subscribe(AZ_IOT_HUB_CLIENT_C2D_SUBSCRIBE_TOPIC);
  Serial.println("connected to iot hub");
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  // SAS token の se= は UNIX 時刻なので、SNTP で時計を合わせてからでないと作れない。
  configTime(0, 0, "ntp.nict.jp", "pool.ntp.org");

  tls.setCACert((const char*)ca_pem);
  mqtt.setServer(IOTHUB_FQDN, IOTHUB_PORT);
  mqtt.setBufferSize(1024);
  mqtt.setCallback(onMessage);

  if (!initHubClient()) return;
  if (!generateSasToken()) return;
  Serial.print("sas token length=");
  Serial.println((unsigned)strlen(sasToken));
  connectToHub();
}

void loop() {
  if (!connectToHub()) {
    delay(5000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastTelemetry < TELEMETRY_INTERVAL_MS) return;
  lastTelemetry = now;

  if (az_result_failed(az_iot_hub_client_telemetry_get_publish_topic(&hubClient, NULL, telemetryTopic,
                                                                     sizeof(telemetryTopic), NULL))) {
    Serial.println("telemetry topic failed");
    return;
  }

  char payload[96];
  snprintf(payload, sizeof(payload), "{\"msgCount\":%lu,\"uptimeMs\":%lu}",
           (unsigned long)telemetryCount++, (unsigned long)now);
  Serial.print(telemetryTopic);
  Serial.print(" <- ");
  Serial.println(payload);
  mqtt.publish(telemetryTopic, payload);
}
