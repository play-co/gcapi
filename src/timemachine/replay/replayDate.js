var doneSetup = false;
var oldNow = Date.now;
var oldDate = Date;
var currentValueOf = 0;

exports.getOldNow = function () {
	return oldNow.apply(oldDate);
};

exports.setCurrentValueOf = function (v) {
	currentValueOf = v;
};

exports.addDT = function (dt) {
	currentValueOf += dt;
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
}