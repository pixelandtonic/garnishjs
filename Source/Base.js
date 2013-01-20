/**
 * Garnish base class
 */
Garnish.Base = Base.extend({

	settings: null,

	_namespace: null,
	_$listeners: null,

	constructor: function()
	{
		this._namespace = '.Garnish'+Math.floor(Math.random()*1000000000);
		this._$listeners = $();
		this.init.apply(this, arguments);
	},

	init: $.noop,

	setSettings: function(settings, defaults)
	{
		var baseSettings = (typeof this.settings == 'undefined' ? {} : this.settings);
		this.settings = $.extend(baseSettings, defaults, settings);
	},

	_formatEvents: function(events)
	{
		if (typeof events == 'string')
		{
			events = events.split(',');

			for (var i = 0; i < events.length; i++)
			{
				events[i] = $.trim(events[i]);
			}
		}

		for (var i = 0; i < events.length; i++)
		{
			events[i] += this._namespace;
		}

		return events.join(' ');
	},

	addListener: function(elem, events, func)
	{
		var $elem = $(elem);
		events = this._formatEvents(events);

		if (typeof func == 'function')
		{
			func = $.proxy(func, this);
		}
		else
		{
			func = $.proxy(this, func);
		}

		$elem.on(events, func);

		// Remember that we're listening to this element
		this._$listeners = this._$listeners.add(elem);

		// Prep for activate event?
		if (events.search(/\bactivate\b/) != -1)
		{
			if (!$elem.data('activatable'))
			{
				var activateNamespace = this._namespace+'-activate';

				// Prevent buttons from getting focus on click
				$elem.on('mousedown'+activateNamespace, function(ev)
				{
					ev.preventDefault();
				});

				$elem.on('click'+activateNamespace, function(ev)
				{
					ev.preventDefault();

					if (!$elem.hasClass('disabled'))
					{
						$elem.trigger('activate');
					}
				});

				$elem.on('keydown'+activateNamespace, function(ev)
				{
					if (ev.target == $elem[0] && ev.keyCode == Garnish.SPACE_KEY)
					{
						ev.preventDefault();

						if (!$elem.hasClass('disabled'))
						{
							$elem.addClass('active');

							Garnish.$doc.on('keyup'+activateNamespace, function(ev)
							{
								$elem.removeClass('active');
								if (ev.target == $elem[0] && ev.keyCode == Garnish.SPACE_KEY)
								{
									ev.preventDefault();
									$elem.trigger('activate');
								}
								Garnish.$doc.off('keyup'+activateNamespace);
							});
						}
					}
				});

				if (!$elem.hasClass('disabled'))
				{
					$elem.attr('tabindex', '0');
				}
				else
				{
					$elem.removeAttr('tabindex');
				}

				$elem.data('activatable', true);
			}

		}
	},

	removeListener: function(elem, events)
	{
		events = this._formatEvents(events);
		$(elem).off(events);
	},

	removeAllListeners: function(elem)
	{
		$(elem).off(this._namespace);
	},

	destroy: function()
	{
		this.removeAllListeners(this._$listeners);
	}

});
