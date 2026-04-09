# Device Firmware (conection-test)

ESP8266 firmware project built with PlatformIO. The device manages three switch channels, publishes temperature telemetry, and synchronizes state through MQTT using JSON payloads.

## Main Features

- WiFi connection with boot-time timeout protection
- MQTT state sync (subscribe and publish)
- Three switch channels with local button input and remote command handling
- Non-blocking MQTT reconnect retries
- Non-blocking button debounce logic
- Periodic temperature telemetry from A0
- Modular structure with clear separation of responsibilities

## Tech Stack

- Board: ESP-07S (ESP8266)
- Framework: Arduino
- Build system: PlatformIO
- Libraries:
  - PubSubClient
  - ArduinoJson

## Project Structure

```text
conection-test/
  platformio.ini
  src/
    main.cpp
    device_app.h
    device_app.cpp
    switch_controller.h
    switch_controller.cpp
    config.h
    example.config.h
  include/
  lib/
  test/
```

## Architecture Overview

- main.cpp
  - Thin Arduino entry point that delegates setup and loop to DeviceApp.

- device_app.h / device_app.cpp
  - Application orchestration layer.
  - Handles WiFi startup, MQTT client setup, callback routing, periodic telemetry, and state publishing.
  - Uses non-blocking retry scheduling for MQTT reconnect.

- switch_controller.h / switch_controller.cpp
  - Switch input/output domain logic.
  - Manages GPIO modes, remote state application, and local button toggles.
  - Uses non-blocking debounce based on millis().

- config.h
  - Runtime configuration values (WiFi credentials, broker host, MQTT topics).

- example.config.h
  - Template file you can copy values from when preparing a new environment.

## MQTT Topics and Payload

Default topics:

- subscribe topic: esp/status
- publish topic: esp/status

Payload example:

```json
{
  "switch1": false,
  "switch2": false,
  "switch3": true,
  "temperature": 24
}
```

Notes:

- switch1, switch2, switch3 are boolean states.
- temperature is updated from analog input A0 and mapped to a range of -10 to 50.

## Pin Mapping

From the current switch controller configuration:

- switch1: input GPIO14, output D1
- switch2: input GPIO12, output D2
- switch3: input GPIO13, output D3

## Configuration

Edit src/config.h and set:

- ssid
- password
- mqtt_server
- topic_sub
- topic_pub

Important:

- Do not commit real credentials to public repositories.
- Keep example values in src/example.config.h as safe placeholders.

## Build, Upload, and Monitor

From the project root (conection-test):

```bash
platformio run
platformio run --target upload --upload-port COM3
platformio device monitor --baud 115200
```

If you use the PlatformIO extension in VS Code, you can run the same actions from the Build, Upload, and Monitor tasks.

## Current Runtime Behavior

- On boot:
  - Initializes serial and GPIOs
  - Connects to WiFi
  - Initializes MQTT and JSON state

- During loop:
  - Keeps MQTT connection alive
  - Retries MQTT reconnect every 5 seconds when disconnected
  - Handles local switch button presses
  - Applies inbound MQTT JSON commands
  - Publishes full state periodically (every 500 ms for telemetry)

## Suggested Next Improvements

- Move credentials to environment-specific secrets flow (for safer sharing)
- Add unit tests for switch debounce and JSON state transitions
- Add topic split (commands vs telemetry) if broker load grows
