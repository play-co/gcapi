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

import device;

NATIVE.screen.onResize = function(width, height) {
	logger.log('native screen resize', width, height);
	window.screen.width = width;
	window.screen.height= height;
	device.screen.publish('Resize', width, height);
	if (width > height) {
		device.screen.isPortrait = false;
		device.screen.isLandscape = true;
		device.screen.orientation = 'landscape';
	} else {
		device.screen.isPortrait = true;
		device.screen.isLandscape = false;
		device.screen.orientation = 'portrait';
	}
	device.screen.width = width;
	device.screen.height = height;
	device.width = width;
	device.height = height;
	
	device.screen.publish('Resize', width, height);
	logger.log('onResize', JSON.stringify(device.screen));
}
