/**
 * Menu
 */
Garnish.Menu = Garnish.Base.extend({

	settings: null,

	$container: null,
	$options: null,
	$trigger: null,

	/**
	 * Constructor
	 */
	init: function(container, settings)
	{
		this.setSettings(settings, Garnish.Menu.defaults);

		this.$container = $(container).appendTo(Garnish.$bod);
		this.$options = this.$container.find('a');
		this.$options.data('menu', this);

		if (this.settings.attachToElement)
		{
			this.$trigger = $(this.settings.attachToElement);
		}

		// Prevent clicking on the container from hiding the menu
		this.addListener(this.$container, 'mousedown', function(ev)
		{
			ev.stopPropagation();
		});

		// Listen for option clicks
		this.addListener(this.$options, 'click', 'selectOption');
	},

	setPositionRelativeToButton: function()
	{
		var windowHeight = Garnish.$win.height(),
			windowScrollTop = Garnish.$win.scrollTop(),

			btnOffset = this.$trigger.offset(),
			btnWidth = this.$trigger.outerWidth(),
			btnHeight = this.$trigger.outerHeight(),
			btnOffsetBottom = btnOffset.top + btnHeight,
			btnOffsetTop = btnOffset.top,

			menuHeight = this.$container.outerHeight(),

			bottomClearance = windowHeight + windowScrollTop - btnOffsetBottom,
			topClearance = btnOffsetTop - windowScrollTop;

		var css = {
			minWidth: btnWidth - (this.$container.outerWidth() - this.$container.width())
		};

		// Is there room for the menu below the button?
		if (bottomClearance >= menuHeight || bottomClearance >= topClearance)
		{
			css.top = btnOffsetBottom;
		}
		else
		{
			css.top = btnOffsetTop - menuHeight;
		}

		switch (this.$container.data('align'))
		{
			case 'right':
			{
				css.right = Garnish.$win.width() - (btnOffset.left + btnWidth);
				break;
			}
			case 'center':
			{
				css.left = Math.round((btnOffset.left + btnWidth / 2) - (this.$container.outerWidth() / 2));
				break;
			}
			default:
			{
				css.left = btnOffset.left;
			}
		}

		this.$container.css(css);
	},

	show: function()
	{
		if (this.$trigger)
		{
			this.setPositionRelativeToButton();
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
		this.hide();
	}

},
{
	defaults: {
		attachToElement: null,
		onOptionSelect: $.noop
	}
});
