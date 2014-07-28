'use strict';

(function(exports) {

  /**
   * KeyboardFrameManager
   */
  var KeyboardFrameManager = function(keyboardManager) {
    this._keyboardManager = keyboardManager;
    this._showingFrame = undefined;
  };

  KeyboardFrameManager.prototype.start = function kfm_start() {

  };

  KeyboardFrameManager.prototype.stop = function kfm_stop() {
    this._showingFrame = undefined;
  };

  KeyboardFrameManager.prototype.resetShowingFrame = function kfm_resetShowingFrame() {
    // determine which showing frame it is right now
  };

  KeyboardFrameManager.prototype.resetFrame = function kfm_resetFrame(frame) {
    if (!frame) {
      return;
    }

    frame.classList.add('hide');
    this._keyboardManager.setLayoutFrameActive(frame, false);
    frame.removeEventListener('mozbrowserresize', this._keyboardManager, true);
  };


  exports.KeyboardFrameManager = KeyboardFrameManager;

})(window);
