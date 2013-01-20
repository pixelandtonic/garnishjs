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
		this.$container.attr('tabindex', 0);

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

		// --------------------------------------------------------------------

		Garnish.preventOutlineOnMouseFocus(this.$container);

		this.addListener(this.$container, 'keydown', 'onKeyDown');

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
		return $item.hasClass('sel');
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

		$item.addClass('sel');

		this.$first = this.$last = $item;
		this.first = this.last = this.getItemIndex($item);

		this.totalSelected++;

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

		this.$items.slice(sliceFrom, sliceTo).addClass('sel');

		this.totalSelected = sliceTo - sliceFrom;

		this.setCallbackTimeout();
	},

	/**
	 * Deselect Item
	 */
	deselectItem: function($item)
	{
		$item.removeClass('sel');

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
		this.$items.removeClass('sel');

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
		if (ev.button == 2) return;

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

		this.$container.focus();
	},

	/**
	 * On Mouse Up
	 */
	onMouseUp: function(ev)
	{
		// ignore right clicks
		if (ev.button == 2) return;

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
		// ignore if meta key is down
		if (ev.metaKey) return;

		// ignore if this pane doesn't have focus
		if (ev.target != this.$container[0]) return;

		// ignore if there are no items
		if (! this.$items.length) return;

		var anchor = ev.shiftKey ? this.last : this.first;

		switch (ev.keyCode)
		{
			case Garnish.DOWN_KEY:
			{
				ev.preventDefault();

				if (this.first === null)
				{
					// select the first item
					var $item = $(this.$items[0]);
				}
				else if (this.$items.length >= anchor + 2)
				{
					// select the item after the last selected item
					var $item = $(this.$items[anchor+1]);
				}

				break;
			}

			case Garnish.UP_KEY:
			{
				ev.preventDefault();

				if (this.first === null)
				{
					// select the last item
					var $item = $(this.$items[this.$items.length-1]);
				}
				else if (anchor > 0)
				{
					var $item = $(this.$items[anchor-1]);
				}

				break;
			}

			case Garnish.ESC_KEY:
			{
				this.deselectAll(true);
				break;
			}

			default:
			{
				return;
			}
		}

		if (typeof $item == 'undefined' || !$item.length)
		{
			return;
		}

		// -------------------------------------------
		//  Scroll to the item
		// -------------------------------------------

		Garnish.scrollContainerToElement(this.$container, $item);

		// -------------------------------------------
		//  Select the item
		// -------------------------------------------

		if (this.first !== null && ev.shiftKey)
		{
			this.selectRange($item);
		}
		else
		{
			this.deselectAll();
			this.selectItem($item);
		}
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
			this.addListener($handle, 'click', function(ev)
			{
				this.ignoreClick = true;
			});
		}

		this.totalSelected += $items.filter('.sel').length;

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
				this.settings.onSelectionChange.call();
			}, this), 300);
		}
	},

	/**
	 * Get Selected Items
	 */
	getSelectedItems: function()
	{
		return this.$items.filter('.sel');
	}
},
{
	defaults: {
		multi: false,
		waitForDblClick: false,
		handle: null,
		onSelectionChange: $.noop
	}
});
