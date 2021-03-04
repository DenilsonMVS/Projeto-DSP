
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


function startButtonClick() {
	alert("Você não selecionou o tipo de malha.")
}

function endButtonClick() {
	alert("Você não iniciou a operação.")
}

function saveButtonClick() {
	if(confirm("Deseja ir para a página de download?"))
		window.location.href = "download-files"
}


/*function a() {
	runRequest("/test", {comida: "feijão"}, function(data) {
		console.log(data)
	})
}*/