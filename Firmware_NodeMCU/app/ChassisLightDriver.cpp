#include "ChassisLightDriver.h"


void ChassisLightDriver::WsConnectedCallback(WebSocketConnection& socket)
{
    debugf("ChassisLightDriver: Client connected \r\n");
    socket.sendString(this->GetConfigurationData());
}

void ChassisLightDriver::WsMessageReceivedCallback(WebSocketConnection& socket, const String& message)
{
    debugf("ChassisLightDriver: Message received %s\r\n", message.c_str());
    this->SetConfigurationData(message);
    String data = this->GetConfigurationData();    
    socket.broadcast(data.c_str(), data.length());
}

void ChassisLightDriver::WsDisconnectedCallback(WebSocketConnection& socket)
{
    debugf("ChassisLightDriver: Disconnected\r\n");
}

void ChassisLightDriver::WsBinaryReceivedCallback(WebSocketConnection& socket, uint8_t* data, size_t size)
{
    debugf("ChassisLightDriver: Binary data received\r\n");
}

String ChassisLightDriver::GetConfigurationData()
{
    DynamicJsonBuffer jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    
    JsonArray& stops = root.createNestedArray("stops");
    for(size_t i = 0; i < animation.ColorStops.count(); i++)
    {
        JsonObject & obj = jsonBuffer.createObject();
        ColorStop stop = animation.ColorStops[i];
        obj["r"] = stop.red;
        obj["g"] = stop.green;
        obj["b"] = stop.blue;
        obj["t"] = stop.duration;
        stops.add(obj);
    }

    String retVal;	
	root.printTo(retVal);
    return retVal;
}

void ChassisLightDriver::SetConfigurationData(const String & data)
{
    bool persist = false;
    {
        DynamicJsonBuffer jsonBuffer;
        const JsonObject & root = jsonBuffer.parseObject(data);
        const JsonArray & array = root["stops"].as<JsonArray>();
        Vector<ColorStop> stops;

        for(JsonVariant stopObj : array)
        {
            ColorStop stop;
            stop.red = stopObj["r"].as<uint8_t>();
            stop.green = stopObj["g"].as<uint8_t>();
            stop.blue = stopObj["b"].as<uint8_t>();
            stop.duration = stopObj["t"].as<uint16_t>();
            stops.add(stop);
        }

        this->animation.ColorStops = stops;
        RestartAnimation();

        persist = root.containsKey("persist") && root["persist"].as<bool>();
    } //release jsonBuffer

    if(persist)
    {
        String configData = this->GetConfigurationData();
        storage.SetValue("chassisLight.json", configData);
    }
}

void ChassisLightDriver::RestartAnimation()
{
    actualStopIndex = 0;
    elapsed = 0;
}

void ChassisLightDriver::Initialize()
{
    WebsocketResource* wsResource = new WebsocketResource();
	wsResource->setConnectionHandler(WebSocketDelegate(&ChassisLightDriver::WsConnectedCallback, this));
	wsResource->setMessageHandler(WebSocketMessageDelegate(&ChassisLightDriver::WsMessageReceivedCallback, this));
	wsResource->setBinaryHandler(WebSocketBinaryDelegate(&ChassisLightDriver::WsBinaryReceivedCallback, this));
	wsResource->setDisconnectionHandler(WebSocketDelegate(&ChassisLightDriver::WsDisconnectedCallback, this));

    httpServer.addPath("/chassisLight", wsResource);

    String storedConfiguration;
    if(storage.GetValue("chassisLight.json", storedConfiguration))
    {
        SetConfigurationData(storedConfiguration);
    }
}

void ChassisLightDriver::SetLight(ColorStop previousStop, ColorStop nextStop, float p)
{
    float deltaR = (static_cast<int16_t>(nextStop.red) - previousStop.red) * p + 0.5f;
    float deltaG = (static_cast<int16_t>(nextStop.green) - previousStop.green) * p + 0.5f;
    float deltaB = (static_cast<int16_t>(nextStop.blue) - previousStop.blue) * p + 0.5f;

    uint8_t r = previousStop.red + static_cast<uint8_t>(deltaR);
    uint8_t g = previousStop.green + static_cast<uint8_t>(deltaG);
    uint8_t b = previousStop.blue + static_cast<uint8_t>(deltaB);
    communicator.SetLight(r, g, b);
}

void ChassisLightDriver::UpdateAnimation()
{
    if(animation.ColorStops.count() == 0)
    {
        communicator.SetLight(32, 32, 32);
    }
    else
    {
        uint16_t nextStopIndex = (actualStopIndex + 1) % animation.ColorStops.count();
        auto previousStop = animation.ColorStops[actualStopIndex];
        auto nextStop = animation.ColorStops[nextStopIndex];

        float p = elapsed / static_cast<float>(nextStop.duration);
        if(p >= 0 && p < 1)
        {
            SetLight(previousStop, nextStop, p);
            elapsed++;
            if(elapsed >= nextStop.duration)
            {
                elapsed = 0;
                actualStopIndex = nextStopIndex;
            }
        }
        else
        {
            elapsed = 0;
            actualStopIndex = nextStopIndex;
        }
    }
}

void ChassisLightDriver::DoWork()
{
    unsigned long currentTime = millis();
    if (currentTime - 20 > this->lastUpdateTimestamp)
    {
        UpdateAnimation();
        this->lastUpdateTimestamp = currentTime;
    }
}
