/**
 * Modal
 */
Garnish.Modal = Garnish.Base.extend({

	$container: null,
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

		if (this.settings.draggable)
		{
			this.dragger = new Garnish.DragMove(this.$container, {
				handle: (this.settings.dragHandleSelector ? this.$container.find(this.settings.dragHandleSelector) : this.$container)
			});
		}

		this.addListener(this.$container, 'click', function(ev) {
			ev.stopPropagation();
		});
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
			this.updateSizeAndPosition();
			this.$container.delay(50).fadeIn($.proxy(this, 'onFadeIn'));
		}

		this.visible = true;
		Garnish.Modal.visibleModal = this;
		this.$shade.fadeIn(50);

		this.addListener(this.$shade, 'click', 'hide');
		this.addListener(Garnish.$win, 'resize', 'updateSizeAndPosition');

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

	updateSizeAndPosition: function()
	{
		if (!this.$container)
		{
			return;
		}

		this.$container.css({
			width: '',
			height: ''
		});

		this.updateSizeAndPosition._width = Math.min(this.getWidth(), Garnish.$win.width()-20);
		this.updateSizeAndPosition._height = Math.min(this.getHeight(), Garnish.$win.height()-20);

		this.$container.css({
			'width':       this.updateSizeAndPosition._width,
			'height':      this.updateSizeAndPosition._height,
			'margin-left': -Math.round(this.updateSizeAndPosition._width/2),
			'margin-top':  -Math.round(this.updateSizeAndPosition._height/2)
		});
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

		this.getHeight._height = this.$container.height();

		if (!this.visible)
		{
			this.$container.hide();
		}

		return this.getHeight._height;
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

		this.getWidth._width = this.$container.width();

		if (!this.visible)
		{
			this.$container.hide();
		}

		return this.getWidth._width;
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
		dragHandleSelector: null,
		onShow: $.noop,
		onHide: $.noop,
		onFadeIn: $.noop,
		onFadeOut: $.noop,
        closeOtherModals: true
	},
	instances: [],
	visibleModal: null
});
