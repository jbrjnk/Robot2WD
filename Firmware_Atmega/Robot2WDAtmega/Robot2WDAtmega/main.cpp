/*
* Robot2WDAtmega.cpp
*
* Created: 18.04.2019 19:57:08
* Author : Jan
*/
#include <avr/io.h>
#include <avr/interrupt.h>
#include "Timer1.h"
#include "SpeedSensor.h"
#include "Uart.h"
#include "MotorDriver.h"
#include "LedDriver.h"
#include "VBatMeasurement.h"

bool ProcessIncomingMessage(Uart & uart, MotorDriver & motorDriver, LedDriver & ledDriver)
{
	bool res = false;
	uint8_t len = uart.IsNewMessageAvailable();
	if(len == 16)
	{
		if(uart.IsIncommingMessageChecksumValid())
		{
			int16_t chA = uart.GetInt16(0 * 2);
			int16_t chB = uart.GetInt16(2 * 2);
			uint8_t red = uart.GetUInt8(4 * 2);
			uint8_t green = uart.GetUInt8(5 * 2);
			uint8_t blue = uart.GetUInt8(6 * 2);

			motorDriver.SetMotorA(chA);
			motorDriver.SetMotorB(chB);

			LedColor color;
			color.R = red;
			color.G = green;
			color.B = blue;
			ledDriver.SetAllLeds(color);

			res = true;
		}
	}

	if (len)
	{
		uart.AcceptReceivedMessage();
	}

	return res;
}

uint32_t lastDistanceA = 0;

uint32_t lastDistanceB = 0;

uint32_t lastReceivedMsgIteration = 0;

void SendMessage(Uart & uart, SpeedSensor & speedsensor, VBatMeasurement & vbat, uint32_t iteration)
{
	if(uart.IsTxRead())
	{
		uint32_t currentDistanceA = speedsensor.GetDistanceA();
		uint32_t currentDistanceB = speedsensor.GetDistanceB();
		uint16_t deltaA = currentDistanceA - lastDistanceA;
		uint16_t deltaB = currentDistanceB - lastDistanceB;
		lastDistanceA = currentDistanceA;
		lastDistanceB = currentDistanceB;
		
		uart.SetUInt16(0 * 2, vbat.GetV1());
		uart.SetUInt16(2 * 2, vbat.GetV2());
		uart.SetUInt16(4 * 2, deltaA);
		uart.SetUInt16(6 * 2, deltaB);
		uart.SetUInt16(8 * 2, static_cast<uint16_t>(iteration));
		uart.Send(10 * 2);
	}
}



int main(void)
{
	sei();
	DDRB = 0x06;
	
	Timer1  &  timer = Timer1::Instance();
	Uart & uart = Uart::Instance();
	SpeedSensor & speedSensor = SpeedSensor::Instance();
	MotorDriver motorDriver(timer);
	LedDriver ledDriver;
	VBatMeasurement vbatMeasurement;

	ledDriver.Transmitt();

	uint32_t lastIteration = timer.GetIteration();
	
	while (1)
	{
		uint32_t currentIteration = timer.GetIteration();
		
		if(ProcessIncomingMessage(uart, motorDriver, ledDriver))
		{
			lastReceivedMsgIteration = currentIteration;
			ledDriver.Transmitt();
		}
		if(lastReceivedMsgIteration + Timer1::C_IterationsPerSec < currentIteration)
		{
			// Last message was received a long time ago. Stop both motors.
			motorDriver.Stop();

		}
		vbatMeasurement.DoWork();
		
		if(lastIteration < currentIteration)
		{
			//new iteration
			speedSensor.NextIteration();

			SendMessage(uart, speedSensor, vbatMeasurement, currentIteration);
			
			vbatMeasurement.Start();
		}
		lastIteration = currentIteration;
	}

	while(1);
}

extern "C" void	atexit( void ) { }

