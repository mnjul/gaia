'use strict';

/* global AppWindow, AppTransitionController */

(function(exports) {
  /**
   * This window inherits the AppWindow, and modifies some properties
   * different from the later.
   *
   * @class InputWindow
   * @param {OBject} configs The configuration of the input app
   * @augments AppWindow
   */
  var InputWindow = function(configs) {
    // note: properties in configs will become this[properties]
    configs.isInputMethod = true;
    configs.name = 'InputMethods';
    configs.url = configs.origin + configs.path;

    AppWindow.call(this, configs);

    // input keyboard transition was not supposed to have a timeout before,
    // so we give this a much higher tolerance
    this.transitionController.OPENING_TRANSITION_TIMEOUT = 5000;
    this.transitionController.CLOSING_TRANSITION_TIMEOUT = 5000;

    // when the app is OOM-kill'ed we need to know which input window reference
    // to delete, so keep track of the manifestURL
    this.browser.element.dataset.frameManifestURL = configs.manifestURL;

    // ui-test need this
    this.browser.element.dataset.frameName = configs.id;
  };

  /**
   * @borrows AppWindow.prototype as InputWindow.prototype
   * @memberof InputWindow
   */
  InputWindow.prototype = Object.create(AppWindow.prototype);

  InputWindow.prototype.constructor = InputWindow;

  InputWindow.REGISTERED_EVENTS = [];

  // use only the transition controller as the sub component
  InputWindow.SUB_COMPONENTS = {
    'transitionController': AppTransitionController
  };

  InputWindow.prototype.containerElement = document.getElementById('keyboards');

  InputWindow.prototype.view = function iw_view() {
    return '<div class=" ' + this.CLASS_LIST +
            ' " id="' + this.instanceID +
            '" transition-state="closed">' +
              '<div class="browser-container"></div>' +
           '</div>';
  };

  InputWindow.prototype.eventPrefix = 'input-app';

  /**
   * Different animation from the original window.
   *
   * @type string
   * @memberof InputWindow
   */
  InputWindow.prototype.openAnimation = 'slide-from-bottom';

  /**
   * Different animation from the original window.
   *
   * @type string
   * @memberof InputWindow
   */
  InputWindow.prototype.closeAnimation = 'slide-to-bottom';

  InputWindow.prototype._DEBUG = false;

  InputWindow.prototype.CLASS_LIST = 'inputWindow';
  InputWindow.prototype.CLASS_NAME = 'InputWindow';

  /**
   * Fired when the input app signals its readiness through window.resizeTo(),
   * which translates to mozbrowserresized;
   *  or
   * Fired when the input app wants to resize itself
   *
   * @event InputWindow#mozbrowserresize
   */
  InputWindow.prototype._handle_mozbrowserresize =
  function iw_handle_mozbrowserresize(evt) {

    var height = evt.detail.height;

    this.publish('ready', {height: height});

    if ('opened' === this.transitionController._transitionState) {
      this._setHeight(height);
      this.publish('heightchanged');
    } else if ('opening' === this.transitionController._transitionState) {
      this._setHeight(height);
    }

    evt.stopPropagation();
  };

  // wrap it so we can mock it for testing
  InputWindow.prototype._getDpx = function iw_getDpx() {
    return window.devicePixelRatio;
  };

  InputWindow.prototype._setHeight = function iw_setHeight(height) {
    // bug 1059683: when we're on a HiDPI device with non-integer 
    // devicePixelRatio the system may calculate (from available screen height
    // and keyboard height) the available height for current window/layout that
    // is a fraction smaller than the ideal value, which can result in a
    // 1-device-px gap between the current window/layout and keyboard, on such
    // devices. to mitigate this, the keyboard tries to report 1 less pixel of
    // height if it sees that the height of the keyboard is a fraction when
    // expressed in device pixel.

    var dpx = this._getDpx();
    if ((height * dpx) % 1 !== 0) {
      height = Math.floor(height * dpx) / dpx;
    }

    this.height = height;
  };

  // Set the input method activeness of this InputWindow:
  // - mozbrowserresize event (for the readiness of the input app)
  // - setVisible & setInputMethodActive
  // - styling classes
  InputWindow.prototype._setAsActiveInput =
  function iw_setAsActiveInput(active) {
    this.debug('setAsActiveInput: ' +
                this.browser.element.dataset.frameManifestURL +
                this.path + ', active: ' + active);

    this.setVisible(active);

    if (this.browser.element.setInputMethodActive) {
      this.browser.element.setInputMethodActive(active);
    }

    if (active) {
      this.browser.element.addEventListener('mozbrowserresize', this, true);
      this.element.classList.add('top-most');
    } else {
      this.browser.element.removeEventListener('mozbrowserresize', this, true);
      this.element.classList.remove('top-most');

      this.height = undefined;
    }
  };

  /**
   * Open the input window, optionally replacing the layout before doing so.
   *
   * @override
   * @param {Object} configs The configs of the layout
   * @memberof InputWindow
   */
  InputWindow.prototype.open = function iw_open(configs){
    var hashChanged = false;

    if (configs.hash !== this.hash) {
      this.browser.element.src = this.origin + this.pathInitial + configs.hash;
      this.debug(this.browser.element.frameName + ' is overwritten: ' +
                 this.browser.element.src);

      this.browser.element.dataset.frameName = configs.id;

      this.hash = configs.hash;

      hashChanged = true;
    }

    var onready = function iw_onready(evt){
      this.element.removeEventListener('_ready', onready);

      this._setHeight(evt.detail.height);

      AppWindow.prototype.open.call(this,
                                    configs.immediate ? 'immediate' : undefined
                                   );
    }.bind(this);

    this.element.addEventListener('_ready', onready);

    this._setAsActiveInput(true);

    // if we change the hash and we're currently closing, then we are currently
    // still the active input method (because setActive(false) is called at
    // |closed|), so setAsActiveInput(true) would do nothing. then
    // not triggering hashchange so we must trigger readyhandler
    // closing: setActiveInput won't do anything
    if (!hashChanged){
      if ('closing' === this.transitionController._transitionState){
        configs.immediate = true;
        this.publish('ready', {height: this.height});
      }
    }
  };

  exports.InputWindow = InputWindow;
})(window);
