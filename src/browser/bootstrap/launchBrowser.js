/** @license
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

// this file bootstraps the loading screen in a web browser

import .renderer;
import lib.Callback;

var MAX_FPS = 15;
var PAUSE_DURATION = 250;
var FADE_DURATION = 500;
var TEST_INVITE = false;

var delegate;
var callDelegate = function (f) { if (delegate[f]) { return delegate[f].apply(delegate, Array.prototype.slice.call(arguments, 1)); }};

// Setup
var controller = CONFIG.splash || {};
var d = document;
var el = d.body.appendChild(d.createElement('canvas'));
// some android phones mock out html5 objects, but don't implement them
var ctx = el.getContext && el.getContext('2d');

// Fill the screen
el.style.cssText = 'position:absolute; background:' + (controller.color || 'black');

// Explicitly set opacity so we can easily fade the canvas out later
el.style.opacity = 1;
el.style.webkitTransition = 'opacity ' + FADE_DURATION + 'ms linear';

// Ensure the element is above everything
el.style.zIndex = 65534;

el.onmousedown = el.ontouchstart = function (e) { callDelegate('onTap', e); e.stopPropagation(); e.preventDefault(); }

// update DOM on resize
var onResize = function () {
	// resize the canvas context to fit real pixels
	var width = window.innerWidth;
	var height = window.innerHeight;

	if (el.width != width || el.height != height) {
		el.width = width;
		el.height = height;

		el.style.width = width + 'px';
		el.style.height = height + 'px';

		renderer.setOpts(callDelegate, ctx, width, height);
		callDelegate('onResize');
		renderer.render();
	}
};

controller.render = function () { renderer.render(); }

controller.startTick = function () {
	this._interval = setInterval(bind(controller, 'onTick'), 1000 / MAX_FPS);
}

controller.onTick = function () {
	callDelegate('onTick');
	this.render();
}

controller.show = function () {
	callDelegate('onBeforeShow');

	onResize();
	window.addEventListener('resize', onResize, false);
	window.addEventListener('orientationchange', onResize, false);

	d.body.appendChild(el);

	if (!el.style.opacity) {
		el.style.opacity = 1;
		setTimeout(bind(this, callDelegate, 'onShow'), FADE_DURATION);
	} else {
		callDelegate('onShow');
	}
};

var onHide = new lib.Callback();

// This is called automatically when the app is ready unless autoHide === false
controller.hide = function (cb) {
	onHide.run(cb);

	if (!callDelegate('onBeforeHide')) {

		onHide.fire();
		onHide.reset();

		setTimeout(bind(this, function () {
			el.style.opacity = 0;
			setTimeout(bind(this, function () {
				window.removeEventListener('resize', onResize, false);
				window.removeEventListener('orientationchange', onResize, false);
				d.body.removeChild(el);
				
				if (this._interval) { clearInterval(this._interval); }
				callDelegate('onHide');
			}, FADE_DURATION));
		}), PAUSE_DURATION);
	}
};

controller.onAppLoadError = function (error) {
	callDelegate('onAppLoadError', error);
};

delegate = {
	onLoad: function () {
		console.log('Init');

		var img = null;
		jsio("import device");
		// If landscape mode,
		if (device && device.width > device.height) {
			img = controller.landscape768;
			if (!img) img = controller.landscape1536;
		} else {
			img = controller.portrait480;
			if (!img) img = controller.portrait960;
			if (!img) img = controller.portrait1024;
			if (!img) img = controller.portrait1136;
			if (!img) img = controller.portrait2048;
		}

		window.CACHE = IMG_CACHE; // Hack!

		// if (img) {
		// 	jsio("import .ImageView");
		// 	new loader.ImageView({
		// 		image: img,
		// 		scaleMethod: controller.scaleMethod
		// 	});
		// }

		controller.show();
	},
	onShow: function () {
		// this gets called in launchClient.js
//		var GC = jsio("import gc.API as GC");
//		GLOBAL.GC.buildApp('launchUI');
	}
}

window._continueLoad();
callDelegate('onLoad', controller);

onResize();
// setTimeout(function () {
// 	window._continueLoad();
// }, 100);