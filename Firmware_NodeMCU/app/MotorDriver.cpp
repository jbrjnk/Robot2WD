#include "MotorDriver.h"

MotorDriver::MotorDriver(Communicator & communicator, HttpServer & httpServer, PersistentStorage & storage) : communicator(communicator), httpServer(httpServer), connection(nullptr), lastIterationTimestamp(0), motorADuty(0), motorBDuty(0), calibration(communicator, storage)
{}

void MotorDriver::Initialize()
{
    WebsocketResource* wsResource = new WebsocketResource();
	wsResource->setConnectionHandler(WebSocketDelegate(&MotorDriver::WsConnectedCallback, this));
	wsResource->setMessageHandler(WebSocketMessageDelegate(&MotorDriver::WsMessageReceivedCallback, this));
	wsResource->setBinaryHandler(WebSocketBinaryDelegate(&MotorDriver::WsBinaryReceivedCallback, this));
	wsResource->setDisconnectionHandler(WebSocketDelegate(&MotorDriver::WsDisconnectedCallback, this));

    httpServer.addPath("/motor", wsResource);

    calibration.Load();
}

void MotorDriver::DoWork()
{
    unsigned long currentTime = millis();
    if (currentTime - 500 > this->lastIterationTimestamp)
    {
        this->lastIterationTimestamp = currentTime;
        SendMessage();
    }

    if (watchdog + 500 < currentTime)
    {
        motorADuty = 0;
        motorBDuty = 0;
    }

    if(calibration.IsRunning())
    {
        calibration.DoWork();
    }
    else
    {
        communicator.SetMotorA(calibration.TransformDutyA(motorADuty));
        communicator.SetMotorB(calibration.TransformDutyB(motorBDuty));
    }
}

void MotorDriver::SendMessage()
{
    if(this->connection)
    {
        DynamicJsonBuffer jsonBuffer;
        JsonObject& root = jsonBuffer.createObject();

        root["distanceA"] = communicator.GetDistanceA();
        root["distanceB"] = communicator.GetDistanceB();
        root["calibrationInProgress"] = calibration.IsRunning();
        root["minDutyA"] = calibration.GetMinDutyA();
        root["minDutyB"] = calibration.GetMinDutyB();

        String jsonStr;	
	    root.printTo(jsonStr);
        this->connection->sendString(jsonStr);
    }
}

void MotorDriver::ProcessMessage(const String & message)
{
    debugf("Received msg %s", message.c_str());
    DynamicJsonBuffer jsonBuffer;
    const JsonObject & root = jsonBuffer.parseObject(message);

    motorADuty = root["motorA"].as<float>();
    motorBDuty = root["motorB"].as<float>();
    watchdog = millis();

    if (root.containsKey("startCalibration") && root["startCalibration"].as<bool>())
    {
        calibration.Start();
    }
    else if (root.containsKey("clearCalibration") && root["clearCalibration"].as<bool>())
    {
        calibration.Clear();
    }
}

void MotorDriver::WsConnectedCallback(WebSocketConnection& socket)
{
    if(!this->connection)
    {
        this->connection = &socket;
        socket.setUserData(this);
    }
    else
    {
        debugf("MotorDriver: Client already connected! Refuse connection \r\n");
        socket.close();
    }
}

void MotorDriver::WsMessageReceivedCallback(WebSocketConnection& socket, const String& message)
{
    if(socket.getUserData() == this)
    {
        ProcessMessage(message);
    }
}

void MotorDriver::WsDisconnectedCallback(WebSocketConnection& socket)
{
    if(socket.getUserData() == this)
    {
        this->connection = nullptr;
        debugf("MotorDriver: Client disconnected \r\n");
    }
}

void MotorDriver::WsBinaryReceivedCallback(WebSocketConnection& socket, uint8_t* data, size_t size)
{
    debugf("MotorDriver: Binary data received\r\n");
}

