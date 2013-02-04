function watcher (opts, index) {
	var property = opts.path[index];
	var obj = opts.context;

	obj.__defineGetter__(
		property,
		function () {
			return obj["____" + property];
		}
	);

	obj.__defineSetter__(
		property,
		function (v) {
			obj["____" + property] = v;
			if (opts.path.length === index + 2) {
				v[opts.path[index + 1]] = opts.f;
			} else {
				opts.context = v;
				watcher(opts, index + 1);
			}
		}
	);
}

exports = function (opts) {
	opts.path = opts.path.split(".");
	watcher(opts, 0);
};