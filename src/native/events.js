/**
 * @license
 * This file is part of the Game Closure SDK.
 *
 * The Game Closure SDK is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License v. 2.0 as published by Mozilla.

 * The Game Closure SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Mozilla Public License v. 2.0 for more details.

 * You should have received a copy of the Mozilla Public License v. 2.0
 * along with the Game Closure SDK.  If not, see <http://mozilla.org/MPL/2.0/>.
 */

handlers = {};

NATIVE.events = {};
NATIVE.events.registerHandler = function (name, handler) {
	handlers[name] = handler;
}

NATIVE.events.dispatchEvent = function (evt) {
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
jsio('import .prompt');
jsio('import .contacts');
