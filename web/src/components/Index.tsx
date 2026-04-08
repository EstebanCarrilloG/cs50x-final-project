'use client';
import { useEffect, useRef, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

const BROKER_URL  = 'ws://192.168.1.6:9001/mqtt';
const TOPIC_SUB   = 'esp/status';   // escucha mensajes del ESP8266
const TOPIC_PUB   = 'esp/led';      // envía comandos al ESP8266

export default function MqttDashboard() {
  const [messages,   setMessages]   = useState<string[]>([]);
  const [connected,  setConnected]  = useState(false);

  // ✅ useRef para persistir el cliente entre renders
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    const client = mqtt.connect(BROKER_URL);
    clientRef.current = client;

    client.on('connect', () => {
      console.log('MQTT conectado');
      setConnected(true);
      client.subscribe(TOPIC_SUB);
    });

    client.on('message', (topic, message) => {
      setMessages((prev) => [...prev, `[${topic}] ${message.toString()}`]);
    });

    // ✅ Manejo de errores
    client.on('error', (err) => {
      console.error('MQTT error:', err);
      setConnected(false);
    });

    client.on('disconnect', () => setConnected(false));

    return () => {
      client.end();
      clientRef.current = null;
    };
  }, []);

  // ✅ Reutiliza la conexión existente
  function handleSend(payload: string) {
    
    if (!clientRef.current?.connected) {
      console.warn('MQTT no está conectado');
      return;
    }
    clientRef.current.publish(TOPIC_PUB, payload);
  }

  return (
    <div>
      <h1>Live Data</h1>
      <p>Estado: {connected ? '🟢 Conectado' : '🔴 Desconectado'}</p>

      <div>
        <input type='checkbox' onChange={(e) => handleSend(e.target.checked ? 'ON' : 'OFF')} id='led-toggle' />
        <label htmlFor='led-toggle'>LED</label>
      </div>

      <ul>
        {messages.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  );
}