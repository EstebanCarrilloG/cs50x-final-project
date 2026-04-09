#ifndef SWITCH_CONTROLLER_H
#define SWITCH_CONTROLLER_H

#include <Arduino.h>
#include <ArduinoJson.h>

// Runtime metadata for each physical switch channel.
struct SwitchConfig
{
  const char *name;
  uint8_t inputPin;
  uint8_t outputPin;
  bool state;
  bool previousState;
  unsigned long lastDebounceMs;
};

// Encapsulates GPIO handling and state updates for all switches.
class SwitchController
{
public:
  static const int kSwitchCount = 3;

  // Creates the default switch map and internal states.
  SwitchController();

  // Configures switch GPIO pins.
  void begin();

  // Applies switch values received from remote JSON payloads.
  void applyRemoteState(const JsonDocument &doc);

  // Polls local buttons and writes changed states into the JSON document.
  bool handleLocalInputs(JsonDocument &doc);

private:
  SwitchConfig switches_[kSwitchCount];
};

#endif