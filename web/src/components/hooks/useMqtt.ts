import { Payload } from "@/types/payload";
import mqtt, { MqttClient } from "mqtt";
import { useEffect, useState, useRef } from "react";

const BROKER_URL = "ws://192.168.1.6:9001/mqtt";

function useMqtt(TOPIC_SUB: string): { connected: boolean; data: Payload; clientRef: React.RefObject<MqttClient | null> } {
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<Payload>({switch1: false, switch2: false, switch3: false, temperature: 0});
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL);
    clientRef.current = client;

    client.on("connect", () => {
      console.log("MQTT conectado");
      setConnected(true);
      client.subscribe(TOPIC_SUB);
    });

    client.on("message", (topic, message) => {
      const json = JSON.parse(message.toString());
      console.log(json)
      setData(json);
    });

    // ✅ Manejo de errores
    client.on("error", (err) => {
      console.error("MQTT error:", err);
      setConnected(false);
    });

    client.on("disconnect", () => setConnected(false));

    return () => {
      client.end();
      clientRef.current = null;
    };
  }, []);

  return { connected, data, clientRef };
}

export default useMqtt;
