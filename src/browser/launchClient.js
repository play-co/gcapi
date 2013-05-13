/* @license
 * This file is part of the Game Closure SDK.
 *
 * The Game Closure SDK is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * The Game Closure SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with the Game Closure SDK.  If not, see <http://www.gnu.org/licenses/>.
 */

if (DEBUG) {
	// prefix filenames in the debugger
	jsio.__env.debugPath = function (path) { return 'http://' + window.location.host + '/' + path; }
}

// shims

if (!window.JSON) {
	jsio('import std.JSON').createGlobal();
}

if (!window.console) {
	window.console = {};
	window.console.log = window.console.info = window.console.error = window.console.warn = function () {};
}

if (!window.localStorage) {
	window.localStorage = {
		getItem: function () {},
		setItem: function () {},
		removeItem: function () {}
	}
}

// parsing options
import std.uri;
var uri = new std.uri(window.location);
var mute = uri.hash('mute');
CONFIG.isMuted = mute != undefined && mute != "false" && mute != "0" && mute != "no";

if (DEBUG) {
	// device simulation

	// simulate device chrome, input, and userAgent
	var sim_device = uri.query('device') || uri.hash('device');
	if (sim_device) {
		// hack to access SDK static resolutions file from a debug device
		try {
			jsio("import preprocessors.import");
			jsio("import preprocessors.cls");

			import .simulateDevice;
			var resImport = "import ..util.resolutions";
			jsio.__jsio(resImport);

			simulateDevice.simulate(util.resolutions.get(sim_device));
		} catch (e) {
			logger.error(e);
		}
	}

	import ..debugging.connect;
	debugging.connect.connect(null, startApp);
} else {
	startApp();
}

function startApp (conn) {

	// setup timestep device API

	import device;
	import platforms.browser.initialize;
	device.init();

	// logging

	if (DEBUG) {

		import ..debugging.TimestepInspector;
		conn.addClient(new debugging.TimestepInspector());

		var initDebugging = function () {
			var env = jsio.__env;
			
			var originalSyntax = bind(env, env.checkSyntax);
			var originalFetch = bind(env, env.fetch);

			env.fetch = function (filename) {
				logging.get('jsiocore').warn('LOADING EXTERNAL FILE:', filename);
				return originalFetch.apply(this, arguments);
			}
			
			env.checkSyntax = function (code, filename) {
				var xhr = new XMLHttpRequest();
				xhr.open('POST', '/.syntax', false);
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.onreadystatechange = function () {
					if (xhr.readyState != 4) { return; }
				
					if (xhr.status == 200 && xhr.responseText) {
						var err;
						try {
							var response = JSON.parse(xhr.responseText);
							err = response[1].stderr.replace(/^stdin:(\d+):/mg, filename + ' line $1:');
						} catch(e) {
							err = xhr.responseText;
						}

						console.log(err);
						
						document.body.innerHTML = '<pre style=\'font: bold 12px Monaco, "Bitstream Vera Sans Mono", "Lucida Console", Terminal, monospace; color: #FFF;\'>' + err + '</err>';
					} else if (xhr.status > 0) {
						originalSyntax(code, filename);
					}
				}
			
				xhr.send('javascript=' + encodeURIComponent(code));
			}
		};

		if (device.isMobileBrowser) {
			conn.initLogProxy();
			conn.initRemoteEval();
		}

		initDebugging();
	}

	// init sets up the GC object
	import gc.API;
	GC.buildApp('launchUI');

	if (DEBUG) {
		conn.setApp(GC.app);
	}
}
