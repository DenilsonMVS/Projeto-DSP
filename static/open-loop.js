
function graphConfig(labelX, labelY) {
	return {
		type: "line",
		data: {
			datasets: [{
				label: labelY,
				backgroundColor: "silver",
				borderColor: "gray",
			}]
		},
		options: {
			scales: {
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: labelY
					}
				}],
				xAxes: [{
					scaleLabel: {
						display: true,
						labelString: labelX
					}
				}]
			}
		}
	}
}

let graph1 = new Chart(document.getElementsByClassName("canvas")[0].getContext("2d"), graphConfig("Tempo(s)", "Posição"))
let graph2 = new Chart(document.getElementsByClassName("canvas")[1].getContext("2d"), graphConfig("Tempo(s)", "%"))

function resetGraphs() {
	graph1.data.labels = []
	graph1.data.datasets[0].data = []
	graph1.update();
	
	graph2.data.labels = []
	graph2.data.datasets[0].data = []
	graph2.update()
}

function updateGraphs() {
	let currentTimeToPlot = []
	let readValueToPlot = []
	let controlSignalToPlot = []
	const step = parseInt(mainData.currentTime.length / 100) || 1
	for(let i = 0; i < mainData.currentTime.length; i += step) {
		currentTimeToPlot.push(mainData.currentTime[i])
		readValueToPlot.push(mainData.readValue[i])
		controlSignalToPlot.push(mainData.controlSignal[i])
	}

	graph1.data.labels = currentTimeToPlot
	graph1.data.datasets[0].data = readValueToPlot
	graph1.update()
	
	graph2.data.labels = currentTimeToPlot
	graph2.data.datasets[0].data = controlSignalToPlot
	graph2.update()
}


let mainData = {
	running: false,

	currentTime: [],
	readValue: [],
	controlSignal: [],

	usingCurrentSensor: false,
	usingAnalogInput: false,

	maxValue: 0,
	minValue: 0,

	reset: function() {
		this.currentTime = []
		this.readValue = []
		this.controlSignal = []
	},

	start: function() {
		this.running = true
		this.mainInterval = setInterval(routine, 100)
	},

	end: function() {
		this.running = false
		clearInterval(this.mainInterval)
	},

	transferData: function(data) {
		for(let i = 0; i < data.values.length; i++) {
			this.currentTime.push(data.values[i].currentTime.toFixed(2))
			this.readValue.push(data.values[i].readValue)
			this.controlSignal.push(data.values[i].controlSignal)
		}
	},

	updateRealTimeReading: function() {
		if(this.readValue.length === 1) {
			this.maxValue = this.readValue[this.readValue.length - 1]
			this.minValue = this.readValue[this.readValue.length - 1]
			document.getElementById("min-value").textContent = this.minValue.toFixed(2)
			document.getElementById("max-value").textContent = this.maxValue.toFixed(2)
		} else if(this.readValue[this.readValue.length - 1] < this.minValue) {
			this.minValue = this.readValue[this.readValue.length - 1]
			document.getElementById("min-value").textContent = this.minValue.toFixed(2)
		} else if(this.readValue[this.readValue.length - 1] > this.maxValue) {
			this.maxValue = this.readValue[this.readValue.length - 1]
			document.getElementById("max-value").textContent = this.maxValue.toFixed(2)
		}

		document.getElementById("input-time").innerHTML = mainData.currentTime[mainData.currentTime.length - 1] || "0"
		document.getElementById("read-value").innerHTML = mainData.readValue[mainData.readValue.length - 1].toFixed(2) || "0" 
	}
}

function configIsOk() {

	const controllerGain = parseFloat(document.getElementById("controller-gain").value)

	if(parseFloat(document.getElementById("sampling-time").value) <= 0) {
		alert("Tempo de amostragem deve ser maior que 0")
		return false
	}

	if(parseFloat(document.getElementById("end-time").value) <= 0) {
		alert("Duração deve ser maior que 0")
		return false
	}

	if(controllerGain < 0 || controllerGain > 100) {
		alert("Ganho deve ser maior ou igual a 0 e menor ou igual a 100")
		return false
	}

	return true
}

function getConfig() {
	mainData.usingCurrentSensor = document.getElementById("use-current-sensor").checked
	mainData.usingAnalogInput = document.getElementById("use-analog-input").checked

	return {
		mode: "open",
		usingCurrentSensor: mainData.usingCurrentSensor,
		usingAnalogInput: mainData.usingAnalogInput,
		readCurrent: document.getElementById("read-current").value,
		useAnalogInput: document.getElementById("use-another-analog-input").value,
		samplingTime: parseFloat(document.getElementById("sampling-time").value),
		endTime: parseFloat(document.getElementById("end-time").value),
		parameters: {
			controlSignal: parseFloat(document.getElementById("controller-gain").value)
		}
	}
}

function startButtonClick() {
	if(!mainData.running && configIsOk() && confirm("Deseja iniciar?")) {
		runRequest("/start", getConfig(), function(data) {
			mainData.reset()
			resetGraphs()
			mainData.start()
		})
	}	
}

function stopButtonClick() {
	if(mainData.running && confirm("Deseja parar?")) {
		runRequest("/stop", {}, function(data) {	
			mainData.end()
		})
	}
}

function saveButtonClick() {
	stopButtonClick()
	if(!mainData.running) {
		if(confirm("Deseja salvar?"))	
			runRequest("/save", {}, function(data) {})

		if(confirm("Deseja ir para a página de download?"))
			window.location.href = "download-files"
	}
}

function routine() {
	runRequest("/routine", {}, function(data) {
		mainData.transferData(data)
		mainData.updateRealTimeReading()
		updateGraphs()

		if(data.values[data.values.length - 1] != undefined && data.values[data.values.length - 1].currentTime >= parseFloat(document.getElementById("end-time").value))
			mainData.end()
	}, mainData.end)
}