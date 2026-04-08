#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "config.h"

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

void setup_wifi()
{
  delay(10);
  Serial.print("Conectando a WiFi");
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED)
  {
    if (millis() - start > 15000)
    {
      Serial.println("\nError: WiFi timeout. Reiniciando...");
      ESP.restart();
    }
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado — IP: " + WiFi.localIP().toString());
}

void callback(char *topic, byte *payload, unsigned int length)
{
  String message;
  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  Serial.println("Mensaje en [" + String(topic) + "]: " + message);

  if (message == "ON")
  {
    digitalWrite(2, LOW); // Turn on led (Inverted logic)
  }
  else if (message == "OFF")
  {
    digitalWrite(2, HIGH); // Turn off led (Inverted logic)
  }
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Conectando MQTT...");
    if (client.connect("ESP8266Client_Unique_ID"))
    {
      Serial.println("conectado");
      client.subscribe(topic_sub);
    }
    else
    {
      Serial.printf("Error rc=%d, reintentando en 5s\n", client.state());
      delay(5000);
    }
  }
}

void setup()
{
  Serial.begin(115200);
  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop()
{
  if (!client.connected())
    reconnect();
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 5000)
  {
    lastMsg = now;
    client.publish(topic_pub, "Hello from ESP8266");
    Serial.println("Mensaje publicado");
  }
}