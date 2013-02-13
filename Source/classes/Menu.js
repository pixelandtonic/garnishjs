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

		this.addListener(this.$options, 'mousedown', 'selectOption');
	},

	setPositionRelativeToButton: function()
	{
		var btnOffset = this.$btn.offset(),
			btnWidth = this.$btn.outerWidth(),
			css = {
				top: btnOffset.top + this.$btn.outerHeight(),
				minWidth: (btnWidth - 32)
			};

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
	}

},
{
	defaults: {
		attachToButton: null,
		onOptionSelect: $.noop
	}
});
