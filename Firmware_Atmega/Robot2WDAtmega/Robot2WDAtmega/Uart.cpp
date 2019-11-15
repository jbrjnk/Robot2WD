/* 
* Uart.cpp
*
* Created: 19.04.2019 20:16:12
* Author: Jan
*/

#include "Uart.h"
#include <avr/interrupt.h>
#include <stdio.h>

Uart::Uart()
{
	UCSRB = (1 << TXEN) | (1 << RXEN) | (1 << RXCIE);
	UCSRC = (1 << URSEL) | (1 << UCSZ1) | (1 << UCSZ0);
	UBRRL = 10;
	DDRD |= (1 << PD1);

	inMsgLen = 0;
	inMsgAvailable = false;
	outMsgLen = 0;
	outMsgPos = 0;
	inErr = false;
}

bool Uart::IsTxRead() const
{
	return outMsgLen == 0;
}

Uart & Uart::Instance()
{
	static Uart instance;
	return instance;
}

uint8_t Uart::ComputeChecksum(uint8_t * data, uint8_t len) const
{
	uint8_t checksum = 1;
	for (uint8_t i = 0; i < len; i++)
	{
		checksum += data[i];
	}
	return checksum;
}

void Uart::Send(uint8_t len)
{
	if(this->IsTxRead())
	{
		uint8_t checksum = ComputeChecksum(const_cast<uint8_t*>(outgoingBuffer), len);
		SetUInt8(len, checksum);
		len+=2;
		outgoingBuffer[len++] = Uart::StopByte;
		
		if(len > 0)
		{
			outMsgLen = len;
			outMsgPos = 0;
			UCSRB |= (1 << UDRIE);
		}
		else {outMsgLen = 0;}
	}	
}

uint8_t Uart::IsNewMessageAvailable() const
{
	return inMsgAvailable ? inMsgLen : 0;
}

bool Uart::IsIncommingMessageChecksumValid() const
{
	uint8_t expected = ComputeChecksum(const_cast<uint8_t*>(incomingBuffer), inMsgLen);
	uint8_t actual = GetUInt8(inMsgLen);

	//const_cast<Uart*>(this)->outgoingBuffer[0] = NibbleToHex(actual >> 4);
	//const_cast<Uart*>(this)->outgoingBuffer[1] = NibbleToHex(actual & 0x0F);
	//const_cast<Uart*>(this)->Send(2);
	return expected == actual;		
}

void Uart::AcceptReceivedMessage()
{
	inMsgAvailable = false;
	inMsgLen = 0;
}

uint8_t Uart::NibbleToHex(uint8_t value) const
{
	value = value % 16;
	if(value < 10){return value + '0';}
	else {return value - 10 + 'A';}
}

int8_t Uart::GetNibble(uint8_t offset) const
{
	char val = static_cast<char>(incomingBuffer[offset]);
	if(val >= '0' && val <= '9'){return val - '0';}
	else if(val >= 'A' && val <= 'F'){return val - 'A' + 10;}
	else return 0;
}

void Uart::SetUInt8(uint8_t offset, uint8_t value)
{
	outgoingBuffer[offset] = NibbleToHex(value >> 4);
	outgoingBuffer[offset + 1] = NibbleToHex(value & 0x0F);
}

void Uart::SetUInt16(uint16_t offset, uint16_t value)
{
	SetUInt8(offset, value >> 8);
	SetUInt8(offset + 2, value & 0xFF);
}


int8_t Uart::GetInt8(uint8_t offset) const
{
	return static_cast<int8_t>((GetNibble(offset) << 4) | GetNibble(offset + 1));
}

uint8_t Uart::GetUInt8(uint8_t offset) const
{
	return static_cast<uint8_t>((GetNibble(offset) << 4) | GetNibble(offset + 1));
}

int16_t Uart::GetInt16(uint8_t offset) const
{
	return static_cast<int16_t>((GetUInt8(offset) << 8) | GetUInt8(offset + 2));
}

uint16_t Uart::GetUInt16(uint8_t offset) const
{
	return static_cast<uint16_t>((GetInt8(offset) << 8) | GetInt8(offset + 2));
}

void dataRegEmptyInterrupt(void)
{
	Uart & instance = Uart::Instance();
	if(instance.outMsgPos < instance.outMsgLen)
	{
		UDR = instance.outgoingBuffer[instance.outMsgPos++];
	}
	else
	{
		UCSRB &= (~(1 << UDRIE));
		instance.outMsgLen = 0;
	}
}

void dataReceivedInterrupt(void)
{
	Uart & instance = Uart::Instance();
	uint8_t data = UDR;

	if(!instance.inMsgAvailable && !instance.inErr)
	{
		if(data == Uart::StopByte)
		{
			instance.inMsgAvailable = true;
			instance.inMsgLen-=2; //subtract checksum bytes
		}
		else if(instance.inMsgLen < sizeof(instance.incomingBuffer))
		{
			instance.incomingBuffer[instance.inMsgLen++] = data;
		}
		else
		{			
			instance.inErr = true;
		}
	}
	else if (instance.inErr && data == Uart::StopByte)
	{
		//reset receiver
		instance.inErr = false;
		instance.inMsgLen = 0;
	}
}

ISR(USART_UDRE_vect)
{
	dataRegEmptyInterrupt();
}

ISR(USART_RXC_vect)
{
	dataReceivedInterrupt();
}
