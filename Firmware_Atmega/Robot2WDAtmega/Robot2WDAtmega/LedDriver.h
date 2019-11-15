/* 
* LedDriver.h
*
* Created: 19.10.2019 19:21:13
* Author: Jan
*/


#ifndef __LEDDRIVER_H__
#define __LEDDRIVER_H__

struct LedColor
{
	uint8_t R;
	uint8_t G;
	uint8_t B;
};

class LedDriver
{
public:
	void Transmitt();
	void SetLed(uint8_t index, LedColor color);
	void SetAllLeds(LedColor color);

	LedDriver();
	LedDriver( const LedDriver &c ) = delete;
	LedDriver& operator=( const LedDriver &c ) = delete;
	~LedDriver(){};
	static const uint8_t LedsCount = 32;

private:
	void SendByte(uint8_t value) const;
	LedColor leds[LedsCount];

}; //LedDriver

#endif //__LEDDRIVER_H__
