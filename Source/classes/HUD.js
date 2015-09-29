/**
 * HUD
 */
Garnish.HUD = Garnish.Base.extend({

	$trigger: null,
	$fixedTriggerParent: null,
	$hud: null,
	$tip: null,
	$body: null,
	$shade: null,

	windowWidth: null,
	windowHeight: null,
	windowScrollLeft: null,
	windowScrollTop: null,

	triggerWidth: null,
	triggerHeight: null,
	triggerOffset: null,
	triggerFixedPosition: null,

	width: null,
	height: null,

	showing: false,
	position: null,

	/**
	 * Constructor
	 */
	init: function(trigger, bodyContents, settings) {

		this.$trigger = $(trigger);

		this.setSettings(settings, Garnish.HUD.defaults);
		this.on('show', this.settings.onShow);
		this.on('hide', this.settings.onHide);

		if (typeof Garnish.HUD.activeHUDs == "undefined")
		{
			Garnish.HUD.activeHUDs = {};
		}

		this.$shade = $('<div class="hud-shade"/>');
		this.$hud = $('<div class="'+this.settings.hudClass+'" />');
		this.$tip = $('<div class="'+this.settings.tipClass+'" />').appendTo(this.$hud);
		this.$body = $('<div class="'+this.settings.bodyClass+'" />').appendTo(this.$hud).append(bodyContents);

		if (this.$body.find('.footer').length)
		{
			this.$hud.addClass('has-footer');
		}

		this.show();
	},

	/**
	 * Update the body contents
	 */
	updateBody: function(bodyContents)
	{
		this.$body.html('');
		this.$body.append(bodyContents);
	},

	/**
	 * Show
	 */
	show: function(ev)
	{
		if (ev && ev.stopPropagation)
		{
			ev.stopPropagation();
		}

		if (this.showing)
		{
			return;
		}

		if (this.settings.closeOtherHUDs)
		{
			for (var hudID in Garnish.HUD.activeHUDs)
			{
				Garnish.HUD.activeHUDs[hudID].hide();
			}
		}

		// Prevent the browser from jumping
		this.$hud.css('top', Garnish.$win.scrollTop());

		// Move it to the end of <body> so it gets the highest sub-z-index
		this.$shade.appendTo(Garnish.$bod);
		this.$hud.appendTo(Garnish.$bod);

		this.$hud.show();
		this.determineBestPosition();
		this.setPosition();

		this.$shade.show();

		this.showing = true;
		Garnish.HUD.activeHUDs[this._namespace] = this;

		Garnish.escManager.register(this, 'hide');

		this.addListener(this.$hud, 'resize', 'resetPosition');
		this.addListener(Garnish.$win, 'resize', 'resetPosition');

		this.addListener(this.$shade, 'click', 'hide');

		if (this.settings.closeBtn)
		{
			this.addListener(this.settings.closeBtn, 'activate', 'hide');
		}

		this.onShow();
	},

	onShow: function()
	{
		this.trigger('show');
	},

	updateElementProperties: function()
	{
		this.windowWidth = Garnish.$win.width();
		this.windowHeight = Garnish.$win.height();

		this.windowScrollLeft = Garnish.$win.scrollLeft();
		this.windowScrollTop = Garnish.$win.scrollTop();

		// get the trigger's dimensions
		this.triggerWidth = this.$trigger.outerWidth();
		this.triggerHeight = this.$trigger.outerHeight();

		// get the offsets for each side of the trigger element
		this.triggerOffset = this.$trigger.offset();
		this.triggerOffset.right = this.triggerOffset.left + this.triggerWidth;
		this.triggerOffset.bottom = this.triggerOffset.top + this.triggerHeight;

		// is the trigger fixed?
		if (this.$fixedTriggerParent)
		{
			var fixedTriggerParentOffset = this.$fixedTriggerParent.offset(),
				fixedTriggerParentPosition = this.$fixedTriggerParent.position();

			this.triggerFixedPosition = {
				top: this.triggerOffset.top - (fixedTriggerParentOffset.top - fixedTriggerParentPosition.top),
				left: this.triggerOffset.left - (fixedTriggerParentOffset.left - fixedTriggerParentPosition.left)
			};
			this.triggerFixedPosition.right = this.triggerFixedPosition.left + this.triggerWidth;
			this.triggerFixedPosition.bottom = this.triggerFixedPosition.top + this.triggerHeight;
		}
		else
		{
			this.triggerFixedPosition = this.triggerOffset;
		}

		// get the HUD dimensions
		this.width = this.$hud.outerWidth();
		this.height = this.$hud.outerHeight();
	},

	determineBestPosition: function()
	{
		// See if the trigger is fixed
		var $parent = this.$trigger;

		do {
			if ($parent.css('position') == 'fixed')
			{
				this.$fixedTriggerParent = $parent;
				break;
			}

			$parent = $parent.offsetParent();
		}
		while ($parent.length && $parent.prop('nodeName') != 'HTML');

		if (this.$fixedTriggerParent)
		{
			this.$hud.css('position', 'fixed');
		}
		else
		{
			this.$hud.css('position', 'absolute');
		}

		// Get the window sizes and trigger offset
		this.updateElementProperties();

		// get the minimum horizontal/vertical clearance needed to fit the HUD
		this.minHorizontalClearance = this.width + this.settings.triggerSpacing + this.settings.windowSpacing;
		this.minVerticalClearance = this.height + this.settings.triggerSpacing + this.settings.windowSpacing;

		// find the actual available top/right/bottom/left clearances
		var clearances = {
			bottom: this.windowHeight + this.windowScrollTop - this.triggerOffset.bottom,
			top:    this.triggerOffset.top - this.windowScrollTop,
			right:  this.windowWidth + this.windowScrollLeft - this.triggerOffset.right,
			left:   this.triggerOffset.left - this.windowScrollLeft
		};

		// Find the first position that has enough room
		this.position = null;

		for (var i = 0; i < this.settings.positions.length; i++)
		{
			var position = this.settings.positions[i],
				prop = (position == 'top' || position == 'bottom' ? 'height' : 'width');

			if (clearances[position] - (this.settings.windowSpacing + this.settings.triggerSpacing) >= this[prop])
			{
				// This is the first position that has enough room in order of preference, so we'll go with this
				this.position = position;
				break;
			}

			if (!this.position || clearances[position] > clearances[this.position])
			{
				// Use this as a fallback as it's the position with the most clearance so far
				this.position = position;
			}
		}

		// Just in case...
		if (!this.position || $.inArray(this.position, ['bottom', 'top', 'right', 'left']) == -1)
		{
			this.position = 'bottom'
		}

		// Update the tip class
		if (this.tipClass)
		{
			this.$tip.removeClass(this.tipClass);
		}

		this.tipClass = this.settings.tipClass+'-'+Garnish.HUD.tipClasses[this.position];
		this.$tip.addClass(this.tipClass);
	},

	setPosition: function()
	{
		if (this.position == 'top' || this.position == 'bottom')
		{
			// Center the HUD horizontally
			var maxLeft = (this.windowWidth + this.windowScrollLeft) - (this.width + this.settings.windowSpacing),
				minLeft = (this.windowScrollLeft + this.settings.windowSpacing),
				triggerCenter = this.triggerFixedPosition.left + Math.round(this.triggerWidth / 2),
				left = triggerCenter - Math.round(this.width / 2);

			if (left > maxLeft) left = maxLeft;
			if (left < minLeft) left = minLeft;

			this.$hud.css('left', left);

			var tipLeft = (triggerCenter - left) - (this.settings.tipWidth / 2);
			this.$tip.css({ left: tipLeft, top: '' });

			if (this.position == 'top')
			{
				var top = this.triggerFixedPosition.top - (this.height + this.settings.triggerSpacing);
				this.$hud.css('top', top);
			}
			else
			{
				var top = this.triggerFixedPosition.bottom + this.settings.triggerSpacing;
				this.$hud.css('top', top);
			}
		}
		else
		{
			// Center the HUD vertically
			var maxTop = (this.windowHeight + this.windowScrollTop) - (this.height + this.settings.windowSpacing),
				minTop = (this.windowScrollTop + this.settings.windowSpacing),
				triggerCenter = this.triggerFixedPosition.top + Math.round(this.triggerHeight / 2),
				top = triggerCenter - Math.round(this.height / 2);

			if (top > maxTop) top = maxTop;
			if (top < minTop) top = minTop;

			this.$hud.css('top', top);

			var tipTop = (triggerCenter - top) - (this.settings.tipWidth / 2);
			this.$tip.css({ top: tipTop, left: '' });


			if (this.position == 'left')
			{
				var left = this.triggerFixedPosition.left - (this.width + this.settings.triggerSpacing);
				this.$hud.css('left', left);
			}
			else
			{
				var left = this.triggerFixedPosition.right + this.settings.triggerSpacing;
				this.$hud.css('left', left);
			}
		}
	},

	resetPosition: function()
	{
		this.updateElementProperties();
		this.setPosition();
	},

	/**
	 * Hide
	 */
	hide: function()
	{
		this.$hud.hide();
		this.$shade.hide();
		this.showing = false;

		delete Garnish.HUD.activeHUDs[this._namespace];

		Garnish.escManager.unregister(this);

		this.onHide();
	},

	onHide: function()
	{
		this.trigger('hide');
	},

	toggle: function()
	{
		if (this.showing)
		{
			this.hide();
		}
		else
		{
			this.show();
		}
	}
},
{
	tipClasses: { bottom: 'top', top: 'bottom', right: 'left', left: 'right'},

	defaults: {
		hudClass: 'hud',
		tipClass: 'tip',
		bodyClass: 'body',
		positions: ['bottom', 'top', 'right', 'left'],
		triggerSpacing: 10,
		windowSpacing: 10,
		tipWidth: 30,
		onShow: $.noop,
		onHide: $.noop,
		closeBtn: null,
		closeOtherHUDs: true
	}
});
