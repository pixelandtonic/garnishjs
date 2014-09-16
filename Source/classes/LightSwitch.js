/**
 * Light Switch
 */
Garnish.LightSwitch = Garnish.Base.extend({

	settings: null,
	$outerContainer: null,
	$innerContainer: null,
	$input: null,
	$toggleTarget: null,
	on: null,
	dragger: null,

	dragStartMargin: null,

	init: function(outerContainer, settings)
	{
		this.$outerContainer = $(outerContainer);

		// Is this already a switch?
		if (this.$outerContainer.data('lightswitch'))
		{
			Garnish.log('Double-instantiating a switch on an element');
			this.$outerContainer.data('lightswitch').destroy();
		}

		this.$outerContainer.data('lightswitch', this);

		this.setSettings(settings, Garnish.LightSwitch.defaults);

		this.$innerContainer = this.$outerContainer.find('.container:first');
		this.$input = this.$outerContainer.find('input:first');
		this.$toggleTarget = $(this.$outerContainer.attr('data-toggle'));

		this.on = this.$outerContainer.hasClass('on');

		this.addListener(this.$outerContainer, 'mousedown', '_onMouseDown');
		this.addListener(this.$outerContainer, 'keydown', '_onKeyDown');

		this.dragger = new Garnish.BaseDrag(this.$outerContainer, {
			axis:                 Garnish.X_AXIS,
			ignoreHandleSelector: null,
			onDragStart:          $.proxy(this, '_onDragStart'),
			onDrag:               $.proxy(this, '_onDrag'),
			onDragStop:           $.proxy(this, '_onDragStop')
		});
	},

	turnOn: function()
	{
		this.$innerContainer.velocity('stop').velocity({marginLeft: 0}, 'fast');
		this.$input.val(Garnish.Y_AXIS);
		this.on = true;
		this.onChange();

		this.$toggleTarget.show();
		this.$toggleTarget.height('auto');
		var height = this.$toggleTarget.height();
		this.$toggleTarget.height(0);
		this.$toggleTarget.velocity('stop').velocity({height: height}, 'fast', $.proxy(function() {
			this.$toggleTarget.height('auto');
		}, this));
	},

	turnOff: function()
	{
		this.$innerContainer.velocity('stop').velocity({marginLeft: Garnish.LightSwitch.offMargin}, 'fast');
		this.$input.val('');
		this.on = false;
		this.onChange();

		this.$toggleTarget.velocity('stop').velocity({height: 0}, 'fast');
	},

	toggle: function(ev)
	{
		if (!this.on)
		{
			this.turnOn();
		}
		else
		{
			this.turnOff();
		}
	},

	onChange: function()
	{
		this.trigger('change');
		this.settings.onChange();
		this.$outerContainer.trigger('change');
	},

	_onMouseDown: function()
	{
		this.addListener(Garnish.$doc, 'mouseup', '_onMouseUp')
	},

	_onMouseUp: function()
	{
		this.removeListener(Garnish.$doc, 'mouseup');

		// Was this a click?
		if (!this.dragger.dragging)
			this.toggle();
	},

	_onKeyDown: function(ev)
	{
		switch (ev.keyCode)
		{
			case Garnish.SPACE_KEY:
			{
				this.toggle();
				ev.preventDefault();
				break;
			}

			case Garnish.RIGHT_KEY:
			{
				if (Garnish.ltr)
				{
					this.turnOn();
				}
				else
				{
					this.turnOff();
				}

				ev.preventDefault();
				break;
			}

			case Garnish.LEFT_KEY:
			{
				if (Garnish.ltr)
				{
					this.turnOff();
				}
				else
				{
					this.turnOn();
				}

				ev.preventDefault();
				break;
			}
		}
	},

	_getMargin: function()
	{
		return parseInt(this.$innerContainer.css('marginLeft'))
	},

	_onDragStart: function()
	{
		this.dragStartMargin = this._getMargin();
	},

	_onDrag: function()
	{
		var margin = this.dragStartMargin + this.dragger.mouseDistX;

		if (margin < Garnish.LightSwitch.offMargin)
		{
			margin = Garnish.LightSwitch.offMargin;
		}
		else if (margin > 0)
		{
			margin = 0;
		}

		this.$innerContainer.css('marginLeft', margin);
	},

	_onDragStop: function()
	{
		var margin = this._getMargin();

		if (margin > -16)
		{
			this.turnOn();
		}
		else
		{
			this.turnOff();
		}
	},

	destroy: function()
	{
		this.base();
		this.dragger.destroy();
	}

},
{
	offMargin: -50,
	defaults: {
		onChange: $.noop
	}
});
