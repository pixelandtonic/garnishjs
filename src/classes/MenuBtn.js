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
		this.$btn.attr('tabindex', '0');

		this.setSettings(settings, Garnish.MenuBtn.defaults);

		this.menu = new Garnish.Menu($menu, {
			anchor: (this.settings.menuAnchor || this.$btn),
			onOptionSelect: $.proxy(this, 'onOptionSelect')
		});

		this.menu.on('hide', $.proxy(this, 'onMenuHide'));
		this.addListener(this.$btn, 'mousedown', 'onMouseDown');
		this.addListener(this.$btn, 'keydown', 'onKeyDown');
		this.addListener(this.$btn, 'blur', 'onBlur');
		this.enable();
	},

	onBlur: function(ev)
	{
		this.hideMenu();
	},

	onKeyDown: function(ev)
	{
		switch (ev.keyCode)
		{
			case Garnish.RETURN_KEY:
			{
				ev.preventDefault();

				var $currentOption = this.menu.$options.filter('.hover');

				if($currentOption.length > 0)
				{
					$currentOption.trigger('click');
				}

				break;
			}

			case Garnish.SPACE_KEY:
			{
				ev.preventDefault();

				if(!this.showingMenu)
				{
					this.showMenu();

					this.menu.$options.removeClass('hover');

					var $selectedOption = this.menu.$options.filter('.sel:first');

					if($selectedOption.length > 0)
					{
						$selectedOption.addClass('hover');
					}
					else
					{
						this.menu.$options.first().addClass('hover');
					}
				}

				break;
			}

			case Garnish.DOWN_KEY:
			{
				ev.preventDefault();

				if(this.showingMenu)
				{
					var $nextOption = null;

					$.each(this.menu.$options, $.proxy(function(index, value)
					{
						if(!$nextOption)
						{
							if($(value).hasClass('hover'))
							{
								if((index + 1) < this.menu.$options.length)
								{
									$nextOption = $(this.menu.$options[(index + 1)]);
								}
							}
						}
					}, this));

					if(!$nextOption)
					{
						$nextOption = $(this.menu.$options[0]);
					}

					this.menu.$options.removeClass('hover');

					$nextOption.addClass('hover');
				}
				else
				{
					this.showMenu();

					this.menu.$options.removeClass('hover');

					var $selectedOption = this.menu.$options.filter('.sel:first');

					if($selectedOption.length > 0)
					{
						$selectedOption.addClass('hover');
					}
					else
					{
						this.menu.$options.first().addClass('hover');
					}
				}

				break;
			}

			case Garnish.UP_KEY:
			{
				ev.preventDefault();

				if(this.showingMenu)
				{
					var $previousOption = null;

					$.each(this.menu.$options, $.proxy(function(index, value)
					{
						if(!$previousOption)
						{
							if($(value).hasClass('hover'))
							{
								if((index - 1) >= 0)
								{
									$previousOption = $(this.menu.$options[(index - 1)]);
								}
							}
						}
					}, this));

					if(!$previousOption)
					{
						$previousOption = $(this.menu.$options[(this.menu.$options.length - 1)]);
					}

					this.menu.$options.removeClass('hover');

					$previousOption.addClass('hover');
				}
				else
				{
					this.showMenu();

					this.menu.$options.removeClass('hover');

					var $selectedOption = this.menu.$options.filter('.sel:first');

					if($selectedOption.length > 0)
					{
						$selectedOption.addClass('hover');
					}
					else
					{
						this.menu.$options.last().addClass('hover');
					}
				}

				break;
			}
		}
	},

	onMouseDown: function(ev)
	{
		if (ev.which != Garnish.PRIMARY_CLICK || Garnish.isCtrlKeyPressed(ev))
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
		this.$btn.trigger('focus');
		this.showingMenu = true;

		setTimeout($.proxy(function() {
			this.addListener(Garnish.$doc, 'mousedown', 'onMouseDown');
		}, this), 1);
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
	},

	onOptionSelect: function(option)
	{
		this.settings.onOptionSelect(option);
		this.trigger('optionSelect', { option: option });
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
		menuAnchor: null,
		onOptionSelect: $.noop
	}
});
