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

handlers = {};

NATIVE.events = {};
NATIVE.events.registerHandler = function(name, handler) {
	handlers[name] = handler;
}

NATIVE.events.dispatchEvent = function(evt) {
	var e = evt;
	if (typeof e == 'string') {
		e = JSON.parse(e);
	}

	var handler = handlers[e.name];
	if (handler) {
		handler(e);
	}
}

jsio('import .input');
jsio('import .plugins');
jsio('import .overlay');
jsio('import .purchase');
jsio('import .pauseResume');
jsio('import .offscreenBuffer');
jsio('import .dialog');
jsio('import .log');
jsio('import .imageLoading');
jsio('import .soundLoading');
jsio('import .backButton');
jsio('import .online');
jsio('import .inputPrompt');
jsio('import .rotation');