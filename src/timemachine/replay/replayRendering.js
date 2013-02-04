var enabled = true;
var doneSetup = false;

function wrapMethod (ctx, name) {
	var oldMethod = ctx[name];

	if (!oldMethod.__isWrapped) {
		ctx[name] = function () {
			if (enabled) {
				return oldMethod.apply(ctx, arguments);
			}
			return false;
		};
		ctx[name].__isWrapped = true;
	}
}

exports.setup = function (timeMachine) {
	if (timeMachine.getLaunch().isNative) {
		doneSetup = true;
		return;
	}
	var elements = document.getElementsByTagName("canvas");
	var ctx;
	var methods = [
		"drawImage",
		"fillRect",
		"clearRect",
		"fillText",
		"strokeText"
	];
	var i = methods.length;

	if (!elements.length) {
		return;
	}
	ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
	while (i) {
		wrapMethod(ctx, methods[--i]);
	}
	doneSetup = true;
};

exports.disableRendering = function (timeMachine) {
	if (!doneSetup) {
		this.setup(timeMachine);
	}
	enabled = false;
};

exports.enableRendering = function (timeMachine) {
	enabled = true;
};

exports.isEnabled = function () {
	return enabled;
};