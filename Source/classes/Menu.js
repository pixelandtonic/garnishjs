/**
 * Menu
 */
Garnish.Menu = Garnish.Base.extend({

	settings: null,

	$container: null,
	$options: null,

	/**
	 * Constructor
	 */
	init: function(container, settings)
	{
		this.setSettings(settings, Garnish.Menu.defaults);

		this.$container = $(container).appendTo(Garnish.$bod);
		this.$options = this.$container.find('li');

		this.addListener(this.$options, 'mousedown', 'selectOption');
	},

	setPosition: function($btn)
	{
		var btnOffset = $btn.offset(),
			btnWidth = $btn.outerWidth(),
			css = {
				top: btnOffset.top + $btn.outerHeight(),
				minWidth: (btnWidth - 32)
			};

		if (this.$container.attr('data-align') == 'right')
		{
			css.right = 1 + Garnish.$win.width() - (btnOffset.left + btnWidth);
		}
		else
		{
			css.left = 1 + btnOffset.left;
		}

		this.$container.css(css);
	},

	show: function()
	{
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
		onOptionSelect: $.noop
	}
});
