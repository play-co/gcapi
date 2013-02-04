var doneSetup = false;
var oldDate = Date;
var currentValueOf = Date.now();
var startTime = -1;

exports.getOldDate = function () {
	return oldDate || Date;
};

exports.getCurrentValueOf = function () {
	currentValueOf = +new Date().oldValueOf();
	return currentValueOf;
};

exports.getStartTime = function () {
	return startTime;
};

exports.setStartTime = function (v) {
	startTime = v;
};

exports.setup = function () {
	if (doneSetup) {
		return;
	}

	doneSetup = true;

	Date.prototype.oldValueOf = Date.prototype.valueOf;

	Date.prototype.valueOf = function () {
		return currentValueOf;
	};

	Date.now = function () {
		return currentValueOf;
	};
};

exports.restore = function () {
	doneSetup = false;
	Date = oldDate;
};
