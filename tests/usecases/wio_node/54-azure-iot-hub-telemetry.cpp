// @board wio_node
// @lib azure/Azure SDK for C@1.1.8
// @lib knolleary/PubSubClient@2.8
// @desc ESP8266 で Azure SDK for C の SAS token を BearSSL の HMAC-SHA256 で作り、PubSubClient + TLS で telemetry を publish する

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <base64.h>
#include <bearssl/bearssl.h>
#include <bearssl/bearssl_hmac.h>
#include <libb64/cdecode.h>
#include <string.h>
#include <time.h>

#include <az_core.h>
#include <az_iot.h>
#include <azure_ca.h>

// 実接続はしない。FQDN も device key もダミー。ESP8266 では mbedtls が無いので
// コア同梱の BearSSL (br_hmac_*) と libb64 で署名を作る。
#define AZURE_SDK_CLIENT_USER_AGENT "c%2F" AZ_SDK_VERSION_STRING "(ard;esp8266)"

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* IOTHUB_FQDN = "digicode-test.azure-devices.net";
static const char* DEVICE_ID = "digicode-wio-node";
static const char* DEVICE_KEY = "ZGlnaWNvZGUtdGV4dC1kdW1teS1kZXZpY2Uta2V5MDE=";
static const uint16_t IOTHUB_PORT = AZ_IOT_DEFAULT_MQTT_CONNECT_PORT;
static const uint32_t SAS_DURATION_SEC = 3600;
static const uint32_t TELEMETRY_INTERVAL_MS = 30000;

WiFiClientSecure tls;
static X509List trustAnchor((const char*)ca_pem);
PubSubClient mqtt(tls);
static az_iot_hub_client hubClient;

static char sasToken[256];
static uint8_t signatureBuffer[384];
static char decodedKey[64];
static uint8_t hmacResult[32];
static char mqttClientId[128];
static char mqttUserName[160];
static char telemetryTopic[128];
static uint32_t telemetryCount = 0;
static uint32_t lastTelemetry = 0;

static bool generateSasToken() {
  const uint32_t expiration = (uint32_t)time(NULL) + SAS_DURATION_SEC;

  az_span signature = az_span_create(signatureBuffer, (int32_t)sizeof(signatureBuffer));
  az_span outSignature = AZ_SPAN_EMPTY;
  if (az_result_failed(az_iot_hub_client_sas_get_signature(&hubClient, expiration, signature, &outSignature))) {
    Serial.println("sas: get_signature failed");
    return false;
  }

  const int decodedLen = base64_decode_chars(DEVICE_KEY, strlen(DEVICE_KEY), decodedKey);
  if (decodedLen <= 0) {
    Serial.println("sas: device key base64 decode failed");
    return false;
  }

  br_hmac_key_context keyCtx;
  br_hmac_key_init(&keyCtx, &br_sha256_vtable, decodedKey, (size_t)decodedLen);
  br_hmac_context hmacCtx;
  br_hmac_init(&hmacCtx, &keyCtx, 32);
  br_hmac_update(&hmacCtx, az_span_ptr(outSignature), (size_t)az_span_size(outSignature));
  br_hmac_out(&hmacCtx, hmacResult);

  const String b64Signature = base64::encode(hmacResult, br_hmac_size(&hmacCtx));
  const az_span signedSignature = az_span_create((uint8_t*)b64Signature.c_str(), (int32_t)b64Signature.length());

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

// ダミー FQDN なので connect は失敗する。呼び出しの形だけ通す。
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

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  // SAS の se= は UNIX 時刻なので SNTP で時計を合わせてからでないと作れない。
  configTime(0, 0, "ntp.nict.jp", "pool.ntp.org");

  tls.setTrustAnchors(&trustAnchor);
  tls.setBufferSizes(1024, 1024);
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
  snprintf(payload, sizeof(payload), "{\"msgCount\":%lu,\"uptimeMs\":%lu,\"heap\":%u}",
           (unsigned long)telemetryCount++, (unsigned long)now, ESP.getFreeHeap());
  Serial.print(telemetryTopic);
  Serial.print(" <- ");
  Serial.println(payload);
  mqtt.publish(telemetryTopic, payload);
}
