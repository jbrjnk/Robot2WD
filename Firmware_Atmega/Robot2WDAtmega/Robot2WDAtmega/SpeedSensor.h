#include <stdint-gcc.h>

#ifndef __SPEEDSENSOR_H__
#define __SPEEDSENSOR_H__


class SpeedSensor
{
friend void extInterruptA(void);
friend void extInterruptB(void);

public:
	static SpeedSensor & Instance();
	uint16_t GetSpeedA() const;
	uint16_t GetSpeedB() const;
	uint32_t GetDistanceA() const;
	uint32_t GetDistanceB() const;
	void NextIteration();

private:
	uint16_t speedA;
	uint16_t speedB;
	uint32_t distanceA;
	uint32_t distanceB;

	volatile uint32_t eventTimestampA;
	volatile uint32_t eventTimestampB;

	volatile uint16_t pulseCountA;
	volatile uint16_t pulseCountB;
	
	SpeedSensor();
	SpeedSensor( const SpeedSensor &c ) = delete;
	SpeedSensor& operator=( const SpeedSensor &c ) = delete;
	~SpeedSensor(){};

};

#endif //__SPEEDSENSOR_H__
