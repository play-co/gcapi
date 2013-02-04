var doneSetup = false;
var oldXMLHttpRequest = null;
var readyStateCallbacks = [];
var readyStateIndex = -1;

exports.getReadyStateCallback = function() {
	readyStateIndex++;
	return readyStateCallbacks[readyStateIndex];
};

exports.setup = function(timeMachine) {
	if (doneSetup) {
		return;
	}

	doneSetup = true;
	oldXMLHttpRequest = XMLHttpRequest;

	XMLHttpRequest = function () {
		this.status = 0;

		this.open = function () {
		};

		this.setRequestHeader = function () {
		};

		this.getAllResponseHeaders = function () {
			return this.allResponseHeaders;
		};

		this.getResponseHeader = function (type) {
			if (!this._allResponseHeaders) {
				if (typeof this.allResponseHeaders === "string") {
					this._allResponseHeaders = {};

					var list = this.allResponseHeaders.split("\n");
					var header;
					var i = list.length;
					var j;

					while (i) {
						header = list[--i];
						j = header.indexOf(":");
						if (header.substr(0, j)) {
							this._allResponseHeaders[header.substr(0, j)] = header.substr(-(header.length - j - 2));
						}
					}
				} else {
					this._allResponseHeaders = this.allResponseHeaders;
				}
			}
			return this._allResponseHeaders[type];
		};

		this.send = function (data) {
			this.onreadystatechange.stamp = true;
			readyStateCallbacks.push({
				cb: this.onreadystatechange,
				xhr: this
			});
		};
	};
};

exports.restore = function () {
	doneSetup = false;
	XMLHttpRequest = oldXMLHttpRequest;
};