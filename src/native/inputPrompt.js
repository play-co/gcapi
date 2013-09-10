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

import lib.PubSub;

merge(NATIVE.input, lib.PubSub.prototype);

console.log(NATIVE.input, NATIVE.input.openPrompt);

NATIVE.events.registerHandler('InputPromptSubmit', function (evt) {
	NATIVE.input.publish('InputPromptSubmit', evt);
});

NATIVE.events.registerHandler('InputKeyboardSubmit', function (evt) {
	NATIVE.input.publish('Submit', evt);
});

NATIVE.events.registerHandler('InputKeyboardCancel', function (evt) {
	NATIVE.input.publish('Cancel', evt);
});

NATIVE.events.registerHandler('InputKeyboardKeyUp', function (evt) {
    NATIVE.input.publish('KeyUp', evt);
});

NATIVE.events.registerHandler('InputKeyboardFocusNext', function (evt) {
    NATIVE.input.publish('FocusNext', evt);
});

NATIVE.events.registerHandler('keyboardScreenResize', bind(window, '__fireEvent', 'keyboardScreenResize'));
