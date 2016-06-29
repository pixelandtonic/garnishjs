/**
 * Menu Button
 */
Garnish.MenuBtn = Garnish.Base.extend({

	$btn: null,
	$menuList: null,
	menu: null,
	showingMenu: false,
	disabled: true,

	/**
	 * Constructor
	 */
	init: function(btn, settings)
	{
		var menuId = 'menu' + this._namespace;

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
			anchor: (this.settings.menuAnchor || this.$btn),
			onOptionSelect: $.proxy(this, 'onOptionSelect')
		});

		this.$menuList = $('ul', this.menu.$container);

		this.$btn.attr({
			'tabindex': 0,
			'role': 'combobox',
			'aria-owns': menuId,
			'aria-haspopup': 'true',
			'aria-expanded': 'false',
		});

		this.$menuList.attr({
			'role': 'listbox',
			'id': menuId,
			'aria-hidden': 'true'
		});

		this.menu.$options.attr({
			'role':'option',
			'tabindex':'-1'
		});

		this.menu.$options.each(function(key, value) {
			$(this).attr('id', menuId+'-option-'+key);
		});

		this.menu.on('hide', $.proxy(this, 'onMenuHide'));
		this.addListener(this.$btn, 'mousedown', 'onMouseDown');
		this.addListener(this.$btn, 'keydown', 'onKeyDown');
		this.addListener(this.$btn, 'blur', 'onBlur');
		this.enable();
	},

	onBlur: function(ev)
	{
		if (this.showingMenu)
		{
			this.hideMenu();
		}
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
					$currentOption.get(0).click();
				}

				break;
			}

			case Garnish.SPACE_KEY:
			{
				ev.preventDefault();

				if(!this.showingMenu)
				{
					this.showMenu();
					
					var $option = this.menu.$options.filter('.sel:first');

					if($option.length > 0)
					{
						$option;
					}
					else
					{
						$option = this.menu.$options.first();
					}

					this.focusOption($option);
				}

				break;
			}

			case Garnish.DOWN_KEY:
			{
				ev.preventDefault();

				var $option;

				if(this.showingMenu)
				{
					$.each(this.menu.$options, $.proxy(function(index, value)
					{
						if(!$option)
						{
							if($(value).hasClass('hover'))
							{
								if((index + 1) < this.menu.$options.length)
								{
									$option = $(this.menu.$options[(index + 1)]);
								}
							}
						}
					}, this));

					if(!$option)
					{
						$option = $(this.menu.$options[0]);
					}
				}
				else
				{
					this.showMenu();

					$option = this.menu.$options.filter('.sel:first');

					if($option.length == 0)
					{
						$option = this.menu.$options.first();
					}
				}

				this.focusOption($option);

				break;
			}

			case Garnish.UP_KEY:
			{
				ev.preventDefault();

				var $option;

				if(this.showingMenu)
				{
					$.each(this.menu.$options, $.proxy(function(index, value)
					{
						if(!$option)
						{
							if($(value).hasClass('hover'))
							{
								if((index - 1) >= 0)
								{
									$option = $(this.menu.$options[(index - 1)]);
								}
							}
						}
					}, this));

					if(!$option)
					{
						$option = $(this.menu.$options[(this.menu.$options.length - 1)]);
					}
				}
				else
				{
					this.showMenu();

					$option = this.menu.$options.filter('.sel:first');

					if($option.length == 0)
					{
						$option = this.menu.$options.last();
					}
				}

				this.focusOption($option);

				break;
			}
		}
	},

	focusOption: function($option)
	{
		this.menu.$options.removeClass('hover');

		$option.addClass('hover');

		this.$menuList.attr('aria-activedescendant', $option.attr('id'));
		this.$btn.attr('aria-activedescendant', $option.attr('id'));
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
		this.$btn.attr('aria-expanded', 'true');
		this.$menuList.attr('aria-hidden', 'false');
		this.showingMenu = true;

		setTimeout($.proxy(function() {
			this.addListener(Garnish.$doc, 'mousedown', 'onMouseDown');
		}, this), 1);
	},

	hideMenu: function()
	{
		this.menu.hide();
		this.$btn.attr('aria-expanded', 'false');
		this.$menuList.attr('aria-hidden', 'true');
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
