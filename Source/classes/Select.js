/**
 * Select
 */
Garnish.Select = Garnish.Base.extend({

	$container: null,
	$items: null,

	totalSelected: null,

	mousedownX: null,
	mousedownY: null,
	mouseUpTimeout: null,
	mouseUpTimeoutDuration: null,
	callbackTimeout: null,

	$focusable: null,
	$first: null,
	first: null,
	$last: null,
	last: null,

	/**
	 * Init
	 */
	init: function(container, items, settings)
	{
		this.$container = $(container);

		// Param mapping
		if (!settings && Garnish.isObject(items))
		{
			// (container, settings)
			settings = items;
			items = null;
		}

		// Is this already a select?
		if (this.$container.data('select'))
		{
			Garnish.log('Double-instantiating a select on an element');
			this.$container.data('select').destroy();
		}

		this.$container.data('select', this);

		this.setSettings(settings, Garnish.Select.defaults);
		this.mouseUpTimeoutDuration = (this.settings.waitForDblClick ? 300 : 0);

		this.$items = $();
		this.addItems(items);

		// --------------------------------------------------------------------

		this.addListener(this.$container, 'click', function(ev)
		{
			if (this.ignoreClick)
			{
				this.ignoreClick = false;
			}
			else
			{
				// deselect all items on container click
				this.deselectAll(true);
			}
		});
	},

	// --------------------------------------------------------------------

	/**
	 * Get Item Index
	 */
	getItemIndex: function($item)
	{
		return this.$items.index($item[0]);
	},

	/**
	 * Is Selected?
	 */
	isSelected: function($item)
	{
		return $item.hasClass(this.settings.selectedClass);
	},

	/**
	 * Select Item
	 */
	selectItem: function($item)
	{
		if (!this.settings.multi)
		{
			this.deselectAll();
		}

		$item.addClass(this.settings.selectedClass);

		this.$first = this.$last = $item;
		this.first = this.last = this.getItemIndex($item);

		this.setFocusableItem($item);
		$item.focus();

		this.totalSelected++;

		this.setCallbackTimeout();
	},

	selectAll: function()
	{
		if (!this.settings.multi || !this.$items.length)
		{
			return;
		}

		this.first = 0;
		this.last = this.$items.length-1;
		this.$first = $(this.$items[this.first]);
		this.$last = $(this.$items[this.last]);

		this.$items.addClass(this.settings.selectedClass);
		this.totalSelected = this.$items.length;
		this.setCallbackTimeout();
	},

	/**
	 * Select Range
	 */
	selectRange: function($item)
	{
		if (!this.settings.multi)
		{
			return this.selectItem($item);
		}

		this.deselectAll();

		this.$last = $item;
		this.last = this.getItemIndex($item);

		this.setFocusableItem($item);
		$item.focus();

		// prepare params for $.slice()
		if (this.first < this.last)
		{
			var sliceFrom = this.first,
				sliceTo = this.last + 1;
		}
		else
		{
			var sliceFrom = this.last,
				sliceTo = this.first + 1;
		}

		this.$items.slice(sliceFrom, sliceTo).addClass(this.settings.selectedClass);

		this.totalSelected = sliceTo - sliceFrom;

		this.setCallbackTimeout();
	},

	/**
	 * Deselect Item
	 */
	deselectItem: function($item)
	{
		$item.removeClass(this.settings.selectedClass);

		var index = this.getItemIndex($item);
		if (this.first === index) this.$first = this.first = null;
		if (this.last === index) this.$last = this.last = null;

		this.totalSelected--;

		this.setCallbackTimeout();
	},

	/**
	 * Deselect All
	 */
	deselectAll: function(clearFirst)
	{
		this.$items.removeClass(this.settings.selectedClass);

		if (clearFirst)
		{
			this.$first = this.first = this.$last = this.last = null;
		}

		this.totalSelected = 0;

		this.setCallbackTimeout();
	},

	/**
	 * Deselect Others
	 */
	deselectOthers: function($item)
	{
		this.deselectAll();
		this.selectItem($item);
	},

	/**
	 * Toggle Item
	 */
	toggleItem: function($item)
	{
		if (! this.isSelected($item))
		{
			this.selectItem($item);
		}
		else
		{
			this.deselectItem($item);
		}
	},

	// --------------------------------------------------------------------

	clearMouseUpTimeout: function()
	{
		clearTimeout(this.mouseUpTimeout);
	},

	/**
	 * On Mouse Down
	 */
	onMouseDown: function(ev)
	{
		// ignore right clicks
		if (ev.button != Garnish.PRIMARY_CLICK)
		{
			return;
		}

		this.mousedownX = ev.pageX;
		this.mousedownY = ev.pageY;

		var $item = $($.data(ev.currentTarget, 'select-item'));

		if (ev.metaKey)
		{
			this.toggleItem($item);
		}
		else if (this.first !== null && ev.shiftKey)
		{
			this.selectRange($item);
		}
		else if (! this.isSelected($item))
		{
			this.deselectAll();
			this.selectItem($item);
		}
	},

	/**
	 * On Mouse Up
	 */
	onMouseUp: function(ev)
	{
		// ignore right clicks
		if (ev.button != Garnish.PRIMARY_CLICK)
		{
			return;
		}

		var $item = $($.data(ev.currentTarget, 'select-item'));

		// was this a click?
		if (! ev.metaKey && ! ev.shiftKey && Garnish.getDist(this.mousedownX, this.mousedownY, ev.pageX, ev.pageY) < 1)
		{
			this.selectItem($item);

			// wait a moment before deselecting others
			// to give the user a chance to double-click
			this.clearMouseUpTimeout();
			this.mouseUpTimeout = setTimeout($.proxy(function() {
				this.deselectOthers($item);
			}, this), this.mouseUpTimeoutDuration);
		}
	},

	// --------------------------------------------------------------------

	/**
	 * On Key Down
	 */
	onKeyDown: function(ev)
	{
		var metaKey = (ev.metaKey || ev.ctrlKey);

		if (this.settings.arrowsChangeSelection || !this.$focusable.length)
		{
			var anchor = ev.shiftKey ? this.last : this.first;
		}
		else
		{
			var anchor = $.inArray(this.$focusable[0], this.$items);

			if (anchor == -1)
			{
				anchor = 0;
			}
		}

		// Ok, what are we doing here?
		switch (ev.keyCode)
		{
			case Garnish.LEFT_KEY:
			{
				ev.preventDefault();

				// Select the last item if none are selected
				if (this.first === null)
				{
					var $item = this.getLastItem();
				}
				else
				{
					if (metaKey)
					{
						var $item = this.getFurthestItemToTheLeft(anchor);
					}
					else
					{
						var $item = this.getItemToTheLeft(anchor);
					}
				}

				break;
			}

			case Garnish.RIGHT_KEY:
			{
				ev.preventDefault();

				// Select the first item if none are selected
				if (this.first === null)
				{
					var $item = this.getFirstItem();
				}
				else
				{
					if (metaKey)
					{
						var $item = this.getFurthestItemToTheRight(anchor);
					}
					else
					{
						var $item = this.getItemToTheRight(anchor);
					}
				}

				break;
			}

			case Garnish.UP_KEY:
			{
				ev.preventDefault();

				// Select the last item if none are selected
				if (this.first === null)
				{
					var $item = this.getLastItem();
				}
				else
				{
					if (metaKey)
					{
						var $item = this.getFurthestItemAbove(anchor);
					}
					else
					{
						var $item = this.getItemAbove(anchor);
					}

					if (!$item)
					{
						$item = this.getFirstItem();
					}
				}

				break;
			}

			case Garnish.DOWN_KEY:
			{
				ev.preventDefault();

				// Select the first item if none are selected
				if (this.first === null)
				{
					var $item = this.getFirstItem();
				}
				else
				{
					if (metaKey)
					{
						var $item = this.getFurthestItemBelow(anchor);
					}
					else
					{
						var $item = this.getItemBelow(anchor);
					}

					if (!$item)
					{
						$item = this.getLastItem();
					}
				}

				break;
			}

			case Garnish.SPACE_KEY:
			{
				if (!metaKey)
				{
					ev.preventDefault();

					if (this.isSelected(this.$focusable))
					{
						this.deselectItem(this.$focusable);
					}
					else
					{
						this.selectItem(this.$focusable);
					}
				}

				break;
			}

			case Garnish.A_KEY:
			{
				if (metaKey)
				{
					ev.preventDefault();
					this.selectAll();
				}

				break;
			}
		}

		// Is there an item queued up for focus/selection?
		if ($item && $item.length)
		{
			if (this.settings.arrowsChangeSelection)
			{
				// select it
				if (this.first !== null && ev.shiftKey)
				{
					this.selectRange($item);
				}
				else
				{
					this.deselectAll();
					this.selectItem($item);
				}
			}
			else
			{
				// just set the new item to be focussable
				this.setFocusableItem($item);
				$item.focus();
			}
		}
	},

	getFirstItem: function()
	{
		if (this.$items.length)
		{
			return $(this.$items[0]);
		}
	},

	getLastItem: function()
	{
		if (this.$items.length)
		{
			return $(this.$items[this.$items.length-1]);
		}
	},

	isPreviousItem: function(index)
	{
		return (index > 0);
	},

	isNextItem: function(index)
	{
		return (index < this.$items.length-1);
	},

	getPreviousItem: function(index)
	{
		if (this.isPreviousItem(index))
		{
			return $(this.$items[index-1]);
		}
	},

	getNextItem: function(index)
	{
		if (this.isNextItem(index))
		{
			return $(this.$items[index+1]);
		}
	},

	getItemToTheLeft: function(index)
	{
		if (this.isPreviousItem(index))
		{
			if (this.settings.horizontal)
			{
				return this.getPreviousItem(index);
			}
			if (!this.settings.vertical)
			{
				return this.getClosestItem(index, Garnish.X_AXIS, '<');
			}
		}
	},

	getItemToTheRight: function(index)
	{
		if (this.isNextItem(index))
		{
			if (this.settings.horizontal)
			{
				return this.getNextItem(index);
			}
			else if (!this.settings.vertical)
			{
				return this.getClosestItem(index, Garnish.X_AXIS, '>');
			}
		}
	},

	getItemAbove: function(index)
	{
		if (this.isPreviousItem(index))
		{
			if (this.settings.vertical)
			{
				return this.getPreviousItem(index);
			}
			else if (!this.settings.horizontal)
			{
				return this.getClosestItem(index, Garnish.Y_AXIS, '<');
			}
		}
	},

	getItemBelow: function(index)
	{
		if (this.isNextItem(index))
		{
			if (this.settings.vertical)
			{
				return this.getNextItem(index);
			}
			else if (!this.settings.horizontal)
			{
				return this.getClosestItem(index, Garnish.Y_AXIS, '>');
			}
		}
	},

	getClosestItem: function(index, axis, dir)
	{
		var axisProps = Garnish.Select.closestItemAxisProps[axis],
			dirProps = Garnish.Select.closestItemDirectionProps[dir];

		var $thisItem = $(this.$items[index]),
			thisOffset = $thisItem.offset(),
			thisMidpoint = thisOffset[axisProps.midpointOffset] + Math.round($thisItem[axisProps.midpointSizeFunc]()/2),
			otherRowPos = null,
			smallestMidpointDiff = null,
			$closestItem = null;

		for (var i = index + dirProps.step; (typeof this.$items[i] != 'undefined'); i += dirProps.step)
		{
			var $otherItem = $(this.$items[i]),
				otherOffset = $otherItem.offset();

			// Are we on the next row yet?
			if (dirProps.isNextRow(otherOffset[axisProps.rowOffset], thisOffset[axisProps.rowOffset]))
			{
				// Is this the first time we've seen this row?
				if (otherRowPos === null)
				{
					otherRowPos = otherOffset[axisProps.rowOffset];
				}
				// Have we gone too far?
				else if (otherOffset[axisProps.rowOffset] != otherRowPos)
				{
					break;
				}

				var otherMidpoint = otherOffset[axisProps.midpointOffset] + Math.round($otherItem[axisProps.midpointSizeFunc]()/2),
					midpointDiff = Math.abs(thisMidpoint - otherMidpoint);

				// Are we getting warmer?
				if (smallestMidpointDiff === null || midpointDiff < smallestMidpointDiff)
				{
					smallestMidpointDiff = midpointDiff;
					$closestItem = $otherItem;
				}
				// Getting colder?
				else
				{
					break;
				}
			}
			// Getting colder?
			else if (dirProps.isWrongDirection(otherOffset[axisProps.rowOffset], thisOffset[axisProps.rowOffset]))
			{
				break;
			}
		}

		return $closestItem;
	},

	getFurthestItemToTheLeft: function(index)
	{
		return this.getFurthestItem(index, 'ToTheLeft');
	},

	getFurthestItemToTheRight: function(index)
	{
		return this.getFurthestItem(index, 'ToTheRight');
	},

	getFurthestItemAbove: function(index)
	{
		return this.getFurthestItem(index, 'Above');
	},

	getFurthestItemBelow: function(index)
	{
		return this.getFurthestItem(index, 'Below');
	},

	getFurthestItem: function(index, dir)
	{
		var $item, $testItem;

		while ($testItem = this['getItem'+dir](index))
		{
			$item = $testItem;
			index = this.getItemIndex($item);
		}

		return $item;
	},

	// --------------------------------------------------------------------

	/**
	 * Get Total Selected
	 */
	getTotalSelected: function()
	{
		return this.totalSelected;
	},

	/**
	 * Add Items
	 */
	addItems: function(items)
	{
		var $items = $(items);

		for (var i = 0; i < $items.length; i++)
		{
			var item = $items[i];

			// Make sure this element doesn't belong to another selector
			if ($.data(item, 'select'))
			{
				Garnish.log('Element was added to more than one selector');
				$.data(item, 'select').removeItems(item);
			}

			// Add the item
			$.data(item, 'select', this);
			this.$items = this.$items.add(item);

			// Get the handle
			if (this.settings.handle)
			{
				if (typeof this.settings.handle == 'object')
				{
					var $handle = $(this.settings.handle);
				}
				else if (typeof this.settings.handle == 'string')
				{
					var $handle = $(item).find(this.settings.handle);
				}
				else if (typeof this.settings.handle == 'function')
				{
					var $handle = $(this.settings.handle(item));
				}
			}
			else
			{
				var $handle = $(item);
			}

			$.data(item, 'select-handle', $handle);
			$handle.data('select-item', item);

			this.addListener($handle, 'mousedown', 'onMouseDown');
			this.addListener($handle, 'mouseup', 'onMouseUp');
			this.addListener($handle, 'keydown', 'onKeyDown');
			this.addListener($handle, 'click', function(ev)
			{
				this.ignoreClick = true;
			});
		}

		this.totalSelected += $items.filter('.'+this.settings.selectedClass).length;

		this.updateIndexes();
	},

	/**
	 * Remove Items
	 */
	removeItems: function(items)
	{
		items = $.makeArray(items);

		for (var i = 0; i < items.length; i++)
		{
			var item = items[i];

			// Make sure we actually know about this item
			var index = $.inArray(item, this.$items);
			if (index != -1)
			{
				var $handle = $.data(item, 'select-handle');
				$handle.data('select-item', null);
				$.data(item, 'select', null);
				$.data(item, 'select-handle', null);
				this.removeAllListeners($handle);
				this.$items.splice(index, 1);
			}
		}

		this.updateIndexes();
	},

	/**
	 * Refresh Item Order
	 */
	refreshItemOrder: function()
	{
		this.$items = $(this.$items);
	},

	/**
	 * Destroy
	 */
	destroy: function()
	{
		this.base();

		// clear timeout
		this.clearCallbackTimeout();
	},

	/**
	 * Update First/Last indexes
	 */
	updateIndexes: function()
	{
		if (this.first !== null)
		{
			this.first = this.getItemIndex(this.$first);
			this.last = this.getItemIndex(this.$last);
			this.setFocusableItem(this.$first);
		}
		else if (this.$items.length)
		{
			this.setFocusableItem($(this.$items[0]));
		}
	},

	/**
	 * Reset Item Order
	 */
	 resetItemOrder: function()
	 {
	 	this.$items = $().add(this.$items);
	 	this.updateIndexes();
	 },

	/**
	 * Sets the focusable item.
	 *
	 * We only want to have one focusable item per selection list, so that the user
	 * doesn't have to tab through a million items.
	 *
	 * @param object $item
	 */
	setFocusableItem: function($item)
	{
		if (this.$focusable)
		{
			this.$focusable.removeAttr('tabindex');
		}

		this.$focusable = $item.attr('tabindex', '0');
	},

	// --------------------------------------------------------------------

	/**
	 * Clear Callback Timeout
	 */
	clearCallbackTimeout: function()
	{
		if (this.settings.onSelectionChange)
		{
			clearTimeout(this.callbackTimeout);
		}
	},

	/**
	 * Set Callback Timeout
	 */
	setCallbackTimeout: function()
	{
		if (this.settings.onSelectionChange)
		{
			// clear the last one
			this.clearCallbackTimeout();

			this.callbackTimeout = setTimeout($.proxy(function()
			{
				this.callbackTimeout = null;
				this.settings.onSelectionChange();
			}, this), 300);
		}
	},

	/**
	 * Get Selected Items
	 */
	getSelectedItems: function()
	{
		return this.$items.filter('.'+this.settings.selectedClass);
	}
},
{
	defaults: {
		selectedClass: 'sel',
		multi: false,
		vertical: false,
		horizontal: false,
		waitForDblClick: false,
		arrowsChangeSelection: true,
		handle: null,
		onSelectionChange: $.noop
	},

	closestItemAxisProps: {
		x: {
			midpointOffset:   'top',
			midpointSizeFunc: 'outerHeight',
			rowOffset:        'left'
		},
		y: {
			midpointOffset:   'left',
			midpointSizeFunc: 'outerWidth',
			rowOffset:        'top'
		}
	},

	closestItemDirectionProps: {
		'<': {
			step: -1,
			isNextRow: function(a, b) { return (a < b); },
			isWrongDirection: function(a, b) { return (a > b); }
		},
		'>': {
			step: 1,
			isNextRow: function(a, b) { return (a > b); },
			isWrongDirection: function(a, b) { return (a < b); }
		}
	}
});
