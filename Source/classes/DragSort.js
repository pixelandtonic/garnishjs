/**
 * Drag-to-sort class
 *
 * Builds on the Drag class by allowing you to sort the elements amongst themselves.
 */
Garnish.DragSort = Garnish.Drag.extend({

	$heightedContainer: null,
	$insertion: null,
	$caboose: null,
	startDraggeeIndex: null,
	closestItem: null,

	/**
	 * Constructor
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

		if (this.settings.caboose)
		{
			// is it a function?
			if (typeof this.settings.caboose == 'function')
			{
				this.$caboose = $(this.settings.caboose());
			}
			else
			{
				this.$caboose = $(this.settings.caboose);
			}
		}
	},

	/**
	 * On Drag Start
	 */
	onDragStart: function()
	{
		this.base();

		// add the caboose?
		if (this.settings.container && this.$caboose)
		{
			this.$caboose.appendTo(this.settings.container);
			this.otherItems.push(this.$caboose[0]);
			this.totalOtherItems++;
		}

		this.closestItem = null;
		this.setMidpoints();
		this.setInsertion();

		// -------------------------------------------
		//  Get the closest container that has a height
		// -------------------------------------------

		if (this.settings.container)
		{
			this.$heightedContainer = $(this.settings.container);

			while (! this.$heightedContainer.height())
			{
				this.$heightedContainer = this.$heightedContainer.parent();
			}
		}

		this.startDraggeeIndex = this.draggeeIndex;
	},

	/**
	 * Sets the insertion element
	 */
	setInsertion: function()
	{
		// get the insertion
		if (this.settings.insertion)
		{
			if (typeof this.settings.insertion == 'function')
			{
				this.$insertion = $(this.settings.insertion(this.$draggee));
			}
			else
			{
				this.$insertion = $(this.settings.insertion);
			}
		}
	},

	/**
	 * Sets the item midpoints up front so we don't have to keep checking on every mouse move
	 */
	setMidpoints: function()
	{
		for (var i = 0; i < this.totalOtherItems; i++)
		{
			var $item = $(this.otherItems[i]),
				offset = $item.offset();

			$item.data('midpoint', {
				left: offset.left + $item.outerWidth() / 2,
				top:  offset.top + $item.outerHeight() / 2
			});
		}
	},

	/**
	 * On Drag
	 */
	onDrag: function()
	{
		// if there's a container set, make sure that we're hovering over it
		if (this.$heightedContainer && !Garnish.hitTest(this.mouseX, this.mouseY, this.$heightedContainer))
		{
			if (this.closestItem)
			{
				this.closestItem = null;

				if (this.$insertion)
				{
					this.$insertion.remove();
				}
			}
		}
		else
		{
			// is there a new closest item?
			if (this.closestItem != (this.closestItem = this.getClosestItem()))
			{
				this.onInsertionPointChange();
			}
		}

		this.base();
	},

	/**
	 * Returns the closest item to the cursor.
	 */
	getClosestItem: function()
	{
		this.getClosestItem._closestItem = null;
		this.getClosestItem._closestItemMouseDiff = null;

		for (this.getClosestItem._i = 0; this.getClosestItem._i < this.totalOtherItems; this.getClosestItem._i++)
		{
			this.getClosestItem._$item = $(this.otherItems[this.getClosestItem._i]);
			this.getClosestItem._midpoint = this.getClosestItem._$item.data('midpoint');
			this.getClosestItem._mouseDiff = Garnish.getDist(this.getClosestItem._midpoint.left, this.getClosestItem._midpoint.top, this.mouseX, this.mouseY);

			if (this.getClosestItem._closestItem === null || this.getClosestItem._mouseDiff < this.getClosestItem._closestItemMouseDiff)
			{
				this.getClosestItem._closestItem = this.getClosestItem._$item[0];
				this.getClosestItem._closestItemMouseDiff = this.getClosestItem._mouseDiff;
			}
		}

		return this.getClosestItem._closestItem;
	},

	/**
	 * On Insertion Point Change
	 */
	onInsertionPointChange: function()
	{
		if (this.closestItem)
		{
			this.$draggee.insertBefore(this.closestItem);

			if (this.$insertion)
			{
				this.$insertion.insertBefore(this.closestItem);
			}
		}

		this.settings.onInsertionPointChange();
	},

	/**
	 * On Drag Stop
	 */
	onDragStop: function()
	{
		// remove the caboose
		if (this.$caboose)
		{
			this.$caboose.remove();
		}

		if (this.$insertion)
		{
			this.$insertion.remove();
		}

		// "show" the drag items, but make them invisible
		this.$draggee.css({
			display:    this.draggeeDisplay,
			visibility: 'hidden'
		});

		// return the helpers to the draggees
		this.returnHelpersToDraggees();

		this.base();

		// has the item actually moved?
		this.$items = $().add(this.$items);
		var newDraggeeIndex = $.inArray(this.$draggee[0], this.$items);
		if (this.startDraggeeIndex != newDraggeeIndex)
		{
			this.settings.onSortChange();
		}
	}
},
{
	defaults: {
		container: null,
		insertion: null,
		onInsertionPointChange: $.noop,
		onSortChange: $.noop
	}
});
