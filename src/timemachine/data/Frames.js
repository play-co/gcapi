import lib.PubSub as PubSub;

import ..record.recordSetInterval as recordSetInterval;
import ..record.recordSetTimeout as recordSetTimeout;

import ..replay.replayXMLHttpRequest as replayXMLHttpRequest;
import ..replay.replayDate as replayDate;
import ..replay.replayRendering as replayRendering;

var TICK_FIELDS = ["cbRunInterval", "cbRunTimeout", "cbRunDocument", "cbRunWindow", "input", "xhrResponse", "loaded"];

var CB_FIELDS = ["cbInterval", "cbTimeout", "cbDocument", "cbWindow"];
var CB_RUN_FIELDS = ["cbRunInterval", "cbRunTimeout", "cbRunDocument", "cbRunWindow"];

var _screenBuffer;
var _screenBufferCtx;

exports = Class(PubSub, function (supr) {
	this.init = function (opts) {
		supr(this, "init", arguments);

		this._launch = opts.launch;

		this._timeMachine = opts.timeMachine;
		this._resources = null;

		this._paused = !this._launch.isNative;
		this._timeScale = 1;
		this._timeLimit = opts.timeLimit;

		this._maxTime = 0;
		this._totalDT = -1;
		this._totalTime = 0;

		this._history = [];
		this._historyCount = 0;
		this._historyIndex = 0;
		this._historyFrame = null;
		this._historyBreakpoint = null;

		this._timeoutCalls = [];

		this._frameData = {dt: 0};
		this._timeMachine.isRecording() && this._history.push(this._frameData);

		this._saveTime = 0;
		this._saveTimeStamp = 0;
		this._saveHistory = [];

		this._screen = false;

		this._asyncCBRuns = {};
		this._resetAsyncCBRuns();

		if (!this._launch.isNative) {
			_screenBuffer = document.createElement('canvas');
			_screenBufferCtx = _screenBuffer.getContext('2d');
		}
	};

	this._resetAsyncCBRuns = function () {
		var i = CB_RUN_FIELDS.length;
		while (i) {
			this._asyncCBRuns[CB_RUN_FIELDS[--i]] = [];
		}
	};

	this.load = function (data) {
		this._history = data.frames;
		this._startTime = data.startTime;

		var history = this._history;
		var item;
		var i, j;

		this._maxTime = 0;
		for (i = 0, j = history.length; i < j; i++) {
			item = history[i];
			if (typeof item === "number") {
				item = {dt: item};
			}
			item.time = this._maxTime;
			item.index = i;
			history[i] = item;

			this._maxTime += item.dt;
		}

		this._historyIndex = 1;
		this._historyFrame = history[this._historyIndex];
		this._historyCount = history.length - 1;

		replayXMLHttpRequest.setup();
		replayDate.setup();
		replayDate.setCurrentValueOf(this._startTime);
	};

	this._runCallbacks = function (frameData) {
		var cbField;
		var cbRunField;
		var history = this._history;
		var runIndex;
		var cbRun;
		var i;

		i = CB_RUN_FIELDS.length;
		while (i) {
			cbRunField = CB_RUN_FIELDS[--i];
			runIndex = frameData[cbRunField];
			if (runIndex) {
				cbField = CB_FIELDS[i];
				for (j = 0, k = runIndex.length; j < k; j++) {
					cbRun = runIndex[j];
					history[cbRun.tickIndex][cbField][cbRun.index]();
				}
			}
		}
	};

	this._runTimeoutCallbacks = function (frameData) {
		if (this._timeoutCalls.length) {
			// Copy the timeoutCalls because timeoutCalls can add timeoutCalls!!
			var timeoutCalls = [];
			var i, j;

			for (i = 0, j = this._timeoutCalls.length; i < j; i++) {
				timeoutCalls[i] = this._timeoutCalls[i];
			}
			this._timeoutCalls = [];

			while (timeoutCalls.length) {
				timeoutCalls.shift()();
			}
		}
	};

	this._saveFrameData = function (dt) {
		if (this._history.length > 1) {
			var sourceItem = this._history[this._history.length - 2];
			var destItem = {dt: sourceItem.dt};
			var found = false;
			var tickField;
			var i = TICK_FIELDS.length;

			// Only save the relevant fields e.g. don't save the dt field...
			while (i) {
				tickField = TICK_FIELDS[--i];
				if (sourceItem[tickField]) {
					destItem[tickField] = sourceItem[tickField];
					found = true;
				}
			}

			this._saveTimeStamp++;
			if (this._saveTimeStamp > 60) {
				destItem.total = this._totalTime;
				this._saveTimeStamp = 0;
			} else if (!found) {
				destItem = sourceItem.dt;
			}

			this._saveHistory.push(destItem);
		}
	};

	this._screenshot = function () {
		if (this._launch.isNative) {
			return;
		}
		if (!this._screen) {
			this._screen = document.getElementsByTagName("canvas")[0];
		}
		if (this._screen) {
			if (this._screen.width > this._screen.height) {
				_screenBuffer.width = 38;
				_screenBuffer.height = 25;
				_screenBufferCtx.clearRect(0, 0, 38, 25);
				_screenBufferCtx.drawImage(this._screen, 0, 0, this._screen.width, this._screen.height, 0, 0, 38, 25);
			} else {
				_screenBuffer.width = 25;
				_screenBuffer.height = 38;
				_screenBufferCtx.clearRect(0, 0, 25, 38);
				_screenBufferCtx.drawImage(this._screen, 0, 0, this._screen.width, this._screen.height, 0, 0, 25, 38);
			}

			i = this._saveHistory.length - 1;
			item = this._saveHistory[i];
			if (typeof item === "number") {
				item = {dt: item};
				this._saveHistory[i] = item;
			}
			item.screen = {sec: (this._totalTime / 1000) | 0, data: _screenBuffer.toDataURL("image/png")};
		}
	};

	this.recordTick = function (dt, cb) {
		this._history.push(this._frameData);
		this._saveFrameData(dt);

		this._totalTime += dt;
		this._frameData = {dt: dt};

		var frameData = this._frameData;

		this._runTimeoutCallbacks(frameData); // Run the timeouts with time=0 from previous tick...

		recordSetTimeout.run();
		recordSetInterval.run();

		cb.apply(cb, [dt]);

		var cbRunField;
		var runs;
		var i;

		i = CB_RUN_FIELDS.length;
		while (i) {
			cbRunField = CB_RUN_FIELDS[--i];
			runs = this._asyncCBRuns[cbRunField];
			if (runs.length) {
				frameData[cbRunField] = runs;
			}
		}
		this._resetAsyncCBRuns();

		this._runCallbacks(frameData);

		if (this._totalTime > this._timeLimit) {
			this.publish("Finished");
			this._saveTime = 1000;
		}
		this._saveTime += dt;
		if (this._saveTime > 1000) {
			this._screenshot();
			this._saveTime = 0;
			this.publish("SaveData", this._startTime, this._saveHistory);
			this._saveHistory = [];
		}

		this.publish("RecordTick", this._totalTime);
	};

	this._checkBreakpoint = function () {
		if (this._historyFrame.breakpoint && (this._historyBreakpoint !== this._historyFrame)) {
			this._historyBreakpoint = this._historyFrame;
			this._paused = true;
			this.publish("Breakpoint", this._historyFrame);
			return true;
		}
		return false;
	};

	this._canReplayTick = function (dt) {
		if (this._paused) {
			return false;
		}

		if (this._resources.waitingForResources(this._historyFrame)) {
			return false;
		}

		var now = replayDate.getOldNow();
		if (this._totalDT === -1) {
			this._totalDT = now;
		}
		var timeScale = this._timeScale;
		if (timeScale < 1) {
			timeScale = 1;
		}
		if (now >= this._totalDT + this._historyFrame.dt * timeScale) {
			this._totalDT += this._historyFrame.dt * timeScale;
		} else {
			return false;
		}

		if (this._checkBreakpoint()) {
			return;
		}

		return true;
	};

	this._runXHR = function (historyFrame) {
		var xhrResponse = historyFrame.xhrResponse;
		var xhrInfo;
		var xhr;
		var response;
		var i, j;

		if (xhrResponse && xhrResponse.length) {
			for (i = 0, j = xhrResponse.length; i < j; i++) {
				xhrInfo = replayXMLHttpRequest.getReadyStateCallback();
				xhr = xhrInfo.xhr;
				response = xhrResponse[i];
				xhr.url = response.url;
				xhr.status = response.status;
				xhr.responseText = response.responseText;
				xhr.allResponseHeaders = response.allResponseHeaders;
				xhr.readyState = 4;
				xhrInfo.cb(response.responseText);
			}
		}
	};

	this._replayTick = function (cb) {
		if (this._historyIndex < this._historyCount) {
			this._historyIndex++;
			this._historyFrame = this._history[this._historyIndex];
			this._totalTime += this._historyFrame.dt;
			replayDate.addDT(this._historyFrame.dt);
		} else {
			this.publish("Finished");
			return;
		}

		this._runTimeoutCallbacks(this._historyFrame);

		cb.apply(cb, [this._historyFrame.dt]);

		this._runCallbacks(this._historyFrame);
		this._runXHR(this._historyFrame)
	};

	this.replayTick = function (cb) {
		if (this._launch.getFastForwardTime()) {
			replayRendering.disableRendering(this._timeMachine);
			var ready = false;
			var i = 0;
			while (i < 60) {
				this._replayTick(cb);
				i++;
				if (!this._launch.getFastForwardTime() || (this._historyFrame.time >= this._launch.getFastForwardTime())) {
					this._launch.setFastForwardTime(0);
					this._paused = false;
					this._totalDT = -1;
					ready = true;
					break;
				}
			}
			replayRendering.enableRendering(this._timeMachine);
			ready && this.publish("FastForwardReady");
		} else if (this._canReplayTick()) {
			this._replayTick(cb);

			if (this._timeScale < 1) {
				var count = this._timeScale;
				replayRendering.disableRendering(this._timeMachine);
				while (count < 0.9999999) {
					if (this._checkBreakpoint()) {
						break;
					}
					this._replayTick(cb);
					count += this._timeScale;
				}
				replayRendering.enableRendering(this._timeMachine);
			}
		} else {
			return;
		}

		this.publish("Tick", this._historyFrame, this._maxTime);
	};

	this.addCBRun = function (type, cbRun) {
		this._asyncCBRuns["cbRun" + type].push(cbRun);
	};

	this.addCB = function (type, cb) {
		var field = "cb" + type;
		var frameData = this._frameData;

		if (!frameData[field]) {
			frameData[field] = [];
		}

		frameData[field].push(cb);

		return {tickIndex: this._history.length, index: frameData[field].length - 1};
	};

	this.addCBToHistoryFrame = function (type, cb) {
		var field = "cb" + type;
		var historyIndex = this._historyIndex;
		var frameData = this._history[historyIndex] || history[0] || {};

		if (!frameData[field]) {
			frameData[field] = [];
		}
		frameData[field].push(cb);

		return {tickIndex: historyIndex, index: frameData[field].length - 1};
	};

	this.pause = function () {
		this._paused = true;
	};

	this.resume = function () {
		this._paused = false;
	};

	this.isPaused = function () {
		return this._paused;
	};

	this.setResources = function (resources) {
		this._resources = resources;
	};

	this.getTotalTime = function () {
		return this._totalTime;
	};

	this.setTimeScale = function (timeScale) {
		if (timeScale > 0) {
			this._timeScale = timeScale;
		}
	};

	this.getFrameData = function (index) {
		if (index !== undefined) {
			return this._history[index];
		}

		return this._frameData;
	};

	this.getPrevFrameData = function () {
		return this._history[this._history.length - 1];
	};

	this.getCurrentHistoryFrame = function () {
		return this._historyFrame;
	};

	this.setStartTime = function (startTime) {
		this._startTime = startTime;
	};

	this.getMaxTime = function () {
		return this._maxTime;
	};

	this.getHistory = function () {
		return this._history;
	};

	this.setTimeLimit = function (timeLimit) {
		this._timeLimit = timeLimit;
	};
});