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

function defineSetter (timeMachine, name) {
	window.__defineSetter__(
		"on" + name.toLowerCase(),
		function (listener) {
			listener.__origin = timeMachine.getLineInfo().get();
			timeMachine.getFrames().addCBToHistoryFrame("Window", listener);
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

	for (var listenerName in listenerNames) {
		defineSetter(timeMachine, listenerName);
	}

	var oldAddEventListener = window.addEventListener;
	var oldLocalStorage = window.localStorage;

	window.__defineSetter__("localStorage", function (v) { logger.warn("Denied changing localStorage."); });
	window.__defineGetter__("localStorage", function () { return oldLocalStorage; });

	window.addEventListener = function (type, listener, useCapture) {
		if (listenerByName[type]) {
			listener.__origin = timeMachine.getLineInfo().get();
			frames.addCBToHistoryFrame("Window", listener);
			return;
		}

		oldAddEventListener.apply(this, [type, listener, useCapture]);
	};
};

exports.restore = function () {
	doneSetup = false;
	Window = oldWindow;
};