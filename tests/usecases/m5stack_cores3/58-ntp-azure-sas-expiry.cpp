// @board m5stack_cores3
// @lib arduino-libraries/NTPClient@3.2.1
// @lib azure/Azure SDK for C@1.1.8
// @lib knolleary/PubSubClient@2.8
// @desc NTPClient で得た epoch を SAS token の se= に使い、期限切れを検知して token を作り直す

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <NTPClient.h>
#include <mbedtls/base64.h>
#include <mbedtls/md.h>
#include <string.h>

#include <az_core.h>
#include <az_iot.h>
#include <azure_ca.h>

// configTime ではなく NTPClient 側の epoch を時刻源にする構成。
// 接続先も device key もダミーで、実際の Hub へは繋がない。
#define AZURE_SDK_CLIENT_USER_AGENT "c%2F" AZ_SDK_VERSION_STRING "(ard;esp32)"

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* IOTHUB_FQDN = "digicode-test.azure-devices.net";
static const char* DEVICE_ID = "digicode-cores3-sas";
static const char* DEVICE_KEY = "REPLACE_WITH_YOUR_DEVICE_KEY";
static const uint16_t IOTHUB_PORT = AZ_IOT_DEFAULT_MQTT_CONNECT_PORT;
// 期限を短めに取って、作り直しの経路を実機でも踏めるようにする。
static const uint32_t SAS_DURATION_SEC = 15 * 60;
static const uint32_t SAS_RENEW_MARGIN_SEC = 120;
static const uint32_t TELEMETRY_INTERVAL_MS = 30000;

WiFiUDP udp;
NTPClient ntp(udp, "ntp.nict.jp", 0, 60000);
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
static uint32_t sasExpiryEpoch = 0;
static uint32_t sasGenerations = 0;
static uint32_t lastTelemetry = 0;
static uint32_t telemetryCount = 0;

static uint32_t nowEpoch() { return (uint32_t)ntp.getEpochTime(); }

static bool hmacSha256(const uint8_t* key, size_t keyLen, az_span data, uint8_t* out) {
  const mbedtls_md_info_t* info = mbedtls_md_info_from_type(MBEDTLS_MD_SHA256);
  if (info == NULL) return false;
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  const bool ok = mbedtls_md_setup(&ctx, info, 1) == 0
                  && mbedtls_md_hmac_starts(&ctx, key, keyLen) == 0
                  && mbedtls_md_hmac_update(&ctx, az_span_ptr(data), (size_t)az_span_size(data)) == 0
                  && mbedtls_md_hmac_finish(&ctx, out) == 0;
  mbedtls_md_free(&ctx);
  return ok;
}

static bool generateSasToken() {
  if (!ntp.isTimeSet()) {
    Serial.println("sas: no time yet");
    return false;
  }
  const uint32_t expiration = nowEpoch() + SAS_DURATION_SEC;

  az_span signature = az_span_create(signatureBuffer, (int32_t)sizeof(signatureBuffer));
  az_span outSignature = AZ_SPAN_EMPTY;
  if (az_result_failed(az_iot_hub_client_sas_get_signature(&hubClient, expiration, signature, &outSignature))) return false;

  size_t decodedLen = 0;
  if (mbedtls_base64_decode(decodedKey, sizeof(decodedKey), &decodedLen,
                            (const unsigned char*)DEVICE_KEY, strlen(DEVICE_KEY)) != 0) return false;
  if (!hmacSha256(decodedKey, decodedLen, outSignature, hmacResult)) return false;

  size_t b64Len = 0;
  if (mbedtls_base64_encode((unsigned char*)b64Signature, sizeof(b64Signature), &b64Len,
                            hmacResult, sizeof(hmacResult)) != 0) return false;

  if (az_result_failed(az_iot_hub_client_sas_get_password(
          &hubClient, expiration, az_span_create((uint8_t*)b64Signature, (int32_t)b64Len),
          AZ_SPAN_EMPTY, sasToken, sizeof(sasToken), NULL))) return false;

  sasExpiryEpoch = expiration;
  sasGenerations++;
  Serial.printf("sas #%lu expires at %lu\n", (unsigned long)sasGenerations, (unsigned long)sasExpiryEpoch);
  return true;
}

// 期限まで SAS_RENEW_MARGIN_SEC を切ったら作り直す。
static bool sasNeedsRenewal() {
  if (sasExpiryEpoch == 0) return true;
  if (!ntp.isTimeSet()) return false;
  return nowEpoch() + SAS_RENEW_MARGIN_SEC >= sasExpiryEpoch;
}

static bool initHubClient() {
  az_iot_hub_client_options options = az_iot_hub_client_options_default();
  options.user_agent = AZ_SPAN_FROM_STR(AZURE_SDK_CLIENT_USER_AGENT);
  if (az_result_failed(az_iot_hub_client_init(&hubClient,
                                              az_span_create((uint8_t*)IOTHUB_FQDN, strlen(IOTHUB_FQDN)),
                                              az_span_create((uint8_t*)DEVICE_ID, strlen(DEVICE_ID)),
                                              &options))) return false;
  size_t idLength = 0;
  if (az_result_failed(az_iot_hub_client_get_client_id(&hubClient, mqttClientId, sizeof(mqttClientId) - 1, &idLength))) return false;
  mqttClientId[idLength] = '\0';
  return !az_result_failed(az_iot_hub_client_get_user_name(&hubClient, mqttUserName, sizeof(mqttUserName), NULL));
}

void setup() {
  Serial.begin(115200);
  delay(200);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  ntp.begin();
  ntp.forceUpdate();

  tls.setCACert((const char*)ca_pem);
  mqtt.setServer(IOTHUB_FQDN, IOTHUB_PORT);
  mqtt.setBufferSize(1024);

  if (!initHubClient()) Serial.println("hub client init failed");
}

void loop() {
  ntp.update();

  if (sasNeedsRenewal()) {
    if (mqtt.connected()) {
      Serial.println("sas expiring; dropping mqtt session");
      mqtt.disconnect();
    }
    if (!generateSasToken()) {
      delay(5000);
      return;
    }
  }

  if (!mqtt.connected()) {
    if (!mqtt.connect(mqttClientId, mqttUserName, sasToken)) {
      Serial.printf("connect failed state=%d\n", mqtt.state());
      delay(5000);
      return;
    }
    Serial.println("iot hub connected");
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastTelemetry < TELEMETRY_INTERVAL_MS) return;
  lastTelemetry = now;

  if (az_result_failed(az_iot_hub_client_telemetry_get_publish_topic(&hubClient, NULL, telemetryTopic,
                                                                     sizeof(telemetryTopic), NULL))) return;
  char payload[128];
  snprintf(payload, sizeof(payload), "{\"seq\":%lu,\"epoch\":%lu,\"sasLeftSec\":%ld}",
           (unsigned long)telemetryCount++, (unsigned long)nowEpoch(),
           (long)sasExpiryEpoch - (long)nowEpoch());
  Serial.println(payload);
  mqtt.publish(telemetryTopic, payload);
}
