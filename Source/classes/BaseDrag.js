/**
 * Base drag class
 *
 * Does all the grunt work for manipulating elements via click-and-drag,
 * while leaving the actual element manipulation up to a subclass.
 */
Garnish.BaseDrag = Garnish.Base.extend({

	// Properties
	// =========================================================================

	$items: null,

	dragging: false,

	mousedownX: null,
	mousedownY: null,
	realMouseX: null,
	realMouseY: null,
	mouseX: null,
	mouseY: null,
	mouseDistX: null,
	mouseDistY: null,

	$targetItem: null,
	targetItemMouseOffsetX: null,
	targetItemMouseOffsetY: null,

	scrollProperty: null,
	scrollDir: null,
	scrollProxy: null,
	scrollFrame: null,

	_: null,

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

		this.settings = $.extend({}, Garnish.BaseDrag.defaults, settings);

		this.$items = $();
		this._ = {};

		if (items)
		{
			this.addItems(items);
		}
	},

	/**
	 * Start Dragging
	 */
	startDragging: function()
	{
		this.dragging = true;
		this.onDragStart();
	},

	/**
	 * Drag
	 */
	drag: function(didMouseMove)
	{
		if (didMouseMove)
		{
			// Is the mouse up against one of the window edges?
			this.drag._scrollProperty = null;

			if (this.settings.axis != Garnish.X_AXIS)
			{
				// Scrolling up?
				this.drag._winScrollTop = Garnish.$win.scrollTop();

				if (this.mouseY < this.drag._winScrollTop + Garnish.BaseDrag.windowScrollTargetSize)
				{
					this.drag._scrollProperty = 'scrollTop';
					this.drag._scrollDir = -1;
				}
				else
				{
					// Scrolling down?
					this.drag._winHeight = Garnish.$win.height();

					if (this.mouseY > this.drag._winScrollTop + this.drag._winHeight - Garnish.BaseDrag.windowScrollTargetSize)
					{
						this.drag._scrollProperty = 'scrollTop';
						this.drag._scrollDir = 1;
					}
				}
			}

			if (!this.drag._scrollProperty && this.settings.axis != Garnish.Y_AXIS)
			{
				// Scrolling left?
				this.drag._winScrollLeft = Garnish.$win.scrollLeft();

				if (this.mouseX < this.drag._winScrollLeft + Garnish.BaseDrag.windowScrollTargetSize)
				{
					this.drag._scrollProperty = 'scrollLeft';
					this.drag._scrollDir = -1;
				}
				else
				{
					// Scrolling right?
					this.drag._winWidth = Garnish.$win.width();

					if (this.mouseX > this.drag._winScrollLeft + this.drag._winWidth - Garnish.BaseDrag.windowScrollTargetSize)
					{
						this.drag._scrollProperty = 'scrollLeft';
						this.drag._scrollDir = 1;
					}
				}
			}

			if (this.drag._scrollProperty)
			{
				// Are we starting to scroll now?
				if (!this.scrollProperty)
				{
					if (!this.scrollProxy)
					{
						this.scrollProxy = $.proxy(this, '_scrollWindow');
					}

					if (this.scrollFrame)
					{
						Garnish.cancelAnimationFrame(this.scrollFrame);
						this.scrollFrame = null;
					}

					this.scrollFrame = Garnish.requestAnimationFrame(this.scrollProxy);
				}

				this.scrollProperty = this.drag._scrollProperty;
				this.scrollDir = this.drag._scrollDir;
			}
			else
			{
				this._cancelWindowScroll();
			}
		}

		this.onDrag();
	},

	/**
	 * Stop Dragging
	 */
	stopDragging: function()
	{
		this.dragging = false;
		this.onDragStop();

		// Clear the scroll animation
		this._cancelWindowScroll();
	},

	/**
	 * Add Items
	 *
	 * @param mixed items Elements that should be draggable.
	 */
	addItems: function(items)
	{
		items = $.makeArray(items);

		for (var i = 0; i < items.length; i++)
		{
			var item = items[i];

			// Make sure this element doesn't belong to another dragger
			if ($.data(item, 'drag'))
			{
				Garnish.log('Element was added to more than one dragger');
				$.data(item, 'drag').removeItems(item);
			}

			// Add the item
			$.data(item, 'drag', this);

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

			$.data(item, 'drag-handle', $handle);
			$handle.data('drag-item', item);
			this.addListener($handle, 'mousedown', '_onMouseDown');
		}

		this.$items = $().add(this.$items.add(items));
	},

	/**
	 * Remove Items
	 *
	 * @param mixed items Elements that should no longer be draggable.
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
				this._deinitItem(item);
				this.$items.splice(index, 1);
			}
		}
	},

	/**
	 * Remove All Items
	 */
	removeAllItems: function()
	{
		for (var i = 0; i < this.$items.length; i++)
		{
			this._deinitItem(this.$items[i]);
		}

		this.$items = $();
	},

	/**
	 * Destroy
	 */
	destroy: function()
	{
		this.removeAllItems();
		this.base();
	},

	// Events
	// -------------------------------------------------------------------------

	/**
	 * On Drag Start
	 */
	onDragStart: function()
	{
		Garnish.requestAnimationFrame($.proxy(function()
		{
			this.trigger('dragStart');
			this.settings.onDragStart();
		}, this));
	},

	/**
	 * On Drag
	 */
	onDrag: function()
	{
		Garnish.requestAnimationFrame($.proxy(function()
		{
			this.trigger('drag');
			this.settings.onDrag();
		}, this));
	},

	/**
	 * On Drag Stop
	 */
	onDragStop: function()
	{
		Garnish.requestAnimationFrame($.proxy(function()
		{
			this.trigger('dragStop');
			this.settings.onDragStop();
		}, this));
	},

	// Private methods
	// =========================================================================

	/**
	 * On Mouse Down
	 */
	_onMouseDown: function(ev)
	{
		// Ignore right clicks
		if (ev.which != Garnish.PRIMARY_CLICK)
		{
			return;
		}

		// Ignore if we already have a target
		if (this.$targetItem)
		{
			return;
		}

		// Make sure the target isn't a button (unless the button is the handle)
		if (ev.currentTarget != ev.target && this.settings.ignoreHandleSelector)
		{
			var $target = $(ev.target);

			if (
				$target.is(this.settings.ignoreHandleSelector) ||
				$target.closest(this.settings.ignoreHandleSelector).length
			)
			{
				return;
			}
		}

		ev.preventDefault();

		// Capture the target
		this.$targetItem = $($.data(ev.currentTarget, 'drag-item'));

		// Capture the current mouse position
		this.mousedownX = this.mouseX = ev.pageX;
		this.mousedownY = this.mouseY = ev.pageY;

		// Capture the difference between the mouse position and the target item's offset
		var offset = this.$targetItem.offset();
		this.targetItemMouseOffsetX = offset.left - ev.pageX;
		this.targetItemMouseOffsetY = offset.top - ev.pageY;

		// Listen for mousemove, mouseup
		this.addListener(Garnish.$doc, 'mousemove', '_onMouseMove');
		this.addListener(Garnish.$doc, 'mouseup', '_onMouseUp');
	},

	/**
	 * On Mouse Move
	 */
	_onMouseMove: function(ev)
	{
		ev.preventDefault();

		this.realMouseX = ev.pageX;
		this.realMouseY = ev.pageY;

		if (this.settings.axis != Garnish.Y_AXIS)
		{
			this.mouseX = ev.pageX;
		}

		if (this.settings.axis != Garnish.X_AXIS)
		{
			this.mouseY = ev.pageY;
		}

		this.mouseDistX = this.mouseX - this.mousedownX;
		this.mouseDistY = this.mouseY - this.mousedownY;

		if (!this.dragging)
		{
			// Has the mouse moved far enough to initiate dragging yet?
			this._onMouseMove._mouseDist = Garnish.getDist(this.mousedownX, this.mousedownY, this.realMouseX, this.realMouseY);

			if (this._onMouseMove._mouseDist >= Garnish.BaseDrag.minMouseDist)
			{
				this.startDragging();
			}
		}

		if (this.dragging)
		{
			this.drag(true);
		}
	},

	/**
	 * On Moues Up
	 */
	_onMouseUp: function(ev)
	{
		// Unbind the document events
		this.removeAllListeners(Garnish.$doc);

		if (this.dragging)
		{
			this.stopDragging();
		}

		this.$targetItem = null;
	},

	/**
	 * Scroll Window
	 */
	_scrollWindow: function()
	{
		this._.scrollPos = Garnish.$win[this.scrollProperty]();
		Garnish.$win[this.scrollProperty](this._.scrollPos + this.scrollDir * 3);

		this.mouseY -= this._.scrollPos - Garnish.$win[this.scrollProperty]()

		this.drag();

		this.scrollFrame = Garnish.requestAnimationFrame(this.scrollProxy);
	},

	/**
	 * Cancel Window Scroll
	 */
	_cancelWindowScroll: function()
	{
		if (this.scrollFrame)
		{
			Garnish.cancelAnimationFrame(this.scrollFrame);
			this.scrollFrame = null;
		}

		this.scrollProperty = null;
		this.scrollDir = null;
	},

	/**
	 * Deinitialize an item.
	 */
	_deinitItem: function(item)
	{
		var $handle = $.data(item, 'drag-handle');

		if ($handle)
		{
			$handle.removeData('drag-item');
			this.removeAllListeners($handle);
		}

		$.removeData(item, 'drag');
		$.removeData(item, 'drag-handle');
	}
},

// Static Properties
// =============================================================================

{
	minMouseDist: 1,
	windowScrollTargetSize: 20,

	defaults: {
		handle: null,
		axis: null,
		ignoreHandleSelector: 'input, textarea, button, select, .btn',

		onDragStart: $.noop,
		onDrag:      $.noop,
		onDragStop:  $.noop
	}
});
