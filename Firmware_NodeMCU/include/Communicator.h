#ifndef COMMUNICATOR_H
#define COMMUNICATOR_H

#include <cstdint>

class Communicator
{
    public:
        Communicator();
        void Initialize();
        void SetMotorA(float duty) {this->dutyA = duty;}
        void SetMotorB(float duty) {this->dutyB = duty;}
        void SetLight(uint8_t red, uint8_t green, uint8_t blue);
        void DoWork();
        uint32_t GetDistanceA() const {return distanceA;}
        uint32_t GetDistanceB() const {return distanceB;}
        float GetVBat1() const  {return vbat1;}
        float GetVBat2() const {return vbat2;}
        int16_t GetIteration() const {return iteration;}
        int16_t GetSpeedA() const {return speedA;}
        int16_t GetSpeedB() const {return speedB;}
        float GetDutyA() const {return dutyA;}
        float GetDutyB() const {return dutyB;}

    private:
        float dutyA;
        float dutyB;
        uint8_t red;
        uint8_t green;
        uint8_t blue;
        uint32_t distanceA;
        uint32_t distanceB;
        uint16_t speedA;
        uint16_t speedB;
        float vbat1;
        float vbat2;
        uint16_t iteration;

        unsigned long lastSentMsgTimestamp;
        char receivedData[32];
        uint8_t receivedLen;

        char NibbleToHex(uint8_t value);
        void UInt8ToHex(char * target, uint8_t value);
        void Int16ToHex(char * target, int16_t value);
        uint8_t ComputeChecksum(char * data, uint8_t len) const;
        uint8_t NibbleFromHex(char * source);
        uint8_t UInt8FromHex(char * source);
        uint16_t UInt16FromHex(char * source);
        void SendMessage();
        void Read();
        void ProcessIncomingMessage();

        static const int C_IncomingMessageLen = 23; // including ending semi-colon
        static const int C_OutgoingMessageLen = 19; 
};

#endif
