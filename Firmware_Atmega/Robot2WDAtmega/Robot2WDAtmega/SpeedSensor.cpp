#include "SpeedSensor.h"
#include "Timer1.h"
#include <avr/interrupt.h>

SpeedSensor::SpeedSensor()
{
	speedA = 0;
	speedB = 0;
	pulseCountB = 0;
	pulseCountA = 0;
	eventTimestampA = UINT32_MAX;
	eventTimestampB = UINT32_MAX;

	MCUCR |= (1 << ISC10) | (1 << ISC00);
	GICR |= (1 << INT1) | (1 << INT0);
}

SpeedSensor & SpeedSensor::Instance()
{
	static SpeedSensor instance;
	return instance;
}

uint16_t SpeedSensor::GetSpeedA() const
{	
	return speedA;
}

uint16_t SpeedSensor::GetSpeedB() const
{
	return speedB;
}

uint32_t SpeedSensor::GetDistanceA() const
{
	return distanceA;
}

uint32_t SpeedSensor::GetDistanceB() const
{
	return distanceB;
}

void SpeedSensor::NextIteration()
{
	Timer1 & timer = Timer1::Instance();
	uint32_t ticks = timer.GetTicksCount();

	bool incrementA = false;
	bool incrementB = false;

	cli();
	uint32_t pulseCountALocal = pulseCountA;
	uint32_t pulseCountBLocal = pulseCountB;
	pulseCountA = 0;
	pulseCountB = 0;

	if(this->eventTimestampA < (ticks - Timer1::C_TicksPerSec / 1000))
	{
		incrementA=true;
		eventTimestampA = UINT32_MAX; // we already incremented value, do not count next event
	}

	if(this->eventTimestampB < (ticks - Timer1::C_TicksPerSec / 1000))
	{
		incrementB=true;
		eventTimestampB = UINT32_MAX; // we already incremented value, do not count next event
	}
	sei();

	if(incrementA){pulseCountALocal++;}
	if(incrementB){pulseCountBLocal++;}
	
	speedA = pulseCountALocal;
	speedB = pulseCountBLocal;

	distanceA += pulseCountALocal;
	distanceB += pulseCountBLocal;
}

void extInterruptA(void)
{
	SpeedSensor & instance = SpeedSensor::Instance();
	Timer1 & timer = Timer1::Instance();
	uint32_t ticks = timer.GetTicksCount();
	
	if(instance.eventTimestampA < (ticks - Timer1::C_TicksPerSec / 1000))
	{
		instance.pulseCountA++;
	}
	instance.eventTimestampA = ticks;
}

void extInterruptB(void)
{
	SpeedSensor & instance = SpeedSensor::Instance();
	Timer1 & timer = Timer1::Instance();
	uint32_t ticks = timer.GetTicksCount();
	
	if(instance.eventTimestampB < (ticks - Timer1::C_TicksPerSec / 1000))
	{
		instance.pulseCountB++;
	}
	instance.eventTimestampB = ticks;
}

ISR(INT0_vect)
{
	extInterruptB();
}

ISR(INT1_vect)
{
	extInterruptA();
}
