var doneSetup = false;
var oldSetInterval = null;
var oldClearInterval = null;
var list = [];

var Interval = Class(function() {
	this.init = function(opts) {
		this._frames = opts.frames;
		this._interval = opts.interval;
		this._nextTime = Date.now() + this._interval;
		this._cbIndex = this._frames.addCB("Interval", opts.cb);
	};

	this.run = function() {
		if (Date.now() >= this._nextTime) {
			this._frames.addCBRun("Interval", this._cbIndex);
			this._nextTime = Date.now() + this._interval;
		}
	};

	this.clear = function() {
		var frameData = this._frames.getFrameData();
		if (!frameData.cbClear) {
			frameData.cbClear = [];
		}

		frameData.cbClear.push(this._cbIndex);
	};
});

exports.setup = function(timeMachine) {
	if (doneSetup) {
		return;
	}

	var frames = timeMachine.getFrames();

	doneSetup = true;
	oldSetInterval = setInterval;
	oldClearInterval = clearInterval;

	setInterval = function(cb, interval) {
		var result = list.length;

		cb.__origin = timeMachine.getLineInfo().get();

		list.push(new Interval({
			timeMachine: timeMachine,
			frames: frames,
			interval: interval,
			cb: cb
		}));

		return result;
	};

	clearInterval = function(id) {
		var interval = list[id];
		if (interval) {
			interval.clear();
			list[id] = false;
		}
	};
};

exports.run = function() {
	var interval;
	var i = list.length;

	while (i) {
		interval = list[--i]
		interval && interval.run();
	}
};

exports.restore = function () {
	doneSetup = false;
	setInterval = oldSetInterval;
	clearInterval = oldClearInterval;
};