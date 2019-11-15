#include "Timer1.h"
#include <avr/interrupt.h>

Timer1::Timer1()
{

	TCCR1A = (1 << WGM11);
	TCCR1B = (1 << WGM13) | (1 << WGM12) | (1 << CS10);
	ICR1 = Timer1::C_CounterUpperBound;
	TIMSK |= (1 << TOIE1);
	ticksCount = 0;
} 

uint32_t Timer1::GetTicksCount() const
{
	cli();
	uint32_t val = ticksCount;
	sei();
	return val;
}

void Timer1::SetChA(PwmChannelMode mode, uint16_t duty)
{
	if(mode == PwmChannelMode::Disabled)
	{
		TCCR1A &= ~((1 << COM1A1) | (1 << COM1A0));
	}
	else if(mode == PwmChannelMode::Normal)
	{
		uint8_t v = TCCR1A;
		v &= ~(1 << COM1A0);
		v |=  (1 << COM1A1);
		TCCR1A = v;
	}
	else if(mode == PwmChannelMode::Inverted)
	{
		TCCR1A |=  ((1 << COM1A1) | (1 << COM1A0));
	}
	OCR1A = duty;
}

void Timer1::SetChB(PwmChannelMode mode, uint16_t duty)
{
	if(mode == PwmChannelMode::Disabled)
	{
		TCCR1A &= ~((1 << COM1B1) | (1 << COM1B0));
	}
	else if(mode == PwmChannelMode::Normal)
	{
		uint8_t v = TCCR1A;
		v &= ~(1 << COM1B0);
		v |=  (1 << COM1B1);
		TCCR1A = v;
	}
	else if(mode == PwmChannelMode::Inverted)
	{
		TCCR1A |=  ((1 << COM1B1) | (1 << COM1B0));
	}
	OCR1B = duty;
}

uint32_t Timer1::GetIteration() const
{
	return GetTicksCount() / C_TicksPerIteration;
}

Timer1::~Timer1()
{
} 

Timer1 & Timer1::Instance()
{
	static Timer1 instance;
	return instance;
}

void timerInterrupt(void)
{
	Timer1 & instance = Timer1::Instance();
	instance.ticksCount++;
}

ISR(TIMER1_OVF_vect)
{
	timerInterrupt();
}
