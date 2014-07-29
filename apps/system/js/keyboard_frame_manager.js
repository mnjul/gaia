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

  KeyboardFrameManager.prototype.handleEvent = function kfm_handleEvent(evt) {
    this._keyboardManager.resizeKeyboard(evt);
  };

  KeyboardFrameManager.prototype.initFrame = function kfm_initFrame(frame) {
    frame.classList.remove('hide');
    this.setFrameActive(frame, true);
    frame.addEventListener('mozbrowserresize', this, true);
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
    frame.removeEventListener('mozbrowserresize', this, true);
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

  // XXX: rename this to "initFrameFromLayout"
  KeyboardFrameManager.prototype.generateLayoutFrame = 
    function kfm_generateLayoutFrame(layout) {

    var layoutFrame = null;
    // The layout is in a keyboard app that has been launched.
    if (this.isRunningKeyboard(layout)) {
      // Re-use the iframe by changing its src.
      layoutFrame = this.getNewLayoutFrameFromOldKeyboard(layout);
    }

    // Can't reuse, so create a new frame to load this new layout.
    if (!layoutFrame) {
      layoutFrame = this.loadKeyboardLayout(layout);
      // TODO make sure setLayoutFrameActive function is ready
      this.setFrameActive(layoutFrame, false);
      layoutFrame.classList.add('hide');
      layoutFrame.dataset.frameManifestURL = layout.manifestURL;
    }

    layoutFrame.dataset.frameName = layout.id;
    layoutFrame.dataset.framePath = layout.path;

    if (!(layout.manifestURL in this.runningLayouts)) {
      this.runningLayouts[layout.manifestURL] = {};
    }

    this.runningLayouts[layout.manifestURL][layout.id] =
      layoutFrame;

    return layoutFrame;
  };

  // XXX: this should be the actual generateLayoutFrame !
  KeyboardFrameManager.prototype.generateLayoutFrame2 = 
    function kfm_generateLayoutFrame2(layout) {

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

  // XXX: move KM's runningLayouts back to KM
  KeyboardFrameManager.prototype.launchLayoutFrame = function km_launchLayoutFrame(layout) {
    if (this.isRunningLayout(layout)) {
      this._debug('this layout is running');
      return this.runningLayouts[layout.manifestURL][layout.id];
    }

    var layoutFrame = this.generateLayoutFrame(layout);

    if (!(layout.manifestURL in this._keyboardManager.runningLayouts)) {
      this._keyboardManager.runningLayouts[layout.manifestURL] = {};
    }

    this._keyboardManager.runningLayouts[layout.manifestURL][layout.id] = '';

    return layoutFrame;
  },

  KeyboardFrameManager.prototype.isRunningKeyboard = function km_isRunningKeyboard(layout) {
    return this.runningLayouts.hasOwnProperty(layout.manifestURL);
  },

  KeyboardFrameManager.prototype.isRunningLayout = function kfm_isRunningLayout(layout) {
    if (!this.isRunningKeyboard(layout))
      return false;
    return this.runningLayouts[layout.manifestURL].hasOwnProperty(layout.id);
  },

  KeyboardFrameManager.prototype.loadKeyboardLayout = function kfm_loadKeyboardLayout(layout) {
    var keyboard = this.generateLayoutFrame2(layout);
    this._keyboardManager.keyboardFrameContainer.appendChild(keyboard);
    return keyboard;
  },

  exports.KeyboardFrameManager = KeyboardFrameManager;

})(window);
