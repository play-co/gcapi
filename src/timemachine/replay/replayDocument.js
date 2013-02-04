var doneSetup = false;
var oldCreateElement = null;
var oldImage;

var listenerNames = [
		"load",
		"reload",
		"error"
	];

var listenerByName = {};
for (var i = 0; i < listenerNames.length; i++) listenerByName[listenerNames[i]] = listenerNames[i];

function defineGetter (timeMachine, frames, element, name) {
	element.__defineGetter__(
		"on" + name.toLowerCase(),
		function (listener) {
			timeMachine.isVerbose && console.log("Get on" + name);

			cbRun = element._listeners[name];
			return (cbRun === -1) ? false : frames._history[cbRun.tickIndex].cb[cbRun.index];
		}
	);
}

function defineSetter (timeMachine, element, name, cb) {
	element.__defineSetter__(
		"on" + name.toLowerCase(),
		function (listener) {
			timeMachine.isVerbose && console.log("Set on" + name);

			if (listener) {
				var newListener = listener;
				if (cb) {
					newListener = function () {
						cb();
						listener();
					}
				}
				newListener.__origin = timeMachine.getLineInfo().get();
				element._listeners[name] = timeMachine.getFrames().addCBToHistoryFrame("Document", newListener);
			} else {
				element._listeners[name] = -1;
			}
		}
	);
}

function wrapElement (element, timeMachine) {
	var frames = timeMachine.getFrames();

	element._listeners = {};
	element._complete = false;

	var listenerCallbacks = {
		load: function() {
			element._complete = true;
		}
	};

	for (var listenerName in listenerByName) {
		element._listeners[listenerName] = -1;
		defineGetter(timeMachine, frames, element, listenerName);
		defineSetter(timeMachine, element, listenerName, listenerCallbacks[listenerName]);
	}

	element.__defineGetter__(
		"complete",
		function () {
			return element._complete;
		}
	);

	element.addEventListener("load", bind(timeMachine.getResources(), "replayLoaded", element));

	element.oldAddEventListener = element.addEventListener;

	element.addEventListener = function (type, listener, useCapture) {
		if (listenerByName[type]) {
			listener.__origin = timeMachine.getLineInfo().get();
			frames.addCBToHistoryFrame("Document", listener);
		} else {
			this.oldAddEventListener.apply(this, [type, listener, useCapture]);
		}
	}
}

function wrapImage (timeMachine) {
	var scope = timeMachine.getLaunch().isNative ? GLOBAL : window;
	oldImage = scope.Image;
	scope.Image = function() {
		var image = new oldImage();
		wrapElement(image, timeMachine);

		return image;
	};
}

function wrapCreateElement (timeMachine) {
	if (!timeMachine.getLaunch().isNative) {
		oldCreateElement = document.createElement;
		document.createElement = function (type) {
			var element = oldCreateElement.apply(document, arguments);
			if ((type === "iframe") || (type === "audio")) {
				wrapElement(element, timeMachine);
			}

			return element;
		};
	}
}

exports.setup = function (timeMachine) {
	if (doneSetup) {
		return;
	}

	doneSetup = true;

	wrapImage(timeMachine);
	wrapCreateElement(timeMachine);
};

exports.restore = function () {
	doneSetup = false;
	document.createElement = oldCreateElement;
}