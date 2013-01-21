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
	$bod: $(document.body),

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
	CMD_KEY:    91,

	// Mouse button constants
	PRIMARY_CLICK:   0,
	SECONDARY_CLICK: 2,

	// Axis constants
	X_AXIS: 'x',
	Y_AXIS: 'y',

	// Node types
	TEXT_NODE: 3,

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
		var $elem = $(elem),
			offset = $elem.offset(),
			x1 = offset.left,
			y1 = offset.top,
			x2 = x1 + $elem.width(),
			y2 = y1 + $elem.height();

		return (x >= x1 && x < x2 && y >= y1 && y < y2);
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
		var scrollTop = document.body.scrollTop;

		if (scrollTop < 0)
		{
			scrollTop = 0;
		}
		else
		{
			var maxScrollTop = Garnish.$bod.outerHeight() - Garnish.$win.height();

			if (scrollTop > maxScrollTop)
			{
				scrollTop = maxScrollTop;
			}
		}

		return scrollTop;
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
			elOffset = $elem.offset().top,
			containerOffset = $container.offset().top,
			offsetDiff = elOffset - containerOffset;

		if (offsetDiff < 0)
		{
			$container.scrollTop(scrollTop + offsetDiff);
		}
		else
		{
			var elHeight = $elem.outerHeight(),
				containerHeight = $container[0].clientHeight;

			if (offsetDiff + elHeight > containerHeight)
			{
				$container.scrollTop(scrollTop + (offsetDiff - (containerHeight - elHeight)));
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
					var properties = {};
					properties[prop] = startingPoint + (i % 2 ? -1 : 1) * (10-i);
					$elem.animate(properties, Garnish.SHAKE_STEP_DURATION);
				}, (Garnish.SHAKE_STEP_DURATION * i));
			})(i);
		}
	}
};


/**
 * Garnish base class
 */
Garnish.Base = Base.extend({

	settings: null,

	_namespace: null,
	_$listeners: null,

	constructor: function()
	{
		this._namespace = '.Garnish'+Math.floor(Math.random()*1000000000);
		this._$listeners = $();
		this.init.apply(this, arguments);
	},

	init: $.noop,

	setSettings: function(settings, defaults)
	{
		var baseSettings = (typeof this.settings == 'undefined' ? {} : this.settings);
		this.settings = $.extend(baseSettings, defaults, settings);
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

	addListener: function(elem, events, func)
	{
		var $elem = $(elem);
		events = this._formatEvents(events);

		if (typeof func == 'function')
		{
			func = $.proxy(func, this);
		}
		else
		{
			func = $.proxy(this, func);
		}

		$elem.on(events, func);

		// Remember that we're listening to this element
		this._$listeners = this._$listeners.add(elem);

		// Prep for activate event?
		if (events.search(/\bactivate\b/) != -1)
		{
			if (!$elem.data('activatable'))
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

					if (!$elem.hasClass('disabled'))
					{
						$elem.trigger('activate');
					}
				});

				$elem.on('keydown'+activateNamespace, function(ev)
				{
					if (ev.target == $elem[0] && ev.keyCode == Garnish.SPACE_KEY)
					{
						ev.preventDefault();

						if (!$elem.hasClass('disabled'))
						{
							$elem.addClass('active');

							Garnish.$doc.on('keyup'+activateNamespace, function(ev)
							{
								$elem.removeClass('active');
								if (ev.target == $elem[0] && ev.keyCode == Garnish.SPACE_KEY)
								{
									ev.preventDefault();
									$elem.trigger('activate');
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

				$elem.data('activatable', true);
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
