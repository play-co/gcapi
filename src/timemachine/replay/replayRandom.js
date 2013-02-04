import ..Random;

var doneSetup = false;
var oldRandom = null;
var random;

exports.setup = function (seed) {
	if (doneSetup) {
		return;
	}

	oldRandom = Math.random();
	random = new Random(seed);

	Math.random = function () {
		return random.random();
	};
};