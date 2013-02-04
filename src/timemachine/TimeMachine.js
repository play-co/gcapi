import lib.PubSub as PubSub;

import .Files;
import .Random;
import .LineInfo;
import .Resources;

import .data.Frames as Frames;
import .data.Logs as Logs;

import .watchers.objectWatcher as objectWatcher;

import .record.recordLogger as recordLogger;
import .record.recordRandom as recordRandom;
import .record.recordWindow as recordWindow;
import .record.recordDocument as recordDocument;
import .record.recordXMLHttpRequest as recordXMLHttpRequest;
import .record.recordDate as recordDate;
import .record.recordSetInterval as recordSetInterval;
import .record.recordSetTimeout as recordSetTimeout;

import .replay.replayLogger as replayLogger;
import .replay.replayRandom as replayRandom;
import .replay.replayWindow as replayWindow;
import .replay.replayDocument as replayDocument;
import .replay.replayXMLHttpRequest as replayXMLHttpRequest;
import .replay.replayDate as replayDate;
import .replay.replaySetInterval as replaySetInterval;
import .replay.replaySetTimeout as replaySetTimeout;
import .replay.replayRendering as replayRendering;

var TIME_MACHINE_NONE = 1;
var TIME_MACHINE_RECORDING = 2;
var TIME_MACHINE_REPLAYING = 3;

