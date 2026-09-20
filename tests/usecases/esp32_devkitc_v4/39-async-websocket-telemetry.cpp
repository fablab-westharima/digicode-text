// @board esp32_devkitc_v4
// @lib ESP32Async/ESPAsyncWebServer@3.12.1
// @lib ESP32Async/AsyncTCP@3.5.0
// @lib bblanchon/ArduinoJson@7.4.3
// @desc AsyncWebSocket で JSON テレメトリを broadcast し、クライアントの JSON コマンドを受ける

#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

static const uint8_t ADC_PIN = 36;  // GPIO36 は A0。入力専用で ADC1
// このボードにユーザー LED は無いので、LED_PIN は GPIO25 に外付けした LED のつもり。
static const uint8_t LED_PIN = 25;

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

static uint32_t broadcastIntervalMs = 2000;
static uint32_t lastBroadcast = 0;
static uint32_t sequence = 0;

static void broadcastTelemetry() {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["adc"] = analogRead(ADC_PIN);
  doc["led"] = digitalRead(LED_PIN) == HIGH;
  doc["clients"] = ws.count();
  doc["heap"] = ESP.getFreeHeap();

  char payload[192];
  serializeJson(doc, payload, sizeof(payload));
  ws.textAll(payload);
}

static void handleCommand(AsyncWebSocketClient* client, uint8_t* data, size_t len) {
  JsonDocument doc;
  if (deserializeJson(doc, data, len)) {
    client->text("{\"ok\":false,\"error\":\"invalid json\"}");
    return;
  }
  if (doc["led"].is<bool>()) digitalWrite(LED_PIN, doc["led"] ? HIGH : LOW);
  broadcastIntervalMs = doc["intervalMs"] | broadcastIntervalMs;
  if (broadcastIntervalMs < 250) broadcastIntervalMs = 250;
  client->text("{\"ok\":true}");
}

static void onWsEvent(AsyncWebSocket* socket, AsyncWebSocketClient* client,
                      AwsEventType type, void* arg, uint8_t* data, size_t len) {
  (void)socket;
  switch (type) {
    case WS_EVT_CONNECT:
      Serial.printf("ws connect #%lu\n", (unsigned long)client->id());
      client->text("{\"hello\":\"esp32-devkitc\"}");
      break;
    case WS_EVT_DISCONNECT:
      Serial.println("ws disconnect");
      break;
    case WS_EVT_DATA: {
      AwsFrameInfo* info = (AwsFrameInfo*)arg;
      if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
        handleCommand(client, data, len);
      }
      break;
    }
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 10000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.print("ip ");
  Serial.println(WiFi.localIP());

  ws.onEvent(onWsEvent);
  server.addHandler(&ws);
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "text/plain", "ws endpoint: /ws");
  });
  server.begin();
}

void loop() {
  ws.cleanupClients();
  const uint32_t now = millis();
  if (now - lastBroadcast >= broadcastIntervalMs) {
    lastBroadcast = now;
    broadcastTelemetry();
  }
  delay(50);
}
