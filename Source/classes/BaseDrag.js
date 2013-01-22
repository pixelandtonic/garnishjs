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

	/**
	 * Init
	 */
	init: function(items, settings)
	{
		// Param mapping
		if (!settings && Garnish.isObject(items))
		{
			// (settings)
			settings = items;
			items = null;
		}

		this.settings = $.extend({}, Garnish.BaseDrag.defaults, settings);

		this.$items = $();

		if (items) this.addItems(items);
	},

	/**
	 * On Mouse Down
	 */
	onMouseDown: function(ev)
	{
		// Ignore right clicks
		if (ev.button != Garnish.PRIMARY_CLICK)
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
		ev.preventDefault();

		if (this.settings.axis != Garnish.Y_AXIS) this.mouseX = ev.pageX;
		if (this.settings.axis != Garnish.X_AXIS) this.mouseY = ev.pageY;

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

		this.onDrag();
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

			$.data(item, 'drag-handle', $handle);
			$handle.data('drag-item', item);
			this.addListener($handle, 'mousedown', 'onMouseDown');
		}
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

			$handle.data('drag-item', null);
			$.data(item, 'drag', null);
			$.data(item, 'drag-handle', null);
			this.removeAllListeners($handle);
		}

		this.$items = $();
	}
},
{
	minMouseDist: 1,

	defaults: {
		handle: null,
		axis: null,
		ignoreButtons: true,

		onDragStart: $.noop,
		onDrag:      $.noop,
		onDragStop:  $.noop
	}
});
