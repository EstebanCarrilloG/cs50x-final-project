# CS50x Final Project

IoT project with ESP8266 + MQTT broker + Next.js web dashboard.

## Overview

The goal of this project is to control and monitor an ESP8266 device from a web interface using MQTT.

Current flow:

- The ESP8266 publishes status messages to `esp/status` every 5 seconds.
- The web app subscribes to `esp/status` and displays messages in real time.
- The web app sends `ON/OFF` to `esp/led` to control the ESP8266 LED.

## Current Project Status

- Mosquitto broker configured with:
  - MQTT TCP on port `1883`
  - MQTT over WebSocket on port `9001`
- PlatformIO firmware for `esp07s` with WiFi/MQTT reconnection logic.
- Next.js frontend connected to the broker through WebSocket (`mqtt.js`).
- Monorepo organized by modules (`device`, `mosquitto`, `web`).

## Folder Structure

```text
cs50x-final-project/
|-- README.md
|-- device/
|   `-- conection-test/
|       |-- platformio.ini
|       `-- src/
|           |-- main.cpp
|           |-- config.h
|           `-- example.config.h
|-- mosquitto/
|   `-- mosquitto.conf
`-- web/
    |-- package.json
    |-- src/
    |   |-- app/
    |   |   |-- layout.tsx
    |   |   `-- page.tsx
    |   `-- components/
    |       `-- Index.tsx
    `-- public/
```

## Tech Stack

- Web:
  - Next.js 16
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - mqtt.js
- Device:
  - ESP8266 (board `esp07s`)
  - Arduino framework
  - PubSubClient
  - PlatformIO
- Broker:
  - Eclipse Mosquitto

## Requirements

- Node.js 20+ (recommended)
- pnpm
- PlatformIO CLI or VS Code extension
- Mosquitto installed locally
- ESP8266 board

## Quick Setup

### 1) Start the MQTT broker

From the project root:

```bash
mosquitto -c ".\\mosquitto\\mosquitto.conf" -v
```

### 2) Configure and flash the ESP8266 firmware

1. Go to `device/conection-test/src`.
2. Create/edit `config.h` with your WiFi credentials and broker IP.
   - You can use `example.config.h` as a template.
3. From `device/conection-test`, build and upload:

```bash
pio run -t upload
```

4. Open the serial monitor:

```bash
pio device monitor -b 115200
```

### 3) Start the web app

From `web`:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Current MQTT Configuration

- Frontend broker URL: `ws://<BROKER_IP>:9001/mqtt`
- Topic subscribe (web): `esp/status`
- Topic publish (web): `esp/led`
- Topic subscribe (ESP8266): `esp/led`
- Topic publish (ESP8266): `esp/status`

Important: the broker IP must match in:

- `web/src/components/Index.tsx` (`BROKER_URL`)
- `device/conection-test/src/config.h` (`mqtt_server`)

## Security Notes

- `mosquitto.conf` is in development mode (`allow_anonymous true`).
- Do not use this configuration in production without authentication/TLS.
- `device/conection-test/.gitignore` excludes `src/config.h` to avoid committing secrets.

## Useful Commands

In `web`:

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```
