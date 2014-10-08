/**
 * Drag-to-sort class
 *
 * Builds on the Drag class by allowing you to sort the elements amongst themselves.
 */
Garnish.DragSort = Garnish.Drag.extend({

	// Properties
	// =========================================================================

	$heightedContainer: null,
	$insertion: null,
	insertionVisible: false,
	startDraggeeIndex: null,
	closestItem: null,

	// Public methods
	// =========================================================================

	/**
	 * Constructor
	 *
	 * @param mixed  items    Elements that should be draggable right away. (Can be skipped.)
	 * @param object settings Any settings that should override the defaults.
	 */
	init: function(items, settings)
	{
		// Param mapping
		if (!settings && $.isPlainObject(items))
		{
			// (settings)
			settings = items;
			items = null;
		}

		settings = $.extend({}, Garnish.DragSort.defaults, settings);
		this.base(items, settings);
	},

	/**
	 * Creates the insertion element.
	 */
	createInsertion: function()
	{
		if (this.settings.insertion)
		{
			if (typeof this.settings.insertion == 'function')
			{
				return $(this.settings.insertion(this.$draggee));
			}
			else
			{
				return $(this.settings.insertion);
			}
		}
	},

	// Events
	// -------------------------------------------------------------------------

	/**
	 * On Drag Start
	 */
	onDragStart: function()
	{
		this.base();

		this.$insertion = this.createInsertion();
		this._placeInsertionWithDraggee();

		this.closestItem = null;
		this._setMidpoints();

		//  Get the closest container that has a height
		if (this.settings.container)
		{
			this.$heightedContainer = $(this.settings.container);

			while (! this.$heightedContainer.height())
			{
				this.$heightedContainer = this.$heightedContainer.parent();
			}
		}

		this.startDraggeeIndex = $.inArray(this.$draggee[0], this.$items);
	},

	/**
	 * On Drag
	 */
	onDrag: function()
	{
		// If there's a container set, make sure that we're hovering over it
		if (this.$heightedContainer && !Garnish.hitTest(this.mouseX, this.mouseY, this.$heightedContainer))
		{
			if (this.closestItem)
			{
				this.closestItem = null;
				this._removeInsertion();
			}
		}
		else
		{
			// Is there a new closest item?
			if (
				this.closestItem !== (this.closestItem = this._getClosestItem()) &&
				this.closestItem !== null
			)
			{
				this._updateInsertion();
			}
		}

		this.base();
	},

	/**
	 * On Drag Stop
	 */
	onDragStop: function()
	{
		this._removeInsertion();

		// Return the helpers to the draggees
		this.returnHelpersToDraggees();

		this.base();

		// Has the item actually moved?
		this.$items = $().add(this.$items);
		var newDraggeeIndex = $.inArray(this.$draggee[0], this.$items);

		if (this.startDraggeeIndex != newDraggeeIndex)
		{
			this.onSortChange();
		}
	},

	/**
	 * On Insertion Point Change event
	 */
	onInsertionPointChange: function()
	{
		Garnish.requestAnimationFrame($.proxy(function()
		{
			this.trigger('insertionPointChange');
			this.settings.onInsertionPointChange();
		}, this));
	},

	/**
	 * On Sort Change event
	 */
	onSortChange: function()
	{
		Garnish.requestAnimationFrame($.proxy(function()
		{
			this.trigger('sortChange');
			this.settings.onSortChange();
		}, this));
	},

	// Private methods
	// =========================================================================

	/**
	 * Sets the item midpoints up front so we don't have to keep checking on every mouse move
	 */
	_setMidpoints: function()
	{
		for (this._setMidpoints._i = 0; this._setMidpoints._i < this.totalOtherItems; this._setMidpoints._i++)
		{
			this._setMidpoint($(this.$items[this._setMidpoints._i]));
		}

		if (!this.settings.removeDraggee)
		{
			this._setMidpoint(this.$draggee);
		}
		else if (this.insertionVisible)
		{
			this._setMidpoint(this.$insertion);
		}
	},

	/**
	 * Set the midpoint on an item.
	 */
	_setMidpoint: function($item)
	{
		this._setMidpoint._offset = $item.offset();
		$item.data('midpointX', this._setMidpoint._offset.left + $item.outerWidth() / 2);
		$item.data('midpointY', this._setMidpoint._offset.top + $item.outerHeight() / 2);
	},

	/**
	 * Returns the closest item to the cursor.
	 */
	_getClosestItem: function()
	{
		this._getClosestItem._closestItem = null;

		if (!this.settings.removeDraggee)
		{
			this._testForClosestItem(this.$draggee[0]);
		}
		else if (this.insertionVisible)
		{
			this._testForClosestItem(this.$insertion[0]);
		}

		for (this._getClosestItem._i = 0; this._getClosestItem._i < this.totalOtherItems; this._getClosestItem._i++)
		{
			this._testForClosestItem(this.otherItems[this._getClosestItem._i]);
		}

		// Ignore if it's the draggee or insertion
		if (
			this._getClosestItem._closestItem != this.$draggee[0] &&
			(!this.insertionVisible || this._getClosestItem._closestItem != this.$insertion[0])
		)
		{
			return this._getClosestItem._closestItem;
		}
		else
		{
			return null;
		}
	},

	_testForClosestItem: function(item)
	{
		this._testForClosestItem._$item = $(item);

		this._testForClosestItem._mouseDiff = Garnish.getDist(
			this._testForClosestItem._$item.data('midpointX'),
			this._testForClosestItem._$item.data('midpointY'),
			this.draggeeVirtualMidpointX,
			this.draggeeVirtualMidpointY
		);

		if (
			this._getClosestItem._closestItem === null ||
			this._testForClosestItem._mouseDiff < this._getClosestItem._closestItemMouseDiff
		)
		{
			this._getClosestItem._closestItem          = this._testForClosestItem._$item[0];
			this._getClosestItem._closestItemMouseDiff = this._testForClosestItem._mouseDiff;
		}
	},

	/**
	 * Updates the position of the insertion point.
	 */
	_updateInsertion: function()
	{
		if (this.closestItem)
		{
			// Going down?
			if (this.$draggee.index() < $(this.closestItem).index())
			{
				this.$draggee.insertAfter(this.closestItem);
			}
			else
			{
				this.$draggee.insertBefore(this.closestItem);
			}

			this._placeInsertionWithDraggee();
		}

		// Now that things have shifted around we need to set the new midpoints
		this._setMidpoints();

		this.onInsertionPointChange();
	},

	_placeInsertionWithDraggee: function()
	{
		if (this.$insertion)
		{
			this.$insertion.insertBefore(this.$draggee.first());
			this.insertionVisible = true;
		}
	},

	/**
	 * Removes the insertion, if it's visible.
	 */
	_removeInsertion: function()
	{
		if (this.insertionVisible)
		{
			this.$insertion.remove();
			this.insertionVisible = false;
		}
	}
},

// Static Properties
// =============================================================================

{
	defaults: {
		container: null,
		insertion: null,
		onInsertionPointChange: $.noop,
		onSortChange: $.noop
	}
});
