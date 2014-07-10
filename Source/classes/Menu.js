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
	}

},
{
	defaults: {
		attachToElement: null,
		onOptionSelect: $.noop
	}
});
