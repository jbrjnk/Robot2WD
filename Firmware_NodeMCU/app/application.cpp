#include <user_config.h>
#include <SmingCore/SmingCore.h>
#include "../include/Communicator.h"
#include "../include/PersistentStorage.h"
#include "../include/ChassisLightDriver.h"
#include "../include/BatteryManager.h"
#include "../include/MotorDriver.h"
#include <SmingCore/Network/Http/Websocket/WebsocketResource.h>

using namespace std;

#define LED_PIN 2 // GPIO2

Timer blinkTimer;
Timer doWorkTimer;
HttpServer server;
uint8_t state = true;

HardwareSerial uart1(1);

Communicator communicator;


AccessPointClass ap;
PersistentStorage storage;
ChassisLightDriver chassisLight(communicator, server, storage);
BatteryManager batteryManager(communicator, server);
MotorDriver motorDriver(communicator, server, storage);

float p = 0;
bool up = true;

void DoWork()
{
	communicator.DoWork();
	motorDriver.DoWork();
	chassisLight.DoWork();
	batteryManager.DoWork();
}

uint16_t i = 300;

void Blink()
{
	if((state % 10) == 0)
	{
		uart1.printf("VBat1: %f, VBat2: %f, DistanceA: %d, DistanceB: %d\r\n", communicator.GetVBat1(), communicator.GetVBat2(), communicator.GetDistanceA(), communicator.GetDistanceB());
	}
	digitalWrite(LED_PIN, (state % 10) < 5);
	state++;
}

long getParam(HttpRequest &request, const char *name)
{
	String paramValueStr = request.getQueryParameter(name);
	return paramValueStr.toInt();
}

void onIndex(HttpRequest &request, HttpResponse &response)
{
	TemplateFileStream *tmpl = new TemplateFileStream("index.html");
	response.sendTemplate(tmpl);
}

void onScripts(HttpRequest &request, HttpResponse &response)
{
	TemplateFileStream *tmpl = new TemplateFileStream("scripts.js");
	response.sendTemplate(tmpl);
}

void init()
{
	spiffs_mount_manual(0x100000, 2 * 0x100000);

    ap.config("Robot2WD", "pwmpwmpwm", AUTH_OPEN, FALSE, 7, 200);
    ap.enable(true);

	communicator.Initialize();
	
	uart1.begin(115200);
	uart1.systemDebugOutput(true);

	server.listen(80);
	server.addPath("/", onIndex);
	server.addPath("/scripts.js", onScripts);
	
	motorDriver.Initialize();
	chassisLight.Initialize();
	batteryManager.Initialize();

	blinkTimer.initializeMs(100, Blink).start();
	doWorkTimer.initializeMs(10, DoWork).start();

}
