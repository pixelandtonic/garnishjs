/**
 * Menu Button
 */
Garnish.MenuBtn = Garnish.Base.extend({

	$btn: null,
	menu: null,
	showingMenu: false,
	disabled: true,

	/**
	 * Constructor
	 */
	init: function(btn, settings)
	{
		this.$btn = $(btn);

		// Is this already a menu button?
		if (this.$btn.data('menubtn'))
		{
			// Grab the old MenuBtn's menu container
			var $menu = this.$btn.data('menubtn').menu.$container;

			Garnish.log('Double-instantiating a menu button on an element');
			this.$btn.data('menubtn').destroy();
		}
		else
		{
			var $menu = this.$btn.next('.menu').detach();
		}

		this.$btn.data('menubtn', this);

		this.setSettings(settings, Garnish.MenuBtn.defaults);

		this.menu = new Garnish.Menu($menu, {
			attachToElement: this.$btn,
			onOptionSelect: $.proxy(this, 'onOptionSelect')
		});

		this.menu.on('hide', $.proxy(this, 'onMenuHide'));

		this.addListener(this.$btn, 'mousedown', 'onMouseDown');
		this.enable();
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
		if (this.disabled)
		{
			return;
		}

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
		if (!Garnish.isMobileBrowser())
		{
			this.removeListener(Garnish.$win, 'resize');
		}

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
	},

	enable: function ()
	{
		this.disabled = false;
	},

	disable: function ()
	{
		this.disabled = true;
	},

	/**
	 * Destroy
	 */
	destroy: function()
	{
		this.$btn.removeData('menubtn');
		this.base();
	}
},
{
	defaults: {
		onOptionSelect: $.noop
	}
});
