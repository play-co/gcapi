var doneSetup = false;
var oldXMLHttpRequest = null;

exports.setup = function(frames) {
	if (doneSetup) {
		return;
	}

	doneSetup = true;
	oldXMLHttpRequest = XMLHttpRequest;

	oldXMLHttpRequest.prototype.oldSend = oldXMLHttpRequest.prototype.send;

	oldXMLHttpRequest.prototype.send = function (data) {
		this.oldOnreadystatechange = this.onreadystatechange;
		this.onreadystatechange = bind(
			this,
			function() {
				if (this.readyState === 4) {
					var frameData = frames.getFrameData();
					if (!frameData.xhrResponse) {
						frameData.xhrResponse = [];
					}

					frameData.xhrResponse.push({
						url: this.url,
						responseText: this.responseText,
						status: this.status,
						allResponseHeaders: this.getAllResponseHeaders()
					});
				}
				this.oldOnreadystatechange && this.oldOnreadystatechange.apply(this, arguments);
			}
		);

		return this.oldSend.apply(this, arguments);
	};
};

exports.restore = function () {
	doneSetup = false;
	XMLHttpRequest = oldXMLHttpRequest;
};