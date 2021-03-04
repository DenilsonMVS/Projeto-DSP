
function sendHTTPRequest(method, url, data) {
	return new Promise(function(resolve, reject){
		const xhr = new XMLHttpRequest()
		xhr.open(method, url)

		xhr.responseType = "json"
		xhr.setRequestHeader("Content-Type", "application/json")

		xhr.onload = function() {
			resolve(xhr.response)
		}

		xhr.onerror = function() {
			reject(xhr.statusText)
		}

		xhr.send(JSON.stringify(data))
	})
}

function runRequest(url, data, func, error) {
	sendHTTPRequest("POST", url, data).then(func).catch(error)
}
