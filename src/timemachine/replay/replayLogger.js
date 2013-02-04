var doneSetup = false;
var oldLog;
var oldWarn;
var oldError;

function nr (index) {
	index = index.toString(10);
	while (index.length < 4) index = "_" + index;
	return index;
}

function compareLog (oldArgs, args) {
	var same = false;
	var a1, a2;
	var i;

	if (oldArgs === false) {
		return;
	}
	if (oldArgs.length === args.length) {
		same = true;
		i = args.length;
		while (i) {
			i--;
			a1 = args[i] + "";
			a2 = oldArgs[i] + "";
			if (a1 !== a2) {
				if ((a1 === "undefined") || (a1 === "null")) {
					if ((a2 !== "undefined") && (a2 !== "null")) {
						same = false;
						break;
					}
				} else {
					same = false;
					break;
				}
			}
		}
	}

	return same;
};

function wrapLoggerMethod (timeMachine, methodName, oldMethod, oldError) {
	console[methodName] = function() {
		var args = Array.prototype.slice.call(arguments);
		var oldArgs = timeMachine.getLogs().get();

		if (isArray(oldArgs)) {
			args.unshift(nr(timeMachine.getFrames()._historyIndex));

			if (compareLog(oldArgs, args)) {
				oldMethod.apply(console, args);
			} else {
				oldArgs.unshift("Expected:");
				oldError.apply(console, oldArgs);
				args.unshift("Found:   ");
				oldError.apply(console, args);
			}
		}
	};
}

function wrapLogger (timeMachine) {
	oldLog = console.log;
	oldWarn = console.warn;
	oldError = console.error;

	console.oldLog = bind(console, oldLog);
	console.oldWarn = bind(console, oldWarn);
	console.oldError = bind(console, oldError);

	wrapLoggerMethod(timeMachine, "log", oldLog, oldError);
	wrapLoggerMethod(timeMachine, "warn", oldWarn, oldError);
	wrapLoggerMethod(timeMachine, "error", oldError, oldError);
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