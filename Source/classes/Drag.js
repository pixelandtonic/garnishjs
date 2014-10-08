/**
 * Drag class
 *
 * Builds on the BaseDrag class by "picking up" the selceted element(s),
 * without worrying about what to do when an element is being dragged.
 */
Garnish.Drag = Garnish.BaseDrag.extend({

	// Properties
	// =========================================================================

	$draggee: null,
	draggeeMouseOffsetX: null,
	draggeeMouseOffsetY: null,
	draggeeWidth: null,
	draggeeHeight: null,

	otherItems: null,
	totalOtherItems: null,

	helpers: null,
	helperTargets: null,
	helperPositions: null,
	helperLagIncrement: null,
	updateHelperPosProxy: null,
	updateHelperPosFrame: null,

	lastMouseX: null,
	lastMouseY: null,

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

		settings = $.extend({}, Garnish.Drag.defaults, settings);
		this.base(items, settings);
	},

	/**
	 * Start Dragging
	 */
	startDragging: function()
	{
		// Reset some things
		this.helpers = [];
		this.helperTargets = [];
		this.helperPositions = [];
		this.lastMouseX = this.lastMouseY = null;

		// Set the $draggee
		this.$draggee = this.findDraggee();

		// Put the target item in the front of the list
		this.$draggee = $([ this.$targetItem[0] ].concat(this.$draggee.not(this.$targetItem[0]).toArray()));

		// Capture the mouse offset and width
		var offset = this.$draggee.offset();
		this.draggeeMouseOffsetX = offset.left - this.mouseX;
		this.draggeeMouseOffsetY = offset.top - this.mouseY;
		this.draggeeWidth        = this.$draggee.outerWidth();
		this.draggeeHeight       = this.$draggee.outerHeight();

		// Save the draggee's display style (block/table-row) so we can re-apply it later
		this.draggeeDisplay = this.$draggee.css('display');

		// Create the helper(s)
		this._createHelpers();

		// Remove/hide the draggee
		this._hideDraggee();

		// Create an array of all the other items
		this.otherItems = [];

		for (var i = 0; i < this.$items.length; i++)
		{
			var item = this.$items[i];

			if ($.inArray(item, this.$draggee) == -1)
			{
				this.otherItems.push(item);
			}
		};

		this.totalOtherItems = this.otherItems.length;

		// Keep the helpers following the cursor, with a little lag to smooth it out
		if (!this.updateHelperPosProxy)
		{
			this.updateHelperPosProxy = $.proxy(this, '_updateHelperPos');
		}

		this.helperLagIncrement = this.helpers.length == 1 ? 0 : Garnish.Drag.helperLagIncrementDividend / (this.helpers.length-1);
		this.updateHelperPosFrame = Garnish.requestAnimationFrame(this.updateHelperPosProxy);

		this.base();
	},

	/**
	 * Drag
	 */
	drag: function()
	{
		// Update the draggee's virtual midpoint
		this.draggeeVirtualMidpointX = this.mouseX + this.draggeeMouseOffsetX + (this.draggeeWidth / 2);
		this.draggeeVirtualMidpointY = this.mouseY + this.draggeeMouseOffsetY + (this.draggeeHeight / 2);

		this.base();
	},

	/**
	 * Stop Dragging
	 */
	stopDragging: function()
	{
		// Clear the helper animation
		Garnish.cancelAnimationFrame(this.updateHelperPosFrame);

		this.base();
	},

	/**
	 * Identifies the item(s) that are being dragged.
	 */
	findDraggee: function()
	{
		switch (typeof this.settings.filter)
		{
			case 'function':
			{
				return this.settings.filter();
			}

			case 'string':
			{
				return this.$items.filter(this.settings.filter);
			}

			default:
			{
				return this.$targetItem;
			}
		}
	},

	/**
	 * Return Helpers to Draggees
	 */
	returnHelpersToDraggees: function()
	{
		for (var i = 0; i < this.helpers.length; i++)
		{
			var $draggee = $(this.$draggee[i]),
				$helper = this.helpers[i];

			$draggee.css({
				display:    this.draggeeDisplay,
				visibility: 'hidden'
			});

			var draggeeOffset = $draggee.offset();

			if (i == 0)
			{
				var callback = $.proxy(this, '_showDraggee');
			}
			else
			{
				var callback = null;
			}

			$helper.velocity({left: draggeeOffset.left, top: draggeeOffset.top}, 'fast', callback);
		}
	},

	// Private methods
	// =========================================================================

	/**
	 * Creates helper clones of the draggee(s)
	 */
	_createHelpers: function()
	{
		if (this.settings.collapseDraggees)
		{
			this._createHelper(0);
		}
		else
		{
			for (var i = 0; i < this.$draggee.length; i++)
			{
				this._createHelper(i);
			}
		}
	},

	/**
	 * Creates a helper.
	 */
	_createHelper: function(i)
	{
		var $draggee = $(this.$draggee[i]),
			$draggeeHelper = $draggee.clone().addClass('draghelper');

		$draggeeHelper.css({
			width: $draggee.width(),
			height: $draggee.height(),
			margin: 0
		});

		if (this.settings.helper)
		{
			if (typeof this.settings.helper == 'function')
			{
				$draggeeHelper = this.settings.helper($draggeeHelper);
			}
			else
			{
				$draggeeHelper = $(this.settings.helper).append($draggeeHelper);
			}
		}

		$draggeeHelper.appendTo(Garnish.$bod);

		var helperPos = this._getHelperTarget(i);

		$draggeeHelper.css({
			position: 'absolute',
			top: helperPos.top,
			left: helperPos.left,
			zIndex: Garnish.Drag.helperZindex + this.$draggee.length - i,
			opacity: this.settings.helperOpacity
		});

		this.helperPositions[i] = {
			top:  helperPos.top,
			left: helperPos.left
		};

		this.helpers.push($draggeeHelper);
	},

	/**
	 * Update Helper Position
	 */
	_updateHelperPos: function()
	{
		// Has the mouse moved?
		if (this.mouseX !== this.lastMouseX || this.mouseY !== this.lastMouseY)
		{
			// Get the new target helper positions
			for (this._updateHelperPos._i = 0; this._updateHelperPos._i < this.helpers.length; this._updateHelperPos._i++)
			{
				this.helperTargets[this._updateHelperPos._i] = this._getHelperTarget(this._updateHelperPos._i);
			}

			this.lastMouseX = this.mouseX;
			this.lastMouseY = this.mouseY;
		}

		// Gravitate helpers toward their target positions
		for (this._updateHelperPos._j = 0; this._updateHelperPos._j < this.helpers.length; this._updateHelperPos._j++)
		{
			this._updateHelperPos._lag = Garnish.Drag.helperLagBase + (this.helperLagIncrement * this._updateHelperPos._j);

			this.helperPositions[this._updateHelperPos._j] = {
				left: this.helperPositions[this._updateHelperPos._j].left + ((this.helperTargets[this._updateHelperPos._j].left - this.helperPositions[this._updateHelperPos._j].left) / this._updateHelperPos._lag),
				top:  this.helperPositions[this._updateHelperPos._j].top  + ((this.helperTargets[this._updateHelperPos._j].top  - this.helperPositions[this._updateHelperPos._j].top) / this._updateHelperPos._lag)
			};

			this.helpers[this._updateHelperPos._j].css(this.helperPositions[this._updateHelperPos._j]);
		}

		// Let's do this again on the next frame!
		this.updateHelperPosFrame = Garnish.requestAnimationFrame(this.updateHelperPosProxy);
	},

	/**
	 * Get the helper position for a draggee helper
	 */
	_getHelperTarget: function(i)
	{
		return {
			left: this.mouseX + this.targetItemMouseOffsetX + (i * Garnish.Drag.helperSpacingX),
			top:  this.mouseY + this.targetItemMouseOffsetY + (i * Garnish.Drag.helperSpacingY)
		};
	},

	_hideDraggee: function()
	{
		if (this.settings.removeDraggee)
		{
			this.$draggee.hide();
		}
		else if (this.settings.collapseDraggees)
		{
			this.$draggee.first().css('visibility', 'hidden');
			this.$draggee.not(this.$draggee.first()).hide();
		}
		else
		{
			this.$draggee.css('visibility', 'hidden');
		}
	},

	_showDraggee: function()
	{
		// Remove the helpers
		for (var i = 0; i < this.helpers.length; i++)
		{
			this.helpers[i].remove();
		}

		this.helpers = null;

		this.$draggee.show().css('visibility', 'inherit');
	}
},

// Static Properties
// =============================================================================

{
	helperZindex: 1000,
	helperLagBase: 1,
	helperLagIncrementDividend: 1.5,
	helperSpacingX: 5,
	helperSpacingY: 5,

	defaults: {
		filter: null,
		collapseDraggees: false,
		removeDraggee: false,
		magneticHelpers: false,
		helperOpacity: 1,
		helper: null
	}
});
