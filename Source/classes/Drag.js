/**
 * Drag class
 *
 * Builds on the BaseDrag class by "picking up" the selceted element(s),
 * without worrying about what to do when an element is being dragged.
 */
Garnish.Drag = Garnish.BaseDrag.extend({

	$draggee: null,
	helpers: null,
	helperTargets: null,
	helperPositions: null,
	helperLagIncrement: null,
	updateHelperPosInterval: null,

	/**
	 * init
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

		this.getDraggee();
		this.draggeeIndex = $.inArray(this.$draggee[0], this.$items);

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

		// keep the helpers following the cursor, with a little lag to smooth it out
		this.helperLagIncrement = this.helpers.length == 1 ? 0 : Garnish.Drag.helperLagIncrementDividend / (this.helpers.length-1);
		this.updateHelperPosInterval = setInterval($.proxy(this, 'updateHelperPos'), Garnish.Drag.updateHelperPosInterval);

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
	 * Get the draggee(s) based on the filter setting, with the clicked item listed first
	 */
	getDraggee: function()
	{
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
	},

	/**
	 * Creates helper clones of the draggee(s)
	 */
	createHelpers: function()
	{
		for (var i = 0; i < this.$draggee.length; i++)
		{
			var $draggee = $(this.$draggee[i]),
				$draggeeHelper = $draggee.clone();

			$draggeeHelper.css({
				width: $draggee.width(),
				height: $draggee.height(),
				margin: 0
			});

			if (typeof this.settings.helper == 'function')
				$draggeeHelper = this.settings.helper($draggeeHelper);
			else if (this.settings.helper)
				$draggeeHelper = $(this.settings.helper).append($draggeeHelper);

			$draggeeHelper.appendTo(Garnish.$bod);

			var helperPos = this.getHelperTarget(i);

			$draggeeHelper.css({
				position: 'absolute',
				top: helperPos.top,
				left: helperPos.left,
				zIndex: Garnish.Drag.helperZindex, // + this.$draggee.length - i,
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
			for (Garnish.Drag.updateHelperPos._i = 0; Garnish.Drag.updateHelperPos._i < this.helpers.length; Garnish.Drag.updateHelperPos._i++)
			{
				this.helperTargets[Garnish.Drag.updateHelperPos._i] = this.getHelperTarget(Garnish.Drag.updateHelperPos._i);
			}

			this.lastMouseX = this.mouseX;
			this.lastMouseY = this.mouseY;
		}

		// gravitate helpers toward their target positions
		for (Garnish.Drag.updateHelperPos._j = 0; Garnish.Drag.updateHelperPos._j < this.helpers.length; Garnish.Drag.updateHelperPos._j++)
		{
			Garnish.Drag.updateHelperPos._lag = Garnish.Drag.helperLagBase + (this.helperLagIncrement * Garnish.Drag.updateHelperPos._j);

			this.helperPositions[Garnish.Drag.updateHelperPos._j] = {
				left: this.helperPositions[Garnish.Drag.updateHelperPos._j].left + ((this.helperTargets[Garnish.Drag.updateHelperPos._j].left - this.helperPositions[Garnish.Drag.updateHelperPos._j].left) / Garnish.Drag.updateHelperPos._lag),
				top:  this.helperPositions[Garnish.Drag.updateHelperPos._j].top  + ((this.helperTargets[Garnish.Drag.updateHelperPos._j].top  - this.helperPositions[Garnish.Drag.updateHelperPos._j].top) / Garnish.Drag.updateHelperPos._lag)
			};

			this.helpers[Garnish.Drag.updateHelperPos._j].css(this.helperPositions[Garnish.Drag.updateHelperPos._j]);
		}
	},

	/**
	 * Return Helpers to Draggee(s)
	 */
	returnHelpersToDraggee: function()
	{
		for (var i = 0; i < this.$draggee.length; i++)
		{
			var $draggee = $(this.$draggee[i]),
				$draggeeHelper = this.helpers[i],
				draggeeOffset = $draggee.offset();

			// preserve $draggee and $draggeeHelper for the end of the animation
			(function($draggee, $draggeeHelper)
			{
				$draggeeHelper.animate({
					left: draggeeOffset.left,
					top: draggeeOffset.top
				}, 'fast', function() {
					$draggee.css('visibility', 'visible');
					$draggeeHelper.remove();
				});
			})($draggee, $draggeeHelper);
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
