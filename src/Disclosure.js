/** global: Garnish */
/**
 * Disclosure Widget
 */
Garnish.Disclosure = Garnish.Base.extend(
  {
    settings: null,

    $trigger: null,
    $container: null,
    $anchor: null,

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
      this.$anchor = this.$trigger;

      this.captureToggleSettings();

      // Get disclosure container from aria-controls attribute
      var triggerId = this.$trigger.attr('aria-controls');
      this.$container = $("#" + triggerId);

      // Get and store expanded state from trigger
      var expanded = this.$trigger.attr('aria-expanded');

      // If no expanded state exists on trigger, add for a11y
      if (!expanded) {
        this.$trigger.attr('aria-expanded', 'false');
      }

      this.addDisclosureEventListeners();
    },
    
    /**
     * Capture whether focus out and ESC will toggle closed
     */
    captureToggleSettings: function() {
      var toggleAttribute = this.$trigger.attr('data-click-toggle-only');

      if (!toggleAttribute) return;

      this.settings.clickToggleOnly = true;
    },

    addDisclosureEventListeners: function() {
      this.addListener(this.$trigger, 'click', function() {
        this.handleTriggerClick();
      });

      if (this.settings.clickToggleOnly === true) return;

      this.addListener(this.$container, 'keyup', function(event) {
        this.handleKeypress(event);
      });

      this.addListener(this.$container, 'focusout', function(event) {
        var newTarget = event.relatedTarget;
        var newTargetIsInsideDisclosure = this.$container.has(newTarget).length > 0;

        // If click target matches trigger element or disclosure child, do nothing
      if (newTarget === this.$trigger.get(0) || newTargetIsInsideDisclosure) {
          return;
        }

        this.hide();
      });
    },

    handleKeypress: function(event) {
      if (event.key === 'Escape') {
        this.hide();
        this.$trigger.focus();
      }
    },

    isExpanded: function () {
      var isExpanded = this.$trigger.attr('aria-expanded');

      return isExpanded === 'true';
    },

    handleTriggerClick: function() {
      if (!this.isExpanded()) {
        this.show();
      } else {
        this.hide();
      }
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
      if (this.isExpanded()) {
        return;
      }

      // Move the menu to the end of the DOM
      this.$container.appendTo(Garnish.$bod);
      this.setPositionRelativeToAnchor();

      this.$container.velocity('stop');
      this.$container.css({
        opacity: 1,
        display: 'block',
      });

      // Set position
      this.addListener(
        Garnish.$scrollContainer,
        'scroll',
        'setPositionRelativeToAnchor'
      );
      
      // Set ARIA attribute for expanded
      this.$trigger.attr('aria-expanded', 'true');

      this.addListener(
        Garnish.$scrollContainer,
        'scroll',
        'setPositionRelativeToAnchor'
      );

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
      if (!this.isExpanded()) {
        return;
      }

      this.$container.velocity(
        'fadeOut',
        { duration: Garnish.FX_DURATION }
      );

      this.$trigger.attr('aria-expanded', 'false');
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
      clickToggleOnly: false,
    },
  }
);
