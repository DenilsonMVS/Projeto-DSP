
import RPi.GPIO as GPIO
import serial
import struct

class UART:
	def __init__(self, baudRate):
		self.ser = serial.Serial(port = "/dev/serial0", baudrate = baudRate, stopbits = serial.STOPBITS_TWO)
		
	def readString(self):
		return self.ser.readline().decode("UTF-8").strip()

	def readChar(self):
		return chr(self.ser.read()[0])

	def readFloat(self):
		return struct.unpack("f", self.ser.read(4))[0]

	def readInt(self):
		return struct.unpack("i", self.ser.read(4))[0]

	def readShort(self):
		return struct.unpack("h", self.ser.read(2))[0]
	
	def writeChar(self, c):
		self.ser.write(bytes(c, "utf-8"))
	
	def writeShort(self, num):
		self.ser.write(struct.pack("h", num))
	
	def writeInt(self, num):
		self.ser.write(struct.pack("i", num))
	
	def writeFloat(self, num):
		self.ser.write(struct.pack("f", num))
	
	def writeString(self, string):
		string += "\n"
		self.ser.write(bytes(string, "utf-8"))