/** global: Garnish */
/**
 * Disclosure Widget
 */
Garnish.Disclosure = Garnish.Base.extend(
  {
    settings: null,
    expanded: false,

    $trigger: null,
    $container: null,
    $anchor: null,

    menuId: null,

    _windowWidth: null,
    _windowHeight: null,
    _windowScrollLeft: null,
    _windowScrollTop: null,

    _anchorOffset: null,
    _anchorWidth: null,
    _anchorHeight: null,
    _anchorOffsetRight: null,
    _anchorOffsetBottom: null,

    _menuWidth: null,
    _menuHeight: null,

    /**
     * Constructor
     */
    init: function (trigger, settings) {
      this.setSettings(settings, Garnish.Disclosure.defaults);

      this.$trigger = $(trigger);

      // Get disclosure container from aria-controls attribute
      var triggerId = this.$trigger.attr('aria-controls');
      this.$container = $("#" + triggerId);

      // Get and store expanded state from trigger
      var expanded = this.$trigger.attr('aria-expanded');
      if (!expanded || expanded === 'false') {
        this.expanded = false;
      }

      // If no expanded state exists on trigger, add for a11y
      if (!expanded) {
        this.$trigger.attr('aria-expanded', 'false');
      }

      
      // Add event listeners
      this.addListener(this.$trigger, 'click', function() {
        this.handleTriggerClick();
      });

      this.addListener(this.$container, 'keyup', function(event) {
        this.handleKeypress(event);
      });
    },

    handleKeypress: function(event) {
      if (event.key === 'Escape') {
        this.hide();
      }
    },

    handleTriggerClick: function() {
      if (!this.expanded) {
        this.show();
      } else {
        this.hide();
      }
    },

    addOptions: function ($options) {
      this.$options = this.$options.add($options);
      $options.data('menu', this);

      $options.each(
        function (optionKey, option) {
          $(option).attr({
            role: 'option',
            tabindex: '-1',
            id: this.menuId + '-option-' + optionKey,
          });
        }.bind(this)
      );

      this.removeAllListeners($options);
      this.addListener($options, 'click', function (ev) {
        this.selectOption(ev.currentTarget);
      });
    },

    setPositionRelativeToAnchor: function () {
      this._windowWidth = Garnish.$win.width();
      this._windowHeight = Garnish.$win.height();
      this._windowScrollLeft = Garnish.$win.scrollLeft();
      this._windowScrollTop = Garnish.$win.scrollTop();

      this._anchorOffset = this.$anchor.offset();
      this._anchorWidth = this.$anchor.outerWidth();
      this._anchorHeight = this.$anchor.outerHeight();
      this._anchorOffsetRight = this._anchorOffset.left + this._anchorHeight;
      this._anchorOffsetBottom = this._anchorOffset.top + this._anchorHeight;

      this.$container.css('minWidth', 0);
      this.$container.css(
        'minWidth',
        this._anchorWidth -
          (this.$container.outerWidth() - this.$container.width())
      );

      this._menuWidth = this.$container.outerWidth();
      this._menuHeight = this.$container.outerHeight();

      // Is there room for the menu below the anchor?
      var topClearance = this._anchorOffset.top - this._windowScrollTop,
        bottomClearance =
          this._windowHeight + this._windowScrollTop - this._anchorOffsetBottom;

      if (
        bottomClearance >= this._menuHeight ||
        (topClearance < this._menuHeight && bottomClearance >= topClearance)
      ) {
        this.$container.css({
          top: this._anchorOffsetBottom,
          maxHeight: bottomClearance - this.settings.windowSpacing,
        });
      } else {
        this.$container.css({
          top:
            this._anchorOffset.top -
            Math.min(
              this._menuHeight,
              topClearance - this.settings.windowSpacing
            ),
          maxHeight: topClearance - this.settings.windowSpacing,
        });
      }

      // Figure out how we're aliging it
      var align = this.$container.data('align');

      if (align !== 'left' && align !== 'center' && align !== 'right') {
        align = 'left';
      }

      if (align === 'center') {
        this._alignCenter();
      } else {
        // Figure out which options are actually possible
        var rightClearance =
            this._windowWidth +
            this._windowScrollLeft -
            (this._anchorOffset.left + this._menuWidth),
          leftClearance = this._anchorOffsetRight - this._menuWidth;

        if ((align === 'right' && leftClearance >= 0) || rightClearance < 0) {
          this._alignRight();
        } else {
          this._alignLeft();
        }
      }

      delete this._windowWidth;
      delete this._windowHeight;
      delete this._windowScrollLeft;
      delete this._windowScrollTop;
      delete this._anchorOffset;
      delete this._anchorWidth;
      delete this._anchorHeight;
      delete this._anchorOffsetRight;
      delete this._anchorOffsetBottom;
      delete this._menuWidth;
      delete this._menuHeight;
    },

    show: function () {
      if (this.expanded) {
        return;
      }

      this.$container.velocity('stop');
      this.$container.css({
        opacity: 1,
        display: 'block',
      });
      
      // Set instance property and ARIA attribute for expanded
      this.expanded = true;
      this.$trigger.attr('aria-expanded', 'true');

      // Focus first focusable element
      var firstFocusableEl = this.$container.find(':focusable')[0];
      if (firstFocusableEl) {
        firstFocusableEl.focus();
      } else {
        this.$container.attr('tabindex', '-1');
        this.$container.focus();
      }
    },

    hide: function () {
      if (!this.expanded) {
        return;
      }

      this.$container.velocity(
        'fadeOut',
        { duration: Garnish.FX_DURATION }
      );

      this.expanded = false;
      this.$trigger.attr('aria-expanded', 'false');
      this.$trigger.focus();
    },

    selectOption: function (option) {
      this.settings.onOptionSelect(option);
      this.trigger('optionselect', { selectedOption: option });
      this.hide();
    },

    _alignLeft: function () {
      this.$container.css({
        left: this._anchorOffset.left,
        right: 'auto',
      });
    },

    _alignRight: function () {
      this.$container.css({
        right:
          this._windowWidth - (this._anchorOffset.left + this._anchorWidth),
        left: 'auto',
      });
    },

    _alignCenter: function () {
      var left = Math.round(
        this._anchorOffset.left + this._anchorWidth / 2 - this._menuWidth / 2
      );

      if (left < 0) {
        left = 0;
      }

      this.$container.css('left', left);
    },
  },
  {
    defaults: {
      anchor: null,
      windowSpacing: 5,
      onOptionSelect: $.noop,
    },
  }
);
