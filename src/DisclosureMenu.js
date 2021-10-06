/** global: Garnish */
/**
 * Disclosure Widget
 */
Garnish.DisclosureMenu = Garnish.Base.extend(
  {
    settings: null,

    $trigger: null,
    $container: null,
    $alignmentElement: null,
    $wrapper: null,

    _windowWidth: null,
    _windowHeight: null,
    _windowScrollLeft: null,
    _windowScrollTop: null,

    _wrapperElementOffset: null,
    _alignmentElementOffset: null,
    _triggerWidth: null,
    _triggerHeight: null,

    _menuWidth: null,
    _menuHeight: null,

    /**
     * Constructor
     */
    init: function (trigger, settings) {
      this.setSettings(settings, Garnish.DisclosureMenu.defaults);

      this.$trigger = $(trigger);
      var triggerId = this.$trigger.attr('aria-controls');
      this.$container = $("#" + triggerId);

      if (!this.$container) return; /* Exit if no disclosure container is found */

      // Get and store expanded state from trigger
      var expanded = this.$trigger.attr('aria-expanded');

      // If no expanded state exists on trigger, add for a11y
      if (!expanded) {
        this.$trigger.attr('aria-expanded', 'false');
      }

      // Capture additional alignment element
      var alignmentSelector = this.$container.data('align-to');
      if (alignmentSelector) {
        this.$alignmentElement = $(alignmentSelector);
      } else {
        this.$alignmentElement = this.$trigger;
      }

      var wrapper = this.$container.closest('[data-wrapper]');
      if (wrapper) {
        this.$wrapper = wrapper;
      }

      this.addDisclosureMenuEventListeners();
    },

    addDisclosureMenuEventListeners: function() {
      this.addListener(this.$trigger, 'click', function() {
        this.handleTriggerClick();
      });

      this.addListener(this.$container, 'keyup', function(event) {
        this.handleKeypress(event);
      });

      this.addListener(Garnish.$doc, 'mousedown', this.handleMousedown)
    },

    focusElement: function(direction) {
      var currentFocus = $(':focus');

      var focusable = this.$container.find(':focusable');

      var currentIndex = focusable.index(currentFocus);
      var newIndex;

      if (direction === 'prev') {
        newIndex = currentIndex - 1;
      } else {
        newIndex = currentIndex + 1;
      }

      if (newIndex >= 0 && newIndex < focusable.length) {
        var elementToFocus = focusable[newIndex];
        elementToFocus.focus();
      }
    },

    handleMousedown: function (event) {
      var newTarget = event.target;
      var newTargetIsInsideDisclosure = this.$container.has(newTarget).length > 0;

      // If click target matches trigger element or disclosure child, do nothing
      if (newTarget === this.$trigger.get(0) || newTargetIsInsideDisclosure) {
        return;
      }

      this.hide();
    },

    handleKeypress: function(event) {
      var keyCode = event.keyCode;
      
      switch (keyCode) {
        case Garnish.ESC_KEY:
          this.hide();
          this.$trigger.focus();
          break;
        case Garnish.RIGHT_KEY:
        case Garnish.DOWN_KEY:
          this.focusElement('next');
          break;
        case Garnish.LEFT_KEY:
        case Garnish.UP_KEY:
          this.focusElement('prev');
          break;
        default:
          break;
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
      if (this.isExpanded()) {
        return;
      }

      this.setContainerPosition();
      this.addListener(
        Garnish.$scrollContainer,
        'scroll',
        'setContainerPosition'
      );
      
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

    setContainerPosition: function () {
      this._windowWidth = Garnish.$win.width();
      this._windowHeight = Garnish.$win.height();
      this._windowScrollLeft = Garnish.$win.scrollLeft();
      this._windowScrollTop = Garnish.$win.scrollTop();

      this._alignmentElementOffset = this.$alignmentElement[0].getBoundingClientRect();

      this._wrapperElementOffset = this.$wrapper[0].getBoundingClientRect();

      this._triggerWidth = this.$trigger.outerWidth();

      this.$container.css('minWidth', 0);
      this.$container.css(
        'minWidth',
        this._triggerWidth -
          (this.$container.outerWidth() - this.$container.width())
      );

      this._menuWidth = this.$container.outerWidth();
      this._menuHeight = this.$container.outerHeight();

      // Is there room for the menu below the trigger?
      var topClearance = this._alignmentElementOffset.top,
        bottomClearance = this._windowHeight - this._alignmentElementOffset.bottom;

      // Find top/bottom offset relative to wrapper element
      var topAdjustment = this._alignmentElementOffset.top - this._wrapperElementOffset.top;
      var bottomAdjustment = this._alignmentElementOffset.bottom - this._wrapperElementOffset.bottom;

      var bottomClearanceExists = 
        bottomClearance >= this._menuHeight ||
        (topClearance < this._menuHeight && bottomClearance >= topClearance);
      
      if (bottomClearanceExists) {
        this.$container.css({
          top: 'calc(100% + ' + bottomAdjustment + 'px)',
          bottom: 'unset',
          maxHeight: bottomClearance - this.settings.windowSpacing,
        });
      } else {
        this.$container.css({
          bottom: 'calc(100% - ' + topAdjustment + 'px)',
          top: 'unset',
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
            (this._alignmentElementOffset.left + this._menuWidth),
          leftClearance = this._alignmentElementOffset.right - this._menuWidth;

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
      delete this._wrapperElementOffset;
      delete this._alignmentElementOffset;
      delete this._triggerWidth;
      delete this._triggerHeight;
      delete this._menuWidth;
      delete this._menuHeight;
    },

    _alignLeft: function () {
      var leftAdjustment = this._alignmentElementOffset.left - this._wrapperElementOffset.left;

      this.$container.css({
        right: 'unset',
        left: leftAdjustment + 'px',
      });
    },

    _alignRight: function () {
      var rightAdjustment = this._alignmentElementOffset.right - this._wrapperElementOffset.right;
      
      this.$container.css({
        left: 'unset',
        right: - rightAdjustment + 'px',
      });
    },

    _alignCenter: function () {
      var left = Math.round(this._triggerWidth / 2 - this._menuWidth / 2);
      var leftAdjustment = this._alignmentElementOffset.left - this._wrapperElementOffset.left;

      this.$container.css('left', left - leftAdjustment);
    },
  },
  {
    defaults: {
      windowSpacing: 5,
    },
  }
);
