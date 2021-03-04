
let buttons = []

function askData(fileName) {
	runRequest("/requestVector", {fileName: fileName}, function(data) {
		console.log(data.text);                    
		console.log("Tá tentando salvar")
		let text = data.text
		let blob = new Blob([text], {type: "text/plain; charset = utf-8"})
		saveAs(blob, "arquivos.txt")
	})
}


runRequest("/fileNames", {}, function(data) {
	for(let i = 0; i < data.names.length; i++) {
		buttons[i] = document.createElement('button')
		buttons[i].setAttribute('type','button')
		buttons[i].setAttribute("id", "buttonId" + i)
		buttons[i].setAttribute("class", "btn")
		buttons[i].appendChild(document.createTextNode(data.names[i]))
		document.getElementById("buttons").appendChild(buttons[i])
		document.getElementById("buttons").innerHTML += "<br>"
	}
	for(let i = 0; i < buttons.length; i++) {
		document.getElementById("buttonId" + i).onclick = function() {
			askData(document.getElementById("buttonId" + i).innerHTML)
		}
	}
})
