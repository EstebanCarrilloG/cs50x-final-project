#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastMsg = 0;

char input[256] = "{\n  \"switch1\": false,\n  \"switch2\": false,\n  \"switch3\":true,\n  \"temperature\": 0\n}";

JsonDocument doc;

struct SwitchConfig
{
  // Data members
  char name[20];
  int inputPin;
  int outputPin;
  bool state;
  bool previousState;
};

const int SWITCHS_NUMBER = 3;

SwitchConfig switches[SWITCHS_NUMBER] = {
    {"switch1", 14, D1, false, false},
    {"switch2", 12, D2, false, false},
    {"switch3", 13, D3, false, false}};

void setup_wifi()
{
  delay(10);
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED)
  {
    if (millis() - start > 15000)
    {
      Serial.println("\nError: WiFi timeout. Restarting...");
      ESP.restart();
    }
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected — IP: " + WiFi.localIP().toString());
}

void callback(char *topic, byte *payload, unsigned int length)
{

  String message;
  for (unsigned int i = 0; i < length; i++)
  {
    message += (char)payload[i];
  }

  deserializeJson(doc, message);

  Serial.println("Message in [" + String(topic) + "]: " + message);

  for (int i = 0; i < SWITCHS_NUMBER; i++)
  {
    (doc[switches[i].name]) ? digitalWrite(switches[i].outputPin, HIGH) : digitalWrite(switches[i].outputPin, LOW);
    delay(10);
  }
}

void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Connecting to MQTT...");
    if (client.connect("ESP8266Client_Unique_ID"))
    {
      Serial.println("connected");
      client.subscribe(topic_sub);
    }
    else
    {
      Serial.printf("Error rc=%d, retrying in 5s\n", client.state());
      delay(5000);
    }
  }
}

void setup()
{
  for (int i = 0; i < SWITCHS_NUMBER; i++)
  {
    pinMode(switches[i].inputPin, INPUT_PULLUP);
    pinMode(switches[i].outputPin, OUTPUT);
  }
  Serial.begin(115200);
  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  deserializeJson(doc, input);
  client.setCallback(callback);
}

bool prevState = 0;
bool switchState = 0;
char output[256];
int previousLecture = 0;

void loop()
{
  if (!client.connected())
    reconnect();

  client.loop();

  for (int i = 0; i < SWITCHS_NUMBER; i++)
  {
    bool button = digitalRead(switches[i].inputPin);

    if (button != switches[i].previousState)
    {
      // Handle button press
      if (button == 0)
      {
        switches[i].state = !switches[i].state;
        switches[i].state ? doc[switches[i].name] = true : doc[switches[i].name] = false;
        serializeJson(doc, output);
        client.publish(topic_pub, output);
      }
      delay(50);
    }

    switches[i].previousState = button;
  }

  unsigned long now = millis();

  if (now - lastMsg > 500)
  {
    int lecture = analogRead(A0);
    lecture = map(lecture, 0, 1023, -10, 50);
    lastMsg = now;
    doc["temperature"] = lecture;
    serializeJson(doc, output);
    client.publish(topic_pub, output);
  }

  // unsigned long now = millis();
  // if (now - lastMsg > 5000)
  // {
  //   lastMsg = now;
  //   client.publish(topic_pub, "{\n  \"switch1\": false,\n  \"switch2\": false,\n  \"switch3\":true\n}");
  //   Serial.println("Message published");
  // }
}