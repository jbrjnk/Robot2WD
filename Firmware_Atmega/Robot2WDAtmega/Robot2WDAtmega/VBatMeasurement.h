/* 
* VBatMeasurement.h
*
* Created: 20.10.2019 9:27:41
* Author: Jan
*/


#ifndef __VBATMEASUREMENT_H__
#define __VBATMEASUREMENT_H__

enum class VBatMeasurementState
{
	Init,
	MeasureV1,
	MeasureV2,
	Completed
};

class VBatMeasurement
{
private:
	VBatMeasurementState state;
	uint16_t v1;
	uint16_t v2;

public:
	VBatMeasurement();
	uint16_t GetV1() const;
	uint16_t GetV2() const;
	void Start();
	void DoWork();

	VBatMeasurement( const VBatMeasurement &c ) = delete;
	VBatMeasurement& operator=( const VBatMeasurement &c ) = delete;
	~VBatMeasurement(){};

}; //VBatMeasurement

#endif //__VBATMEASUREMENT_H__
