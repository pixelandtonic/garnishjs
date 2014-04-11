/*!
 * Garnish
 */

// Bail if Garnish is already defined
if (typeof Garnish != 'undefined')
{
	throw 'Garnish is already defined!';
}


Garnish = {

	// jQuery objects for common elements
	$win: $(window),
	$doc: $(document),
	$bod: $(document.body)

};

Garnish.rtl = Garnish.$bod.hasClass('rtl');
Garnish.ltr = !Garnish.rtl;

Garnish = $.extend(Garnish, {

	// Key code constants
	DELETE_KEY:  8,
	SHIFT_KEY:  16,
	CTRL_KEY:   17,
	ALT_KEY:    18,
	RETURN_KEY: 13,
	ESC_KEY:    27,
	SPACE_KEY:  32,
	LEFT_KEY:   37,
	UP_KEY:     38,
	RIGHT_KEY:  39,
	DOWN_KEY:   40,
	A_KEY:      65,
	S_KEY:      83,
	CMD_KEY:    91,

	// Mouse button constants
	PRIMARY_CLICK:   1,
	SECONDARY_CLICK: 3,

	// Axis constants
	X_AXIS: 'x',
	Y_AXIS: 'y',

	// Node types
	TEXT_NODE: 3,

	/**
	 * Logs a message to the browser's console, if the browser has one.
	 *
	 * @param string msg
	 */
	log: function(msg)
	{
		if (typeof console != 'undefined' && typeof console.log == 'function')
		{
			console.log(msg);
		}
	},

	_isMobileBrowser: null,
	_isMobileOrTabletBrowser: null,

	/**
	 * Returns whether this is a mobile browser.
	 * Detection script courtesy of http://detectmobilebrowsers.com
	 *
	 * Last updated: 2013-02-04
	 *
	 * @param bool detectTablets
	 * @return bool
	 */
	isMobileBrowser: function(detectTablets)
	{
		var key = detectTablets ? '_isMobileOrTabletBrowser' : '_isMobileBrowser';

		if (Garnish[key] === null)
		{
			var a = navigator.userAgent || navigator.vendor || window.opera;
			Garnish[key] = ((new RegExp('(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino'+(detectTablets ? '|android|ipad|playbook|silk' : ''), 'i')).test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)));
		}

		return Garnish[key];
	},

	/**
	 * Returns whether a variable is an array.
	 *
	 * @param mixed val
	 * @return bool
	 */
	isArray: function(val)
	{
		return (val instanceof Array);
	},

	/**
	 * Returns whether a variable is a jQuery collection.
	 *
	 * @param mixed val
	 * @return bool
	 */
	isJquery: function(val)
	{
		return (val instanceof jQuery);
	},

	/**
	 * Returns whether a variable is a string.
	 *
	 * @param mixed val
	 * @return bool
	 */
	isString: function(val)
	{
		return (typeof val == 'string');
	},

	/**
	 * Returns whether something is a text node.
	 *
	 * @param object elem
	 * @return bool
	 */
	isTextNode: function(elem)
	{
		return (elem.nodeType == Garnish.TEXT_NODE);
	},

	/**
	 * Returns the distance between two coordinates.
	 *
	 * @param int x1 The first coordinate's X position.
	 * @param int y1 The first coordinate's Y position.
	 * @param int x2 The second coordinate's X position.
	 * @param int y2 The second coordinate's Y position.
	 * @return float
	 */
	getDist: function(x1, y1, x2, y2)
	{
		return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
	},

	/**
	 * Returns whether an element is touching an x/y coordinate.
	 *
	 * @param int    x    The coordinate's X position.
	 * @param int    y    The coordinate's Y position.
	 * @param object elem Either an actual element or a jQuery collection.
	 * @return bool
	 */
	hitTest: function(x, y, elem)
	{
		Garnish.hitTest._$elem = $(elem);
		Garnish.hitTest._offset = Garnish.hitTest._$elem.offset();
		Garnish.hitTest._x1 = Garnish.hitTest._offset.left;
		Garnish.hitTest._y1 = Garnish.hitTest._offset.top;
		Garnish.hitTest._x2 = Garnish.hitTest._x1 + Garnish.hitTest._$elem.outerWidth();
		Garnish.hitTest._y2 = Garnish.hitTest._y1 + Garnish.hitTest._$elem.outerHeight();

		return (x >= Garnish.hitTest._x1 && x < Garnish.hitTest._x2 && y >= Garnish.hitTest._y1 && y < Garnish.hitTest._y2);
	},

	/**
	 * Returns whether the cursor is touching an element.
	 *
	 * @param object ev   The mouse event object containing pageX and pageY properties.
	 * @param object elem Either an actual element or a jQuery collection.
	 * @return bool
	 */
	isCursorOver: function(ev, elem)
	{
		return Garnish.hitTest(ev.pageX, ev.pageY, elem);
	},

	/**
	 * Copies text styles from one element to another.
	 *
	 * @param object source The source element. Can be either an actual element or a jQuery collection.
	 * @param object target The target element. Can be either an actual element or a jQuery collection.
	 */
	copyTextStyles: function(source, target)
	{
		var $source = $(source),
			$target = $(target);

		$target.css({
			lineHeight:    $source.css('lineHeight'),
			fontSize:      $source.css('fontSize'),
			fontFamily:    $source.css('fontFamily'),
			fontWeight:    $source.css('fontWeight'),
			letterSpacing: $source.css('letterSpacing'),
			textAlign:     $source.css('textAlign')
		});
	},

	/**
	 * Returns the body's real scrollTop, discarding any window banding in Safari.
	 *
	 * @return int
	 */
	getBodyScrollTop: function()
	{
		Garnish.getBodyScrollTop._scrollTop = document.body.scrollTop;

		if (Garnish.getBodyScrollTop._scrollTop < 0)
		{
			Garnish.getBodyScrollTop._scrollTop = 0;
		}
		else
		{
			Garnish.getBodyScrollTop._maxScrollTop = Garnish.$bod.outerHeight() - Garnish.$win.height();

			if (Garnish.getBodyScrollTop._scrollTop > Garnish.getBodyScrollTop._maxScrollTop)
			{
				Garnish.getBodyScrollTop._scrollTop = Garnish.getBodyScrollTop._maxScrollTop;
			}
		}

		return Garnish.getBodyScrollTop._scrollTop;
	},

	/**
	 * Scrolls a container element to an element within it.
	 *
	 * @param object container Either an actual element or a jQuery collection.
	 * @param object elem      Either an actual element or a jQuery collection.
	 */
	scrollContainerToElement: function(container, elem)
	{
		var $container = $(container),
			$elem = $(elem);

		var scrollTop = $container.scrollTop(),
				elemOffset = $elem.offset().top;

		if ($container[0] == window)
		{
			var elemScrollOffset = elemOffset - scrollTop;
		}
		else
		{
			var elemScrollOffset = elemOffset - $container.offset().top;
		}

		// Is the element above the fold?
		if (elemScrollOffset < 0)
		{
			$container.scrollTop(scrollTop + elemScrollOffset);
		}
		else
		{
			var elemHeight = $elem.outerHeight(),
				containerHeight = ($container[0] == window ? window.innerHeight : $container[0].clientHeight);

			// Is it below the fold?
			if (elemScrollOffset + elemHeight > containerHeight)
			{
				$container.scrollTop(scrollTop + (elemScrollOffset - (containerHeight - elemHeight)));
			}
		}
	},

	SHAKE_STEPS: 10,
	SHAKE_STEP_DURATION: 25,

	/**
	 * Shakes an element.
	 *
	 * @param mixed  elem Either an actual element or a jQuery collection.
	 * @param string prop The property that should be adjusted (default is 'margin-left').
	 */
	shake: function(elem, prop)
	{
		var $elem = $(elem);

		if (!prop)
		{
			prop = 'margin-left';
		}

		var startingPoint = parseInt($elem.css(prop));
		if (isNaN(startingPoint))
		{
			startingPoint = 0;
		}

		for (var i = 0; i <= Garnish.SHAKE_STEPS; i++)
		{
			(function(i)
			{
				setTimeout(function()
				{
					Garnish.shake._properties = {};
					Garnish.shake._properties[prop] = startingPoint + (i % 2 ? -1 : 1) * (10-i);
					$elem.animate(Garnish.shake._properties, Garnish.SHAKE_STEP_DURATION);
				}, (Garnish.SHAKE_STEP_DURATION * i));
			})(i);
		}
	},

	/**
	 * Returns the first element in an array or jQuery collection.
	 *
	 * @param mixed elem
	 * @return mixed
	 */
	getElement: function(elem)
	{
		return $.makeArray(elem)[0];
	},

	/**
	 * Returns the beginning of an input's name= attribute value with any [bracktes] stripped out.
	 *
	 * @param object elem
	 * @return string|null
	 */
	getInputBasename: function(elem)
	{
		var name = $(elem).attr('name');

		if (name)
		{
			return name.replace(/\[.*/, '');
		}
		else
		{
			return null;
		}
	},

	/**
	 * Returns an input's value as it would be POSTed.
	 * So unchecked checkboxes and radio buttons return null,
	 * and multi-selects whose name don't end in "[]" only return the last selection
	 *
	 * @param jQuery $input
	 * @return mixed
	 */
	getInputPostVal: function($input)
	{
		var type = $input.attr('type'),
			val  = $input.val();

		// Is this an unchecked checkbox or radio button?
		if ((type == 'checkbox' || type == 'radio'))
		{
			if ($input.prop('checked'))
			{
				return val;
			}
			else
			{
				return null;
			}
		}

		// Flatten any array values whose input name doesn't end in "[]"
		//  - e.g. a multi-select
		else if (Garnish.isArray(val) && $input.attr('name').substr(-2) != '[]')
		{
			if (val.length)
			{
				return val[val.length-1];
			}
			else
			{
				return null;
			}
		}

		// Just return the value
		else
		{
			return val;
		}
	},

	/**
	 * Returns the inputs within a container
	 *
	 * @param mixed container The container element. Can be either an actual element or a jQuery collection.
	 * @return jQuery
	 */
	findInputs: function(container)
	{
		return $(container).find('input,text,textarea,select,button');
	},

	/**
	 * Returns the post data within a container.
	 *
	 * @param mixed container
	 * @return array
	 */
	getPostData: function(container)
	{
		var postData = {},
			arrayInputCounters = {},
			$inputs = Garnish.findInputs(container);

		for (var i = 0; i < $inputs.length; i++)
		{
			var $input = $($inputs[i]);

			if ($input.prop('disabled'))
			{
				continue;
			}

			var inputName = $input.attr('name');
			if (!inputName)
			{
				continue;
			}

			var inputVal = Garnish.getInputPostVal($input);
			if (inputVal === null)
			{
				continue;
			}

			var isArrayInput = (inputName.substr(-2) == '[]');

			if (isArrayInput)
			{
				// Get the cropped input name
				var croppedName = inputName.substring(0, inputName.length-2);

				// Prep the input counter
				if (typeof arrayInputCounters[croppedName] == 'undefined')
				{
					arrayInputCounters[croppedName] = 0;
				}
			}

			if (!Garnish.isArray(inputVal))
			{
				inputVal = [inputVal];
			}

			for (var j = 0; j < inputVal.length; j++)
			{
				if (isArrayInput)
				{
					var inputName = croppedName+'['+arrayInputCounters[croppedName]+']';
					arrayInputCounters[croppedName]++;
				}

				postData[inputName] = inputVal[j];
			}
		}

		return postData;
	}
});


