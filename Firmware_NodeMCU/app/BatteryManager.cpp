#include "BatteryManager.h"

void BatteryManager::Initialize()
{
    httpServer.addPath("/battery", HttpPathDelegate(&BatteryManager::OnHttpRequest, this));
}

void BatteryManager::OnHttpRequest(HttpRequest &request, HttpResponse &response)
{
	JsonObjectStream * jsonStream = new JsonObjectStream();
    
    jsonStream->getRoot()["vbat1"] = communicator.GetVBat1();
	jsonStream->getRoot()["vbat2"] = communicator.GetVBat2();
    jsonStream->getRoot()["ATMegaIteration"] = communicator.GetIteration();
    jsonStream->getRoot()["ESP12Millis"] = millis();
    response.sendJsonObject(jsonStream);
}

void BatteryManager::DoWork()
{}
