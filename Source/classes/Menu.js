/**
 * Menu
 */
Garnish.Menu = Garnish.Base.extend({

	settings: null,

	$container: null,
	$options: null,
	$trigger: null,

	_windowWidth: null,
	_windowHeight: null,
	_windowScrollLeft: null,
	_windowScrollTop: null,

	_triggerOffset: null,
	_triggerWidth: null,
	_triggerHeight: null,
	_triggerOffsetRight: null,
	_triggerOffsetBottom: null,

	_menuWidth: null,
	_menuHeight: null,

	/**
	 * Constructor
	 */
	init: function(container, settings)
	{
		this.setSettings(settings, Garnish.Menu.defaults);

		this.$container = $(container);
		this.$options = $();
		this.addOptions(this.$container.find('a'));

		if (this.settings.attachToElement)
		{
			this.$trigger = $(this.settings.attachToElement);
		}

		// Prevent clicking on the container from hiding the menu
		this.addListener(this.$container, 'mousedown', function(ev)
		{
			ev.stopPropagation();
		});
	},

	addOptions: function($options)
	{
		this.$options = this.$options.add($options);
		$options.data('menu', this);
		this.addListener($options, 'click', 'selectOption');
	},

	setPositionRelativeToTrigger: function()
	{
		this._windowWidth = Garnish.$win.width();
		this._windowHeight = Garnish.$win.height();
		this._windowScrollLeft = Garnish.$win.scrollLeft();
		this._windowScrollTop = Garnish.$win.scrollTop();

		this._triggerOffset = this.$trigger.offset();
		this._triggerWidth = this.$trigger.outerWidth();
		this._triggerHeight = this.$trigger.outerHeight();
		this._triggerOffsetRight = this._triggerOffset.left + this._triggerHeight;
		this._triggerOffsetBottom = this._triggerOffset.top + this._triggerHeight;

		this.$container.css('minWidth', 0);
		this.$container.css('minWidth', this._triggerWidth - (this.$container.outerWidth() - this.$container.width()));

		this._menuWidth = this.$container.outerWidth();
		this._menuHeight = this.$container.outerHeight();

		// Is there room for the menu below the trigger?
		var topClearance = this._triggerOffset.top - this._windowScrollTop,
			bottomClearance = this._windowHeight + this._windowScrollTop - this._triggerOffsetBottom;

		if (bottomClearance >= this._menuHeight || bottomClearance >= topClearance)
		{
			this.$container.css('top', this._triggerOffsetBottom);
		}
		else
		{
			this.$container.css('top', this._triggerOffset.top - this._menuHeight);
		}

		// Figure out how we're aliging it
		var align = this.$container.data('align');

		if (align != 'left' && align != 'center' && align != 'right')
		{
			align = 'left';
		}

		if (align == 'center')
		{
			this._alignCenter();
		}
		else
		{
			// Figure out which options are actually possible
			var rightClearance = this._windowWidth + this._windowScrollLeft - (this._triggerOffset.left + this._menuWidth),
				leftClearance = this._triggerOffsetRight - this._menuWidth;

			if (align == 'right' && leftClearance >= 0 || rightClearance < 0)
			{
				this._alignRight();
			}
			else
			{
				this._alignLeft();
			}
		}

		delete this._windowWidth;
		delete this._windowHeight;
		delete this._windowScrollLeft;
		delete this._windowScrollTop;
		delete this._triggerOffset;
		delete this._triggerWidth;
		delete this._triggerHeight;
		delete this._triggerOffsetRight;
		delete this._triggerOffsetBottom;
		delete this._menuWidth;
		delete this._menuHeight;
	},

	show: function()
	{
		// Move the menu to the end of the DOM
		this.$container.appendTo(Garnish.$bod)

		if (this.$trigger)
		{
			this.setPositionRelativeToTrigger();
		}

		this.$container.fadeIn(50);

		Garnish.escManager.register(this, 'hide');
	},

	hide: function()
	{
		this.$container.fadeOut('fast');

		Garnish.escManager.unregister(this);

		this.trigger('hide');
	},

	selectOption: function(ev)
	{
		this.settings.onOptionSelect(ev.currentTarget);
		this.trigger('optionselect', { selectedOption: ev.currentTarget });
		this.hide();
	},

	_alignLeft: function()
	{
		this.$container.css({
			left: this._triggerOffset.left,
			right: 'auto'
		});
	},

	_alignRight: function()
	{
		this.$container.css({
			right: this._windowWidth - (this._triggerOffset.left + this._triggerWidth),
			left: 'auto'
		});
	},

	_alignCenter: function()
	{
		var left = Math.round((this._triggerOffset.left + this._triggerWidth / 2) - (this._menuWidth / 2));

		if (left < 0)
		{
			left = 0;
		}

		this.$container.css('left', left);
	}

},
{
	defaults: {
		attachToElement: null,
		onOptionSelect: $.noop
	}
});
