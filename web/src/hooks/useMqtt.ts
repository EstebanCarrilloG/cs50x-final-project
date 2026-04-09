import {
  MAX_TEMPERATURE_POINTS,
  MQTT_BROKER_URL,
  MQTT_COMMAND_TOPIC,
  MQTT_RECONNECT_PERIOD_MS,
  MQTT_STATE_TOPIC,
} from "@/lib/mqtt";
import {
  DEFAULT_PAYLOAD,
  type Payload,
  parsePayloadMessage,
} from "@/types/payload";
import mqtt, { type MqttClient } from "mqtt";
import { useCallback, useEffect, useRef, useState } from "react";

export type TemperaturePoint = {
  timestamp: number;
  label: string;
  value: number;
};

type UseMqttOptions = {
  brokerUrl?: string;
  topicSub?: string;
  topicPub?: string;
};

type UseMqttResult = {
  connected: boolean;
  data: Payload;
  temperatureHistory: TemperaturePoint[];
  publish: (nextPayload: Payload) => boolean;
};

function useMqtt(options: UseMqttOptions = {}): UseMqttResult {
  const {
    brokerUrl = MQTT_BROKER_URL,
    topicSub = MQTT_STATE_TOPIC,
    topicPub = MQTT_COMMAND_TOPIC,
  } = options;

  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<Payload>(DEFAULT_PAYLOAD);
  const [temperatureHistory, setTemperatureHistory] = useState<
    TemperaturePoint[]
  >([]);
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const client = mqtt.connect(brokerUrl, {
      reconnectPeriod: MQTT_RECONNECT_PERIOD_MS,
      connectTimeout: 10_000,
      clean: true,
    });

    const handleConnect = () => {
      setConnected(true);
      client.subscribe(topicSub, (error) => {
        if (error) {
          console.error("MQTT subscribe error:", error);
        }
      });
    };

    const handleMessage = (topic: string, message: Buffer) => {
      if (topic !== topicSub) {
        return;
      }

      const parsedPayload = parsePayloadMessage(message.toString());
      if (!parsedPayload) {
        console.warn("MQTT payload ignored: invalid structure");
        return;
      }

      setData(parsedPayload);

      if (Number.isFinite(parsedPayload.temperature)) {
        const now = Date.now();
        const nextPoint: TemperaturePoint = {
          timestamp: now,
          label: new Date(now).toLocaleTimeString("en-GB", { hour12: false }),
          value: Number(parsedPayload.temperature.toFixed(2)),
        };

        setTemperatureHistory((prev) => {
          const next = [...prev, nextPoint];
          if (next.length <= MAX_TEMPERATURE_POINTS) {
            return next;
          }

          return next.slice(next.length - MAX_TEMPERATURE_POINTS);
        });
      }
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    const handleError = (error: Error) => {
      console.error("MQTT error:", error);
      setConnected(false);
    };

    clientRef.current = client;
    client.on("connect", handleConnect);
    client.on("message", handleMessage);
    client.on("close", handleDisconnect);
    client.on("offline", handleDisconnect);
    client.on("error", handleError);

    return () => {
      client.removeListener("connect", handleConnect);
      client.removeListener("message", handleMessage);
      client.removeListener("close", handleDisconnect);
      client.removeListener("offline", handleDisconnect);
      client.removeListener("error", handleError);
      client.end(true);
      clientRef.current = null;
    };
  }, [brokerUrl, topicSub]);

  const publish = useCallback(
    (nextPayload: Payload) => {
      const client = clientRef.current;
      if (!client?.connected) {
        return false;
      }

      client.publish(topicPub, JSON.stringify(nextPayload));
      return true;
    },
    [topicPub],
  );

  return { connected, data, temperatureHistory, publish };
}

export default useMqtt;
