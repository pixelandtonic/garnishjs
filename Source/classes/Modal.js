/**
 * Modal
 */
Garnish.Modal = Garnish.Base.extend({

	$container: null,
	$header: null,
	$body: null,
	$scrollpane: null,
	$footer: null,
	$footerBtns: null,
	$submitBtn: null,
	$shade: null,

	_headerHeight: null,
	_footerHeight: null,

	visible: false,

	dragger: null,

	init: function(container, settings)
	{
		// Param mapping
		if (!settings && $.isPlainObject(container))
		{
			// (settings)
			settings = container;
            container = null;
		}

		this.setSettings(settings, Garnish.Modal.defaults);

        // If container already set, drop the shade below it.
        if (container)
        {
            this.$shade = $('<div class="modal-shade"/>').insertBefore(container);
        }
        else
        {
            this.$shade = $('<div class="modal-shade"/>').appendTo(Garnish.$bod);
        }


        if (container)
		{
			this.setContainer(container);
			this.show();
		}

		Garnish.Modal.instances.push(this);
	},

	setContainer: function(container)
	{
		this.$container = $(container);

		// Is this already a modal?
		if (this.$container.data('modal'))
		{
			Garnish.log('Double-instantiating a modal on an element');
			this.$container.data('modal').destroy();
		}

		this.$container.data('modal', this);

		this.$header = this.$container.find('.pane-head:first');
		this.$body = this.$container.find('.pane-body:first');
		this.$scrollpane = this.$body.children('.scrollpane:first');
		this.$footer = this.$container.find('.pane-foot:first');
		this.$footerBtns = this.$footer.find('.btn');
		this.$submitBtn = this.$footerBtns.filter('.submit:first');
		this.$closeBtn = this.$footerBtns.filter('.close:first');

		if (this.settings.draggable)
		{
			var $dragHandles = this.$header.add(this.$footer);
			if ($dragHandles.length)
			{
				this.dragger = new Garnish.DragMove(this.$container, {
					handle: this.$container
				});
			}
		}

		this.addListener(this.$container, 'click', function(ev) {
			ev.stopPropagation();
		});

		this.addListener(this.$container, 'keydown', 'onKeyDown');
		this.addListener(this.$closeBtn, 'click', 'hide');
	},

	show: function()
	{
        // Close other modals as needed
		if (Garnish.Modal.visibleModal && this.settings.closeOtherModals)
		{
			Garnish.Modal.visibleModal.hide();
		}

		if (this.$container)
		{
			this.$container.show();

			// Center it vertically
			var modalHeight = this.getHeight();
			this.$container.css('margin-top', -Math.round(modalHeight/2));

			// Make sure it's not too wide
			var windowWidth = Garnish.$win.width();
			if (this.$container.width() > windowWidth)
			{
				this.$container.css({
					width: windowWidth,
					marginLeft: -Math.round(windowWidth/2)
				});
			}

			this.$container.delay(50).fadeIn($.proxy(this, 'onFadeIn'));
		}

		this.visible = true;
		Garnish.Modal.visibleModal = this;
		this.$shade.fadeIn(50);

		this.addListener(this.$shade, 'click', 'hide');

		Garnish.escManager.register(this, 'hide');

		this.settings.onShow();
	},

	hide: function(ev)
	{
		if (ev)
		{
			ev.stopPropagation();
		}

		if (this.$container)
		{
			this.$container.fadeOut('fast');
			this.removeListener(Garnish.$win, 'resize');
		}

		this.visible = false;
		Garnish.Modal.visibleModal = null;
		this.$shade.fadeOut('fast', $.proxy(this, 'onFadeOut'));
		this.removeListener(this.$shade, 'click');
		this.removeListener(Garnish.$bod, 'keyup');

		Garnish.escManager.unregister(this);
		this.settings.onHide();
	},

	onFadeIn: function()
	{
		this.settings.onFadeIn();
	},

	onFadeOut: function()
	{
		this.settings.onFadeOut();
	},

	getHeight: function()
	{
		if (!this.$container)
		{
			throw 'Attempted to get the height of a modal whose container has not been set.';
		}

		if (!this.visible)
		{
			this.$container.show();
		}

		var height = this.$container.outerHeight();

		if (!this.visible)
		{
			this.$container.hide();
		}

		return height;
	},

	getWidth: function()
	{
		if (!this.$container)
		{
			throw 'Attempted to get the width of a modal whose container has not been set.';
		}

		if (!this.visible)
		{
			this.$container.show();
		}

		var width = this.$container.outerWidth();

		if (!this.visible)
		{
			this.$container.hide();
		}

		return width;
	},

	onKeyDown: function(ev)
	{
		if (ev.target.nodeName != 'TEXTAREA' && ev.keyCode == Garnish.RETURN_KEY)
		{
			this.$submitBtn.click();
		}
	},

	destroy: function()
	{
		this.base();

		if (this.dragger)
		{
			this.dragger.destroy();
		}
	},

    shiftModalToEnd: function ()
    {
        this.$shade.appendTo(Garnish.$bod);
        this.$container.appendTo(Garnish.$bod);
    }
},
{
	relativeElemPadding: 8,
	defaults: {
		draggable: true,
		onShow: $.noop,
		onHide: $.noop,
		onFadeIn: $.noop,
		onFadeOut: $.noop,
        closeOtherModals: true
	},
	instances: [],
	visibleModal: null
});
