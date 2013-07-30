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

"use import";

import lib.PubSub;

var InputPrompt = new Class(lib.PubSub, function (supr) {});
NATIVE.InputPrompt = new InputPrompt();

NATIVE.events.registerHandler('inputPromptSubmit', function (evt) {
	NATIVE.InputPrompt.publish('Submit', evt);
});

NATIVE.events.registerHandler('inputPromptCancel', function (evt) {
	NATIVE.InputPrompt.publish('Cancel', evt);
});

NATIVE.events.registerHandler('inputPromptKeyUp', function (evt) {
    NATIVE.InputPrompt.publish('KeyUp', evt);
});

NATIVE.events.registerHandler('inputPromptMove', function (evt) {
    NATIVE.InputPrompt.publish('Move', evt);
});

NATIVE.events.registerHandler('keyboardScreenResize', bind(window, '__fireEvent', 'keyboardScreenResize'));