void Calibration::Load()
{
    String data;
    if(storage.GetValue("calibration.json", data))
    {
        debugf("Loading ok \r\n");
        DynamicJsonBuffer jsonBuffer;
        const JsonObject & root = jsonBuffer.parseObject(data);

        minDutyA = root["minDutyA"].as<float>();
        minDutyB = root["minDutyB"].as<float>();
        maxDutyA = root["maxDutyA"].as<float>();
        maxDutyB = root["maxDutyB"].as<float>();
    }
}

void Calibration::Clear()
{
    this->minDutyA = 0;
    this->minDutyB = 0;
    this->maxDutyA = 1;
    this->maxDutyB = 1;
    storage.Delete("calibration.json");
}

void Calibration::Start()
{
    state = CalibrationState::Init;
    waitUntil = 0;
}

void Calibration::DoWork()
{
    uint32_t now = millis();
    if(waitUntil !=0 && waitUntil > now)
    {
        return;
    }

    if (state == CalibrationState::Init)
    {
        iteration = 0;
        duty = C_InitDuty - C_DutyStep;
        state = CalibrationState::MotorA;
        lastDistance = UINT32_MAX;
        waitUntil = now + 4000;
        debugf("Calibration init, begin with Motor A\r\n");
    }
    else if (state == CalibrationState::MotorA)
    {
        uint32_t d = communicator.GetDistanceA();
        if(d > lastDistance + 3 && lastDistance != UINT32_MAX)
        {
            debugf("Calibration, motor A, %d", iteration, d, lastDistance);
            minDutyAResults[iteration] = duty;
            iteration++;
            duty = C_InitDuty -C_DutyStep;
            lastDistance = UINT32_MAX;
            waitUntil = now + 2000;
            communicator.SetMotorA(0);
        }
        else
        {
            duty += C_DutyStep;
            communicator.SetMotorA(duty);
            waitUntil = now + 800;
            lastDistance = d;
        }

        if(iteration >= C_IterationsCount)
        {
            iteration = 0;
            state = CalibrationState::MotorB;
            debugf("Calibration Motor A completed, continue with motor B\r\n");
        }
    }
    else if (state == CalibrationState::MotorB)
    {
        uint32_t d = communicator.GetDistanceB();
        if(d > lastDistance + 3 && lastDistance != UINT32_MAX)
        {
            debugf("Calibration, motor B, %d\r\n", iteration);
            minDutyBResults[iteration] = duty;
            iteration++;
            duty = C_InitDuty - C_DutyStep;
            lastDistance = UINT32_MAX;
            waitUntil = now + 2000;
            communicator.SetMotorB(0);
        }
        else
        {
            duty += C_DutyStep;
            communicator.SetMotorB(duty);
            waitUntil = now + 800;
            lastDistance = d;
        }

        if(iteration >= C_IterationsCount)
        {
            state = CalibrationState::Idle;
            SetNewCalibration();
        }
    }
}

void Calibration::SetNewCalibration()
{
    float avgA = 0;
    float avgB = 0;

    for(uint8_t i = 0; i < C_IterationsCount; i++)
    {
        debugf("Calibration result. A: %f, B: %f \r\n", minDutyAResults[i], minDutyBResults[i]);
        avgA += minDutyAResults[i];
        avgB += minDutyBResults[i];
    }

    avgA /= C_IterationsCount;
    avgB /= C_IterationsCount;

    debugf("Min duty A: %f\r\n", avgA);
    debugf("Min duty B: %f\r\n", avgB);
    
    minDutyA = avgA;
    minDutyB = avgB;

    DynamicJsonBuffer jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();

    root["minDutyA"] = minDutyA;
    root["minDutyB"] = minDutyB;
    root["maxDutyA"] = maxDutyA;
    root["maxDutyB"] = maxDutyB;

    String jsonStr;	
	root.printTo(jsonStr);
    storage.SetValue("calibration.json", jsonStr);
}

float Calibration::Sign(float value)
{
    if (value == 0){return 0;}
    else if (value > 0){return 1;}
    else {return -1;}
}

float Calibration::TransformDutyA(float duty)
{
    return Sign(duty) * minDutyA + (maxDutyA - minDutyA) * duty;
}

float Calibration::TransformDutyB(float duty)
{
    return Sign(duty) * minDutyB + (maxDutyB - minDutyB) * duty;
}
