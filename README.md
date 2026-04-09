# CS50x Final Project

IoT system with ESP8266 firmware, Eclipse Mosquitto broker, and a Next.js dashboard for real-time monitoring and control.

## Consolidated Update (2 Pull Requests)

This README reflects the combined result of two major updates:

1. PR #1 - Firmware modular refactor
- Split firmware logic into focused modules.
- Added non-blocking MQTT reconnect handling.
- Added non-blocking switch debounce handling.
- Standardized JSON payload structure for state + temperature telemetry.

2. PR #2 - Web dashboard refactor
- Reorganized MQTT and payload modules in the web app.
- Added reusable dashboard and chart components.
- Added environment-driven MQTT configuration.
- Improved UI layout, metadata, and development scripts.

## System Overview

- Device (ESP8266) connects to WiFi and MQTT broker.
- Firmware publishes and subscribes JSON state through MQTT topics.
- Web dashboard connects through MQTT over WebSocket and updates in real time.
- Mosquitto provides both TCP MQTT and WebSocket endpoints.

## Repository Structure

```text
cs50x-final-project/
  README.md
  device/
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
  mosquitto/
    mosquitto.conf
  web/
    .example.env
    package.json
    src/
      app/
        layout.tsx
        page.tsx
      components/
        Dashboard.tsx
        TemperatureChart.tsx
      hooks/
        useMqtt.ts
      lib/
        mqtt.ts
      types/
        payload.ts
```

## MQTT Contract

Default topics:

- Device subscribe topic: esp/status
- Device publish topic: esp/status
- Web subscribe topic: esp/status
- Web publish topic: esp/status

Payload shape:

```json
{
  "switch1": false,
  "switch2": false,
  "switch3": true,
  "temperature": 24.3
}
```

Note: command and state topics are currently shared by default. They can be split later by changing firmware config and web env variables.

## Tech Stack

- Device: ESP8266 (ESP-07S), Arduino framework, PlatformIO, PubSubClient, ArduinoJson
- Web: Next.js 16, React 19, TypeScript, Tailwind CSS 4, mqtt, Recharts
- Broker: Eclipse Mosquitto

## Requirements

- Node.js 20+
- pnpm 10+
- PlatformIO CLI or VS Code PlatformIO extension
- Mosquitto installed locally
- ESP8266 board

## Quick Start

1. Start MQTT broker from project root:

```bash
mosquitto -c ".\\mosquitto\\mosquitto.conf" -v
```

2. Configure and flash firmware:

- Open `device/conection-test/src/config.h`
- Set WiFi credentials, broker host, and topics
- Use `device/conection-test/src/example.config.h` as template

Then run:

```bash
cd device/conection-test
platformio run --target upload
platformio device monitor --baud 115200
```

3. Configure web environment:

- Copy `web/.example.env` to `web/.env.local`
- Adjust values if your broker host or topics differ

4. Run web dashboard:

```bash
cd web
pnpm install
pnpm dev
```

Open http://localhost:3000

## Development Commands

Web:

```bash
cd web
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

Firmware:

```bash
cd device/conection-test
platformio run
platformio run --target upload
platformio device monitor --baud 115200
```

## Security Notes

- Current Mosquitto config uses allow_anonymous true for local development.
- Do not use anonymous mode in production.
- Use broker authentication and TLS in production environments.
- Avoid committing real secrets in firmware config files.
