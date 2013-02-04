exports = Class(function () {
	this.init = function (opts) {
		this._frames = opts.frames;
		this._frames.setResources(this);

		this._loadedResources = {};
		this._waitingList = [];
	};

	this._filePath = function (url) {
		for (var i = 0; i < 3; i++) {
			var j = url.indexOf("::/"[i]);
			url = url.substr(j + 1, url.length - j - 1);
		}
		return url;
	}

	this.recordLoaded = function (filename) {
		var frameData = this._frames.getFrameData();
		if (!frameData.loaded) {
			frameData.loaded = [];
		}
		frameData.loaded.push(this._filePath(filename));
	};

	this.replayLoaded = function (element) {
		this._loadedResources[this._filePath(element.src)] = true;
	};

	this.waitingForResources = function (frameData) {
		var waitingList = this._waitingList;
		var loadedResources = this._loadedResources;

		if (frameData.loaded) {
			this._waitingList.concat(frameData.loaded);
		}

		var i = 0;
		while (i < waitingList.length) {
			if (loadedResources[waitingList[i]]) {
				waitingList.splice(i, 1);
			} else {
				i++;
			}
		}

		return waitingList.length > 0;
	};
});
