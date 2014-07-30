'use strict';

(function(exports) {

  /**
   * KeyboardFrameManager manages all the iframe-related operations that
   * has to do with keyboard layouts. It receives a layout from KeyboardManager
   * and performs operations on the iframe associated with the layout (such that)
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

  };

  KeyboardFrameManager.prototype.handleEvent = function kfm_handleEvent(evt) {
    this._keyboardManager.resizeKeyboard(evt);
  };

  KeyboardFrameManager.prototype.setupFrameByLayout =
    function kfm_setupFrameByLayout(layout) {
    var frame = this.runningLayouts[layout.manifestURL][layout.id];
    frame.classList.remove('hide');
    this.setFrameActive(frame, true);
    frame.addEventListener('mozbrowserresize', this, true);
  };

  KeyboardFrameManager.prototype.resetFrameByLayout =
    function kfm_resetFrameByLayout(layout) {
    if (!layout) {
      return;
    }

    var frame = this.runningLayouts[layout.manifestURL][layout.id];

    if (!frame) {
      return;
    }

    frame.classList.add('hide');
    this.setFrameActive(frame, false);
    frame.removeEventListener('mozbrowserresize', this, true);
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

    this._keyboardManager.setHasActiveKeyboard(active);
  };

  KeyboardFrameManager.prototype.getLayoutFrameFromExistingKeyboard = 
    function kfm_getLayoutFrameFromExistingKeyboard(layout) {
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
        this.deleteRunningFrameRef(layout.manifestURL, name);
        this._keyboardManager.deleteRunningLayout(layout.manifestURL, name);
        break;
      }
    }
    return layoutFrame;
  };

  KeyboardFrameManager.prototype.initLayoutFrame = 
    function kfm_initLayoutFrame(layout) {

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

  KeyboardFrameManager.prototype.launchLayoutFrame = function km_launchLayoutFrame(layout) {
    if (this.isRunningLayout(layout)) {
      this._debug('this layout is running');
      return this.runningLayouts[layout.manifestURL][layout.id];
    }

    var layoutFrame = null;
    // The layout is in a keyboard app that has been launched.
    if (this.isRunningKeyboard(layout)) {
      // Re-use the iframe by changing its src.
      layoutFrame = this.getLayoutFrameFromExistingKeyboard(layout);
    }

    // Can't reuse, so create a new frame to load this new layout.
    if (!layoutFrame) {
      layoutFrame = this.loadKeyboardLayoutToFrame(layout);
      this.setFrameActive(layoutFrame, false);
      layoutFrame.classList.add('hide');
      layoutFrame.dataset.frameManifestURL = layout.manifestURL;
    }

    layoutFrame.dataset.frameName = layout.id;
    layoutFrame.dataset.framePath = layout.path;

    this.insertLayoutFrame(layout, layoutFrame);
    this._keyboardManager.insertRunningLayout(layout);
  };

  KeyboardFrameManager.prototype.isRunningKeyboard = function km_isRunningKeyboard(layout) {
    return this.runningLayouts.hasOwnProperty(layout.manifestURL);
  };

  KeyboardFrameManager.prototype.isRunningLayout = function kfm_isRunningLayout(layout) {
    if (!this.isRunningKeyboard(layout))
      return false;
    return this.runningLayouts[layout.manifestURL].hasOwnProperty(layout.id);
  };

  KeyboardFrameManager.prototype.loadKeyboardLayoutToFrame = function kfm_loadKeyboardLayoutToFrame(layout) {
    var keyboard = this.initLayoutFrame(layout);
    this._keyboardManager.keyboardFrameContainer.appendChild(keyboard);
    return keyboard;
  };

  KeyboardFrameManager.prototype.deleteRunningKeyboardRef = function kfm_deleteRunningKeyboardRef(kbManifestURL) {
    delete this.runningLayouts[kbManifestURL];
  };

  KeyboardFrameManager.prototype.deleteRunningFrameRef = function kfm_deleteRunningLayoutRef(kbManifestURL, layoutID) {
    delete this.runningLayouts[kbManifestURL][layoutID];
  };

  KeyboardFrameManager.prototype.insertLayoutFrame = function kfm_insertLayoutFrame(layout, layoutFrame) {
    if (!(layout.manifestURL in this.runningLayouts)) {
      this.runningLayouts[layout.manifestURL] = {};
    }

    this.runningLayouts[layout.manifestURL][layout.id] = layoutFrame;
  };

  KeyboardFrameManager.prototype.destroyFrame = function kfm_destroyFrame(kbManifestURL, layoutID) {
    var frame = this.runningLayouts[manifestURL][id];
    try {
      frame.parentNode.removeChild(frame);
    } catch (e) {
      // if it doesn't work, noone cares
    }
  };

  exports.KeyboardFrameManager = KeyboardFrameManager;

})(window);
