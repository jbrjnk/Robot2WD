/* 
* VBatMeasurement.cpp
*
* Created: 20.10.2019 9:27:40
* Author: Jan
*/

#include <avr/io.h>
#include "VBatMeasurement.h"


VBatMeasurement::VBatMeasurement() : state(VBatMeasurementState::Init), v1(0), v2(0)
{}

uint16_t VBatMeasurement::GetV1() const {return v1;}

uint16_t VBatMeasurement::GetV2() const {return v2;}

void VBatMeasurement::Start()
{
	if (state == VBatMeasurementState::Completed)
	{
		state = VBatMeasurementState::Init;
	}
}

void VBatMeasurement::DoWork()
{
	if(state == VBatMeasurementState::Init)
	{
		ADMUX = (1 << REFS1) | (1 << REFS0) | (1 << MUX1);
		ADCSRA = (1 << ADEN) | (1 << ADPS0) | (1 << ADPS1) | (1 << ADPS2);
		ADCSRA |= (1 << ADSC);
		state = VBatMeasurementState::MeasureV1;
	}
	else if(state == VBatMeasurementState::MeasureV1)
	{
		if((ADCSRA & (1 << ADSC)) == 0)
		{
			//conversion completed
			uint8_t low = ADCL;
			uint8_t high = ADCH;
			v1 = (high << 8) | low;
			
			
			//start next conversion
			ADMUX |= (1 << MUX0);
			ADCSRA |= (1 << ADSC);
			state = VBatMeasurementState::MeasureV2;			
		}
	}
	else if(state == VBatMeasurementState::MeasureV2)
	{
		if((ADCSRA & (1 << ADSC)) == 0)
		{
			//conversion completed
			uint8_t low = ADCL;
			uint8_t high = ADCH;
			v2 = (high << 8) | low;
			state = VBatMeasurementState::Completed;
		}
	}
	else if(state == VBatMeasurementState::Completed)
	{
		//ADCSRA = 0;
	}
}
