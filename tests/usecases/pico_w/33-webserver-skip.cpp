// @board pico_w
// @desc コア同梱の WebServer だけで GPIO 制御の JSON API を作り、GET/POST/DELETE を扱う (追加ライブラリなし)

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";

// Pico W のヘッダに出ている GPIO は GP0-GP22 と GP26-GP28 の 26 本。GP23/24/25/29 は
// 無線チップ CYW43439 が使うので、API から触らせるのはヘッダに出ている空き 4 本にする。
static const uint8_t OUTPUT_PINS[] = { 2, 3, 6, 7 };
static const size_t OUTPUT_COUNT = sizeof(OUTPUT_PINS) / sizeof(OUTPUT_PINS[0]);

WebServer server(80);
static uint32_t requestCount = 0;

static bool isManaged(uint8_t pin) {
  for (size_t i = 0; i < OUTPUT_COUNT; i++) if (OUTPUT_PINS[i] == pin) return true;
  return false;
}

// ArduinoJson を足さずに済ませたいので、返す JSON は String で組む。
// 出すのは数値と固定の識別子だけなので、エスケープは要らない。
static void sendJson(int code, const String& body) {
  server.send(code, "application/json", body);
}

static void handlePins() {
  requestCount++;
  String body = "{\"requests\":";
  body += requestCount;
  body += ",\"uptimeMs\":";
  body += millis();
  body += ",\"pins\":[";
  for (size_t i = 0; i < OUTPUT_COUNT; i++) {
    if (i) body += ',';
    body += "{\"gpio\":";
    body += OUTPUT_PINS[i];
    body += ",\"level\":";
    body += (int)digitalRead(OUTPUT_PINS[i]);
    body += '}';
  }
  body += "]}";
  sendJson(200, body);
}

// body は {"gpio":2,"level":true} の形。手で読むので、数値と true/false だけを拾う。
static bool parseRequest(const String& body, uint8_t& gpio, bool& level) {
  const int gpioAt = body.indexOf("\"gpio\"");
  const int levelAt = body.indexOf("\"level\"");
  if (gpioAt < 0 || levelAt < 0) return false;

  const int gpioColon = body.indexOf(':', gpioAt);
  if (gpioColon < 0) return false;
  gpio = (uint8_t)body.substring(gpioColon + 1).toInt();

  const int levelColon = body.indexOf(':', levelAt);
  if (levelColon < 0) return false;
  const String rest = body.substring(levelColon + 1);
  level = rest.indexOf("true") >= 0 || rest.indexOf('1') >= 0;
  return true;
}

static void handleSetPin() {
  requestCount++;
  uint8_t gpio = 255;
  bool level = false;
  if (!parseRequest(server.arg("plain"), gpio, level)) {
    sendJson(400, "{\"error\":\"invalid json\"}");
    return;
  }
  if (!isManaged(gpio)) {
    String err = "{\"error\":\"gpio not managed\",\"gpio\":";
    err += gpio;
    err += '}';
    sendJson(422, err);
    return;
  }
  digitalWrite(gpio, level ? HIGH : LOW);
  String ok = "{\"gpio\":";
  ok += gpio;
  ok += ",\"level\":";
  ok += level ? "true" : "false";
  ok += '}';
  sendJson(200, ok);
}

static void handleReset() {
  requestCount++;
  for (size_t i = 0; i < OUTPUT_COUNT; i++) digitalWrite(OUTPUT_PINS[i], LOW);
  String body = "{\"reset\":true,\"count\":";
  body += (uint32_t)OUTPUT_COUNT;
  body += '}';
  sendJson(200, body);
}

void setup() {
  Serial.begin(115200);
  const uint32_t serialDeadline = millis() + 3000;
  while (!Serial && millis() < serialDeadline) delay(10);

  for (size_t i = 0; i < OUTPUT_COUNT; i++) {
    pinMode(OUTPUT_PINS[i], OUTPUT);
    digitalWrite(OUTPUT_PINS[i], LOW);
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.localIP());

  server.on("/api/pins", HTTP_GET, handlePins);
  server.on("/api/pins", HTTP_POST, handleSetPin);
  server.on("/api/pins", HTTP_DELETE, handleReset);
  server.onNotFound([]() {
    String body = "{\"error\":\"not found\",\"uri\":\"";
    body += server.uri();
    body += "\"}";
    sendJson(404, body);
  });
  server.begin();
}

void loop() {
  server.handleClient();
  delay(2);
}
