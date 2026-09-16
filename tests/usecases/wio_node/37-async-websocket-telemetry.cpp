// @board wio_node
// @lib ESP32Async/ESPAsyncWebServer@3.12.1
// @lib ESP32Async/ESPAsyncTCP@2.0.0
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ESP8266 の AsyncWebSocket で A0 とヒープを broadcast し、JSON コマンドで Grove 電源を切替

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint8_t GROVE_POWER = 15;
static const uint8_t STATUS_LED = 2;

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

static uint32_t broadcastIntervalMs = 2000;
static uint32_t lastBroadcast = 0;
static uint32_t sequence = 0;

static void broadcastTelemetry() {
  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = millis();
  doc["a0"] = analogRead(A0);
  doc["heap"] = ESP.getFreeHeap();
  doc["rssi"] = WiFi.RSSI();
  doc["grovePower"] = digitalRead(GROVE_POWER) == HIGH;
  doc["clients"] = ws.count();

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
  if (doc["grovePower"].is<bool>()) {
    digitalWrite(GROVE_POWER, doc["grovePower"] ? HIGH : LOW);
  }
  if (doc["led"].is<bool>()) {
    digitalWrite(STATUS_LED, doc["led"] ? LOW : HIGH); // アクティブ LOW
  }
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
      client->text("{\"hello\":\"wio-node\"}");
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
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, HIGH);

  WiFi.persistent(false);
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
