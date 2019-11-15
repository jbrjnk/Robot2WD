#ifndef BATTERYMANAGER_H
#define BATTERYMANAGER_H

#include "Communicator.h"
#include <SmingCore/SmingCore.h>

class BatteryManager
{
    public:
        BatteryManager(Communicator & communicator, HttpServer & httpServer) : communicator(communicator), httpServer(httpServer) {}
        void Initialize();
        void DoWork();
    private:
        Communicator & communicator;
        HttpServer & httpServer;

        void OnHttpRequest(HttpRequest &request, HttpResponse &response);

        BatteryManager(BatteryManager const&) = delete;
        BatteryManager(BatteryManager &&)     = delete;
        BatteryManager& operator=(BatteryManager const&) = delete;
        BatteryManager& operator=(BatteryManager &&)     = delete;
};

#endif