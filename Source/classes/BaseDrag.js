/**
 * Base drag class
 *
 * Does all the grunt work for manipulating elements via click-and-drag,
 * while leaving the actual element manipulation up to a subclass.
 */
Garnish.BaseDrag = Garnish.Base.extend({

	$items: null,

	dragging: false,

	mousedownX: null,
	mousedownY: null,
	mouseDistX: null,
	mouseDistY: null,
	$targetItem: null,
	targetItemMouseDiffX: null,
	targetItemMouseDiffY: null,
	mouseX: null,
	mouseY: null,
	lastMouseX: null,
	lastMouseY: null,

	scrollProperty: null,
	scrollDir: null,

	_: null,

	/**
	 * Init
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

		if (items) this.addItems(items);
	},

	/**
	 * On Mouse Down
	 */
	onMouseDown: function(ev)
	{
		// Ignore right clicks
		if (ev.which != Garnish.PRIMARY_CLICK)
		{
			return;
		}

		// ignore if we already have a target
		if (this.$targetItem) return;

		// Make sure the target isn't a button (unless the button is the handle)
		if (this.settings.ignoreButtons && ev.currentTarget != ev.target)
		{
			var $target = $(ev.target);
			if ($target.hasClass('btn') || $target.closest('.btn').length)
			{
				return;
			}
		}

		ev.preventDefault();

		// capture the target
		this.$targetItem = $($.data(ev.currentTarget, 'drag-item'));

		// capture the current mouse position
		this.mousedownX = this.mouseX = ev.pageX;
		this.mousedownY = this.mouseY = ev.pageY;

		// capture the difference between the mouse position and the target item's offset
		var offset = this.$targetItem.offset();
		this.targetItemMouseDiffX = ev.pageX - offset.left;
		this.targetItemMouseDiffY = ev.pageY - offset.top;

		// listen for mousemove, mouseup
		this.addListener(Garnish.$doc, 'mousemove', 'onMouseMove');
		this.addListener(Garnish.$doc, 'mouseup', 'onMouseUp');
	},

	/**
	 * On Moues Move
	 */
	onMouseMove: function(ev)
	{
		if (ev)
		{
			ev.preventDefault();

			if (this.settings.axis != Garnish.Y_AXIS) this.mouseX = ev.pageX;
			if (this.settings.axis != Garnish.X_AXIS) this.mouseY = ev.pageY;
		}

		this.mouseDistX = this.mouseX - this.mousedownX;
		this.mouseDistY = this.mouseY - this.mousedownY;

		if (!this.dragging)
		{
			// Has the mouse moved far enough to initiate dragging yet?
			this.onMouseMove._mouseDist = Garnish.getDist(this.mousedownX, this.mousedownY, this.mouseX, this.mouseY);
			if (this.onMouseMove._mouseDist >= Garnish.BaseDrag.minMouseDist)
			{
				this.startDragging();
			}
			else
			{
				return;
			}
		}

		if (ev)
		{
			// Is the mouse up against one of the window edges?
			this.onMouseMove._scrollProperty = null;

			if (this.settings.axis != Garnish.X_AXIS)
			{
				// Scrolling up?
				this.onMouseMove._winScrollTop = Garnish.$win.scrollTop();

				if (this.mouseY < this.onMouseMove._winScrollTop + Garnish.BaseDrag.windowScrollTargetSize)
				{
					this.onMouseMove._scrollProperty = 'scrollTop';
					this.onMouseMove._scrollDir = -1;
				}
				else
				{
					// Scrolling down?
					this.onMouseMove._winHeight = Garnish.$win.height();

					if (this.mouseY > this.onMouseMove._winScrollTop + this.onMouseMove._winHeight - Garnish.BaseDrag.windowScrollTargetSize)
					{
						this.onMouseMove._scrollProperty = 'scrollTop';
						this.onMouseMove._scrollDir = 1;
					}
				}
			}

			if (!this.onMouseMove._scrollProperty && this.settings.axis != Garnish.Y_AXIS)
			{
				// Scrolling left?
				this.onMouseMove._winScrollLeft = Garnish.$win.scrollLeft();

				if (this.mouseX < this.onMouseMove._winScrollLeft + Garnish.BaseDrag.windowScrollTargetSize)
				{
					this.onMouseMove._scrollProperty = 'scrollLeft';
					this.onMouseMove._scrollDir = -1;
				}
				else
				{
					// Scrolling right?
					this.onMouseMove._winWidth = Garnish.$win.width();

					if (this.mouseX > this.onMouseMove._winScrollLeft + this.onMouseMove._winWidth - Garnish.BaseDrag.windowScrollTargetSize)
					{
						this.onMouseMove._scrollProperty = 'scrollLeft';
						this.onMouseMove._scrollDir = 1;
					}
				}
			}

			if (this.onMouseMove._scrollProperty)
			{
				if (!this.scrollProperty)
				{
					this.scrollInterval = setInterval($.proxy(this, 'scrollWindow'), 20);
				}

				this.scrollProperty = this.onMouseMove._scrollProperty;
				this.scrollDir = this.onMouseMove._scrollDir;
			}
			else
			{
				this.cancelWindowScroll();
			}
		}

		this.onDrag();
	},

	scrollWindow: function()
	{
		this._.scrollPos = Garnish.$win[this.scrollProperty]();
		Garnish.$win[this.scrollProperty](this._.scrollPos + this.scrollDir * 3);

		this.mouseY -= this._.scrollPos - Garnish.$win[this.scrollProperty]()

		this.onMouseMove();
	},

	cancelWindowScroll: function()
	{
		if (this.scrollInterval)
		{
			clearInterval(this.scrollInterval);
			this.scrollInterval = null;
		}

		this.scrollProperty = null;
		this.scrollDir = null;
	},

	/**
	 * On Moues Up
	 */
	onMouseUp: function(ev)
	{
		// unbind the document events
		this.removeAllListeners(Garnish.$doc);

		if (this.dragging)
		{
			this.stopDragging();
		}

		this.$targetItem = null;
	},

	/**
	 * Start Dragging
	 */
	startDragging: function()
	{
		// Set the $draggee
		switch (typeof this.settings.filter)
		{
			case 'function':
			{
				this.$draggee = this.settings.filter();
				break;
			}

			case 'string':
			{
				this.$draggee = this.$items.filter(this.settings.filter);
				break;
			}

			default:
			{
				this.$draggee = this.$targetItem;
			}
		}

		// put the target item in the front of the list
		this.$draggee = $([ this.$targetItem[0] ].concat(this.$draggee.not(this.$targetItem[0]).toArray()));

		this.dragging = true;
		this.onDragStart();
	},

	/**
	 * Stop Dragging
	 */
	stopDragging: function()
	{
		this.dragging = false;
		this.onDragStop();
		this.cancelWindowScroll();
	},

	/**
	 * On Drag Start
	 */
	onDragStart: function()
	{
		this.settings.onDragStart();
	},

	/**
	 * On Drag
	 */
	onDrag: function()
	{
		this.settings.onDrag();
	},

	/**
	 * On Drag Stop
	 */
	onDragStop: function()
	{
		this.settings.onDragStop();
	},

	/**
	 * Add Items
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
			this.addListener($handle, 'mousedown', 'onMouseDown');
		}

		this.$items = $().add(this.$items.add(items));
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
				var $handle = $.data(item, 'drag-handle');
				$handle.data('drag-item', null);
				$.data(item, 'drag', null);
				$.data(item, 'drag-handle', null);
				this.removeAllListeners($handle);
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
			var item = this.$items[i],
				$handle = $.data(item, 'drag-handle');

			$.data(item, 'drag', null);

			if ($handle)
			{
				$.data(item, 'drag-handle', null);
				$handle.data('drag-item', null);
				this.removeAllListeners($handle);
			}
		}

		this.$items = $();
	}
},
{
	minMouseDist: 1,
	windowScrollTargetSize: 20,

	defaults: {
		handle: null,
		filter: null,
		axis: null,
		ignoreButtons: true,

		onDragStart: $.noop,
		onDrag:      $.noop,
		onDragStop:  $.noop
	}
});
