/*
* MotorDriver.cpp
*
* Created: 18.10.2019 9:38:27
* Author: Jan
*/

#include <avr/io.h>
#include "MotorDriver.h"

MotorDriver::MotorDriver(Timer1 & timer) : timer(timer)
{
	DDRC |= 0x03;
	timer.SetChA(PwmChannelMode::Disabled, 0);
	timer.SetChB(PwmChannelMode::Disabled, 0);
}

void MotorDriver::SetMotorA(int16_t duty)
{
	if(duty == 0)
	{
		PORTC &= (~1);
		timer.SetChA(PwmChannelMode::Disabled, 0);
	}
	else if(duty >= 0)
	{
		PORTC &= (~1);
		timer.SetChA(PwmChannelMode::Normal, duty);
	}
	else if(duty < 0)
	{
		PORTC |= 1;
		timer.SetChA(PwmChannelMode::Inverted, - duty);
	}
}

void MotorDriver::SetMotorB(int16_t duty)
{

	if(duty == 0)
	{
		PORTC &= (~2);
		timer.SetChB(PwmChannelMode::Disabled, 0);
	}
	else if(duty >= 0)
	{
		PORTC |= 2;
		timer.SetChB(PwmChannelMode::Inverted, duty);
	}
	else if(duty < 0)
	{
		PORTC &= (~2);
		timer.SetChB(PwmChannelMode::Normal, - duty);
	}
}

void MotorDriver::Stop()
{
	this->SetMotorA(0);
	this->SetMotorB(0);
}
