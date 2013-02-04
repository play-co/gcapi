var doneSetup = false;
var oldSetInterval = null;
var oldClearInterval = null;

exports.setup = function (timeMachine) {
	if (doneSetup) {
		return;
	}

	doneSetup = true;
	oldSetInterval = setInterval;
	oldClearInterval = clearInterval;

	setInterval = function (cb, interval) {
		cb.__origin = timeMachine.getLineInfo().get();

		timeMachine.getFrames().addCBToHistoryFrame("Interval", cb);
	};

	clearInterval = function (id) {
	};
};

exports.restore = function () {
	doneSetup = false;
	setInterval = oldSetInterval;
	clearInterval = oldClearInterval;
}