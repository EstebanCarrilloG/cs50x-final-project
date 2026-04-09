# Web Dashboard

Next.js frontend to monitor and control the ESP8266 device over MQTT.

## Requirements

- Node.js 20+
- pnpm 10+
- A running MQTT broker with WebSocket enabled

## Environment Variables

Create `.env.local` in this folder and define:

```env
NEXT_PUBLIC_MQTT_BROKER_URL=ws://192.168.1.6:9001/mqtt
NEXT_PUBLIC_MQTT_STATE_TOPIC=esp/status
NEXT_PUBLIC_MQTT_COMMAND_TOPIC=esp/status
```

You can copy from `.example.env`.

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```
