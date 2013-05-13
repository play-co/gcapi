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

// this whole file should not get included in release
if (DEBUG) {

	/*
	 * Tools for traversing views from the JS console.
	 * This class ends up being in the global scope:
	 *   GLOBAL._DEBUG = new exports();
	 */
	exports = Class(function () {

		this.traverse = function (f) { return GC.app && this.traverseView(f, GC.app.view); }
		this.traverseView = function(f, view) {
			return {
				uid: view.uid,
				data: f(view),
				subviews: view.getSubviews().map(bind(this, 'traverseView', f))
			};
		}

		this.find = function (f) { return GC.app && this.findView(f, GC.app.view); }
		this.findView = function (f, view) {
			if (f(view)) { return view; }
			var subviews = view.getSubviews();
			for (var i = 0, sub; sub = subviews[i]; ++i) {
				var res = this.findView(f, sub);
				if (res) { return res; }
			}

			return false;
		}

		this.getViewByID = function (uid) { return this.find(function (view) { return view.uid == uid; }); }

		this.pack = function () { return GC.app && this.packView(GC.app.view); }
		this.packView = function (view) {
			import ui.ImageView;
			import ui.TextView;

			return this.traverseView(function (view) {

				if (view instanceof ui.ImageView) {
					var img = view.getImage();
					if (img) {
						var imageData = img.getMap();
						imageData.type = 'ImageView';
					}
				}

				if (view instanceof ui.TextView) {
					var text = view.getText();
				}

				var s = view.style;
				return {
					x: s.x,
					y: s.y,
					width: s.width,
					height: s.height,
					scale: s.scale,
					image: imageData,
					text: text,
					visible: s.visible,
					opacity: s.opacity,
					tag: view.getTag()
				};
			}, view);
		}

		this.unpack = function (data) {
			import ui.View;
			import ui.ImageView;
			import ui.resource.Image;
			import ui.TextView;

			function buildView (superview, data) {
				var view;

				var opts = data.data;
				if (opts.image) {
					var img = opts.image;
					view = new ui.ImageView({
						x: opts.x,
						y: opts.y,
						width: opts.width,
						height: opts.height,
						scale: opts.scale,

						scaleMethod: img.scaleMethod,
						slices: img.slices,

						superview: superview,
						image: new ui.resource.Image({
							url: img.url,
							sourceX: img.x,
							sourceY: img.y,
							sourceW: img.width,
							sourceH: img.height,
							marginTop: img.marginTop,
							marginRight: img.marginRight,
							marginBottom: img.marginBottom,
							marginLeft: img.marginLeft
						}),
						visible: opts.visible,
						opacity: opts.opacity,
						tag: opts.tag
					});
				} else {
					view = new (opts.text ? ui.TextView : ui.View)({
						x: opts.x,
						y: opts.y,
						width: opts.width,
						height: opts.height,
						text: opts.text,
						superview: superview,
						scale: opts.scale,
						visible: opts.visible,
						opacity: opts.opacity,
						tag: opts.tag
					});
				}

				view.uid = data.uid;

				for (var i = 0, sub; sub = data.subviews[i]; ++i) {
					buildView(view, sub);
				}
			}

			GC.app.view.updateOpts(data.data);
			for (var i = 0, sub; sub = data.subviews[i]; ++i) {
				buildView(GC.app.view, sub);
			}
		}

		this.eachView = function (list, f) {
			for (var i = 0, n = list.length; i < n; ++i) {
				var view = this.getViewByID(list[i]);
				if (view) {
					f(view, list[i]);
				} else {
					logger.warn('view', list[i], 'not found');
				}
			}
		}

		this.hideViews = function (/* id1, id2, id3, ... */) {
			this.eachView(arguments, function (view) { view.style.visible = false; });
		}

		this.showViews = function (/* id1, id2, id3, ... */) {
			this.eachView(arguments, function (view) { view.style.visible = true; });
		}

		this.hideAllViews = function () {
			this.traverse(function (view) { view.style.visible = false; });
		}

		this.showAllViews = function () {
			this.traverse(function (view) { view.style.visible = true; });
		}

		this.hideViewRange = function (a, b) {
			var range = [];
			for (var i = a; i < b; ++i) {
				range.push(i);
			}

			this.hideViews.apply(this, range);
		}

		this.showViewRange = function (a, b) {
			var range = [];
			for (var i = a; i < b; ++i) {
				range.push(i);
			}

			this.showViews.apply(this, range);
		}
	});
}