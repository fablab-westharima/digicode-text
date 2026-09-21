// @board m5stack_atom_lite
// @lib bblanchon/ArduinoJson@7.4.3
// @desc softAP + DNSServer + WebServer で設定用のキャプティブポータルを立てる (コア同梱のみ + JSON)

#include <Arduino.h>
#include <WiFi.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <ArduinoJson.h>

static const char* AP_SSID = "digicode-setup";
static const char* AP_PASSWORD = "digicode1234";
static const byte DNS_PORT = 53;

DNSServer dns;
WebServer server(80);

static String pendingSsid;
static String pendingPassword;
static uint32_t lastLog = 0;

static void handlePortal() {
  String page = F("<html><body><h2>DigiCode setup</h2>"
                  "<form method='POST' action='/save'>"
                  "SSID <input name='ssid'><br>"
                  "PASS <input name='pass' type='password'><br>"
                  "<button type='submit'>save</button></form></body></html>");
  server.send(200, "text/html", page);
}

static void handleSave() {
  pendingSsid = server.arg("ssid");
  pendingPassword = server.arg("pass");
  JsonDocument doc;
  doc["saved"] = true;
  doc["ssid"] = pendingSsid;
  doc["passwordLength"] = pendingPassword.length();
  String body;
  serializeJson(doc, body);
  server.send(200, "application/json", body);
}

static void handleScan() {
  JsonDocument doc;
  const int n = WiFi.scanNetworks();
  JsonArray nets = doc["networks"].to<JsonArray>();
  for (int i = 0; i < n && i < 15; i++) {
    JsonObject o = nets.add<JsonObject>();
    o["ssid"] = WiFi.SSID(i);
    o["rssi"] = WiFi.RSSI(i);
    o["channel"] = WiFi.channel(i);
    o["open"] = WiFi.encryptionType(i) == WIFI_AUTH_OPEN;
  }
  WiFi.scanDelete();
  String body;
  serializeJson(doc, body);
  server.send(200, "application/json", body);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASSWORD);
  Serial.print("ap ip: ");
  Serial.println(WiFi.softAPIP());

  dns.setErrorReplyCode(DNSReplyCode::NoError);
  dns.start(DNS_PORT, "*", WiFi.softAPIP());

  server.on("/", HTTP_GET, handlePortal);
  server.on("/save", HTTP_POST, handleSave);
  server.on("/api/scan", HTTP_GET, handleScan);
  server.onNotFound(handlePortal); // キャプティブポータル用に全部ポータルへ
  server.begin();
}

void loop() {
  dns.processNextRequest();
  server.handleClient();

  const uint32_t now = millis();
  if (now - lastLog >= 5000) {
    lastLog = now;
    Serial.print("clients=");
    Serial.print(WiFi.softAPgetStationNum());
    Serial.print(" pendingSsid=");
    Serial.println(pendingSsid.length() ? pendingSsid : String("(none)"));
  }
}
