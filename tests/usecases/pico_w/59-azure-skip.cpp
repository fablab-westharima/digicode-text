// @board pico_w
// @lib azure/Azure SDK for C@1.1.8
// @lib knolleary/PubSubClient@2.8
// @desc Azure SDK for C で IoT Hub の client id / user name / SAS token を組み立て、PubSubClient + BearSSL TLS で telemetry を publish する

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <bearssl/bearssl_hmac.h>
#include <string.h>
#include <time.h>

#include <az_core.h>
#include <az_iot.h>
#include <azure_ca.h>

// 実接続はしない。FQDN も device key もダミー。ここで確かめたいのは
// az_iot_hub_client_* と BearSSL の HMAC-SHA256 が Pico W (CYW43439) で build できることだけ。
// ESP32 系は mbedtls を持つが、arduino-pico の TLS は BearSSL なので HMAC と base64 は
// そちら側の API と自前の実装で書く。
#define AZURE_SDK_CLIENT_USER_AGENT "c%2F" AZ_SDK_VERSION_STRING "(ard;picow)"

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* IOTHUB_FQDN = "digicode-test.azure-devices.net";
static const char* DEVICE_ID = "digicode-pico-w";
// 共有アクセスキーの置き場。ここに本物を書かない（公開 repo なので、鍵の形をした
// 文字列自体を置かない）。compile を見るだけのケースなので、中身は何でもよい。
static const char* DEVICE_KEY = "REPLACE_WITH_YOUR_DEVICE_KEY";
static const uint16_t IOTHUB_PORT = AZ_IOT_DEFAULT_MQTT_CONNECT_PORT;
static const uint32_t SAS_DURATION_SEC = 3600;
static const uint32_t TELEMETRY_INTERVAL_MS = 30000;

WiFiClientSecure tls;
PubSubClient mqtt(tls);
static BearSSL::X509List trustRoot((const char*)ca_pem);
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

static const char B64_ALPHABET[] =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static uint32_t epochSeconds() { return (uint32_t)time(NULL); }

// base64 は mbedtls のような同梱実装が arduino-pico には無いので、この 2 つは自前で持つ。
static int b64Value(char c) {
  if (c >= 'A' && c <= 'Z') return c - 'A';
  if (c >= 'a' && c <= 'z') return c - 'a' + 26;
  if (c >= '0' && c <= '9') return c - '0' + 52;
  if (c == '+') return 62;
  if (c == '/') return 63;
  return -1;
}

static bool base64Decode(const char* in, uint8_t* out, size_t outMax, size_t* outLen) {
  uint32_t acc = 0;
  int bits = 0;
  size_t n = 0;
  for (const char* p = in; *p != '\0'; p++) {
    if (*p == '=') break;
    const int v = b64Value(*p);
    if (v < 0) return false;
    acc = (acc << 6) | (uint32_t)v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      if (n >= outMax) return false;
      out[n++] = (uint8_t)((acc >> bits) & 0xFF);
    }
  }
  *outLen = n;
  return true;
}

static bool base64Encode(const uint8_t* in, size_t inLen, char* out, size_t outMax, size_t* outLen) {
  const size_t need = ((inLen + 2) / 3) * 4;
  if (need + 1 > outMax) return false;
  size_t o = 0;
  for (size_t i = 0; i < inLen; i += 3) {
    const uint32_t b0 = in[i];
    const uint32_t b1 = (i + 1 < inLen) ? in[i + 1] : 0;
    const uint32_t b2 = (i + 2 < inLen) ? in[i + 2] : 0;
    const uint32_t triple = (b0 << 16) | (b1 << 8) | b2;
    out[o++] = B64_ALPHABET[(triple >> 18) & 0x3F];
    out[o++] = B64_ALPHABET[(triple >> 12) & 0x3F];
    out[o++] = (i + 1 < inLen) ? B64_ALPHABET[(triple >> 6) & 0x3F] : '=';
    out[o++] = (i + 2 < inLen) ? B64_ALPHABET[triple & 0x3F] : '=';
  }
  out[o] = '\0';
  *outLen = o;
  return true;
}

// BearSSL で HMAC-SHA256。key / payload はいずれも az_span 側から渡す。
static bool hmacSha256(const uint8_t* key, size_t keyLen, az_span payload, uint8_t* out) {
  br_hmac_key_context kc;
  br_hmac_key_init(&kc, &br_sha256_vtable, key, keyLen);

  br_hmac_context ctx;
  br_hmac_init(&ctx, &kc, 0);
  br_hmac_update(&ctx, az_span_ptr(payload), (size_t)az_span_size(payload));
  return br_hmac_out(&ctx, out) == 32;
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
  if (!base64Decode(DEVICE_KEY, decodedKey, sizeof(decodedKey), &decodedLen)) {
    Serial.println("sas: device key base64 decode failed");
    return false;
  }

  if (!hmacSha256(decodedKey, decodedLen, outSignature, hmacResult)) {
    Serial.println("sas: hmac failed");
    return false;
  }

  size_t b64Len = 0;
  if (!base64Encode(hmacResult, sizeof(hmacResult), b64Signature, sizeof(b64Signature), &b64Len)) {
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
  const uint32_t serialDeadline = millis() + 3000;
  while (!Serial && millis() < serialDeadline) delay(10);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.status() == WL_CONNECTED ? "wifi ok" : "wifi failed");

  // SAS token の se= は UNIX 時刻なので、SNTP で時計を合わせてからでないと作れない。
  // arduino-pico では WiFi 同梱の NTP クラスがそれをやる。
  NTP.begin("ntp.nict.jp", "pool.ntp.org");
  Serial.println(NTP.waitSet(10000) ? "ntp set" : "ntp not set yet");

  // BearSSL は RAM を食うので、受信 4KB / 送信 1KB に絞る。
  tls.setBufferSizes(4096, 1024);
  tls.setTrustAnchors(&trustRoot);
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
