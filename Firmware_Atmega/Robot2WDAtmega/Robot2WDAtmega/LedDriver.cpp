/*
* LedDriver.cpp
*
* Created: 19.10.2019 19:21:12
* Author: Jan
*/

#include "Config.h"

#include <avr/io.h>
#include <stdint-gcc.h>
#include <avr/interrupt.h>

#include "LedDriver.h"
#include "util/delay.h"
#include "avr/cpufunc.h"


void LedDriver::SendByte(uint8_t value) const
{
	for(uint8_t bit = 8; bit > 0; bit--)
	{
		if(value & 0x80)
		{
			cli();
			PORTD |= (1 << 4);
			_NOP();_NOP();_NOP();_NOP();_NOP();_NOP();_NOP();_NOP();
			_NOP();_NOP();_NOP();_NOP();_NOP();_NOP();_NOP();_NOP();
			PORTD &= ~(1 << 4);
			_NOP();_NOP();_NOP();_NOP();_NOP();
			_NOP();_NOP();_NOP();_NOP();_NOP();
			sei();
		}
		else
		{
			cli();
			PORTD |= (1 << 4);
			_NOP();_NOP();
			PORTD &= ~(1 << 4);
			_NOP();_NOP();_NOP();_NOP();_NOP();
			_NOP();_NOP();_NOP();_NOP();_NOP();
			_NOP();_NOP();_NOP();_NOP();_NOP();
			_NOP();_NOP();_NOP();_NOP();_NOP();
			sei();
		}
		value = value << 1;
	}
}

void LedDriver::Transmitt()
{
	//reset
	PORTD &= ~(1 << 4);
	_delay_us(12);
	
	for(uint8_t i = 0; i < LedDriver::LedsCount; i++)
	{
		SendByte(leds[i].G);
		SendByte(leds[i].R);
		SendByte(leds[i].B);
	}
}

void LedDriver::SetLed(uint8_t index, LedColor color)
{
	leds[index] = color;
}

LedDriver::LedDriver()
{
	DDRD |= (1 << 4);
	for(uint8_t i = 0; i < LedDriver::LedsCount; i++)
	{
		leds[i].R = 0;
		leds[i].G = 0;
		leds[i].B = 64;
	}
}

void LedDriver::SetAllLeds(LedColor color)
{
	for(uint8_t i = 0; i < LedDriver::LedsCount; i++)
	{
		leds[i] = color;
	}
}