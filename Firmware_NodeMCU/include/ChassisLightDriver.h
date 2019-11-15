#ifndef CHASSISLIGHTDRIVER_H
#define CHASSISLIGHTDRIVER_H

#include "Communicator.h"
#include "PersistentStorage.h"
#include <SmingCore/Network/Http/Websocket/WebsocketResource.h>
#include <SmingCore/Network/Http/Websocket/WebSocketConnection.h>
#include <SmingCore/SmingCore.h>

struct ColorStop
{
    uint8_t red;
    uint8_t green;
    uint8_t blue;
    uint16_t duration; //tenths of a second
};

struct ColorAnimation
{
    Vector<ColorStop> ColorStops;
};

class ChassisLightDriver
{
    public:
        ChassisLightDriver(Communicator & communicator, HttpServer & httpServer, PersistentStorage & storage) : communicator(communicator), httpServer(httpServer), storage(storage), actualStopIndex(0), elapsed(0), lastUpdateTimestamp(0) {}
        void Initialize();
        void DoWork();
    private:
        Communicator & communicator;
        HttpServer & httpServer;
        PersistentStorage & storage;

        ColorAnimation animation;
        uint16_t actualStopIndex;
        uint16_t elapsed;
        unsigned long lastUpdateTimestamp;

        void WsConnectedCallback(WebSocketConnection& socket);
        void WsMessageReceivedCallback(WebSocketConnection& socket, const String& message);
        void WsDisconnectedCallback(WebSocketConnection& socket);
        void WsBinaryReceivedCallback(WebSocketConnection& socket, uint8_t* data, size_t size);

        String GetConfigurationData();
        void SetConfigurationData(const String & data);

        void UpdateAnimation();
        void RestartAnimation();
        void SetLight(ColorStop previousStop, ColorStop nextStop, float p);

        ChassisLightDriver(ChassisLightDriver const&) = delete;
        ChassisLightDriver(ChassisLightDriver &&)     = delete;
        ChassisLightDriver& operator=(ChassisLightDriver const&) = delete;
        ChassisLightDriver& operator=(ChassisLightDriver &&)     = delete;
};

#endif