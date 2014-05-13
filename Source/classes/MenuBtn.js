/**
 * Menu Button
 */
Garnish.MenuBtn = Garnish.Base.extend({

	$btn: null,
	menu: null,
	showingMenu: false,

	/**
	 * Constructor
	 */
	init: function(btn, settings)
	{
		this.$btn = $(btn);

		// Is this already a menu button?
		if (this.$btn.data('menubtn'))
		{
			Garnish.log('Double-instantiating a menu button on an element');
			this.$btn.data('menubtn').destroy();
		}

		this.$btn.data('menubtn', this);

		this.setSettings(settings, Garnish.MenuBtn.defaults);

		var $menu = this.$btn.next('.menu').detach();
		this.menu = new Garnish.Menu($menu, {
			attachToElement: this.$btn,
			onOptionSelect: $.proxy(this, 'onOptionSelect')
		});

		this.menu.on('hide', $.proxy(this, 'onMenuHide'));

		this.addListener(this.$btn, 'mousedown', 'onMouseDown');
	},

	onMouseDown: function(ev)
	{
		if (ev.which != Garnish.PRIMARY_CLICK || ev.metaKey)
		{
			return;
		}

		ev.preventDefault();

		if (this.showingMenu)
		{
			this.hideMenu();
		}
		else
		{
			this.showMenu();
		}
	},

	showMenu: function()
	{
		this.menu.show();
		this.$btn.addClass('active');
		this.showingMenu = true;

		setTimeout($.proxy(function() {
			this.addListener(Garnish.$doc, 'mousedown', 'onMouseDown');
		}, this), 1);

		if (!Garnish.isMobileBrowser())
		{
			this.addListener(Garnish.$win, 'resize', 'hideMenu');
		}
	},

	hideMenu: function()
	{
		this.menu.hide();
	},

	onMenuHide: function()
	{
		this.$btn.removeClass('active');
		this.showingMenu = false;

		this.removeListener(Garnish.$doc, 'mousedown');

		if (!Garnish.isMobileBrowser())
		{
			this.removeListener(Garnish.$doc, 'resize');
		}
	},

	onOptionSelect: function(option)
	{
		this.settings.onOptionSelect(option);
	}

},
{
	defaults: {
		onOptionSelect: $.noop
	}
});
