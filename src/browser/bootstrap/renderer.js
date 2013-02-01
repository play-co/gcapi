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

var Renderer = Class(function () {
	this.init = function () {
		this._views = [];
	}

	this.add = function (view) {
		this._views.push(view);
		this.render();
	}

	this.setOpts = function (delegate, ctx, width, height) {
		this._delegate = delegate;
		this._ctx = ctx;
		this.width = width;
		this.height = height;

		var canvas = ctx.canvas;
		canvas.width = this.width;
		canvas.height = this.height;
	}
	
	this.render = function () {
		// some android phones mock out html5 objects, but don't implement them
		var ctx = this._ctx;
		if (!ctx) { return; }

		// clear the canvas with clear rect
		var canvas = ctx.canvas;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		for (var i = 0, v; v = this._views[i]; ++i) {
			v.render(ctx);
		}

		this._delegate('onRender', ctx);
		ctx.restore();
	};
});

exports = new Renderer();

	// // Display name
	// if (displayName) {
	// 	var r = preload.displayName;
		
	// 	ctx.fillStyle = preload.textColor || 'black';
	// 	ctx.textAlign = 'center';
	// 	ctx.verticalAlign = 'middle';
	// 	ctx.textBaseline = 'middle';
	// 	ctx.font = 'bold 24px "Droid Sans", Helvetica';
	// 	ctx.fillText(displayName.toUpperCase(), r.x + r.w/2, r.y + r.h/2);
	// }

	// // Photo
	// if (photoImgReady) {
	// 	var r = preload.photo;
	// 	ctx.drawImage(photoImg, r.x, r.y, r.w, r.h);
	// }
