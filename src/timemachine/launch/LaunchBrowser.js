exports = Class(function () {
	this.init = function () {
		this._useTimeMachine = false;

		if (top && top.simulator) {
			this._useTimeMachine = top.simulator.timeMachine;
		}

		this.isNative = false;
	};

	this.useLog = function () {
		return true;
	};

	this.useTimeMachine = function () {
		return this._useTimeMachine;
	};

	this.getMode = function () {
		return this._useTimeMachine ? (top.simulator.timeMachineMode || false) : false;
	};

	this.getIndex = function () {
		if (this._useTimeMachine && top.simulator && ("timeMachineIndex" in top.simulator)) {
			return top.simulator.timeMachineIndex;
		}
		return -1;
	};

	this.setIndex = function (index) {
		// Don't implement, only for native!
	};

	this.getFastForwardTime = function () {
		return top.simulator.fastForwardTime;
	};

	this.setFastForwardTime = function (time) {
		top.simulator.fastForwardTime = time;
	};

	this.getTarget = function () {
		return 'browser';
	};
});