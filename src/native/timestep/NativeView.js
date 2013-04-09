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

// monkey patch the View prototype (object composition)

from ui.filter import Filter;

exports.install = function() {
	import ui.View as View;

	var proto = View.prototype;

	// TODO this is only going to work with 1 filter
	proto.addFilter = function(filter) {
		this._filters[filter.getType()] = filter;
		filter.setView(this);
		filter.update();
	};

	proto.removeFilter = function(type) {
		if (this.__view.filterType == Filter.TYPES[type]) {
			this.clearFilters();
		}
		delete this._filters[type];
	};

	proto.clearFilters = function() {
		this.__view.filterType = 'None';
		this.__view.filterColor = 'rgba(0,0,0,0)';
	};
};
