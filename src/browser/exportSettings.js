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

"use import";
from util.underscore import _;
import std.uri as URI;

var keysToIgnore = /^tr_pending|BOOKMARK_DISMISSED_COUNT/

var exportSettings = function () {
	var oldUrl = new URI(window.location);
	var protocol = oldUrl.query('protocol');
	var url = new URI(protocol + "://" + window.location.host + window.location.pathname);
	alert(url);
	var settings = {};
	_.each(_.reject(_.keys(localStorage), function (key) {
		return key.match(keysToIgnore);
	}), function (key) {
			settings[key] = localStorage[key];
			logger.log(key, settings[key]);
	});
	url.addQuery({settings:JSON.stringify(settings)});
	window.location = url;
}

exportSettings();

