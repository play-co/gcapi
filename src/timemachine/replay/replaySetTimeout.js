var doneSetup = false;
var oldSetTimeout = null;
var oldClearTimeout = null;

exports.setup = function (timeMachine) {
	if (doneSetup) {
		return;
	}

	doneSetup = true;
	oldSetTimeout = setTimeout;
	oldClearTimeout = clearTimeout;

	setTimeout = function (cb, time) {
		cb.__origin = timeMachine.getLineInfo().get();

		if (time === 0) {
			timeMachine.getFrames()._timeoutCalls.push(cb);
			return -1;
		} else {
			timeMachine.getFrames().addCBToHistoryFrame("Timeout", cb);
		}
	};

	clearTimeout = function (id) {
	};
};

exports.restore = function () {
	doneSetup = false;
	setTimeout = oldSetTimeout;
	clearTimeout = oldClearTimeout;
};