var TimeMachine = exports = Class(PubSub, function (supr) {
	this.init = function (opts) {
		supr(this, "init", arguments);

		this._launch = opts.launch;
		this._cb = opts.cb;
		this._mode = this._launch.getMode() || TIME_MACHINE_REPLAYING;
		this._log = this._launch.useLog();

		console.log("============== Time Machine ==============");
		console.log("mode: " + ["?", "none", "recording", "replaying"][this._mode]);
		console.log("log: " + this._log);

		console.log("===setRootDTCallback===");
		this._testDT = 0;
		setRootDTCallback(bind(this, function(dt) { this._testDT = dt; return 30; });

		this._index = 0;
		this._fileList = false;
		this._frames = new Frames({timeMachine: this, timeLimit: 60000 * 10, launch: this._launch});

		GLOBAL.CONFIG.timeMachine = this;
		this.isVerbose = true;

		this._setup();
	};

	this._setup = function () {
		this._ready = false;
		this._logs = new Logs();
		this._files = new Files();
		this._files.loadFileList(bind(this, "_onLoadFileList"));
	};

	this._selectLastRecording = function () {
		var file = this._fileList.files[this._fileList.files.length - 1];
		var index = this._launch.getIndex();
		var target = this._launch.getTarget();
		var i = this._fileList.files.length;

		while (i) {
			if ((this._fileList.files[--i].index === index) && (this._fileList.files[i].target === target)) {
				file = this._fileList.files[i];
				break;
			}
		}

		this._validTarget = (file.target === target);
		this._index = file.index;
		this._launch.setIndex(this._index);
		logger.log("Time machine: Replay recording from", new Date(file.startTime));
	};

	this._onLoadFileList = function (fileList) {
		if (fileList.error || !fileList.files || !fileList.files.length) {
			if (this._mode === TIME_MACHINE_REPLAYING) {
				logger.log("Time machine: Can't replay, no valid recordings found.");
				this._mode = TIME_MACHINE_NONE;
			}
		} else {
			this._fileList = fileList;
			this._selectLastRecording();
			this.publish("FileList");
		}

		if (this._mode !== TIME_MACHINE_NONE) {
			logger.log("Initializing time machine...");

			this._randomSeed = Date.now();

			this._frames.subscribe("SaveData", this, "_onSaveData");
			this._frames.subscribe("Finished", this, "_onFinished");

			this._resources = new Resources({frames: this._frames});

			this._lineInfo = new LineInfo();
		}

		switch (this._mode) {
			case TIME_MACHINE_NONE:
				this._cb && this._cb();
				break;

			case TIME_MACHINE_REPLAYING:
				this._setupReplay();
				break;

			case TIME_MACHINE_RECORDING:
				this._setupRecording();
				break;
		}
	};

	this._onSaveData = function (startTime, history) {
		var data = {
				index: this._index,
				frames: history
			};

		if (this._saveStartData) {
			data.startTime = startTime;
			data.randomSeed = this._randomSeed;
			data.target = this._launch.getTarget();
			this._saveStartData = false;
		}

		if (this._log) {
			var logs = this._logs.getLines();
			if (logs.length) {
				data.logs = logs;
				this._logs.setLines([]);
			}
		}

		this._files.saveData(data);
	};

	this._parseFile = function (data) {
		var result = {localStorage: {}, frames: []};
		var logs = [];
		var lines = data.s.split("\n");
		var line;
		var json;
		var tag;
		var i, j, k;

		for (i = 0, j = lines.length; i < j; i++) {
			line = lines[i];
			k = line.indexOf(":");
			if (k !== -1) {
				tag = line.substr(0, k);
				try {
					json = JSON.parse(line.substr(k + 1, line.length - k - 1));
				} catch (e) {
					tag = "";
				}
				if (tag === "logs") {
					logs = logs.concat(json);
				} else if (tag === "frames") {
					result.frames = result.frames.concat(json);
				} else {
					result[tag] = json;
				}
			}
		}

		this._logs.setLines(logs);

		return result;
	};

	this._onLoadData = function (data) {
		this.publish("FramesReady");

		if (data.error) {
			this._ready = false;
			logger.log("Time machine: failed to load recording", data.info || "");
		} else {
			data = this._parseFile(data);

			localStorage.clear();
			for (var i in data.localStorage) {
				localStorage.setItem(i, data.localStorage[i]);
			}

			replayRandom.setup(data.randomSeed);

			this._frames.load(data);
			this._ready = true;
			this.publish("ReplayLoaded");
		}

		this._cb(this);
	};

	this._onFinished = function () {
		this._ready = false;

		switch (this._mode) {
			case TIME_MACHINE_RECORDING:
				logger.log("Time machine: finished recording...");

				this._log && recordLogger.restore(this);
				recordWindow.restore();
				recordDocument.restore();
				recordSetInterval.restore();
				recordSetTimeout.restore();
				break;

			case TIME_MACHINE_REPLAYING:
				logger.log("Time machine: finished replaying...");

				this._log && replayLogger.restore(this);
				replayWindow.restore();
				replayDocument.restore();
				replaySetInterval.restore();
				replaySetTimeout.restore();
				break;
		}
	};

	this._setupReplay = function () {
		if (this._validTarget) { // Was this recorded on the same type of device?
			this._log && replayLogger.setup(this);
			replayWindow.setup(this);
			replayDocument.setup(this);
			replaySetInterval.setup(this);
			replaySetTimeout.setup(this);
			replayRendering.setup(this);
		}

		this._files.loadData(this._index, bind(this, "_onLoadData"));
	};

	this._onDataSaved = function (response) {
		if (response.error) {
			logger.error("Time machine: error while saving data", response.info || "");
			this._mode = TIME_MACHINE_NONE;
		} else if (response.index == undefined) {
			logger.error("Time machine: index expected");
			this._mode = TIME_MACHINE_NONE;
		} else {
			this._index = response.index;
			this._saveStartData = true;

			this._log && recordLogger.setup(this);
			recordRandom.setup(this._randomSeed);
			recordDocument.setup(this);
			recordWindow.setup(this);
			recordDate.setup();
			recordSetInterval.setup(this);
			recordSetTimeout.setup(this);

			this._ready = true;
		}

		this._cb(this);
	};

	this._setupRecording = function () {
		recordXMLHttpRequest.setup(this._frames);

		this.publish("FramesReady");
		this._files.saveData({localStorage: localStorage}, bind(this, "_onDataSaved"));
	};

	this.recStop = function () {
		var data = {
			index: this._index,
			logs: this._logs.getLines()
		};

		if (this._saveStartData) {
			data.startTime = startTime;
			data.randomSeed = this._randomSeed;
			this._saveStartData = false;
		}
		this._files.saveData(data);
	};

	this.isReady = function () {
		return this._ready;
	};

	this.isEnabled = function () {
		return (this._mode !== TIME_MACHINE_NONE);
	};

	this.isRecording = function () {
		return (this._mode === TIME_MACHINE_RECORDING);
	};

	this.isReplaying = function () {
		return (this._mode === TIME_MACHINE_REPLAYING);
	};

	this.getFrames = function () {
		return this._frames;
	};

	this.getLogs = function () {
		return this._logs;
	};

	this.getResources = function () {
		return this._resources;
	};

	this.getLineInfo = function() {
		return this._lineInfo;
	};

	this.getRenderingEnabled = function () {
		return replayRendering.isEnabled();
	};

	this.getFileList = function () {
		return this._fileList;
	};

	this.getFiles = function () {
		return this._files;
	};

	this.getLaunch = function () {
		return this._launch;
	};

	this.getValidTarget = function () {
		return this._validTarget;
	};
});