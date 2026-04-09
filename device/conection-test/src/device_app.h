#ifndef DEVICE_APP_H
#define DEVICE_APP_H

#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

#include "switch_controller.h"

// Coordinates connectivity, state synchronization and telemetry publishing.
class DeviceApp
{
public:
  // Builds the app and binds infrastructure dependencies.
  DeviceApp();

  // Initializes serial, GPIOs, WiFi, MQTT and default JSON state.
  void begin();

  // Processes MQTT traffic, local inputs and periodic telemetry.
  void loop();

private:
  // Publish sensor payload every 500 ms.
  static const unsigned long kTelemetryIntervalMs = 500;

  // Connects to WiFi or reboots if the timeout is reached.
  void setupWifi() const;

  // Reconnects to the MQTT broker and re-subscribes to topics.
  void reconnectMqtt();

  // Serializes and publishes the current state JSON payload.
  void publishState();

  // Handles inbound MQTT JSON commands.
  void handleMqttMessage(char *topic, byte *payload, unsigned int length);

  // Reads and maps the analog sensor to temperature range.
  int readTemperatureSensor() const;

  // Static adapter required by PubSubClient callback signature.
  static void mqttCallbackAdapter(char *topic, byte *payload, unsigned int length);

  // Singleton-like pointer used by the static MQTT callback adapter.
  static DeviceApp *instance_;

  WiFiClient wifiClient_;
  PubSubClient mqttClient_;
  // Shared device state serialized to/from MQTT payloads.
  JsonDocument stateDoc_;
  char outputBuffer_[256];
  unsigned long lastTelemetrySentMs_;
  // Next timestamp when an MQTT reconnect attempt is allowed.
  unsigned long nextMqttRetryAtMs_;
  SwitchController switchController_;
};

#endif