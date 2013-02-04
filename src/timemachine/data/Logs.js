exports = Class(function () {
	this.init = function () {
		this._logIndex = -1;
		this._logs = [];
	};

	this.add = function (args) {
		this._logs.push(JSON.parse(JSON.stringify(args)));
	};

	this.get = function () {
		this._logIndex++;
		return this._logs[this._logIndex] || false;
	};

	this.getLines = function () {
		return this._logs;
	};

	this.setLines = function (lines) {
		this._logs = lines;
	};
});
