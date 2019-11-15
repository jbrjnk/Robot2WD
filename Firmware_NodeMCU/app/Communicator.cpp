#include "Communicator.h"
#include <SmingCore/SmingCore.h>
#include <SmingCore/Clock.h>

Communicator::Communicator()
{
    this->dutyA = 0;
    this->dutyB = 0;
    this->red = 0;
    this->green = 0;
    this->blue = 0;
    this->distanceA = 0;
    this->distanceB = 0;
    this->vbat1 = 0;
    this->vbat2 = 0;
    this->lastSentMsgTimestamp = millis();
    this->receivedLen = 0;
    this->speedA = 0;
    this->speedB = 0;
}

void Communicator::Initialize()
{
    Serial.begin(115200);
    Serial.swap();
    Serial.setTimeout(1);
}

void Communicator::SetLight(uint8_t red, uint8_t green, uint8_t blue)
{
    this->red = red;
    this->green = green;
    this->blue = blue;
}

void Communicator::DoWork()
{
    unsigned long currentTime = millis();
    if (currentTime - 20 > this->lastSentMsgTimestamp)
    {
        this->SendMessage();
        this->lastSentMsgTimestamp = currentTime;
    }
    this->Read();
}

char Communicator::NibbleToHex(uint8_t value)
{
    value = value & 0x0F;
    if(value >= 0 && value < 10){return '0' + value;}
    else if (value >= 10 && value <= 15){return 'A' + value - 10;}
}

void Communicator::UInt8ToHex(char * target, uint8_t value)
{
    target[0] = NibbleToHex(value >> 4);
    target[1] = NibbleToHex(value & 0x0F);
}

void Communicator::Int16ToHex(char * target, int16_t value)
{
    UInt8ToHex(target, value >> 8);
    UInt8ToHex(target + 2, value & 0xFF);
}

uint8_t Communicator::ComputeChecksum(char * data, uint8_t len) const
{
	uint8_t checksum = 1;
	for (uint8_t i = 0; i < len; i++)
	{
		checksum += data[i];
	}
	return checksum;
}

uint8_t Communicator::NibbleFromHex(char * source)
{
    if((*source) >= '0' && (*source) <= '9'){return (*source) - '0';}
    else if ((*source) >= 'A' && (*source) <= 'F'){return (*source) - 'A' + 10;}
    else return 0;
}

uint8_t Communicator::UInt8FromHex(char * source)
{
    return (NibbleFromHex(source) << 4) | NibbleFromHex(source + 1);
}

uint16_t Communicator::UInt16FromHex(char * source)
{
    return (UInt8FromHex(source) << 8) | UInt8FromHex(source + 2);
}

void Communicator::SendMessage()
{
    int16_t motorAInt = static_cast<int16_t>(this->dutyA * 1280);
    int16_t motorBInt = static_cast<int16_t>(this->dutyB * 1280);

    char data[19];
    Int16ToHex(data, motorAInt);
    Int16ToHex(data + 4, motorBInt);
    UInt8ToHex(data + 8, this->red);
    UInt8ToHex(data + 10, this->green);
    UInt8ToHex(data + 12, this->blue);
    UInt8ToHex(data + C_OutgoingMessageLen - 3, ComputeChecksum(data, C_OutgoingMessageLen - 3));
    data[18] = ';';
    Serial.write(data, sizeof(data));
}

void Communicator::Read()
{
    char tmpBuffer[64];
    if (Serial.available())
    {
        int8_t len = Serial.readBytes(receivedData, sizeof(receivedData) - receivedLen);

        if(len > 0)
        {
            receivedLen+=len;
            char * separatorPos = static_cast<char*>(memchr(receivedData, ';', receivedLen));
            if(separatorPos)
            {
                size_t msgLen = (separatorPos - receivedData) + 1;
                if (msgLen == C_IncomingMessageLen)
                {
                    // received whole message
                    ProcessIncomingMessage();
                }
                else
                {
                    // message has invalid length, probably corrupted, clear buffer
                }
                memmove(receivedData, separatorPos + 1, sizeof(receivedData) - msgLen);
                receivedLen-= msgLen;
            }
            else if(receivedLen >= sizeof(receivedData))
            {
                receivedLen = 0;
            }
        }
    }    
}

void Communicator::ProcessIncomingMessage()
{
    uint8_t checksumComputed = ComputeChecksum(receivedData, C_IncomingMessageLen - 3);
    uint8_t checksum = UInt8FromHex(receivedData + C_IncomingMessageLen - 3);
    if(checksum == checksumComputed)
    {
        uint16_t v1 = UInt16FromHex(receivedData);
        uint16_t vTotal = UInt16FromHex(receivedData + 2 * 2);
        float vbat1Volts = v1 * 0.25 * 4.1818 * 0.01;
        float vbatTotalVolts = vTotal * 0.25 * 4.2099 * 0.01;
        vbat1 = vbat1Volts;
        vbat2 = vbatTotalVolts - vbat1Volts;

        this->speedA = UInt16FromHex(receivedData + 4 * 2);
        this->speedB = UInt16FromHex(receivedData + 6 * 2);
        this->distanceA += speedA;
        this->distanceB += speedB;
        this->iteration = UInt16FromHex(receivedData + 8 * 2);
    }
    else
    {
        debugf("Wrong checksum. Computed: %d, received: %d \r\n", checksumComputed, checksum);
    }
}
