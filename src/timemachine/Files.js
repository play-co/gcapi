var XMLHTTPRequest = XMLHttpRequest;
var oldSend = XMLHttpRequest.prototype.send;

exports = Class(function (supr) {
	this._request = function (url, data, cb) {
		import device;

		if (device.isMobileNative) {
			url = window.location.substr(0, window.location.length - 1) + url;
		}

		var xmlHTTPRequest = new XMLHTTPRequest();
		var sendData = {
				appID: GLOBAL.CONFIG.appID,
				shortName: GLOBAL.CONFIG.shortName,
			};

		if (data) {
			sendData.data = data;
		}

		this._cb = cb;

		xmlHTTPRequest._url = url;
		xmlHTTPRequest.open("POST", url, true);
		xmlHTTPRequest.setRequestHeader("Content-Type", "application/json");
		xmlHTTPRequest.onreadystatechange = bind(this, "onReadyStateChange", xmlHTTPRequest);
		oldSend.apply(xmlHTTPRequest, [JSON.stringify(sendData)]);
	};

	this.onReadyStateChange = function (xmlHTTPRequest) {
		if (xmlHTTPRequest.readyState !== 4) {
			return;
		}

		var response = xmlHTTPRequest.response || xmlHTTPRequest.responseText;
		try {
			var json = JSON.parse(response);
			response = json;
		} catch(e) {
		}

		this._cb && this._cb(response);
	};

	this.loadFileList = function (cb) {
		this._request("/plugins/time_machine/load_file_list", false, cb);
	};

	this.saveData = function (data, cb) {
		this._request("/plugins/time_machine/save_data", data, cb);
	};

	this.saveData = function (data, cb) {
		this._request("/plugins/time_machine/save_data", data, cb);
	};

	this.loadData = function (index, cb) {
		this._request("/plugins/time_machine/load_data", {index: index}, cb);
	};

	this.removeData = function (index, cb) {
		this._request("/plugins/time_machine/remove_data", {index: index}, cb);
	};
});