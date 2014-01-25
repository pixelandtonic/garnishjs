/**
 * HUD
 */
Garnish.HUD = Garnish.Base.extend({

	$trigger: null,
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

	width: null,
	height: null,

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

		this.showing = false;

		this.$hud = $('<div class="'+this.settings.hudClass+'" />').appendTo(Garnish.$bod);
		this.$tip = $('<div class="'+this.settings.tipClass+'" />').appendTo(this.$hud);
		this.$body = $('<div class="'+this.settings.bodyClass+'" />').appendTo(this.$hud).append(bodyContents);

		this.$shade = $('<div class="hud-shade"/>').insertBefore(this.$hud);

		this.show();
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
			for (var hudID in Garnish.HUD.activeHUDs) {
				Garnish.HUD.activeHUDs[hudID].hide();
			}
		}

		// Prevent the browser from jumping
		this.$hud.css('top', Garnish.$win.scrollTop());

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

		// get the HUD dimensions
		this.width = this.$hud.outerWidth();
		this.height = this.$hud.outerHeight();
	},

	determineBestPosition: function()
	{
		// Get the window sizez and trigger offset
		this.updateElementProperties();

		// get the minimum horizontal/vertical clearance needed to fit the HUD
		this.minHorizontalClearance = this.width + this.settings.triggerSpacing + this.settings.windowSpacing;
		this.minVerticalClearance = this.height + this.settings.triggerSpacing + this.settings.windowSpacing;

		// find the actual available top/right/bottom/left clearances
		var clearances = [
			this.windowHeight + this.windowScrollTop - this.triggerOffset.bottom, // bottom
			this.triggerOffset.top - this.windowScrollTop,                        // top
			this.windowWidth + this.windowScrollLeft - this.triggerOffset.right,  // right
			this.triggerOffset.left - this.windowScrollLeft                       // left
		];

		// Find the first position that has enough room
		for (var i = 0; i < 4; i++)
		{
			var prop = (i < 2 ? 'height' : 'width');
			if (clearances[i] - (this.settings.windowSpacing + this.settings.triggerSpacing) >= this[prop])
			{
				var positionIndex = i;
				break;
			}
		}

		if (typeof positionIndex == 'undefined')
		{
			// Just figure out which one is the biggest
			var biggestClearance = Math.max.apply(null, clearances),
				positionIndex = $.inArray(biggestClearance, clearances);
		}

		this.position = Garnish.HUD.positions[positionIndex];

		// Update the tip class
		if (this.tipClass)
		{
			this.$tip.removeClass(this.tipClass);
		}

		this.tipClass = this.settings.tipClass+'-'+Garnish.HUD.tipClasses[positionIndex];
		this.$tip.addClass(this.tipClass);
	},

	setPosition: function()
	{
		if (this.position == 'top' || this.position == 'bottom')
		{
			// Center the HUD horizontally
			var maxLeft = (this.windowWidth + this.windowScrollLeft) - (this.width + this.settings.windowSpacing),
				minLeft = (this.windowScrollLeft + this.settings.windowSpacing),
				triggerCenter = this.triggerOffset.left + Math.round(this.triggerWidth / 2),
				left = triggerCenter - Math.round(this.width / 2);

			if (left > maxLeft) left = maxLeft;
			if (left < minLeft) left = minLeft;

			this.$hud.css('left', left);

			var tipLeft = (triggerCenter - left) - (this.settings.tipWidth / 2);
			this.$tip.css({ left: tipLeft, top: '' });

			if (this.position == 'top')
			{
				var top = this.triggerOffset.top - (this.height + this.settings.triggerSpacing);
				this.$hud.css('top', top);
			}
			else
			{
				var top = this.triggerOffset.bottom + this.settings.triggerSpacing;
				this.$hud.css('top', top);
			}
		}
		else
		{
			// Center the HUD vertically
			var maxTop = (this.windowHeight + this.windowScrollTop) - (this.height + this.settings.windowSpacing),
				minTop = (this.windowScrollTop + this.settings.windowSpacing),
				triggerCenter = this.triggerOffset.top + Math.round(this.triggerHeight / 2),
				top = triggerCenter - Math.round(this.height / 2);

			if (top > maxTop) top = maxTop;
			if (top < minTop) top = minTop;

			this.$hud.css('top', top);

			var tipTop = (triggerCenter - top) - (this.settings.tipWidth / 2);
			this.$tip.css({ top: tipTop, left: '' });


			if (this.position == 'left')
			{
				var left = this.triggerOffset.left - (this.width + this.settings.triggerSpacing);
				this.$hud.css('left', left);
			}
			else
			{
				var left = this.triggerOffset.right + this.settings.triggerSpacing;
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
		this.$shade.remove();
		this.showing = false;

		delete Garnish.HUD.activeHUDs[this._namespace];

		Garnish.escManager.unregister(this);

		this.onHide();
	},

	onHide: function()
	{
		this.trigger('hide');
	}
},
{
	positions: ['bottom', 'top', 'right', 'left'],
	tipClasses: ['top', 'bottom', 'left', 'right'],

	defaults: {
		hudClass: 'hud',
		tipClass: 'tip',
		bodyClass: 'body',
		triggerSpacing: 7,
		windowSpacing: 20,
		tipWidth: 8,
		onShow: $.noop,
		onHide: $.noop,
		closeBtn: null,
		closeOtherHUDs: true
	}
});
