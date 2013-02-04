var doneSetup = false;
var oldWindow;

var listenerNames = [
		//"message",
		"blur",
		"resize",
		"orientationchange",
		"online",
		"offline",
		"pageshow",
		"pagehide"
	];

var listenerByName = {};
for (var i = 0; i < listenerNames.length; i++) listenerByName[listenerNames[i]] = listenerNames[i];

var listeners = {};
for (var listenerName in listenerByName) {
	listeners[listenerName] = -1;
}

function defineSetter (timeMachine, name) {
	window.__defineSetter__(
		"on" + name.toLowerCase(),
		function (listener) {
			if (listener) {
				listener.__origin = timeMachine.getLineInfo().get();
				listener.__name = name;
				listeners[name] = timeMachine.getFrames().addCB("Window", listener);
			} else {
				listeners[name] = -1;
			}
		}
	);
}

function addListener (frames, name) {
	window.addEventListener(
		name.toLowerCase(),
		function () {
			(listeners[name] !== -1) && frames.addCBRun("Window", listeners[name]);
		}
	);
}

exports.setup = function (timeMachine) {
	if (doneSetup) {
		return;
	}

	var frames = timeMachine.getFrames();

	doneSetup = true;
	oldWindow = window;

	for (var listenerName in listenerByName) {
		defineSetter(timeMachine, listenerName);
		addListener(frames, listenerName);
	}

	var oldAddEventListener = window.addEventListener;

	window.addEventListener = function (type, listener, useCapture) {
		var i = listenerNames.length;
		while (i) {
			if (type === listenerNames[--i]) {
				listener.__origin = timeMachine.getLineInfo().get();
				var cbRun = frames.addCB("Window", listener);
				listener = function () {
					frames.addCBRun("Window", cbRun);
				};
				break;
			}
		}

		oldAddEventListener.apply(this, [type, listener, useCapture]);
	};
};

exports.restore = function () {
	doneSetup = false;
	window = oldWindow;
}