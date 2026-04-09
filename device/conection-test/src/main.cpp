// Thin Arduino entry point that delegates lifecycle control to DeviceApp.
#include "device_app.h"

DeviceApp app;

// Arduino setup hook.
void setup()
{
  app.begin();
}

// Arduino main loop hook.
void loop()
{
  app.loop();
}