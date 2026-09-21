// @board m5stack_atom_lite
// @lib madhephaestus/ESP32Servo@3.2.1
// @lib bblanchon/ArduinoJson@7.4.3
// @desc WebServer の JSON API でサーボ角度を受け取り、現在状態を JSON で返す

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const int SERVO_PIN = 19;

Servo servo;
WebServer server(80);

static int targetAngle = 90;
static int currentAngle = 90;
static uint32_t lastMove = 0;

static void handleState() {
  JsonDocument doc;
  doc["target"] = targetAngle;
  doc["current"] = currentAngle;
  doc["attached"] = servo.attached();
  doc["uptimeMs"] = millis();
  String body;
  serializeJson(doc, body);
  server.send(200, "application/json", body);
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
  handleState();
}

void setup() {
  Serial.begin(115200);
  delay(200);

  ESP32PWM::allocateTimer(0);
  servo.setPeriodHertz(50);
  servo.attach(SERVO_PIN, 500, 2400);
  servo.write(currentAngle);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  const uint32_t deadline = millis() + 8000;
  while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);

  server.on("/api/servo", HTTP_GET, handleState);
  server.on("/api/servo", HTTP_POST, handleMove);
  server.onNotFound([]() { server.send(404, "application/json", "{\"error\":\"not found\"}"); });
  server.begin();
  Serial.println(WiFi.localIP());
}

void loop() {
  server.handleClient();

  const uint32_t now = millis();
  if (now - lastMove < 15) return;
  lastMove = now;

  if (currentAngle < targetAngle) currentAngle++;
  else if (currentAngle > targetAngle) currentAngle--;
  else return;
  servo.write(currentAngle);
}
