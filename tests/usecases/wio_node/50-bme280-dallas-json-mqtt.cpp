// @board wio_node
// @lib adafruit/Adafruit BME280 Library@2.3.0
// @lib adafruit/Adafruit Unified Sensor@1.1.15
// @lib adafruit/Adafruit BusIO@1.17.4
// @lib paulstoffregen/OneWire@2.3.8
// @lib milesburton/DallasTemperature@4.0.6
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc I2C の BME280 と 1-Wire の DS18B20 を同時に読み、差分付き JSON を MQTT へ送る

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

static const char* WIFI_SSID = "digicode-test";
static const char* WIFI_PASSWORD = "not-a-real-password";
static const char* MQTT_HOST = "192.168.10.10";
static const uint16_t MQTT_PORT = 1883;
static const char* TOPIC_TELEMETRY = "digicode/wio-node/climate";

static const uint8_t GROVE_POWER = 15;
static const uint8_t ONE_WIRE_PIN = 12; // Wio Node D6 = GPIO12
static const float SEALEVEL_HPA = 1013.25f;
static const uint32_t PUBLISH_INTERVAL_MS = 10000;

Adafruit_BME280 bme;
OneWire oneWire(ONE_WIRE_PIN);
DallasTemperature probes(&oneWire);
WiFiClient net;
PubSubClient mqtt(net);

static bool bmeReady = false;
static uint8_t probeCount = 0;
static uint32_t lastPublish = 0;
static uint32_t sequence = 0;

static bool ensureLink() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    const uint32_t deadline = millis() + 8000;
    while (WiFi.status() != WL_CONNECTED && millis() < deadline) delay(250);
    if (WiFi.status() != WL_CONNECTED) return false;
  }
  if (!mqtt.connected()) {
    String id = "wio-climate-";
    id += String(ESP.getChipId(), HEX);
    if (!mqtt.connect(id.c_str())) return false;
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  delay(200);
  pinMode(GROVE_POWER, OUTPUT);
  digitalWrite(GROVE_POWER, HIGH);
  delay(400);

  Wire.begin(4, 5); // Wio Node PORT1: SDA=GPIO4 SCL=GPIO5
  bmeReady = bme.begin(0x76, &Wire);
  if (!bmeReady) bmeReady = bme.begin(0x77, &Wire);
  if (bmeReady) {
    bme.setSampling(Adafruit_BME280::MODE_FORCED,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::FILTER_OFF);
  } else {
    Serial.println("bme280 missing");
  }

  probes.begin();
  probes.setResolution(11);
  probes.setWaitForConversion(true);
  probeCount = probes.getDeviceCount();
  Serial.printf("probes=%u\n", probeCount);

  WiFi.persistent(false);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(768);
}

void loop() {
  if (!ensureLink()) {
    delay(2000);
    return;
  }
  mqtt.loop();

  const uint32_t now = millis();
  if (now - lastPublish < PUBLISH_INTERVAL_MS) return;
  lastPublish = now;

  JsonDocument doc;
  doc["seq"] = sequence++;
  doc["uptimeMs"] = now;
  doc["heap"] = ESP.getFreeHeap();

  float ambient = NAN;
  if (bmeReady) {
    bme.takeForcedMeasurement();
    ambient = bme.readTemperature();
    JsonObject air = doc["air"].to<JsonObject>();
    air["temperatureC"] = ambient;
    air["humidityPct"] = bme.readHumidity();
    air["pressureHpa"] = bme.readPressure() / 100.0f;
    air["altitudeM"] = bme.readAltitude(SEALEVEL_HPA);
  }

  probes.requestTemperatures();
  JsonArray water = doc["probes"].to<JsonArray>();
  float firstProbe = NAN;
  for (uint8_t i = 0; i < probeCount && i < 4; i++) {
    const float c = probes.getTempCByIndex(i);
    if (c == DEVICE_DISCONNECTED_C) continue;
    water.add(c);
    if (isnan(firstProbe)) firstProbe = c;
  }
  if (!isnan(ambient) && !isnan(firstProbe)) doc["deltaC"] = firstProbe - ambient;

  char payload[512];
  const size_t n = serializeJson(doc, payload, sizeof(payload));
  mqtt.publish(TOPIC_TELEMETRY, (const uint8_t*)payload, n, false);
  Serial.println(payload);
  yield();
}
