/** global: Garnish */
/**
 * Menu Button
 */
Garnish.MenuBtn = Garnish.Base.extend(
    {
        $btn: null,
        menu: null,
        showingMenu: false,
        disabled: true,

        /**
         * Constructor
         */
        init: function(btn, menu, settings) {
            // Param mapping
            if (typeof settings === 'undefined' && $.isPlainObject(menu)) {
                // (btn, settings)
                settings = menu;
                menu = null;
            }

            this.$btn = $(btn);
            var $menu;

            // Is this already a menu button?
            if (this.$btn.data('menubtn')) {
                // Grab the old MenuBtn's menu container
                if (!menu) {
                    $menu = this.$btn.data('menubtn').menu.$container;
                }

                Garnish.log('Double-instantiating a menu button on an element');
                this.$btn.data('menubtn').destroy();
            }
            else if (!menu) {
                $menu = this.$btn.next('.menu').detach();
            }

            this.$btn.data('menubtn', this);

            this.setSettings(settings, Garnish.MenuBtn.defaults);

            this.menu = menu || new Garnish.CustomSelect($menu);
            this.menu.$anchor = $(this.settings.menuAnchor || this.$btn);
            this.menu.on('optionselect', function(ev) {
                this.onOptionSelect(ev.selectedOption);
            }.bind(this));

            this.$btn.attr({
                'tabindex': 0,
                'aria-controls': this.menu.menuId,
                'aria-haspopup': 'listbox',
                'aria-expanded': 'false'
            });

            this.menu.on('hide', this.onMenuHide.bind(this));
            this.addListener(this.$btn, 'mousedown', 'onMouseDown');
            this.addListener(this.$btn, 'keydown', 'onKeyDown');
            this.addListener(this.$btn, 'blur', 'onBlur');
            this.enable();
        },

        onBlur: function() {
            if (this.showingMenu) {
                Garnish.requestAnimationFrame(function() {
                    if (!$.contains(this.menu.$container.get(0), document.activeElement)) {
                        this.hideMenu();
                    }
                }.bind(this));
            }
        },

        onKeyDown: function(ev) {
            var $option;

            switch (ev.keyCode) {
                case Garnish.RETURN_KEY: {
                    ev.preventDefault();

                    const $currentOption = this.menu.$options.filter('.hover');
                    if ($currentOption.length > 0) {
                        $currentOption.get(0).click();
                    }

                    break;
                }

                case Garnish.SPACE_KEY: {
                    ev.preventDefault();

                    if (this.showingMenu) {
                        const $currentOption = this.menu.$options.filter('.hover');
                        if ($currentOption.length > 0) {
                            $currentOption.get(0).click();
                        }
                    } else {
                        this.showMenu();

                        $option = this.menu.$options.filter('.sel:first');

                        if ($option.length === 0) {
                            $option = this.menu.$options.first();
                        }

                        this.focusOption($option);
                    }

                    break;
                }

                case Garnish.DOWN_KEY: {
                    ev.preventDefault();

                    if (this.showingMenu) {
                        $.each(this.menu.$options, function(index, value) {
                            if (!$option) {
                                if ($(value).hasClass('hover')) {
                                    if ((index + 1) < this.menu.$options.length) {
                                        $option = $(this.menu.$options[(index + 1)]);
                                    }
                                }
                            }
                        }.bind(this));

                        if (!$option) {
                            $option = $(this.menu.$options[0]);
                        }
                    }
                    else {
                        this.showMenu();

                        $option = this.menu.$options.filter('.sel:first');

                        if ($option.length === 0) {
                            $option = this.menu.$options.first();
                        }
                    }

                    this.focusOption($option);

                    break;
                }

                case Garnish.UP_KEY: {
                    ev.preventDefault();

                    if (this.showingMenu) {
                        $.each(this.menu.$options, function(index, value) {
                            if (!$option) {
                                if ($(value).hasClass('hover')) {
                                    if ((index - 1) >= 0) {
                                        $option = $(this.menu.$options[(index - 1)]);
                                    }
                                }
                            }
                        }.bind(this));

                        if (!$option) {
                            $option = $(this.menu.$options[(this.menu.$options.length - 1)]);
                        }
                    }
                    else {
                        this.showMenu();

                        $option = this.menu.$options.filter('.sel:first');

                        if ($option.length === 0) {
                            $option = this.menu.$options.last();
                        }
                    }

                    this.focusOption($option);

                    break;
                }
            }
        },

        focusOption: function($option) {
            this.menu.$options.removeClass('hover');

            $option.addClass('hover');

            this.menu.$menuList.attr('aria-activedescendant', $option.attr('id'));
            this.$btn.attr('aria-activedescendant', $option.attr('id'));
        },

        onMouseDown: function(ev) {
            if (ev.which !== Garnish.PRIMARY_CLICK || Garnish.isCtrlKeyPressed(ev) || ev.target.nodeName === 'INPUT') {
                return;
            }

            ev.preventDefault();

            if (this.showingMenu) {
                this.hideMenu();
            }
            else {
                this.showMenu();
            }
        },

        showMenu: function() {
            if (this.disabled) {
                return;
            }

            this.menu.show();
            this.$btn.addClass('active');
            this.$btn.trigger('focus');
            this.$btn.attr('aria-expanded', 'true');

            this.showingMenu = true;

            setTimeout(function() {
                this.addListener(Garnish.$doc, 'mousedown', 'onMouseDown');
            }.bind(this), 1);
        },

        hideMenu: function() {
            this.menu.hide();
        },

        onMenuHide: function() {
            this.$btn.removeClass('active');
            this.$btn.attr('aria-expanded', 'false');
            this.showingMenu = false;

            this.removeListener(Garnish.$doc, 'mousedown');
        },

        onOptionSelect: function(option) {
            this.settings.onOptionSelect(option);
            this.trigger('optionSelect', {option: option});
        },

        enable: function() {
            this.disabled = false;
        },

        disable: function() {
            this.disabled = true;
        },

        /**
         * Destroy
         */
        destroy: function() {
            this.$btn.removeData('menubtn');
            this.base();
        }
    },
    {
        defaults: {
            menuAnchor: null,
            onOptionSelect: $.noop
        }
    }
);
