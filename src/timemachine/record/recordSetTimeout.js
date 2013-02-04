var doneSetup = false;
var oldSetTimeout = null;
var oldClearTimeout = null;
var list = [];
var timeoutID = 0;

var Timeout = Class(function() {
	this.init = function(opts) {
		this._frames = opts.frames;
		this._endTime = Date.now() + (opts.time || 1);
		this._cbIndex = this._frames.addCB("Timeout", opts.cb);

		timeoutID++;
		this.id = timeoutID;
	};

	this.run = function() {
		if (Date.now() > this._endTime) {
			this._frames.addCBRun("Timeout", this._cbIndex);
			return true;
		}

		return false;
	};
});

exports.setup = function(timeMachine) {
	if (doneSetup) {
		return;
	}

	var frames = timeMachine.getFrames();

	doneSetup = true;
	oldSetTimeout = setTimeout;
	oldClearTimeout = clearTimeout;

	setTimeout = function(cb, time) {
		cb.__origin = timeMachine.getLineInfo().get();

		if (time === 0) {
			frames._timeoutCalls.push(cb);
			return -1;
		} else {
			var timeout = new Timeout({
					timeMachine: timeMachine,
					frames: frames,
					time: time,
					cb: cb
				});
			list.push(timeout);

			return timeout.id;
		}
	};

	clearTimeout = function(id) {
		var i = 0;
		while (i < list.length) {
			if (list[i].id == id) {
				list.splice(i, 1);
				return;
			}
			i++;
		}
	};
};

exports.run = function() {
	var timeout;
	var i = 0;

	while (i < list.length) {
		if (list[i].run()) {
			list.splice(i, 1);
		} else {
			i++;
		}
	}
};

exports.restore = function () {
	doneSetup = false;
	setTimeout = oldSetTimeout;
	clearTimeout = oldClearTimeout;
};