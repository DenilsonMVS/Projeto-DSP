
let mainData = {
	running: false,

	currentTime: [],
	readValue: [],
	controlSignal: [],

	usingCurrentSensor: false,
	usingAnalogInput: false,

	currentSensor: [],
	analogInput: [],

	maxValue: 0,
	minValue: 0,

	reset: function() {
		this.currentTime = []
		this.readValue = []
		this.controlSignal = []
		this.currentSensor = []
		this.analogInput = []
	},

	start: function() {
		this.running = true
		this.mainInterval = setInterval(routine, 500)
	},

	end: function() {
		this.running = false
		clearInterval(this.mainInterval)
	},

	transferData: function(data) {
		this.reset()
		for(let i = 0; i < data.values.length; i++) {
			this.currentTime.push(data.values[i].currentTime.toFixed(2))
			this.readValue.push(data.values[i].readValue)
			this.controlSignal.push(data.values[i].controlSignal)
			this.currentSensor.push	(data.values[i].currentSensor)
			this.analogInput.push(data.values[i].analogInput)
		}
	},

	updateRealTimeReading: function(data) {
		document.getElementById("min-value").textContent = data.minValue.toFixed(2)
		document.getElementById("max-value").textContent = data.maxValue.toFixed(2)

		document.getElementById("input-time").innerHTML = mainData.currentTime[mainData.currentTime.length - 1] || "0"
		document.getElementById("read-value").innerHTML = mainData.readValue[mainData.readValue.length - 1].toFixed(2) || "0" 
	}
}


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

let graph1 = new Chart(document.getElementsByClassName("canvas")[0].getContext("2d"), {
	type: "line",
	data: {
		datasets: [{
			label: "Posição (rad)",
			backgroundColor: "rgba(128, 128, 128, 0.8)",
			borderColor: "rgb(128, 128, 128)"
		}, {
			label: "Corrente (A)",
			backgroundColor: "rgba(240, 230, 140, 0.8)",
			borderColor: "rgb(240, 230, 140)"
		}, {
			label: "Tensão na entrada analógica (V)",
			backgroundColor: "rgba(0, 62, 110, 0.8)",
			borderColor: "rgb(0, 62, 110)"
		}]
	},
	options: {
		scales: {
			xAxes: [{
				scaleLabel: {
					display: true,
					labelString: "Tempo (s)"
				}
			}]
		}
	}
})
let graph2 = new Chart(document.getElementsByClassName("canvas")[1].getContext("2d"), {
	type: "line",
	data: {
		datasets: [{
			label: "Sinal de Controle",
			backgroundColor: "rgba(128, 128, 128, 0.8)",
			borderColor: "rgb(128, 128, 128)"
		}]
	},
	options: {
		scales: {
			xAxes: [{
				scaleLabel: {
					display: true,
					labelString: "Tempo (s)"
				}
			}],
		}
	}
})

function resetGraphs() {
	graph1.data.labels = []
	graph1.data.datasets[0].data = []
	graph1.data.datasets[1].data = []
	graph1.data.datasets[2].data = []
	graph1.update();
	
	graph2.data.labels = []
	graph2.data.datasets[0].data = []
	graph2.update()
}

function updateGraphs() {
	if(mainData.usingCurrentSensor)
		graph1.data.datasets[1].data = mainData.currentSensor

	if(mainData.usingAnalogInput)
		graph1.data.datasets[2].data = mainData.analogInput


	graph1.data.labels = mainData.currentTime
	graph1.data.datasets[0].data = mainData.readValue
	graph1.update()
	
	graph2.data.labels = mainData.currentTime
	graph2.data.datasets[0].data = mainData.controlSignal
	graph2.update()
}


function controllerTypeHaveChanged() {
	const value = document.getElementById("controller-type-selector").value
	const inputZone = document.getElementById("controller-value-zone")

	inputZone.innerHTML = "<p><span class='special-font'>P: </span><input type='text' id='proportional' class='input-values' value='0'>"

	if(value == "PI")
		inputZone.innerHTML += "<p><span class='special-font'>I: </span><input type='text' id='integrative' class='input-values' value='0'>"
	if(value == "PD")
		inputZone.innerHTML += "<p><span class='special-font'>D: </span><input type='text' id='derivative' class='input-values' value='0'>"
	else if(value == "PID") {
		inputZone.innerHTML += "<p><span class='special-font'>I: </span><input type='text' id='integrative' class='input-values' value='0'>"
		inputZone.innerHTML += "<p><span class='special-font'>D: </span><input type='text' id='derivative' class='input-values' value='0'>"
	}
}


function configIsOk() {
	
	if(parseFloat(document.getElementById("sampling-time").value) <= 0) {
		alert("Tempo de amostragem deve ser maior que 0")
		return false
	}

	if(parseFloat(document.getElementById("end-time").value) <= 0) {
		alert("Duração deve ser maior que 0")
		return false
	}

	if(parseFloat(document.getElementById("proportional").value) == NaN) {
		alert("É necessário passar um valor para o proporcional")
		return false
	}

	const value = document.getElementById("controller-type-selector").value

	if(value == "PI") {
	
		if(parseFloat(document.getElementById("integrative").value) == NaN) {
			alert("É necessário passar um valor para o integrativo")
			return false
		}
	
	} else if(value == "PD") {
		
		if(parseFloat(document.getElementById("derivative").value) == NaN) {
			alert("É necessário passar um valor para o derivativo")
			return false
		}
		
	} else if(value == "PID") {
	
		if(parseFloat(document.getElementById("integrative").value) == NaN) {
			alert("É necessário passar um valor para o integrativo")
			return false
		}

		if(parseFloat(document.getElementById("derivative").value) == NaN) {
			alert("É necessário passar um valor para o derivativo")
			return false
		}
	}

	return true
}

function getConfig() {
	let integrative = 0
	let derivative = 0
	const value = document.getElementById("controller-type-selector").value

	if(value == "PI")
		integrative = parseFloat(document.getElementById("integrative").value)
	else if(value == "PD")
		derivative = parseFloat(document.getElementById("derivative").value)
	else if(value == "PID") {
		integrative = parseFloat(document.getElementById("integrative").value)
		derivative = parseFloat(document.getElementById("derivative").value)
	}

	mainData.usingCurrentSensor = document.getElementById("use-current-sensor").checked
	mainData.usingAnalogInput = document.getElementById("use-analog-input").checked

	return {
		mode: "closed",
		usingCurrentSensor: mainData.usingCurrentSensor,
		usingAnalogInput: mainData.usingAnalogInput,
		samplingTime: parseFloat(document.getElementById("sampling-time").value),
		endTime: parseFloat(document.getElementById("end-time").value),
		parameters: {
			proportional: parseFloat(document.getElementById("proportional").value),
			integrative: integrative,
			derivative: derivative
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
		console.log(data)
		mainData.transferData(data)
		mainData.updateRealTimeReading(data)
		updateGraphs()

		if(data.values[data.values.length - 1] != undefined && data.values[data.values.length - 1].currentTime >= parseFloat(document.getElementById("end-time").value))
			mainData.end()
	}, mainData.end)
}
