'use strict';

(function(exports) {

  /**
   * KeyboardFrameManager
   */
  var KeyboardFrameManager = function(keyboardManager) {
    this._keyboardManager = keyboardManager;

    // The set of running keyboards.
    // This is a map from keyboard manifestURL to an object like this:
    // 'keyboard.gaiamobile.org/manifest.webapp' : {
    //   'English': aIframe
    // }

    this.runningLayouts = {};

    this._onDebug = false;
  };

  KeyboardFrameManager.prototype._debug = function kfm__debug(msg) {
    if (this._onDebug) {
      console.log('[Keyboard Manager] ' + msg);
    }
  },

  KeyboardFrameManager.prototype.start = function kfm_start() {

  };

  KeyboardFrameManager.prototype.stop = function kfm_stop() {
    this._showingFrame = undefined;
  };

  KeyboardFrameManager.prototype.initFrame = function kfm_initFrame(frame) {
    frame.classList.remove('hide');
    this.setFrameActive(frame, true);
    frame.addEventListener('mozbrowserresize', this._keyboardManager, true);
  };

  KeyboardFrameManager.prototype.initFrameByLayout =
    function kfm_initFrameByLayout(layout) {
    // console.trace();
    var frame = this.runningLayouts[layout.manifestURL][layout.id];
    this.initFrame(frame);
  };

  KeyboardFrameManager.prototype.uninitFrame = function kfm_uninitFrame(frame) {
    if (!frame) {
      return;
    }

    frame.classList.add('hide');
    this.setFrameActive(frame, false);
    frame.removeEventListener('mozbrowserresize', this._keyboardManager, true);
  };

  KeyboardFrameManager.prototype.uninitFrameByLayout =
    function kfm_uninitFrameByLayout(layout) {
    var frame = this.runningLayouts[layout.manifestURL][layout.id];
    this.uninitFrame(frame);
  };

  // XXX: outside user of this function should be abstracted
  KeyboardFrameManager.prototype.getFrameByLayout =
    function kfm_getFrameByLayout(layout) {
    if (!layout) {
      return null;
    }
    return this.runningLayouts[layout.manifestURL][layout.id];
  };

  KeyboardFrameManager.prototype.setLayoutFrameActive =
    function kfm_setLayoutFrameActive(layout, active) {
    var frame = this.runningLayouts[layout.manifestURL][layout.id];

    this.setFrameActive(frame, active);
  };

  KeyboardFrameManager.prototype.setFrameActive =
    function kfm_setFrameActive(frame, active) {
    this._debug('setFrameActive: ' +
                frame.dataset.frameManifestURL +
                frame.dataset.framePath + ', active: ' + active);

    if (frame.setVisible) {
      frame.setVisible(active);
    }
    if (frame.setInputMethodActive) {
      frame.setInputMethodActive(active);
    }

    // XXX: decouple this
    this._keyboardManager.hasActiveKeyboard = active;
  };

  // XXX: maybe change name?
  KeyboardFrameManager.prototype.getNewLayoutFrameFromOldKeyboard = 
    function kfm_getNewLayoutFrameFromOldKeyboard(layout) {
      var layoutFrame = null;
      var runningKeybaord = this.runningLayouts[layout.manifestURL];
      for (var name in runningKeybaord) {
        var oldPath = runningKeybaord[name].dataset.framePath;
        var newPath = layout.path;
        if (oldPath.substring(0, oldPath.indexOf('#')) ===
            newPath.substring(0, newPath.indexOf('#'))) {
          layoutFrame = runningKeybaord[name];
          layoutFrame.src = layout.origin + newPath;
          this._debug(name + ' is overwritten: ' + layoutFrame.src);
          delete runningKeybaord[name];
          // XXX: decouple this
          delete this._keyboardManager.runningLayouts[layout.manifestURL][name];
          break;
        }
      }
      return layoutFrame;
  };

  exports.KeyboardFrameManager = KeyboardFrameManager;

})(window);