/**
 * Garnish base class
 */
Garnish.Base = Base.extend({

	settings: null,

	_eventHandlers: null,
	_namespace: null,
	_$listeners: null,

	constructor: function()
	{
		this._eventHandlers = [];
		this._namespace = '.Garnish'+Math.floor(Math.random()*1000000000);
		this._$listeners = $();
		this.init.apply(this, arguments);
	},

	init: $.noop,

	setSettings: function(settings, defaults)
	{
		var baseSettings = (typeof this.settings == 'undefined' ? {} : this.settings);
		this.settings = $.extend({}, baseSettings, defaults, settings);
	},

	on: function(events, data, handler)
	{
		if (typeof data == 'function')
		{
			handler = data;
			data = {};
		}

		var events = this._normalizeEvents(events);

		for (var i = 0; i < events.length; i++)
		{
			var ev = events[i];

			this._eventHandlers.push({
				type: ev[0],
				namepsace: ev[1],
				data: data,
				handler: handler
			});
		}
	},

	off: function(events)
	{
		var events = this._normalizeEvents(events);

		for (var i = 0; i < events; i++)
		{
			var ev = events[i];

			for (var j = this._eventHandlers.length - 1; j >= 0; i--)
			{
				var handler = this._eventHandlers[j];

				if (handler.type == ev[0] && (!ev[1] || handler.namespace == ev[1]))
				{
					this._eventHandlers.splice(j, 1);
				}
			}
		}
	},

	trigger: function(type, data)
	{
		var ev = {
			type: type,
			target: this
		};

		if (typeof params == 'undefined')
		{
			params = [];
		}

		for (var i = 0; i < this._eventHandlers.length; i++)
		{
			var handler = this._eventHandlers[i];

			if (handler.type == type)
			{
				var _ev = $.extend({ data: handler.data }, data, ev);
				handler.handler(_ev)
			}
		}
	},

	_normalizeEvents: function(events)
	{
		if (typeof events == 'string')
		{
			events = events.split(' ');
		}

		for (var i = 0; i < events.length; i++)
		{
			if (typeof events[i] == 'string')
			{
				events[i] = events[i].split('.');
			}
		}

		return events;
	},

	_formatEvents: function(events)
	{
		if (typeof events == 'string')
		{
			events = events.split(',');

			for (var i = 0; i < events.length; i++)
			{
				events[i] = $.trim(events[i]);
			}
		}

		for (var i = 0; i < events.length; i++)
		{
			events[i] += this._namespace;
		}

		return events.join(' ');
	},

	addListener: function(elem, events, data, func)
	{
		var $elem = $(elem);
		events = this._formatEvents(events);

		// Param mapping
		if (typeof data != 'object')
		{
			// (elem, events, func)
			func = data;
			data = {};
		}

		if (typeof func == 'function')
		{
			func = $.proxy(func, this);
		}
		else
		{
			func = $.proxy(this, func);
		}

		$elem.on(events, data, func);

		// Remember that we're listening to this element
		this._$listeners = this._$listeners.add(elem);

		// Prep for activate event?
		if (events.search(/\bactivate\b/) != -1 && !$elem.data('garnish-activatable'))
		{
			var activateNamespace = this._namespace+'-activate';

			// Prevent buttons from getting focus on click
			$elem.on('mousedown'+activateNamespace, function(ev)
			{
				ev.preventDefault();
			});

			$elem.on('click'+activateNamespace, function(ev)
			{
				ev.preventDefault();

				var elemIndex = $.inArray(ev.currentTarget, $elem),
					$evElem = $(elem[elemIndex]);

				if (!$evElem.hasClass('disabled'))
				{
					$evElem.trigger('activate');
				}
			});

			$elem.on('keydown'+activateNamespace, function(ev)
			{
				var elemIndex = $.inArray(ev.currentTarget, $elem);
				if (elemIndex != -1 && ev.keyCode == Garnish.SPACE_KEY)
				{
					ev.preventDefault();
					var $evElem = $($elem[elemIndex]);

					if (!$evElem.hasClass('disabled'))
					{
						$evElem.addClass('active');

						Garnish.$doc.on('keyup'+activateNamespace, function(ev)
						{
							$elem.removeClass('active');
							if (ev.keyCode == Garnish.SPACE_KEY)
							{
								ev.preventDefault();
								$evElem.trigger('activate');
							}
							Garnish.$doc.off('keyup'+activateNamespace);
						});
					}
				}
			});

			if (!$elem.hasClass('disabled'))
			{
				$elem.attr('tabindex', '0');
			}
			else
			{
				$elem.removeAttr('tabindex');
			}

			$elem.data('garnish-activatable', true);
		}

		// Prep for chanegtext event?
		if (events.search(/\btextchange\b/) != -1)
		{
			// Store the initial values
			for (var i = 0; i < $elem.length; i++)
			{
				var _$elem = $($elem[i]);
				_$elem.data('garnish-textchangeValue', _$elem.val());

				if (!_$elem.data('garnish-textchangeable'))
				{
					var textchangeNamespace = this._namespace+'-textchange',
						events = 'keypress'+textchangeNamespace +
							' keyup'+textchangeNamespace +
							' change'+textchangeNamespace +
							' blur'+textchangeNamespace;

					_$elem.on(events, function(ev)
					{
						var _$elem = $(ev.currentTarget),
							val = _$elem.val();

						if (val != _$elem.data('garnish-textchangeValue'))
						{
							_$elem.data('garnish-textchangeValue', val);
							_$elem.trigger('textchange');
						}
					});

					_$elem.data('garnish-textchangeable', true);
				}
			}
		}

		// Prep for resize event?
		if (events.search(/\bresize\b/) != -1)
		{
			// Resize detection technique adapted from http://www.backalleycoder.com/2013/03/18/cross-browser-event-based-element-resize-detection/ -- thanks!
			for (var i = 0; i < $elem.length; i++)
			{
				(function(elem)
				{
					if (elem == window)
					{
						return;
					}

					// IE < 11 had a proprietary 'resize' event and 'attachEvent' method.
					// Conveniently both dropped in 11.

					if (!document.attachEvent && !elem.__resizeTriggers__)
					{
						// The element must be relative, absolute, or fixed
						if (getComputedStyle(elem).position == 'static')
						{
							elem.style.position = 'relative';
						}

						var $resizeTriggers = $(
							'<div class="resize-triggers">' +
								'<div class="expand-trigger"><div></div></div>' +
								'<div class="contract-trigger"></div>' +
							'</div>'
						).prependTo(elem);

						elem.__resizeLast__ = {};
						elem.__resizeTriggers__ = $resizeTriggers[0];

						resetTriggers(elem);
						elem.addEventListener('scroll', scrollListener, true);

						// Listen for window resizes too
						Garnish.$win.on('resize', function()
						{
							scrollListener.apply(elem);
						});

						// Avoid a top margin on the next element
						$resizeTriggers.next().addClass('first');
					}
				})($elem[i]);
			}
		}
	},

	removeListener: function(elem, events)
	{
		events = this._formatEvents(events);
		$(elem).off(events);
	},

	removeAllListeners: function(elem)
	{
		$(elem).off(this._namespace);
	},

	destroy: function()
	{
		this.removeAllListeners(this._$listeners);
	}
});

