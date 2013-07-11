/**
 * Menu
 */
Garnish.Menu = Garnish.Base.extend({

	settings: null,

	$container: null,
	$options: null,
	$btn: null,

	/**
	 * Constructor
	 */
	init: function(container, settings)
	{
		this.setSettings(settings, Garnish.Menu.defaults);

		this.$container = $(container).appendTo(Garnish.$bod);
		this.$options = this.$container.find('a');
		this.$options.data('menu', this);

		if (this.settings.attachToButton)
		{
			this.$btn = $(this.settings.attachToButton);
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
		var css = {
			minWidth: (btnWidth - 32)
		};

		var windowHeight = Garnish.$win.height(),
			windowScrollTop = Garnish.$win.scrollTop(),

			btnOffset = this.$btn.offset(),
			btnWidth = this.$btn.outerWidth(),
			btnHeight = this.$btn.outerHeight(),
			btnOffsetBottom = btnOffset.top + btnHeight,
			btnOffsetTop = btnOffset.top,

			menuHeight = this.$container.outerHeight(),

			bottomClearance = windowHeight + windowScrollTop - btnOffsetBottom,
			topClearance = btnOffsetTop - windowScrollTop;

		// Is there room for the menu below the button?
		if (bottomClearance >= btnHeight || bottomClearance >= topClearance)
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
				css.right = 1 + Garnish.$win.width() - (btnOffset.left + btnWidth);
				break;
			}
			case 'center':
			{
				css.left = Math.round((btnOffset.left + btnWidth / 2) - (this.$container.outerWidth() / 2));
				break;
			}
			default:
			{
				css.left = 1 + btnOffset.left;
			}
		}

		this.$container.css(css);
	},

	show: function()
	{
		if (this.$btn)
		{
			this.setPositionRelativeToButton();
		}

		this.$container.fadeIn(50);
	},

	hide: function()
	{
		this.$container.fadeOut('fast');
	},

	selectOption: function(ev)
	{
		this.settings.onOptionSelect(ev.currentTarget);
		this.hide();
	}

},
{
	defaults: {
		attachToButton: null,
		onOptionSelect: $.noop
	}
});
