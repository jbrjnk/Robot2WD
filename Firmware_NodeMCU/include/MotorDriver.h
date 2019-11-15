#ifndef MOTORDRIVER_H
#define MOTORDRIVER_H

#include "Communicator.h"
#include "PersistentStorage.h"
#include <SmingCore/SmingCore.h>
#include <SmingCore/Network/Http/Websocket/WebsocketResource.h>
#include <SmingCore/Network/Http/Websocket/WebSocketConnection.h>

enum class CalibrationState
{
    Init,
    MotorA,
    MotorB,
    Idle
};

struct CalibrationData
{
    
};

class Calibration
{
public:
    Calibration(Communicator & communicator, PersistentStorage & storage) : storage(storage), communicator(communicator), state(CalibrationState::Idle), minDutyA(0), minDutyB(0), maxDutyA(1), maxDutyB(1) {}
    void Start();
    void Load();
    void Clear();
    bool IsRunning() {return state != CalibrationState::Idle;}
    float TransformDutyA(float duty);
    float TransformDutyB(float duty);
    void DoWork();
    float GetMinDutyA(){return minDutyA;}
    float GetMinDutyB(){return minDutyB;}

    static constexpr uint8_t C_IterationsCount = 3;
    static constexpr float C_DutyStep = 0.005;
    static constexpr float C_InitDuty = 0.4;

private:
    void SetNewCalibration();
    float Sign(float value);
    
    CalibrationState state;
    uint8_t iteration;
    uint32_t lastDistance;
    float duty;
    PersistentStorage & storage;
    Communicator & communicator;
    
    uint32_t waitUntil;    

    float minDutyA;
    float minDutyB;
    float maxDutyA;
    float maxDutyB;

    float minDutyAResults[C_IterationsCount];
    float minDutyBResults[C_IterationsCount];
};

class MotorDriver
{
    public:
        MotorDriver(Communicator & communicator, HttpServer & httpServer, PersistentStorage & storage);
        void Initialize();
        void DoWork();
    private:
        Communicator & communicator;
        HttpServer & httpServer;
        WebSocketConnection * connection;

        unsigned long lastIterationTimestamp;
        unsigned long watchdog;

        Calibration calibration;
        float motorADuty;
        float motorBDuty;

        void SendMessage();
        void ProcessMessage(const String & message);

        void WsConnectedCallback(WebSocketConnection& socket);
        void WsMessageReceivedCallback(WebSocketConnection& socket, const String& message);
        void WsDisconnectedCallback(WebSocketConnection& socket);
        void WsBinaryReceivedCallback(WebSocketConnection& socket, uint8_t* data, size_t size);

        MotorDriver(MotorDriver const&) = delete;
        MotorDriver(MotorDriver &&)     = delete;
        MotorDriver& operator=(MotorDriver const&) = delete;
        MotorDriver& operator=(MotorDriver &&)     = delete;
};

#endif