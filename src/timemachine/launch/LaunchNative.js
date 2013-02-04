exports = Class(function () {
	this.init = function () {
		this._useTimeMachine = false;

		this._index = -1;

		var info = GLOBAL.localStorage.getItem("___timeMachine");
		if (info !== null) {
			try {
				info = JSON.parse(info);
				this._index = info.index;
				this._mode = info.mode || 1;
				this._useTimeMachine = true;
			} catch (e) {
			}
		}

		this.isNative = true;
	};

	this.useLog = function () {
		return true;
	};

	this.useTimeMachine = function () {
		return this._useTimeMachine;
	};

	this.getMode = function () {
		return this._mode;
	};

	this.getIndex = function () {
		return this._index;
	};

	this.setIndex = function (index) {
	};

	this.getFastForwardTime = function () {
		return 0;
	};

	this.setFastForwardTime = function (time) {
	};

	this.getTarget = function () {
		return 'native';
	};
});