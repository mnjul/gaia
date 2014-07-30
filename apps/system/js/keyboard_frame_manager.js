'use strict';

(function(exports) {

  /**
   * KeyboardFrameManager manages all the iframe-related operations that
   * has to do with keyboard layouts. It receives a layout from KeyboardManager
   * and performs operations on the iframe associated with the layout, such that
   * KeyboardManager does not have to be concerned about the inner mechanisms
   * of a keyboard iframe.
   */
  var KeyboardFrameManager = function(keyboardManager) {
    this._keyboardManager = keyboardManager;

    // The set of running keyboards.
    // This is a map from keyboard manifestURL to an object like this:
    // 'keyboard.gaiamobile.org/manifest.webapp' : {
    //   'English': aIframe
    // }

    this._runningLayouts = {};

    this._onDebug = false;
  };

  KeyboardFrameManager.prototype._debug = function kfm__debug(msg) {
    if (this._onDebug) {
      console.log('[Keyboard Manager] ' + msg);
    }
  };

  KeyboardFrameManager.prototype.start = function kfm_start() {

  };

  KeyboardFrameManager.prototype.stop = function kfm_stop() {

  };

  KeyboardFrameManager.prototype.handleEvent = function kfm_handleEvent(evt) {
    this._keyboardManager.resizeKeyboard(evt);
  };

  KeyboardFrameManager.prototype.setupFrame = function kfm_setupFrame(layout) {
    var frame = this._runningLayouts[layout.manifestURL][layout.id];
    frame.classList.remove('hide');
    this._setFrameActive(frame, true);
    frame.addEventListener('mozbrowserresize', this, true);
  };

  KeyboardFrameManager.prototype.resetFrame = function kfm_resetFrame(layout) {
    if (!layout) {
      return;
    }

    var frame = this._runningLayouts[layout.manifestURL][layout.id];

    if (!frame) {
      return;
    }

    frame.classList.add('hide');
    this._setFrameActive(frame, false);
    frame.removeEventListener('mozbrowserresize', this, true);
  };

  KeyboardFrameManager.prototype._setFrameActive =
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

    this._keyboardManager.setHasActiveKeyboard(active);
  };

  KeyboardFrameManager.prototype.launchFrame = function km_launchFrame(layout) {
    if (this._isRunningLayout(layout)) {
      this._debug('this layout is running');
      return this._runningLayouts[layout.manifestURL][layout.id];
    }

    var frame = null;
    // The layout is in a keyboard app that has been launched.
    if (this._isRunningKeyboard(layout)) {
      // Re-use the iframe by changing its src.
      frame = this._getFrameFromExistingKeyboard(layout);
    }

    // Can't reuse, so create a new frame to load this new layout.
    if (!frame) {
      frame = this._loadKeyboardLayoutToFrame(layout);
      this._setFrameActive(frame, false);
      frame.classList.add('hide');
      frame.dataset.frameManifestURL = layout.manifestURL;
    }

    frame.dataset.frameName = layout.id;
    frame.dataset.framePath = layout.path;

    this._insertFrameRef(layout, frame);
  };

  KeyboardFrameManager.prototype._loadKeyboardLayoutToFrame =
    function kfm__loadKeyboardLayoutToFrame(layout) {
    var keyboard = this._constructFrame(layout);
    this._keyboardManager.keyboardFrameContainer.appendChild(keyboard);
    return keyboard;
  };

  KeyboardFrameManager.prototype._constructFrame =
    function kfm__constructFrame(layout) {

    // Generate a <iframe mozbrowser> containing the keyboard.
    var keyboard = document.createElement('iframe');
    keyboard.src = layout.origin + layout.path;
    keyboard.setAttribute('mozapptype', 'inputmethod');
    keyboard.setAttribute('mozbrowser', 'true');
    keyboard.setAttribute('mozpasspointerevents', 'true');
    keyboard.setAttribute('mozapp', layout.manifestURL);

    var manifest =
      window.applications.getByManifestURL(layout.manifestURL).manifest;
    var isCertifiedApp = (manifest.type === 'certified');

    // oop is always enabled for non-certified app,
    // and optionally enabled to certified apps if
    // available memory is more than 512MB.
    if (this._keyboardManager.isOutOfProcessEnabled &&
        (!isCertifiedApp || this._keyboardManager.totalMemory >= 512)) {
      console.log('=== Enable keyboard: ' + layout.origin + ' run as OOP ===');
      keyboard.setAttribute('remote', 'true');
      keyboard.setAttribute('ignoreuserfocus', 'true');
    }

    return keyboard;
  };

  KeyboardFrameManager.prototype._getFrameFromExistingKeyboard =
    function kfm__getFrameFromExistingKeyboard(layout) {
    var frame = null;
    var runningKeybaord = this._runningLayouts[layout.manifestURL];
    for (var name in runningKeybaord) {
      var oldPath = runningKeybaord[name].dataset.framePath;
      var newPath = layout.path;
      if (oldPath.substring(0, oldPath.indexOf('#')) ===
          newPath.substring(0, newPath.indexOf('#'))) {
        frame = runningKeybaord[name];
        frame.src = layout.origin + newPath;
        this._debug(name + ' is overwritten: ' + frame.src);
        this.deleteRunningFrameRef(layout.manifestURL, name);
        this._keyboardManager.deleteRunningLayout(layout.manifestURL, name);
        break;
      }
    }
    return frame;
  };

  KeyboardFrameManager.prototype.destroyFrame =
    function kfm_destroyFrame(kbManifestURL, layoutID) {
    var frame = this._runningLayouts[kbManifestURL][layoutID];
    try {
      frame.parentNode.removeChild(frame);
    } catch (e) {
      // if it doesn't work, noone cares
    }
  };

  KeyboardFrameManager.prototype._insertFrameRef =
    function kfm__insertFrameRef(layout, frame) {
    if (!(layout.manifestURL in this._runningLayouts)) {
      this._runningLayouts[layout.manifestURL] = {};
    }

    this._runningLayouts[layout.manifestURL][layout.id] = frame;
  };

  KeyboardFrameManager.prototype.deleteRunningKeyboardRef =
    function kfm_deleteRunningKeyboardRef(kbManifestURL) {
    delete this._runningLayouts[kbManifestURL];
  };

  KeyboardFrameManager.prototype.deleteRunningFrameRef =
    function kfm_deleteRunningLayoutRef(kbManifestURL, layoutID) {
    delete this._runningLayouts[kbManifestURL][layoutID];
  };

  KeyboardFrameManager.prototype._isRunningKeyboard =
    function km__isRunningKeyboard(layout) {
    return this._runningLayouts.hasOwnProperty(layout.manifestURL);
  };

  KeyboardFrameManager.prototype._isRunningLayout =
    function kfm__isRunningLayout(layout) {
    if (!this._isRunningKeyboard(layout)) {
      return false;
    }
    return this._runningLayouts[layout.manifestURL].hasOwnProperty(layout.id);
  };

  exports.KeyboardFrameManager = KeyboardFrameManager;

})(window);
