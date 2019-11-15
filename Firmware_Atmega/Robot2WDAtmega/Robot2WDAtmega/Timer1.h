#include <stdint-gcc.h>

#ifndef __Timer1_H__
#define __Timer1_H__


enum class PwmChannelMode
{
	Normal,
	Inverted,
	Disabled
};


class Timer1
{
	friend void timerInterrupt(void);
	public:
	
	static Timer1 & Instance();

	uint32_t GetTicksCount() const;

	void SetChA(PwmChannelMode mode, uint16_t duty);

	void SetChB(PwmChannelMode mode, uint16_t duty);

	uint32_t GetIteration() const;

	static const uint32_t C_CounterUpperBound = 1280-1;

	static const uint32_t C_ClockFreq = 20000000;

	static const uint32_t C_TicksPerSec = (C_ClockFreq / (C_CounterUpperBound + 1));

	static const uint32_t C_IterationsPerSec = 10;

	static const uint32_t C_TicksPerIteration = C_TicksPerSec / C_IterationsPerSec;

	protected:

	private:
	volatile uint32_t ticksCount;

	Timer1();
	Timer1( const Timer1 &c ) = delete;
	Timer1& operator=( const Timer1 &c ) = delete;
	~Timer1();
};

#endif
