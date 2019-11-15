#ifndef __MOTORDRIVER_H__
#define __MOTORDRIVER_H__

#include <stdint-gcc.h>
#include "Timer1.h"

class MotorDriver
{
	public:
		MotorDriver(Timer1 & Timer1);

		void SetMotorA(int16_t duty);
		void SetMotorB(int16_t duty);
		void Stop();

		MotorDriver( const MotorDriver &c ) = delete;
		MotorDriver& operator=( const MotorDriver &c ) = delete;
		~MotorDriver(){};

	private:
		Timer1 & timer;

}; //MotorDriver

#endif
