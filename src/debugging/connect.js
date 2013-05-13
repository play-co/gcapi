/**
 * @license
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

// this whole file should not get included in release
if (DEBUG) {
	import net;
	import net.protocols.Cuppa;

	import ._DEBUG;

	var _conn;
	GLOBAL._DEBUG = new _DEBUG();

	exports.getConn = function () { return _conn; }

	exports.connect = function (opts, cb) {
		var transport = opts && opts.transport;
		var connectOpts = opts && opts.opts;

		if (!transport) {
			if (window.parent != window) {
				// in iframe
				transport = 'postmessage';
				connectOpts = {
					port: '__debug_timestep_inspector_' + window.location.port + '__',
					win: window.parent
				};
			} else {
				// assume we're on a mobile device
				transport = 'csp';
				connectOpts = {
					url: 'http://' + window.location.host + '/plugins/native_debugger/mobile_csp'
				};
			}
		}

		_conn = new DebugConn();
		_conn.onConnect(bind(GLOBAL, cb, _conn));
		net.connect(_conn, transport, connectOpts);

		return _conn;
	}

	var DebugConn = Class(net.protocols.Cuppa, function (supr) {

		this.init = function () {
			supr(this, 'init', arguments);

			this._clients = [];
		}

		this.setApp = function (app) {
			this._clients.forEach(function (client) {
				if (client.setApp) {
					client.setApp(app);
				}
			});
		}

		this.addClient = function (client) {
			this._clients.push(client);
			client.setConn(this);
		}

		this.initLogProxy = function () {
			import .logProxy;
			logProxy.install(this);
		}

		this.initRemoteEval = function () {
			import .remoteEval;
			remoteEval.install(this);		
		}
	});
}
