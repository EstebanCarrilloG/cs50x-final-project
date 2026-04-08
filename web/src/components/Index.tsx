'use client';
import { useEffect, useState } from 'react';
import mqtt from 'mqtt';

export default function MqttDashboard() {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Use wss for secure connections (required if your site is https)
    const client = mqtt.connect('ws://192.168.1.6:9001/mqtt');

    client.on('connect', () => {
      console.log('Connected');
      client.subscribe('my/test/topic');
    });

    client.on('message', (topic, message) => {
      setMessages((prev) => [...prev, message.toString()]);
    });

    return () => {
      if (client) client.end();
    };
  }, []);

  return (
    <div>
      <h1>Live Data</h1>
      {messages.map((msg, i) => <p key={i}>{msg}</p>)}
    </div>
  );
}