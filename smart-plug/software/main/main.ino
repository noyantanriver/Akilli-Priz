#include <ESP8266WiFi.h>
#include <MQTT.h>
#include <SimpleTimer.h>

const char *ssid = "";
const char *password = "";

SimpleTimer timer;
WiFiClient net;
MQTTClient client;

const int RelayPin = 2;

const float U = 230;

String relayStatus = "on";

unsigned long last_time;
unsigned long current_time;

void setup()
{
    Serial.begin(115200);

    pinMode(2, OUTPUT);
    digitalWrite(RelayPin, HIGH);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    client.begin("broker.shiftr.io", net);
    client.onMessage(messageReceived);

    connect();
    timer.setInterval(2 * 1000, getACS712);
}

void loop()
{
    client.loop();
    delay(10);

    if (!client.connected())
    {
        connect();
    }

    timer.run();
}

float getCurrentAC()
{
    uint32_t period = 1000000 / 50;
    uint32_t t_start = micros();

    uint32_t Isum = 0, measurements_count = 0;
    int32_t Inow;

    while (micros() - t_start < period)
    {
        int32_t val = analogRead(A0);
        int zero = 533;
        if (val > 533 && val < 539)
            zero = val;

        Inow = val - zero;
        Isum += Inow * Inow;
        measurements_count++;
    }

    float Irms = sqrt(Isum / measurements_count) / 1023.0 * 5.0 / 0.066;
    return Irms;
}

void getACS712()
{
    float I = getCurrentAC();
    float P = U * I;
    last_time = current_time;
    current_time = millis();
    float WH = P * ((current_time - last_time) / 3600000.0);
    client.publish("power", "{\"I\":" + String(I, 3) + ",\"P\": " + String(P, 3) + ",\"WH\":" + String(WH, 3) + "}");
}

void connect()
{
    Serial.println("WIFI Connection.");
    while (WiFi.status() != WL_CONNECTED)
    {
        Serial.print(".");
        delay(500);
    }
    Serial.println();
    Serial.println("WiFi Connected.");

    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    Serial.println("MQTT Connection.");
    while (!client.connect("plug-nodemcu", "274c2d82", "27f4eeef9cf0e792"))
    {
        Serial.print(".");
        delay(1000);
    }
    Serial.println();
    Serial.println("MQTT Connected.");

    client.subscribe("/relay");
}

void messageReceived(String &topic, String &payload)
{
    Serial.println("incoming: " + topic + " - " + payload);

    if (topic == "/relay")
    {
        if (payload == "on")
        {
            digitalWrite(RelayPin, HIGH);
            relayStatus = "on";
            client.publish("relay_status", "{\"status\":\"on\"}");
        }
        else if (payload == "off")
        {
            digitalWrite(RelayPin, LOW);
            relayStatus = "off";
            client.publish("relay_status", "{\"status\":\"off\"}");
        }
        else if (payload == "status")
        {
            client.publish("relay_status", "{\"status\":\"" + relayStatus + "\"}");
        }
    }
}