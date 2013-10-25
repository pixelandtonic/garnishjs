/**
 * Drag class
 *
 * Builds on the BaseDrag class by "picking up" the selceted element(s),
 * without worrying about what to do when an element is being dragged.
 */
Garnish.Drag = Garnish.BaseDrag.extend({

	$draggee: null,
	otherItems: null,
	totalOtherItems: null,
	helpers: null,
	helperTargets: null,
	helperPositions: null,
	helperLagIncrement: null,
	updateHelperPosInterval: null,
	draggeeMouseOffsetX: null,
	draggeeMouseOffsetY: null,
	draggeeMidpointX: null,
	draggeeMidpointY: null,

	/**
	 * init
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
	 * On Drag Start
	 */
	onDragStart: function()
	{
		this.helpers = [];
		this.helperTargets = [];
		this.helperPositions = [];

		// save their display style (block/table-row) so we can re-apply it later
		this.draggeeDisplay = this.$draggee.css('display');

		this.createHelpers();

		// remove/hide the draggee
		if (this.settings.removeDraggee)
		{
			this.$draggee.hide();
		}
		else
		{
			this.$draggee.css('visibility', 'hidden');
		}

		this.lastMouseX = this.lastMouseY = null;

		// -------------------------------------------
		//  Deal with the remaining items
		// -------------------------------------------

		// create an array of all the other items
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

		// keep the helpers following the cursor, with a little lag to smooth it out
		this.helperLagIncrement = this.helpers.length == 1 ? 0 : Garnish.Drag.helperLagIncrementDividend / (this.helpers.length-1);
		this.updateHelperPosInterval = setInterval($.proxy(this, 'updateHelperPos'), Garnish.Drag.updateHelperPosInterval);

		// Capture the mouse offset
		var offset = this.$draggee.offset();
		this.draggeeMouseOffsetX = this.mouseX - (offset.left + this.$draggee.outerWidth() / 2);
		this.draggeeMouseOffsetY = this.mouseY - (offset.top + this.$draggee.outerHeight() / 2);

		this.base();
	},

	/**
	 * On Drag
	 */
	onDrag: function()
	{
		this.draggeeMidpointX = this.mouseX - this.draggeeMouseOffsetX;
		this.draggeeMidpointY = this.mouseY - this.draggeeMouseOffsetY;

		this.base();
	},

	/**
	 * On Drag Stop
	 */
	onDragStop: function()
	{
		// clear the helper interval
		clearInterval(this.updateHelperPosInterval);

		this.base();
	},

	/**
	 * Creates helper clones of the draggee(s)
	 */
	createHelpers: function()
	{
		for (var i = 0; i < this.$draggee.length; i++)
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

			var helperPos = this.getHelperTarget(i);

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
		}
	},

	/**
	 * Get the helper position for a draggee helper
	 */
	getHelperTarget: function(i)
	{
		return {
			left: this.mouseX - this.targetItemMouseDiffX + (i * Garnish.Drag.helperSpacingX),
			top:  this.mouseY - this.targetItemMouseDiffY + (i * Garnish.Drag.helperSpacingY)
		};
	},

	/**
	 * Update Helper Position
	 */
	updateHelperPos: function()
	{
		// has the mouse moved?
		if (this.mouseX !== this.lastMouseX || this.mouseY !== this.lastMouseY)
		{
			// get the new target helper positions
			for (this.updateHelperPos._i = 0; this.updateHelperPos._i < this.helpers.length; this.updateHelperPos._i++)
			{
				this.helperTargets[this.updateHelperPos._i] = this.getHelperTarget(this.updateHelperPos._i);
			}

			this.lastMouseX = this.mouseX;
			this.lastMouseY = this.mouseY;
		}

		// gravitate helpers toward their target positions
		for (this.updateHelperPos._j = 0; this.updateHelperPos._j < this.helpers.length; this.updateHelperPos._j++)
		{
			this.updateHelperPos._lag = Garnish.Drag.helperLagBase + (this.helperLagIncrement * this.updateHelperPos._j);

			this.helperPositions[this.updateHelperPos._j] = {
				left: this.helperPositions[this.updateHelperPos._j].left + ((this.helperTargets[this.updateHelperPos._j].left - this.helperPositions[this.updateHelperPos._j].left) / this.updateHelperPos._lag),
				top:  this.helperPositions[this.updateHelperPos._j].top  + ((this.helperTargets[this.updateHelperPos._j].top  - this.helperPositions[this.updateHelperPos._j].top) / this.updateHelperPos._lag)
			};

			this.helpers[this.updateHelperPos._j].css(this.helperPositions[this.updateHelperPos._j]);
		}
	},

	/**
	 * Return Helpers to Draggees
	 */
	returnHelpersToDraggees: function()
	{
		for (var i = 0; i < this.$draggee.length; i++)
		{
			var $draggee = $(this.$draggee[i]),
				$helper = this.helpers[i],
				draggeeOffset = $draggee.offset();

			// preserve $draggee and $helper for the end of the animation
			(
				function($draggee, $helper)
				{
					$helper.animate({left: draggeeOffset.left, top: draggeeOffset.top}, 'fast',
						function()
						{
							$draggee.css('visibility', 'inherit');
							$helper.remove();
						}
					);
				}
			)($draggee, $helper);
		}
	}
},
{
	helperZindex: 1000,
	helperLagBase: 1,
	helperLagIncrementDividend: 1.5,
	updateHelperPosInterval: 20,
	helperSpacingX: 5,
	helperSpacingY: 5,

	defaults: {
		removeDraggee: false,
		helperOpacity: 1,
		helper: null
	}
});
