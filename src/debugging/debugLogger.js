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

// this whole file should not get included in release
if (DEBUG) {
	import device;
	import math.geom.Point as Point;
	import net;
	import net.protocols.Cuppa;
	import ui.resource.Image as Image;
	import ui.ImageView as ImageView;

	GLOBAL._DEBUG = new (Class(function () {

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
	}));

	function stringify(value) {
		if (value === null) {
			return 'null';
		} else if (typeof value == 'object') {
			if (isArray(value)) {
				value = value.slice(0);
				for (var i = 0, n = value.length; i < n; ++i) {
					value[i] = stringify(value[i]);
				}
				return '[' + value.join(', ') + ']';
			} else if (value.__class__) {
				return '[object ' + value.__class__ + ']';
			} else {
				return Object.prototype.toString.call(value);
			}
		} else {
			return String(value);
		}
	}

	var installed = false;
	var conn = null;
	var buffer = [];
	var LOG_LOCK = false;
	var timeout = null;
	var timedout = false;

	function install() {
		import base;

		var oldLog = base.log;

		// kill connection
		timeout = setTimeout(function() { timedout = true; }, 10000);

		base.log = function() {
			if (!timedout && !LOG_LOCK) {
				LOG_LOCK = true; // prevent recursive loops if sendEvent decides to log stuff

				// convert arguments to strings
				var n = arguments.length;
				var args = new Array(n);
				for (var i = 0; i < n; ++i) {
					args[i] = stringify(arguments[i]);
				}

				// buffer log lines
				if (!conn || !conn.isConnected()) {
					buffer.push(args);
				} else {
					// flush logs
					if (buffer[0]) {
						for (var i = 0, log; log = buffer[i]; ++i) {
							conn.sendEvent('LOG', log);
						}
						buffer = [];
					}
					
					// send log
					conn.sendEvent('LOG', args);
				}

				LOG_LOCK = false;
			}

			return oldLog.apply(this, arguments);
		};

		installed = true;
	}

	function flushBuffer() {
		// we timed out, so bail
		if (!buffer) { return conn.close(); }

		// if we buffered log messages, send them
		var n = buffer.length;
		for (var i = 0; i < n; ++i) {
			conn.sendEvent('LOG', buffer[i]);
		}

		buffer = [];
	}

	exports.getConn = function () { return conn; }

	exports.connect = function (transport, opts) {
		logger.log("debugLogger.connect" + JSON.stringify(transport) + JSON.stringify(opts));
		if (!installed) { install(); }

		conn = new net.protocols.Cuppa();

		conn.onError = function(err) {
			logger.log('log protocol error:', err);
		}

		conn.onConnect(function() {
			clearTimeout(timeout);

			conn.sendEvent("HANDSHAKE", {
				"type": jsio.__env.name,
				"appID": CONFIG.appID,
				"version": CONFIG.version,
				"title": CONFIG.title,
				"shortName": CONFIG.shortName,
				"userAgent": navigator.userAgent,
				"device": NATIVE.device
			});

			flushBuffer();

			logger.log('DEBUGGING CONNECTION MADE');
		});

		conn.onDisconnect(function() {
			logger.log('DEBUGGING CONNECTION LOST');
		});

		conn.onRequest.subscribe('EVAL', this, function(req) {
			try {
				var value;
				if (GLOBAL.NATIVE && NATIVE.eval) {
					value = NATIVE.eval(req.args, "[console]");
				} else {
					value = window.eval(req.args, "[console]");
				}

				req.respond(stringify(value));
			} catch (e) {
				req.error(e.name + ": " + e.message);
			}
		});

		exports.handleInspectorRequests(conn);
		net.connect(conn, transport, opts);
	}

	exports.initLocalInspector = function () {
		var conn = new net.protocols.Cuppa();
		exports.handleInspectorRequests(conn);
		//we need to get the port this is serving on
		var port = '__debug_timestep_inspector_' + window.location.port + '__';
		net.connect(conn, 'postmessage', {win: window.parent, port: port});
	}

	var OverlayRenderer = Class(function () {
		// store the views we need to render
		this._highlightViewUID = null;
		this.setHighlight = function (uid) { this._highlightViewUID = uid; }

		this._selectedViewUID = null;
		this.setSelected = function (uid) { this._selectedViewUID = uid; }

		var tick = 0;
		var maxColor = 255;
		var minColor = 100;
		
		//render the highlighted view
		var _now = +new Date();
		var _t = 0;
		function renderHighlight (pos, ctx) {
			ctx.save();
			ctx.translate(pos.x, pos.y);
			ctx.rotate(pos.r);
			
			// pulsate the blue
			tick += -(_now - (_now = new Date()));

			var weight = (Math.sin(2 * Math.PI * tick / 1000) + 1) / 2;
			var val = (weight * (maxColor - minColor)) + minColor | 0;

			
			var color = '0,' + (val * .7 | 0) + ',' + (val | 0);

			ctx.strokeStyle = 'rgba(' + color + ', 0.7)';
			ctx.strokeRect(0, 0, pos.width, pos.height);
			ctx.fillStyle = 'rgba(' + color + ', 0.6)';
			ctx.fillRect(0, 0, pos.width, pos.height);

			//draw the cross hair
			//ctx.fillStyle = 'rgb(' + val + ',' + val + ',' + val +')';
			var opacity = weight * (1 - 0.4) + 0.4;
			ctx.fillStyle = 'rgba(255,255,255,' + (opacity.toFixed(2)) +')';
			ctx.translate(pos.anchorX, pos.anchorY);
			ctx.rotate(tick / 500);

			ctx.fillRect(-0.5, -7, 1, 14);
			ctx.fillRect(-7, -0.5, 14, 1);

			ctx.restore();
		}

		function renderSelected(pos, ctx) {
			ctx.save();
			ctx.translate(pos.x, pos.y);
			ctx.rotate(pos.r);
			ctx.strokeStyle = "red";
			ctx.lineWidth = 1;
			ctx.strokeRect(-0.5, -0.5, pos.width + 1, pos.height + 1);
			ctx.restore();
		}

		if (device.simulating && document.body && document.body.appendChild) {
			var canvas = new (device.get('Canvas'))();
			canvas.style.cssText = 'position: absolute; left: 0; top: 0; z-index: 1000; pointer-events: none;';
			document.body.appendChild(canvas);

			this.constructor.ctx = canvas.getContext('2d');
		}

		// used to drive renderer separately when app is paused
		this.startTick = function () {
			this.stopTick();
			this._tick = setInterval(bind(this, 'render'), 1000 / 30);
		}

		// used to stop renderer's timer when app is unpaused
		this.stopTick = function () {
			if (this._tick) {
				clearInterval(this._tick);
			}
		}
		
		this.setEnabled = function (isEnabled) {
			this._isEnabled = isEnabled;
			if (OverlayRenderer.ctx) {
				OverlayRenderer.ctx.clear();
			}
		}

		this.render = function (ctx) {
			// if (!this._isEnabled) { return; }

			// on simulated devices, we have our own canvas
			// so size it to fit the screen (clearing it too)
			if (OverlayRenderer.ctx) {
				ctx = OverlayRenderer.ctx;
				ctx.canvas.width = device.screen.width;
				ctx.canvas.height = device.screen.height;
			}

			// render highlighted views
			if (this._highlightViewUID !== null) {
				var view = _DEBUG.getViewByID(this._highlightViewUID);
				var pos = view && view.getPosition();
				if (pos) renderHighlight(pos, ctx);
			}

			// render selected views
			if (this._selectedViewUID !== null) {
				var view = _DEBUG.getViewByID(this._selectedViewUID);
				var pos = view && view.getPosition();
				if (pos) renderSelected(pos, ctx);
			}
		}
	});

	exports._overlay = new OverlayRenderer();

	// mapping for reading/writing style properties on a view
	// map: inspector id -> style property
	var _propMap = {
		relX: 'x',
		relY: 'y',
		relR: 'r',
		relWidthPercent: 'widthPercent',
		relHeightPercent: 'heightPercent',
		relWidth: 'width',
		relHeight: 'height',
		relScale: 'scale',
		opacity: 'opacity',
		zIndex: 'zIndex',
		visible: 'visible',
		anchorX: 'anchorX',
		anchorY: 'anchorY',
		offsetX: 'offsetX',
		offsetY: 'offsetY',
		clip: 'clip',
		layout: 'layout',
		inLayout: 'inLayout',
		top: 'top',
		left: 'left',
		bottom: 'bottom',
		right: 'right',
		flex: 'flex',
		direction: 'direction',
		justifyContent: 'justifyContent',
		order: 'order',

		layoutWidth: 'layoutWidth',
		layoutHeight: 'layoutHeight',
		centerX: 'centerX',
		centerY: 'centerY',
		minWidth: 'minWidth',
		minHeight: 'minHeight',
		maxWidth: 'maxWidth',
		maxHeight: 'maxHeight',
	};

	exports.handleInspectorRequests = function (conn) {

		if (CONFIG.splash) {
			var prevHide = CONFIG.splash.hide;
			CONFIG.splash.hide = function () {
				prevHide && prevHide.apply(this, arguments);
				if (conn) {
					conn.onConnect(function () {
						conn.sendEvent('HIDE_LOADING_IMAGE');
					});
				}
			}
		}

		var DebugInputHandler = Class(function () {

			import device;
			var _simulateMouseMove = device.simulating && document.body.addEventListener;

			this.init = function (conn) {
				this.conn = conn;
				this.onMouseMoveCapture = bind(this, this.onMouseMoveCapture);
				this.setShiftDown = bind(this, this.setShiftDown);
				this.onContextMenu = bind(this, this.onContextMenu);

				if (_simulateMouseMove) {
					window.addEventListener('mousemove', this.onMouseMoveCapture, true);

				}

				//exports._overlay.setSize(GC.app.view.style.width, GC.app.view.style.height);

				//hacky hack to determine if the shift was set or not
				window.addEventListener('mousedown', this.setShiftDown, true);
				window.addEventListener('contextmenu', this.onContextMenu, true);

				GC.app.view.subscribe('InputMoveCapture', this, 'onInputMoveCapture');
				//GC.app.view.subscribe('InputStartCapture', this, 'onInputSelectCapture');
			}

			this.setShiftDown = function (e) {
				if (e.which === 3 || e.button === 2) {
					e.stopPropagation();
					e.preventDefault();
					return false;
				}

				this._shiftDown = !!e.shiftKey;

				if (this._shiftDown) {
					this.onInputSelectCapture(e);
					e.stopPropagation();
					e.preventDefault();
					return;
				}
			}

			import event.input.dispatch as dispatch;

			this.onContextMenu = function (e) {
				var data = {
					pt: {x: e.pageX, y: e.pageY}
				};

				//get the views under the pointer
				var clickEvt = {pt: [], trace: [], depth: 0};
				var clickPt = new Point(e.pageX, e.pageY);
				dispatch.traceEvt(GC.app.view, clickEvt, clickPt);

				if (!clickEvt.trace.length) return;
				data.active = clickEvt.trace[0].uid;

				//get the views under the pointer
				var mockEvt = {pt: [], trace: [], depth: 0};
				var mockPt = new Point(e.pageX, e.pageY);

				this.traceEvt(GC.app.view, mockEvt, mockPt);

				data.trace = [];
				//convert to small objects
				for (var i = mockEvt.trace.length - 1, item; item = mockEvt.trace[i]; --i) {
					data.trace.push({
						uid: item.view.uid,
						tag: item.view.getTag(),
						depth: item.depth
					});
				}

				this.conn.sendEvent('INPUT_TRACE', data);

				e.stopPropagation();
				e.preventDefault();
				return false;
			}

			this.destroy = function () {
				if (_simulateMouseMove) {
					window.removeEventListener('mousedown', this.onMouseDownCapture, true);
				}

				window.removeEventListener('mousedown', this.setShiftDown, true);
				GC.app.view.unsubscribe('InputMoveCapture', this, 'onInputMoveCapture');
				//GC.app.view.unsubscribe('InputStartCapture', this, 'onInputSelectCapture');
			}

			this.onInputMoveCapture = function (evt, pt, allEvt, allPt) {
				var trace = [];
				
				//loop backwards through the trace
				for (var i = evt.trace.length - 1, view; view = evt.trace[i]; --i) {
					trace.push(view.uid);
					
					var superview = view.getSuperview();
					while (superview && superview != evt.trace[i + 1]) {
						trace.push(superview.uid);
						superview = superview.getSuperview();
					}
				}

				var data = {
					x: pt.x,
					y: pt.y,
					trace: trace
				};

				this.conn.sendEvent('INPUT_MOVE', data);
			}

			this.onInputSelectCapture = function (e) {
				//only send event if shift click
				

				var evt = {pt: [], trace: [], depth: 0};
				var pt = new Point(e.pageX, e.pageY);
				dispatch.traceEvt(GC.app.view, evt, pt);

				var trace = [];
				for (var i = evt.trace.length - 1, view; view = evt.trace[i]; --i) {
					trace.push(view.uid);

					var superview = view.getSuperview();
					while (superview && superview != evt.trace[i + 1]) {
						trace.push(superview.uid);
						superview = superview.getSuperview();
					}
				}

				var data = {
					x: pt.x,
					y: pt.y,
					trace: trace
				};
				
				this.conn.sendEvent('INPUT_SELECT', data);
			}

			

			this.traceEvt = function(view, evt, pt, depth) {
				depth = depth || 0;

				var localPt = view.style.localizePoint(new Point(pt));
				
				//if the point is contained add it to the trace
				if (view.containsLocalPoint(localPt)) { 
					evt.trace.unshift({view: view, depth: depth});
					evt.pt[view.uid] = localPt; 
				}

				var subviews = view.getSubviews();
				for (var i = subviews.length - 1; i >= 0; --i) {
					if (subviews[i].style.visible) {
  						this.traceEvt(subviews[i], evt, localPt, depth + 1);
  					}
				}

				if (subviews.length === 0) {
					evt.target = view;
					return true;
				}
			};

			this.onMouseMoveCapture = function (e) {
				//$.stopEvent(e);
				
				//get the event to the active target
				var mockEvt = {pt: [], trace: [], depth: 0};
				var mockPt = new Point(e.pageX, e.pageY);
				dispatch.traceEvt(GC.app.view, mockEvt, mockPt);

				this.onInputMoveCapture(mockEvt, mockPt);
			}
		});

		conn.onConnect(this, function () {
			// connected is not enough, if there was an error,
			// the app might not exist and we shouldn't try
			// to initialize the remote inspector
			if (GC.app) {
				conn.sendEvent('APP_READY', {uid: GC.app.view.uid});

				GC.app.engine.unsubscribe('Render', this);
				GC.app.engine.subscribe('Render', this._overlay, 'render');
			}
		});

		conn.onEvent.subscribe('BATCH', this, function (evt) {
			var i;
			for (i in evt.args) {
				conn.onEvent.publish(evt.args[i].name, evt.args[i].args);
			}
		});

		conn.onEvent.subscribe('SET_NAME', this, function (evt) {
			GLOBAL._name = evt.args.name;
			logging.setPrefix(evt.args.name + ': ');
		});

		var _homeScreen = false;
		conn.onEvent.subscribe('HOME_BUTTON', this, function () {
			if (!GC) return;

			var app = GC.app;

			if (this._homeScreen) {
				GC._onShow && GC._onShow();
				app.engine.resume();
			} else {
				GC._onHide && GC._onHide();
				app.engine.pause();

				var canvas = document.getElementsByTagName('canvas');
				if (canvas.length) {
					canvas = canvas[0];
					if (canvas.getContext) {
						var ctx = canvas.getContext('2d');
						ctx.fillStyle = '#000000';
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					}
				}
			}

			this._homeScreen ^= true;
		});

		conn.onEvent.subscribe('BACK_BUTTON', this, function (evt) {
			GLOBAL.NATIVE.onBackButton();
		});

		conn.onRequest.subscribe('SCREENSHOT', this, function (req) {
			var canv = document.getElementsByTagName('canvas')[0]
			req.respond({
				width: canv.width,
				height: canv.height,
				canvasImg: canv.toDataURL('image/png')
			});
		});

		conn.onEvent.subscribe('MUTE', this, function (evt) {
			GLOBAL.ACCESSIBILITY.mute(evt.args.shouldMute);
		});

		var _paused = false;
		conn.onEvent.subscribe('PAUSE', this, function () {
			if (!GC) return;
			var app = GC.app;

			if (_paused) {
				app.engine.resume();
				exports._overlay.stopTick();
			} else {
				app.engine.pause();
				exports._overlay.startTick();
			}
			_paused = !_paused;
		});

		conn.onEvent.subscribe('STEP', this, function () {
			if (!GC) return;
			var app = GC.app;

			app.engine.stepFrame();
			_paused = true;
		});

		var _input = null;
		conn.onRequest.subscribe('ADD_MOUSE_EVT', this, function (req) {
			if (!_input) { _input = new DebugInputHandler(conn); }
			req.respond();
		});

		conn.onRequest.subscribe('REMOVE_MOUSE_EVT', this, function (req) {
			if (_input) { _input.destroy(); }
			req.respond();
		});

		conn.onEvent.subscribe('SET_HIGHLIGHT', this, function (req) {
			this._overlay.setHighlight(req.args.uid);
			//this._overlay.render();
		});

		conn.onEvent.subscribe('SET_SELECTED', this, function (req) {
			this._overlay.setSelected(req.args.uid);
			//this._overlay.render();
		});

		function findBetterTag (view) {
			var parent = view.getSuperview();
			for (var key in parent) {
				if (parent[key] === view) {
					return key;
				}
			}

			return null;
		}

		conn.onRequest.subscribe('GET_ROOT_UID', this, function (req) {
			req.respond({uid: GC.app.view.uid});
		});

		conn.onRequest.subscribe('GET_VIEW', this, function (req) {
			var view = _DEBUG.getViewByID(req.args.uid);
			if (!view) {
				req.error('no view with id' + req.args.uid, {VIEW_NOT_FOUND: true});
			} else {
				var sup = view.getSuperview();

				//create the optimal tag
				var tag = view.getTag && view.getTag() || view.toString();
				var betterTag = findBetterTag(view);
				if (betterTag) tag = betterTag + ":" + tag;

				req.respond({
					uid: view.uid,
					superviewID: sup && sup.uid,
					tag: tag,
					subviewIDs: view.getSubviews().map(function (view) { return view.uid; })
				});
			}
		});

		conn.onRequest.subscribe('REPLACE_IMAGE', this, function (req) {
			var args = req.args;
			var imgData = args.imgData;
			var uid = args.uid;

			var view = _DEBUG.getViewByID(uid);
			var newImg = new Image();

			newImg._srcImg.addEventListener("load", function() {
				var map = newImg._map;	
				map.width = newImg._srcImg.width,
				map.height = newImg._srcImg.height,
				map.x = 0;
				map.y = 0;
				view.setImage(newImg);
				view.needsRepaint();
			}, false);
		
			newImg._srcImg.src = imgData;
		});

		conn.onRequest.subscribe('GET_VIEW_PROPS', this, function (req) {
			var args = req.args;
			var view = _DEBUG.getViewByID(args.uid);
			if (!view) {
				return req.error("VIEW_NOT_FOUND");
			}

			var s = view.style;
			var p = view.getPosition();
			var layout = view.__layout;
			var ret = {};
			for (var key in _propMap) {
				ret[key] = s[_propMap[key]];
			}

			merge(ret, {
				absX: p.x,
				absY: p.y,
				absR: p.r,
				absWidth: p.width,
				absHeight: p.height,
				absScale: p.scale,

				subviews: layout && (typeof layout.getSubviews == 'function') && layout.getSubviews().length,
				direction: layout && (typeof layout.getDirection == 'function') && layout.getDirection(),
				padding: s.padding && s.padding.toString()
			});

			for (var key in ret) {
				if (ret[key] == undefined) {
					ret[key] = '-';
				}
			}

			ret.isImageView = view instanceof ImageView;

			if (ret.isImageView) {
				ret.imagePath = view._opts.image || (view._img && view._img._map && view._img._map.url);
				if (ret.imagePath && ret.imagePath._map) {
					ret.imagePath = ret.imagePath._map.url;
				}
			}

			ret.uuid = args.uid;

			ret.description = (view.constructor.name || 'View') + ' ' + args.uid + '\n' + view.getTag();

			req.respond(ret);
		});

		conn.onRequest.subscribe('SET_VIEW_PROP', this, function (req) {
			var args = req.args;
			var view = _DEBUG.getViewByID(args.uid);
			if (!view) {
				return req.error("VIEW_NOT_FOUND");
			}

			var key = args.key;
			var value = args.value;
			if (key in _propMap) {
				view.style[_propMap[key]] = value;
			} else {
				switch (key) {
					case 'absX': break;
					case 'absY': view.style.y = value; break;
					case 'absWidth': view.style.width = value; break;
					case 'absHeight': view.style.height = value; break;
					case 'absScale': view.style.scale = value; break;
					case 'padding': view.style.padding = value; break;
				}
			}
		});

		var _pollTimer = null;
		var _pollView = null;

		conn.onEvent.subscribe('POLL_VIEW_POSITION', this, function (evt) {

			function poll() {
				if (_pollView) {
					var eventData = _pollView.getPosition();
					eventData.uid = _pollView.uid;
					
					conn.sendEvent('POLL_VIEW_POSITION', eventData);
				}
			}

			_pollView = _DEBUG.getViewByID(evt.args.uid);
			if (!_pollTimer && _pollView) {
				_pollTimer = setInterval(poll, 100);
			}

			if (!_pollView) {
				clearInterval(poll);
				_pollTimer = null;
			}
		});
	}
}
