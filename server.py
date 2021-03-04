
from flask import Flask, render_template, request, jsonify
from random import randint, uniform
import numpy as np
import uart
import time
from threading import Timer


app = Flask(__name__)


class Main:

	def __init__(self):
		self.running = False 


	def readNothing(self):
		self.currentSensor = None
		self.analogInput = None

	def readCurrentSensor(self):
		self.currentSensor = self.UART.readShort() * 3.3 / 4095
		self.analogInput = None

	def readAnalogInput(self):
		self.currentSensor = None
		self.analogInput = self.UART.readShort() * 3.3 / 4095
	
	def readCurrentSensorAndAnalogInput(self):
		self.currentSensor = self.UART.readShort() * 3.3 / 4095
		self.analogInput = self.UART.readShort() * 3.3 / 4095

	def configureExtraReadings(self):
		if(self.usingCurrentSensor and self.usingAnalogInput):
			self.readExtraData = self.readCurrentSensorAndAnalogInput
			self.UART.writeChar("3")
		elif(self.usingCurrentSensor):
			self.readExtraData = self.readCurrentSensor
			self.UART.writeChar("2")
		elif(self.usingAnalogInput):
			self.readExtraData = self.readAnalogInput
			self.UART.writeChar("1")
		else:
			self.readExtraData = self.readNothing
			self.UART.writeChar("0")
	

	def start(self, data):
		self.running = True

		self.mode = data["mode"]

		self.samplingTime = data["samplingTime"]
		self.endTime = data["endTime"]
		self.parameters = data["parameters"]

		self.usingCurrentSensor = data["usingCurrentSensor"]
		self.usingAnalogInput = data["usingAnalogInput"]
		
		self.currentSensor = None
		self.analogInput = None

		self.minValue = 0
		self.maxValue = 0
		
		self.data = []
		
		self.UART = uart.UART(2500000)
		
		if(self.mode == "closed"):            

			self.UART.writeChar("c")
			self.UART.writeFloat(self.samplingTime)
			self.UART.writeFloat(self.endTime)
			self.UART.writeFloat(self.parameters["proportional"])
			self.UART.writeFloat(self.parameters["integrative"])
			self.UART.writeFloat(self.parameters["derivative"])

			self.configureExtraReadings()

			self.mainInterval = Timer(self.samplingTime, self.communicateWithPic)
		
		else:
			
			self.UART.writeChar("o")
			self.UART.writeFloat(self.samplingTime)
			self.UART.writeFloat(self.endTime)
			self.UART.writeFloat(self.parameters["controlSignal"])

			self.configureExtraReadings()

			self.mainInterval = Timer(self.samplingTime, self.communicateWithPicOpenLoop)

		self.mainInterval.start()

	
	def setMaxAndMinValues(self):
		if(len(self.data) == 1):
			self.minValue = self.data[0]["readValue"]
			self.maxValue = self.data[0]["readValue"]
		elif(self.data[-1]["readValue"] < self.minValue):
			self.minValue = self.data[-1]["readValue"]
		elif(self.data[-1]["readValue"] > self.maxValue):
			self.maxValue = self.data[-1]["readValue"] 

	def communicateWithPic(self):
		currentTime = self.UART.readFloat()
		readValue = self.UART.readShort() * 0.2618
		controlSignal = self.UART.readFloat()
		self.readExtraData()
		
		self.data.append({"currentTime": currentTime, "readValue": readValue, "controlSignal": controlSignal, "currentSensor": self.currentSensor, "analogInput": self.analogInput})
		self.setMaxAndMinValues()
		
		if(currentTime < self.endTime):
			self.mainInterval = Timer(self.samplingTime, self.communicateWithPic)
			self.mainInterval.start()


	def communicateWithPicOpenLoop(self):
		currentTime = self.UART.readFloat()
		readValue = self.UART.readShort() * 0.2618
		
		self.data.append({"currentTime": currentTime, "readValue": readValue, "controlSignal": self.parameters["controlSignal"], "currentSensor": currentSensor, "analogInput": analogInput})
		self.setMaxAndMinValues()

		if(currentTime < self.endTime):
			self.mainInterval = Timer(self.samplingTime, self.communicateWithPicOpenLoop)
			self.mainInterval.start()

main = Main()


@app.route("/")
def index():
	return render_template("index.html")


@app.route("/open-loop")
def openLoop():
	return render_template("open-loop.html")


@app.route("/closed-loop")
def closedLoop():
	return render_template("closed-loop.html")


@app.route("/download-files")
def downloadFiles():
	return render_template("download.html")


@app.route("/filter")
def filter():
	return render_template("filter.html")



@app.route("/start", methods = ["GET", "POST"])
def start():
	#print(request.json)
	main.start(request.json)
	return jsonify({})


@app.route("/stop", methods = ["GET", "POST"])
def stop():
	clearInterval(main.mainInterval)
	return jsonify({})


@app.route("/save", methods = ["GET", "POST"])
def save():
	name = "files/" + time.asctime(time.localtime(time.time())) + ".txt"
	log = open(name, "w")
	fileString = "currentTime, readValue, controlSignal,\n"

	for i in main.data:
		fileString += str(i["currentTime"]) + ", "
		fileString += str(i["readValue"]) + ", "
		fileString += str(i["controlSignal"]) + ",\n"
		
	log.write(fileString)
	log.close()
	log = open("files/files.txt", "a")
	log.write(name + "\n")
	log.close()
	return jsonify({})


@app.route("/fileNames", methods = ["GET", "POST"])
def fileNames():
	files = []
	log = open("files/files.txt", "r")
	for line in log:
		files.append(line)

	string = []
	for i in range(len(files)):
		string.append("")
		for j in range(6, len(files[i]) - 1):
			string[i] += files[i][j]

	log.close()
	return jsonify({"names": string})


@app.route("/requestVector", methods = ["GET", "POST"])
def requestVector():
	
	fileName = request.json["fileName"]
	
	values = ""
	log = open("files/" + fileName, "r")
	for line in log:
		values += line
	
	return jsonify({"text": values})


@app.route("/routine", methods = ["GET", "POST"])
def sendValues():
	step = int(len(main.data) / 100)
	if(step == 0):
		step = 1

	dataToTransmit = []
	for i in range(0, len(main.data), step):
		dataToTransmit.append(main.data[i])
	if(dataToTransmit[-1]["currentTime"] != main.data[-1]["currentTime"]):
		dataToTransmit.append(main.data[-1])
	
	
	return jsonify({"values": dataToTransmit, "minValue": main.minValue, "maxValue": main.maxValue})


@app.route("/restart", methods = ["GET", "POST"])
def restart():
	main.running = True
	return jsonify({})


if(__name__ == "__main__"):
	app.run(debug = True, host = "0.0.0.0")
