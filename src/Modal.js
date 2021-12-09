/** global: Garnish */
/**
 * Modal
 */
Garnish.Modal = Garnish.Base.extend(
    {
        $container: null,
        $shade: null,

        visible: false,

        dragger: null,

        desiredWidth: null,
        desiredHeight: null,
        resizeDragger: null,
        resizeStartWidth: null,
        resizeStartHeight: null,

        init: function(container, settings) {
            // Param mapping
            if (typeof settings === 'undefined' && $.isPlainObject(container)) {
                // (settings)
                settings = container;
                container = null;
            }

            this.setSettings(settings, Garnish.Modal.defaults);

            // Create the shade
            this.$shade = $('<div class="' + this.settings.shadeClass + '"/>');

            // If the container is already set, drop the shade below it.
            if (container) {
                this.$shade.insertBefore(container);
            }
            else {
                this.$shade.appendTo(Garnish.$bod);
            }

            if (container) {
                this.addAriaAttributes(container);
                this.setContainer(container);

                if (this.settings.autoShow) {
                    this.show();
                }
            }

            Garnish.Modal.instances.push(this);
        },

        addAriaAttributes: function(container) {
            $(container).attr({
                'aria-modal': 'true',
                'role': 'dialog',
            });
        },

        setContainer: function(container) {
            this.$container = $(container);

            // Is this already a modal?
            if (this.$container.data('modal')) {
                Garnish.log('Double-instantiating a modal on an element');
                this.$container.data('modal').destroy();
            }

            this.$container.data('modal', this);

            if (this.settings.draggable) {
                this.dragger = new Garnish.DragMove(this.$container, {
                    handle: (this.settings.dragHandleSelector ? this.$container.find(this.settings.dragHandleSelector) : this.$container)
                });
            }

            if (this.settings.resizable) {
                var $resizeDragHandle = $('<div class="resizehandle"/>').appendTo(this.$container);

                this.resizeDragger = new Garnish.BaseDrag($resizeDragHandle, {
                    onDragStart: this._handleResizeStart.bind(this),
                    onDrag: this._handleResize.bind(this)
                });
            }

            this.addListener(this.$container, 'click', function(ev) {
                ev.stopPropagation();
            });

            // Show it if we're late to the party
            if (this.visible) {
                this.show();
            }
        },

        hideOutsideContent: function() {
            // Hide body content from screen reader users
            var modal = this;

            Garnish.$bod.children().each(function() {
                if (modal.contentShouldBeHidden(this)) {
                    modal.ariaHide(this);
                }
            });
        },

        resetOutsideContentVisibility: function() {
            var ariaSelector = '.' + this.settings.jsAriaClass + ', .' + this.settings.jsAriaFalseClass + ', .' + this.settings.jsAriaTrueClass;

            var ariaHiddenElements = $(ariaSelector);
            var modal = this;

            // Go through each and restore to initial value
            $(ariaHiddenElements).each(function() {
                if ($(this).hasClass(modal.settings.jsAriaClass)) {
                    $(this).removeClass(modal.settings.jsAriaClass);
                    $(this).removeAttr('aria-hidden');
                } else if ($(this).hasClass(modal.settings.jsAriaFalseClass)) {
                    $(this).removeClass(modal.settings.jsAriaFalseClass);
                    $(this).attr('aria-hidden', false);
                } else if ($(this).hasClass(modal.settings.jsAriaTrueClass)) {
                    $(this).removeClass(modal.settings.jsAriaTrueClass);
                    $(this).attr('aria-hidden', true);
                }
            });
        },

        ariaHide: function(element) {
            var ariaHiddenAttribute = $(element).attr('aria-hidden');

            // Capture initial aria-hidden values in an applied class
            if (!ariaHiddenAttribute) {
                $(element).addClass(this.settings.jsAriaClass);
            } else if (ariaHiddenAttribute === 'false') {
                $(element).addClass(this.settings.jsAriaFalseClass);
            } else if (ariaHiddenAttribute === 'true') {
                $(element.addClass(this.settings.jsAriaTrueClass));
            }

            $(element).attr('aria-hidden', 'true');
        },

        contentShouldBeHidden: function(element) {
            var hide = true;
            var tagName = $(element).prop('tagName');

            // TODO clean up this conditional
            if (tagName === 'SCRIPT' || tagName === 'STYLE' || element === Garnish.Modal.visibleModal.$container.get(0)) {
                hide = false;
            }

            return hide;
        },

        show: function() {
            // Close other modals as needed
            if (this.settings.closeOtherModals && Garnish.Modal.visibleModal && Garnish.Modal.visibleModal !== this) {
                Garnish.Modal.visibleModal.hide();
            }

            if (this.$container) {
                // Move it to the end of <body> so it gets the highest sub-z-index
                this.$shade.appendTo(Garnish.$bod);
                this.$container.appendTo(Garnish.$bod);

                this.$container.show();
                this.updateSizeAndPosition();

                this.$shade.velocity('fadeIn', {
                    duration: 50,
                    complete: function() {
                        this.$container.velocity('fadeIn', {
                            complete: function() {
                                this.updateSizeAndPosition();
                                this.onFadeIn();
                            }.bind(this)
                        });
                    }.bind(this)
                });

                if (this.settings.hideOnShadeClick) {
                    this.addListener(this.$shade, 'click', 'hide');
                }

                // Add keydown listener for focus trap
                this.addListener(this.$container, 'keydown', 'handleKeydown');

                this.addListener(Garnish.$win, 'resize', '_handleWindowResize');
            }

            this.enable();

            if (!this.visible) {
                this.visible = true;
                Garnish.Modal.visibleModal = this;

                Garnish.shortcutManager.addLayer();

                if (this.settings.hideOnEsc) {
                    Garnish.shortcutManager.registerShortcut(Garnish.ESC_KEY, this.hide.bind(this));
                }

                this.trigger('show');
                this.settings.onShow();
            }

            this.hideOutsideContent();
        },

        handleKeydown: function(event) {
            if (event.keyCode !== Garnish.TAB_KEY) return;

            var focusable = Garnish.findFocusable(this.$container);
            var target = $(event.target);

            if (event.shiftKey) { // Handle reverse TAB by looping to beginning of container
                if (target.is(focusable.first())) {
                    focusable.last().focus();
                    event.preventDefault();
                }
            } else {
                if (target.is(focusable.last())) {
                    focusable.first().focus();
                    event.preventDefault();
                }
            }
        },

        quickShow: function() {
            this.show();

            if (this.$container) {
                this.$container.velocity('stop');
                this.$container.show().css('opacity', 1);

                this.$shade.velocity('stop');
                this.$shade.show().css('opacity', 1);
            }
        },

        hide: function(ev) {
            if (!this.visible) {
                return;
            }

            this.disable();

            if (ev) {
                ev.stopPropagation();
            }

            if (this.$container) {
                this.$container.velocity('fadeOut', {duration: Garnish.FX_DURATION});
                this.$shade.velocity('fadeOut', {
                    duration: Garnish.FX_DURATION,
                    complete: this.onFadeOut.bind(this)
                });

                if (this.settings.hideOnShadeClick) {
                    this.removeListener(this.$shade, 'click');
                }

                // Remove keydown listener for focus trap
                this.removeListener(this.$container, 'keydown', 'handleKeydown');

                this.removeListener(Garnish.$win, 'resize');
            }

            if (this.settings.triggerElement) {
                this.settings.triggerElement.focus();
            }

            this.visible = false;
            Garnish.Modal.visibleModal = null;
            Garnish.shortcutManager.removeLayer();
            this.trigger('hide');
            this.resetOutsideContentVisibility();
            this.settings.onHide();
        },

        quickHide: function() {
            this.hide();

            if (this.$container) {
                this.$container.velocity('stop');
                this.$container.css('opacity', 0).hide();

                this.$shade.velocity('stop');
                this.$shade.css('opacity', 0).hide();
            }
        },

        updateSizeAndPosition: function() {
            if (!this.$container) {
                return;
            }

            this.$container.css({
                'width': (this.desiredWidth ? Math.max(this.desiredWidth, 200) : ''),
                'height': (this.desiredHeight ? Math.max(this.desiredHeight, 200) : ''),
                'min-width': '',
                'min-height': ''
            });

            // Set the width first so that the height can adjust for the width
            this.updateSizeAndPosition._windowWidth = Garnish.$win.width();
            this.updateSizeAndPosition._width = Math.min(this.getWidth(), this.updateSizeAndPosition._windowWidth - this.settings.minGutter * 2);

            this.$container.css({
                'width': this.updateSizeAndPosition._width,
                'min-width': this.updateSizeAndPosition._width,
                'left': Math.round((this.updateSizeAndPosition._windowWidth - this.updateSizeAndPosition._width) / 2)
            });

            // Now set the height
            this.updateSizeAndPosition._windowHeight = Garnish.$win.height();
            this.updateSizeAndPosition._height = Math.min(this.getHeight(), this.updateSizeAndPosition._windowHeight - this.settings.minGutter * 2);

            this.$container.css({
                'height': this.updateSizeAndPosition._height,
                'min-height': this.updateSizeAndPosition._height,
                'top': Math.round((this.updateSizeAndPosition._windowHeight - this.updateSizeAndPosition._height) / 2)
            });

            this.trigger('updateSizeAndPosition');
        },

        onFadeIn: function() {
            this.trigger('fadeIn');
            this.settings.onFadeIn();
        },

        onFadeOut: function() {
            this.trigger('fadeOut');
            this.settings.onFadeOut();
        },

        getHeight: function() {
            if (!this.$container) {
                throw 'Attempted to get the height of a modal whose container has not been set.';
            }

            if (!this.visible) {
                this.$container.show();
            }

            this.getHeight._height = this.$container.outerHeight();

            if (!this.visible) {
                this.$container.hide();
            }

            return this.getHeight._height;
        },

        getWidth: function() {
            if (!this.$container) {
                throw 'Attempted to get the width of a modal whose container has not been set.';
            }

            if (!this.visible) {
                this.$container.show();
            }

            // Chrome might be 1px shy here for some reason
            this.getWidth._width = this.$container.outerWidth() + 1;

            if (!this.visible) {
                this.$container.hide();
            }

            return this.getWidth._width;
        },

        _handleWindowResize: function(ev) {
            // ignore propagated resize events
            if (ev.target === window) {
                this.updateSizeAndPosition();
            }
        },

        _handleResizeStart: function() {
            this.resizeStartWidth = this.getWidth();
            this.resizeStartHeight = this.getHeight();
        },

        _handleResize: function() {
            if (Garnish.ltr) {
                this.desiredWidth = this.resizeStartWidth + (this.resizeDragger.mouseDistX * 2);
            }
            else {
                this.desiredWidth = this.resizeStartWidth - (this.resizeDragger.mouseDistX * 2);
            }

            this.desiredHeight = this.resizeStartHeight + (this.resizeDragger.mouseDistY * 2);

            this.updateSizeAndPosition();
        },

        /**
         * Destroy
         */
        destroy: function() {
            if (this.$container) {
                this.$container.removeData('modal').remove();
            }

            if (this.$shade) {
                this.$shade.remove();
            }

            if (this.dragger) {
                this.dragger.destroy();
            }

            if (this.resizeDragger) {
                this.resizeDragger.destroy();
            }

            this.base();
        }
    },
    {
        relativeElemPadding: 8,
        defaults: {
            autoShow: true,
            draggable: false,
            dragHandleSelector: null,
            resizable: false,
            minGutter: 10,
            onShow: $.noop,
            onHide: $.noop,
            onFadeIn: $.noop,
            onFadeOut: $.noop,
            closeOtherModals: false,
            hideOnEsc: true,
            hideOnShadeClick: true,
            triggerElement: null,
            shadeClass: 'modal-shade',
            jsAriaClass: 'garnish-js-aria',
            jsAriaTrueClass: 'garnish-js-aria-true',
            jsAriaFalseClass: 'garnish-js-aria-false',
        },
        instances: [],
        visibleModal: null
    }
);
