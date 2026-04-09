#include "switch_controller.h"

namespace
{
// Basic delay-based debounce to avoid repeated toggles on one press.
const unsigned long kDebounceDelayMs = 50;
}

// Maps logical switch names to input and output pins.
SwitchController::SwitchController()
  : switches_{{"switch1", 14, D1, false, false, 0},
        {"switch2", 12, D2, false, false, 0},
        {"switch3", 13, D3, false, false, 0}}
{
}

// Initializes GPIO mode for every switch and seeds previous button state.
void SwitchController::begin()
{
  const unsigned long now = millis();

  for (int i = 0; i < kSwitchCount; ++i)
  {
    pinMode(switches_[i].inputPin, INPUT_PULLUP);
    pinMode(switches_[i].outputPin, OUTPUT);
    digitalWrite(switches_[i].outputPin, LOW);
    switches_[i].previousState = digitalRead(switches_[i].inputPin);
    switches_[i].lastDebounceMs = now;
  }
}

// Updates outputs and internal state from an inbound JSON command.
void SwitchController::applyRemoteState(const JsonDocument &doc)
{
  for (int i = 0; i < kSwitchCount; ++i)
  {
    const bool state = doc[switches_[i].name] | false;
    switches_[i].state = state;
    digitalWrite(switches_[i].outputPin, state ? HIGH : LOW);
  }
}

// Reads local inputs and toggles state only on a debounced falling-edge press.
bool SwitchController::handleLocalInputs(JsonDocument &doc)
{
  bool changed = false;
  const unsigned long now = millis();

  for (int i = 0; i < kSwitchCount; ++i)
  {
    const bool button = digitalRead(switches_[i].inputPin);

    if (button != switches_[i].previousState)
    {
      if (now - switches_[i].lastDebounceMs >= kDebounceDelayMs)
      {
        switches_[i].lastDebounceMs = now;
        switches_[i].previousState = button;

        if (!button)
        {
          switches_[i].state = !switches_[i].state;
          doc[switches_[i].name] = switches_[i].state;
          changed = true;
        }
      }

      continue;
    }
  }

  return changed;
}