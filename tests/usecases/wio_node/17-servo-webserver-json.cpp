// @board wio_node
// @lib bblanchon/ArduinoJson@7.4.3
// @desc ESP8266WebServer の JSON API でコア同梱 Servo を動かす

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <Servo.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const uint8_t SERVO_PIN = 14;
static const uint8_t GROVE_POWER = 15;

Servo arm;
ESP8266WebServer server(80);

static int targetAngle = 90;
static int currentAngle = 90;
static uint32_t lastMove = 0;

static void sendState(int code) {
  JsonDocument doc;
  doc["target"] = targetAngle;
  doc["current"] = currentAngle;
  doc["attached"] = arm.attached();
  doc["uptimeMs"] = millis();
  doc["heap"] = ESP.getFreeHeap();
  String body;
  serializeJson(doc, body);
  server.send(code, "application/json", body);
}

static void handleMove() {
  JsonDocument doc;
  const DeserializationError err = deserializeJson(doc, server.arg("plain"));
  if (err) {
    server.send(400, "application/json", String("{\"error\":\"") + err.c_str() + "\"}");
    return;
  }
  const int angle = doc["angle"] | -1;
  if (angle < 0 || angle > 180) {
    server.send(422, "application/json", "{\"error\":\"angle must be 0..180\"}");
    return;
  }
  targetAngle = angle;
  sendState(200);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(200);

  arm.attach(SERVO_PIN, 544, 2400);
  arm.write(currentAngle);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
  Serial.println(WiFi.localIP());

  server.on("/api/servo", HTTP_GET, []() { sendState(200); });
  server.on("/api/servo", HTTP_POST, handleMove);
  server.onNotFound([]() { server.send(404, "application/json", "{\"error\":\"not found\"}"); });
  server.begin();
}

void loop() {
  server.handleClient();
  const uint32_t now = millis();
  if (now - lastMove < 15) return;
  lastMove = now;

  if (currentAngle < targetAngle) currentAngle++;
  else if (currentAngle > targetAngle) currentAngle--;
  else return;
  arm.write(currentAngle);
}