/**
 * Used by our resize detection script
 */
if (!document.attachEvent)
{
	var requestFrame = (function()
	{
		var raf = window.requestAnimationFrame ||
				  window.mozRequestAnimationFrame ||
				  window.webkitRequestAnimationFrame ||
				  function(fn){ return window.setTimeout(fn, 20); };

		  return function(fn){ return raf(fn); };
	})();

	var cancelFrame = (function()
	{
		var cancel = window.cancelAnimationFrame ||
					 window.mozCancelAnimationFrame ||
					 window.webkitCancelAnimationFrame ||
					 window.clearTimeout;

		return function(id){ return cancel(id); };
	})();

	var resetTriggers = function(elem)
	{
		var triggers    = elem.__resizeTriggers__,
			expand      = triggers.firstElementChild,
			contract    = triggers.lastElementChild,
			expandChild = expand.firstElementChild;

		contract.scrollLeft = contract.scrollWidth;
		contract.scrollTop  = contract.scrollHeight;

		expandChild.style.width  = expand.offsetWidth + 1 + 'px';
		expandChild.style.height = expand.offsetHeight + 1 + 'px';

		expand.scrollLeft = expand.scrollWidth;
		expand.scrollTop  = expand.scrollHeight;
	}

	var checkTriggers = function(elem)
	{
		return elem.offsetWidth  != elem.__resizeLast__.width ||
			   elem.offsetHeight != elem.__resizeLast__.height;
	}

	var scrollListener = function(ev)
	{
		var elem = this;
		resetTriggers(elem);

		if (elem.__resizeRAF__)
		{
			cancelFrame(elem.__resizeRAF__);
		}

		elem.__resizeRAF__ = requestFrame(function()
		{
			if (checkTriggers(elem))
			{
				elem.__resizeLast__.width  = elem.offsetWidth;
				elem.__resizeLast__.height = elem.offsetHeight;

				$(elem).trigger('resize');
			}
		});
	}
}
