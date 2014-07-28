'use strict';

(function(exports) {

  /**
   * KeyboardFrameManager
   */
  var KeyboardFrameManager = function(keyboardManager) {
    this._keyboardManager = keyboardManager;
    this._showingFrame = undefined;

    // The set of running keyboards.
    // This is a map from keyboard manifestURL to an object like this:
    // 'keyboard.gaiamobile.org/manifest.webapp' : {
    //   'English': aIframe
    // }

    this.runningLayouts = {};
  };

  KeyboardFrameManager.prototype.start = function kfm_start() {

  };

  KeyboardFrameManager.prototype.stop = function kfm_stop() {
    this._showingFrame = undefined;
  };

  KeyboardFrameManager.prototype.assignShowingFrame =
    function kfm_assignShowingFrame(frame) {
    this._showingFrame = frame;
  };

  KeyboardFrameManager.prototype.resetShowingFrame =
    function kfm_resetShowingFrame() {
    this.uninitFrame(this._showingFrame);
  };

  KeyboardFrameManager.prototype.retrieveShowingFrame =
    function kfm_retrieveShowingFrame() {
    return this._showingFrame;
  };

  KeyboardFrameManager.prototype.initFrame = function kfm_initFrame(frame) {
    frame.classList.remove('hide');
    this._keyboardManager.setLayoutFrameActive(frame, true);
    frame.addEventListener('mozbrowserresize', this._keyboardManager, true);
  };

  KeyboardFrameManager.prototype.uninitFrame = function kfm_uninitFrame(frame) {
    if (!frame) {
      return;
    }

    frame.classList.add('hide');
    this._keyboardManager.setLayoutFrameActive(frame, false);
    frame.removeEventListener('mozbrowserresize', this._keyboardManager, true);
  };

  exports.KeyboardFrameManager = KeyboardFrameManager;

})(window);
