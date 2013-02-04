var doneSetup = false;
var oldLog;
var oldWarn;
var oldError;

function nr (index) {
	index += "";
	while (index.length < 4) index = "_" + index;
	return index;
}

function wrapLoggerMethod (timeMachine, methodName, oldMethod) {
	console[methodName] = function() {
		var args = Array.prototype.slice.call(arguments);
		args.unshift(nr(timeMachine.getFrames()._history.length));
		oldMethod.apply(console, args);
		timeMachine.getLogs().add(args);
	};
}

function wrapLogger (timeMachine) {
	oldLog = console.log;
	oldWarn = console.warn;
	oldError = console.error;

	console.oldLog = bind(console, oldLog);
	console.oldWarn = bind(console, oldWarn);
	console.oldError = bind(console, oldError);

	wrapLoggerMethod(timeMachine, "log", oldLog);
	wrapLoggerMethod(timeMachine, "warn", oldWarn);
	wrapLoggerMethod(timeMachine, "error", oldError);
}

exports.setup = function (timeMachine) {
	if (doneSetup) {
		return;
	}

	doneSetup = true;

	wrapLogger(timeMachine);
};

exports.restore = function (timeMachine) {
	doneSetup = false;

	console.log = oldLog;
	console.warn = oldWarn;
	console.error = oldError;
}