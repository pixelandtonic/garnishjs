/**
 * Menu
 */
Garnish.Menu = Garnish.Base.extend({

	settings: null,

	$container: null,
	$options: null,
	$trigger: null,
	isContextMenu: false,

	/**
	 * Constructor
	 */
	init: function(menuData, settings)
	{
		this.$container = null;

		this.setSettings(settings, Garnish.Menu.defaults);

		// Context menu
		if (this.settings.contextMenuFor)
		{
			this.menuOptions = menuData;

			this.isContextMenu = true;
		}
		else
		{
			this.$container = $(menuData);
			this.$options = this.$container.find('a');
			this.$options.data('menu', this);

			// Prevent clicking on the container from hiding the menu
			this.addListener(this.$container, 'mousedown', function(ev)
			{
				ev.stopPropagation();
			});
		}

		if (this.settings.attachToElement)
		{
			this.$trigger = $(this.settings.attachToElement);
		}

		this.enable();
	},

	setPositionRelativeToTrigger: function()
	{
		var windowHeight = Garnish.$win.height(),
			windowScrollTop = Garnish.$win.scrollTop(),

			triggerOffset = this.$trigger.offset(),
			triggerWidth = this.$trigger.outerWidth(),
			triggerHeight = this.$trigger.outerHeight(),
			triggerOffsetBottom = triggerOffset.top + triggerHeight,
			triggerOffsetTop = triggerOffset.top,

			menuHeight = this.$container.outerHeight(),

			bottomClearance = windowHeight + windowScrollTop - triggerOffsetBottom,
			topClearance = triggerOffsetTop - windowScrollTop;

		var css = {
			minWidth: triggerWidth - (this.$container.outerWidth() - this.$container.width())
		};

		// Is there room for the menu below the trigger?
		if (bottomClearance >= menuHeight || bottomClearance >= topClearance)
		{
			css.top = triggerOffsetBottom;
		}
		else
		{
			css.top = triggerOffsetTop - menuHeight;
		}

		var align = this.$container.data('align');

		if (!align)
		{
			align = 'left';
		}

		if (Garnish.rtl)
		{
			if (align == 'left')
			{
				align = 'right';
			}
			else if (align == 'right')
			{
				align = 'left';
			}
		}

		switch (align)
		{
			case 'right':
			{
				css.right = Garnish.$win.width() - (triggerOffset.left + triggerWidth);
				break;
			}
			case 'center':
			{
				css.left = Math.round((triggerOffset.left + triggerWidth / 2) - (this.$container.outerWidth() / 2));
				break;
			}
			case 'left':
			{
				css.left = triggerOffset.left;
			}
		}

		this.$container.css(css);
	},

	rightClick: function (ev)
	{
		// Ignore left mouse clicks
		if (ev.type == 'mousedown' && ev.which != Garnish.SECONDARY_CLICK)
		{
			return;
		}

		if (ev.type == 'contextmenu')
		{
			// Prevent the real context menu from showing
			ev.preventDefault();
		}

		// Ignore if already showing
		if (this.showing && ev.currentTarget == this.currentTarget)
		{
			return;
		}

		this.currentTarget = ev.currentTarget;
		this.show();
		this.$container.css({ left: ev.pageX+1, top: ev.pageY-4 });

		setTimeout($.proxy(function()
		{
			this.addListener(Garnish.$doc, 'mousedown', 'hide');
		}, this), 0);
	},

	show: function()
	{
		if (!this.$container)
		{
			this.buildMenu();
		}

		// Move the menu to the end of the DOM
		this.$container.appendTo(Garnish.$bod);

		if (this.$trigger)
		{
			this.setPositionRelativeToTrigger();
		}

		this.$container.fadeIn(50);

		Garnish.escManager.register(this, 'hide');
	},

	buildMenu: function ()
	{
		this.$container = $('<div class="'+this.settings.menuClass+'" style="display: none" />');

		var $ul = $('<ul/>').appendTo(this.$container);

		for (var i in this.menuOptions)
		{
			var option = this.menuOptions[i];

			if (option == '-')
			{
				// Create a new <ul>
				$ul = $('<ul/>').appendTo(this.$container);
			}
			else
			{
				var $li = $('<li></li>').appendTo($ul),
					$a = $('<a>'+option.label+'</a>').appendTo($li);

				if (typeof option.onClick == 'function')
				{
					// maintain the current $a and options.onClick variables
					(function($a, onClick)
					{
						setTimeout($.proxy(function(){
							$a.mousedown($.proxy(function(ev)
							{
								this.hide();
								// call the onClick callback, with the scope set to the item,
								// and pass it the event with currentTarget set to the item as well
								onClick.call(this.currentTarget, $.extend(ev, { currentTarget: this.currentTarget }));
							}, this));
						}, this), 1);
					}).call(this, $a, option.onClick);
				}
			}
		}
	},

	hide: function()
	{
		this.$container.fadeOut('fast');

		Garnish.escManager.unregister(this);
		this.removeListener(Garnish.$doc, 'mousedown');

		this.trigger('hide');
	},

	selectOption: function(ev)
	{
		this.settings.onOptionSelect(ev.currentTarget);
		this.trigger('optionselect', { selectedOption: ev.currentTarget });
		this.hide();
	},

	enable: function ()
	{
		if (this.isContextMenu)
		{
			this.addListener(this.settings.contextMenuFor, 'mousedown,contextmenu', 'rightClick');
		}
		else
		{
			this.addListener(this.$options, 'click', 'selectOption');
		}
	},

	disable: function ()
	{
		if (this.isContextMenu)
		{
			this.removeListener(this.settings.contextMenuFor, 'mousedown,contextmenu');
		}
		else
		{
			this.removeListener(this.$options, 'click');
		}
	}

},
{
	defaults: {
		attachToElement: null,
		onOptionSelect: $.noop,
		contextMenuFor: null
	}
});
