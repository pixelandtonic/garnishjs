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
      var triggerId = this.$trigger.attr('aria-controls');
      this.$container = $("#" + triggerId);

      if (!this.$container) return; /* Exit if no disclosure container is found */

      this.captureToggleSettings();
      this.capturePositionSettings();

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
      var toggleAttribute = this.$trigger.data('clickToggleOnly');

      if (toggleAttribute === undefined) return;

      this.settings.clickToggleOnly = true;
    },

    capturePositionSettings: function() {
      var positionAttribute = this.$container.data('positionRelativeToTrigger');

      if (positionAttribute === undefined) return;

      this.settings.positionRelativeToTrigger = true;
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

    show: function () {
      var setDisclosurePosition = this.settings.positionRelativeToTrigger;

      if (this.isExpanded()) {
        return;
      }

      if (setDisclosurePosition) {
        this.setPositionRelativeToTrigger();
        this.addListener(
          Garnish.$scrollContainer,
          'scroll',
          'setPositionRelativeToTrigger'
        );
      }
      
      this.$container.velocity('stop');
      this.$container.css({
        opacity: 1,
        display: 'block',
      });

      
      // Set ARIA attribute for expanded
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
      if (!this.isExpanded()) {
        return;
      }

      this.$container.velocity(
        'fadeOut',
        { duration: Garnish.FX_DURATION }
      );

      this.$trigger.attr('aria-expanded', 'false');
    },

    setPositionRelativeToTrigger: function () {
      this._windowWidth = Garnish.$win.width();
      this._windowHeight = Garnish.$win.height();
      this._windowScrollLeft = Garnish.$win.scrollLeft();
      this._windowScrollTop = Garnish.$win.scrollTop();

      this._anchorOffset = this.$anchor[0].getBoundingClientRect();
      this._anchorWidth = this.$anchor.outerWidth();
      this._anchorHeight = this.$anchor.outerHeight();
      this._anchorOffsetRight = this._anchorOffset.left + this._anchorHeight;
      this._anchorOffsetBottom = this._anchorOffset.bottom;

      this.$container.css('minWidth', 0);
      this.$container.css(
        'minWidth',
        this._anchorWidth -
          (this.$container.outerWidth() - this.$container.width())
      );

      this._menuWidth = this.$container.outerWidth();
      this._menuHeight = this.$container.outerHeight();

      // Is there room for the menu below the anchor?
      var topClearance = this._anchorOffset.top,
        bottomClearance = this._anchorOffsetBottom;

      if (
        bottomClearance >= this._menuHeight ||
        (topClearance < this._menuHeight && bottomClearance >= topClearance)
      ) {
        this.$container.css({
          maxHeight: bottomClearance - this.settings.windowSpacing,
        });
      } else {
        this.$container.css({
          marginTop:
            (this._anchorHeight +
            Math.min(
              this._menuHeight,
              topClearance - this.settings.windowSpacing
            )) * -1,
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

    _alignLeft: function () {
      this.$container.css({
        left: this._anchorOffset.left,
        right: 'auto',
      });
    },

    _alignRight: function () {
      this.$container.css({
        marginLeft:
          Math.abs(this._anchorWidth - this.$container.width()) * -1,
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
      positionRelativeToTrigger: false,
    },
  }
);
