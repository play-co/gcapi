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

"use import";

import lib.PubSub;

var _evts = new lib.PubSub();

window.addEventListener = function(evtName, cb, isBubble) {
	_evts.subscribe(evtName, window, cb);
}

window.removeEventListener = function(evtName, cb, isBubble) {
	_evts.unsubscribe(evtName, window, cb);
}

window.__fireEvent = function(name, evt) {
	if (!evt) { evt = {}; }
	evt.type = name;
	_evts.publish(name, evt);
}
