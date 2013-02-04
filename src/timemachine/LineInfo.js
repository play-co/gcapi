exports = Class(function () {
	this.get = function (index) {
		var err = this._getErrorObject();
		var callerLine = err.stack.split("\n")[index || 5];

		return callerLine.slice(callerLine.indexOf("at ") + 2, callerLine.length);
	};

	this._getErrorObject = function () {
		return new Error("");
	};
});