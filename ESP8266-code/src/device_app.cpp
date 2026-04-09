#include "device_app.h"
#include "config.h"

namespace
{
// Initial state used before the first MQTT exchange.
const char kDefaultStateJson[] =
    "{\n"
    "  \"switch1\": false,\n"
    "  \"switch2\": false,\n"
    "  \"switch3\": false,\n"
    "  \"temperature\": 0\n"
    "}";
const char kMqttClientId[] = "ESP8266Client_Unique_ID";
const unsigned long kWifiConnectTimeoutMs = 15000;
const unsigned long kMqttReconnectDelayMs = 5000;
}

DeviceApp *DeviceApp::instance_ = nullptr;

// Keep the current object reachable from the static callback adapter.
DeviceApp::DeviceApp()
    : mqttClient_(wifiClient_),
      outputBuffer_{0},
      lastTelemetrySentMs_(0),
      nextMqttRetryAtMs_(0)
{
  instance_ = this;
}

// Performs one-time hardware and connectivity initialization.
void DeviceApp::begin()
{
  Serial.begin(115200);

  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);

  switchController_.begin();
  setupWifi();

  mqttClient_.setServer(mqtt_server, 1883);
  mqttClient_.setCallback(mqttCallbackAdapter);

  const auto error = deserializeJson(stateDoc_, kDefaultStateJson);
  if (error)
  {
    Serial.print("Error initializing JSON state: ");
    Serial.println(error.c_str());
  }
}

// Runs the main cooperative loop for communication and telemetry.
void DeviceApp::loop()
{
  if (!mqttClient_.connected())
  {
    reconnectMqtt();
  }

  if (mqttClient_.connected())
  {
    mqttClient_.loop();
  }

  if (switchController_.handleLocalInputs(stateDoc_))
  {
    publishState();
  }

  const unsigned long now = millis();
  if (now - lastTelemetrySentMs_ >= kTelemetryIntervalMs)
  {
    stateDoc_["temperature"] = readTemperatureSensor();
    publishState();
    lastTelemetrySentMs_ = now;
  }
}

// Blocks until WiFi is connected or a controlled reboot is triggered.
void DeviceApp::setupWifi() const
{
  delay(10);
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  const unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED)
  {
    if (millis() - start > kWifiConnectTimeoutMs)
    {
      Serial.println("\nError: WiFi timeout. Restarting...");
      ESP.restart();
    }

    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected - IP: " + WiFi.localIP().toString());
}

// Maintains MQTT connectivity with non-blocking retry scheduling.
void DeviceApp::reconnectMqtt()
{
  if (mqttClient_.connected())
  {
    return;
  }

  const unsigned long now = millis();
  if (now < nextMqttRetryAtMs_)
  {
    return;
  }

  Serial.print("Connecting to MQTT...");

  if (mqttClient_.connect(kMqttClientId))
  {
    Serial.println("connected");
    mqttClient_.subscribe(topic_sub);
    nextMqttRetryAtMs_ = 0;
    publishState();
  }
  else
  {
    Serial.printf("Error rc=%d, retrying in 5s\n", mqttClient_.state());
    nextMqttRetryAtMs_ = now + kMqttReconnectDelayMs;
  }
}

// Sends the full state document to the configured publish topic.
void DeviceApp::publishState()
{
  if (!mqttClient_.connected())
  {
    return;
  }

  const size_t written = serializeJson(stateDoc_, outputBuffer_, sizeof(outputBuffer_));
  if (written == 0)
  {
    Serial.println("Error serializing JSON payload");
    return;
  }

  mqttClient_.publish(topic_pub, outputBuffer_);
}

// Parses incoming command payload and applies remote switch state.
void DeviceApp::handleMqttMessage(char *topic, byte *payload, unsigned int length)
{
  String message;
  message.reserve(length);

  for (unsigned int i = 0; i < length; ++i)
  {
    message += static_cast<char>(payload[i]);
  }

  const auto error = deserializeJson(stateDoc_, message);
  if (error)
  {
    Serial.print("Invalid JSON in topic ");
    Serial.print(topic);
    Serial.print(": ");
    Serial.println(error.c_str());
    return;
  }

  Serial.println("Message in [" + String(topic) + "]: " + message);
  switchController_.applyRemoteState(stateDoc_);
}

// Reads A0 and maps it to an expected environmental temperature range.
int DeviceApp::readTemperatureSensor() const
{
  int reading = analogRead(A0);
  reading = map(reading, 0, 1023, -10, 50);
  return reading;
}

// Delegates the C-style MQTT callback to the active DeviceApp instance.
void DeviceApp::mqttCallbackAdapter(char *topic, byte *payload, unsigned int length)
{
  if (instance_ != nullptr)
  {
    instance_->handleMqttMessage(topic, payload, length);
  }
}