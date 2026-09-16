// @board wio_node
// @lib adafruit/Adafruit NeoPixel@1.15.5
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ブラウザからの JSON で NeoPixel の色・明るさ・アニメーションを切り替える

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Adafruit_NeoPixel.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint16_t PIXEL_COUNT = 8;
static const uint8_t PIXEL_PIN = 13;
static const uint8_t GROVE_POWER = 15;

Adafruit_NeoPixel strip(PIXEL_COUNT, PIXEL_PIN, NEO_GRB + NEO_KHZ800);
ESP8266WebServer server(80);

static uint8_t red = 0, green = 64, blue = 32;
static uint8_t brightness = 40;
static bool animate = true;
static uint16_t hue = 0;
static uint32_t lastFrame = 0;

static void sendState() {
  JsonDocument doc;
  JsonObject color = doc["color"].to<JsonObject>();
  color["r"] = red;
  color["g"] = green;
  color["b"] = blue;
  doc["brightness"] = brightness;
  doc["animate"] = animate;
  doc["pixels"] = strip.numPixels();
  doc["heap"] = ESP.getFreeHeap();
  String body;
  serializeJson(doc, body);
  server.send(200, "application/json", body);
}

static void handlePost() {
  JsonDocument doc;
  if (deserializeJson(doc, server.arg("plain"))) {
    server.send(400, "application/json", "{\"error\":\"invalid json\"}");
    return;
  }
  red = doc["color"]["r"] | red;
  green = doc["color"]["g"] | green;
  blue = doc["color"]["b"] | blue;
  brightness = doc["brightness"] | brightness;
  animate = doc["animate"] | animate;
  strip.setBrightness(brightness);
  sendState();
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(200);

  strip.begin();
  strip.setBrightness(brightness);
  strip.clear();
  strip.show();

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);

  server.on("/api/led", HTTP_GET, sendState);
  server.on("/api/led", HTTP_POST, handlePost);
  server.begin();
  Serial.println(WiFi.localIP());
}

void loop() {
  server.handleClient();
  const uint32_t now = millis();
  if (now - lastFrame < 40) return;
  lastFrame = now;

  if (animate) {
    for (uint16_t i = 0; i < PIXEL_COUNT; i++) {
      strip.setPixelColor(i, strip.ColorHSV(hue + i * (65536 / PIXEL_COUNT), 255, 255));
    }
    hue += 400;
  } else {
    strip.fill(strip.Color(red, green, blue), 0, PIXEL_COUNT);
  }
  strip.show();
}
