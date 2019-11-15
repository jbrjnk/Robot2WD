#ifndef __UART_H__
#define __UART_H__

#include <stdint-gcc.h>

class Uart
{
	friend void dataRegEmptyInterrupt(void);
	friend void dataReceivedInterrupt(void);
public:
	static Uart & Instance();
	void Send(uint8_t len);	
	bool IsTxRead() const;
	uint8_t IsNewMessageAvailable() const;
	bool IsIncommingMessageChecksumValid() const;
	void AcceptReceivedMessage();

	uint8_t NibbleToHex(uint8_t value) const;
	
	void SetUInt8(uint8_t offset, uint8_t value);
	void SetUInt16(uint16_t offset, uint16_t value);

	int8_t GetNibble(uint8_t offset) const;
	int16_t GetInt16(uint8_t offset) const;
	uint16_t GetUInt16(uint8_t offset) const;

	int8_t GetInt8(uint8_t offset) const;
	uint8_t GetUInt8(uint8_t offset) const;

	volatile uint8_t outgoingBuffer[32];
	volatile uint8_t incomingBuffer[32];

	static const uint8_t StopByte = ';';
private:
	volatile uint8_t outMsgLen;
	volatile uint8_t outMsgPos;

	volatile uint8_t inMsgLen;
	volatile bool inMsgAvailable;
	volatile bool inErr;

	uint8_t ComputeChecksum(uint8_t * data, uint8_t len) const;

	Uart( const Uart &c ) = delete;
	Uart& operator=( const Uart &c ) = delete;
	Uart();
	~Uart(){};

}; //Uart

#endif //__UART_H__
