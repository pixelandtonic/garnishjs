/**
 * Nice Text
 */
Garnish.NiceText = Garnish.Base.extend({

	$input: null,
	$hint: null,
	$stage: null,
	autoHeight: null,
	focussed: false,
	showingHint: false,
	val: null,
	inputBoxSizing: 'content-box',
	stageHeight: null,
	minHeight: null,
	interval: null,

	init: function(input, settings)
	{
		this.$input = $(input);
		this.settings = $.extend({}, Garnish.NiceText.defaults, settings);

		// Is this already a transparent text input?
		if (this.$input.data('nicetext'))
		{
			Garnish.log('Double-instantiating a transparent text input on an element');
			this.$input.data('nicetext').destroy();
		}

		this.$input.data('nicetext', this);

		this.getVal();

		this.autoHeight = (this.settings.autoHeight && this.$input.prop('nodeName') == 'TEXTAREA');
		if (this.autoHeight)
		{
			this.minHeight = this.getStageHeight('');
			this.setHeight();

			this.addListener(Garnish.$win, 'resize', 'setHeight');
		}

		if (this.settings.hint)
		{
			this.$hintContainer = $('<div class="texthint-container"/>').insertBefore(this.$input);
			this.$hint = $('<div class="texthint">'+this.settings.hint+'</div>').appendTo(this.$hintContainer);
			this.$hint.css({
				top:  (parseInt(this.$input.css('borderTopWidth'))  + parseInt(this.$input.css('paddingTop'))),
				left: (parseInt(this.$input.css('borderLeftWidth')) + parseInt(this.$input.css('paddingLeft')) + 1)
			});
			Garnish.copyTextStyles(this.$input, this.$hint);

			if (this.val)
			{
				this.$hint.hide();
			}
			else
			{
				this.showingHint = true;
			}

			// Focus the input when clicking on the hint
			this.addListener(this.$hint, 'mousedown', function(ev) {
				ev.preventDefault();
				this.$input.focus();
			});
		}

		this.addListener(this.$input, 'focus', 'onFocus');
		this.addListener(this.$input, 'blur', 'onBlur');
		this.addListener(this.$input, 'keydown', 'onKeyDown');
	},

	getVal: function()
	{
		this.val = this.$input.val();
		return this.val;
	},

	showHint: function()
	{
		this.$hint.fadeIn(Garnish.NiceText.hintFadeDuration);
		this.showingHint = true;
	},

	hideHint: function()
	{
		this.$hint.fadeOut(Garnish.NiceText.hintFadeDuration);
		this.showingHint = false;
	},

	checkInput: function()
	{
		// Has the value changed?
		var changed = (this.val !== this.getVal());
		if (changed)
		{
			if (this.$hint)
			{
				if (this.showingHint && this.val)
				{
					this.hideHint();
				}
				else if (!this.showingHint && !this.val)
				{
					this.showHint();
				}
			}

			if (this.autoHeight)
			{
				this.setHeight();
			}
		}

		return changed;
	},

	buildStage: function()
	{
		this.$stage = $('<stage/>').appendTo(Garnish.$bod);

		// replicate the textarea's text styles
		this.$stage.css({
			position: 'absolute',
			top: -9999,
			left: -9999,
			wordWrap: 'break-word'
		});

		this.inputBoxSizing = this.$input.css('box-sizing');

		if (this.inputBoxSizing == 'border-box')
		{
			this.$stage.css({
				'border-top-width':    this.$input.css('border-top-width'),
				'border-right-width':  this.$input.css('border-right-width'),
				'border-bottom-width': this.$input.css('border-bottom-width'),
				'border-left-width':   this.$input.css('border-left-width'),
				'padding-top':         this.$input.css('padding-top'),
				'padding-right':       this.$input.css('padding-right'),
				'padding-bottom':      this.$input.css('padding-bottom'),
				'padding-left':        this.$input.css('padding-left'),
				'-webkit-box-sizing':  this.inputBoxSizing,
		  		'-moz-box-sizing':     this.inputBoxSizing,
		        'box-sizing':          this.inputBoxSizing
			});
		}

		Garnish.copyTextStyles(this.$input, this.$stage);
	},

	getStageHeight: function(val)
	{
		if (!this.$stage)
		{
			this.buildStage();
		}

		if (this.inputBoxSizing == 'border-box')
		{
			this.$stage.css('width', this.$input.outerWidth());
		}
		else
		{
			this.$stage.css('width', this.$input.width());
		}

		if (!val)
		{
			val = '&nbsp;';
			for (var i = 1; i < this.$input.prop('rows'); i++)
			{
				val += '<br/>&nbsp;';
			}
		}
		else
		{
			// Ampersand entities
			val = val.replace(/&/g, '&amp;');

			// < and >
			val = val.replace(/</g, '&lt;');
			val = val.replace(/>/g, '&gt;');

			// Spaces
			val = val.replace(/ /g, '&nbsp;');

			// Line breaks
			val = val.replace(/[\n\r]$/g, '<br/>&nbsp;');
			val = val.replace(/[\n\r]/g, '<br/>');
		}

		this.$stage.html(val);

		if (this.inputBoxSizing == 'border-box')
		{
			this.stageHeight = this.$stage.outerHeight();
		}
		else
		{
			this.stageHeight = this.$stage.height();
		}

		return this.stageHeight;
	},

	setHeight: function()
	{
		// has the height changed?
		if (this.stageHeight !== this.getStageHeight(this.val))
		{
			// update the textarea height
			var height = this.stageHeight;

			if (height < this.minHeight)
			{
				height = this.minHeight;
			}

			this.$input.css('min-height', height);

			this.settings.onHeightChange(height);
		}
	},

	onFocus: function()
	{
		this.focussed = true;
		this.interval = setInterval($.proxy(this, 'checkInput'), Garnish.NiceText.interval);
		this.checkInput();
	},

	onBlur: function()
	{
		this.focussed = false;
		clearInterval(this.interval);

		this.checkInput();
	},

	onKeyDown: function()
	{
		setTimeout($.proxy(this, 'checkInput'), 1);
	},

	destroy: function()
	{
		this.base();
		this.$hint.remove();
		this.$stage.remove();
	}

},
{
	interval: 100,
	hintFadeDuration: 50,
	defaults: {
		autoHeight:     true,
		onHeightChange: $.noop
	}
});
