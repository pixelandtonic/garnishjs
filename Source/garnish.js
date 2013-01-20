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
	CMD_KEY:    91,

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
