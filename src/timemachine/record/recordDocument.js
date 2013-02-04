var doneSetup = false;
var oldDocument = null;
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
		function () {
			cbRun = element._listeners[name];

			timeMachine.isVerbose && console.log("Get on" + name);

			if (cbRun === -1) {
				return false;
			} else {
				return frames.getFrameData(cbRun.tickIndex).cbDocument[cbRun.index];
				//return frames._history[cbRun.tickIndex].cbDocument[cbRun.index];
			}
		}
	);
};

function defineSetter (timeMachine, element, name) {
	element.__defineSetter__(
		"on" + name.toLowerCase(),
		function (listener) {
			timeMachine.isVerbose && console.log("Set on" + name);

			if (listener) {
				listener.__origin = timeMachine.getLineInfo().get();
				element._listeners[name] = timeMachine.getFrames().addCB("Document", listener);
			} else {
				element._listeners[name] = -1;
			}
		}
	);
}

function addListener (frames, element, name, cb) {
	element.addEventListener(
		name.toLowerCase(),
		function () {
			cb && cb();
			(element._listeners[name] !== -1) && frames.addCBRun("Document", element._listeners[name]);
		}
	);
}

function wrapElement (element, timeMachine) {
	element._listeners = {};
	element._complete = false;

	var frames = timeMachine.getFrames();
	var listenerCallbacks = {
			load: function() {
				element._complete = true;
				timeMachine.getResources().recordLoaded(element.src);
			}
		};

	for (var listenerName in listenerByName) {
		element._listeners[listenerName] = -1;
		addListener(frames, element, listenerName, listenerCallbacks[listenerName]);
		defineGetter(timeMachine, frames, element, listenerName);
		defineSetter(timeMachine, element, listenerName);
	}

	element.__defineGetter__(
		"complete",
		function () {
			return element._complete;
		}
	);

	element.oldAddEventListener = element.addEventListener;
	element.oldRemoveEventListener = element.addEventListener;

	element.addEventListener = function (type, listener, useCapture) {
		if (listenerByName[type]) {
			listener.__origin = timeMachine.getLineInfo().get();
			listener = bind(frames, "addCBRun", "Document", frames.addCB("Document", listener));
		}
		this.oldAddEventListener.apply(this, [type, listener, useCapture]);
	};

	element.removeEventListener = function (type, listener, useCapture) {
		if (listenerByName[type]) {
			element._listeners[type] = -1;
		} else {
			this.oldRemoveEventListener.apply(this, [type, listener, useCapture]);
		}
	};
};

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
	if (!timeMachine.getLaunch().isNative) {
		oldDocument = document;
	}

	wrapImage(timeMachine);

	if (!timeMachine.getLaunch().isNative) {
		wrapCreateElement(timeMachine);
	}
};

exports.restore = function () {
	doneSetup = false;

	if (!timeMachine.getLaunch().isNative) {
		Image = oldImage;
		document.createElement = oldCreateElement;
	}
}