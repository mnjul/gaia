'use strict';

/* global SettingsPromiseManager, CloseLockManager, UserDictionaryListPanel,
          GeneralPanel, DialogController, MozActivity, PanelController,
          UserDictionaryEditDialog */

(function(exports) {

var KeyboardSettingsApp = function KeyboardSettingsApp() {
  this.closeLockManager = null;

  // the existence of UserDictionaryListPanel is indicative of the suport for
  // userdict.
  // let's keep the reference of panels here for now.
  this.panelController = null;
  this.dialogController = null;
  this.generalPanel = null;
  this.userDictionaryListPanel = null;
  this.userDictionaryEditDialog = null;

  this._closeLock = null;
};

KeyboardSettingsApp.prototype.start = function() {
  this.closeLockManager = new CloseLockManager();
  this.closeLockManager.onclose = this.close.bind(this);
  this.closeLockManager.start();

  // SettingsPromiseManager wraps Settings DB methods into promises.
  // This must be available to *GroupView.
  this.settingsPromiseManager = new SettingsPromiseManager();

  this.generalPanel = new GeneralPanel(this);

  this.panelController = new PanelController(this.generalPanel);
  this.panelController.start();

  this.dialogController = new DialogController();
  this.dialogController.start();

  // We support user dictionary!
  if (typeof UserDictionaryListPanel === 'function') {
    this.userDictionaryListPanel = new UserDictionaryListPanel(this);
    this.userDictionaryEditDialog = new UserDictionaryEditDialog();
  }

  document.addEventListener('visibilitychange', this);
};

KeyboardSettingsApp.prototype.stop = function() {
  this.closeLockManager.stop();
  this.closeLockManager = null;

  this.settingsPromiseManager = null;

  this.panelController.stop();
  this.panelController = null;

  this.generalPanel.uninit();
  this.generalPanel = null;

  this.dialogController.stop();
  this.dialogController = null;

  if (this.UserDictionaryListPanel) {
    this.userDictionaryListPanel.uninit();
    this.userDictionaryListPanel = null;

    this.userDictionaryEditDialog.uninit();
    this.userDictionaryEditDialog = null;
  }

  document.removeEventListener('visibilitychange', this);
};

KeyboardSettingsApp.prototype.close = function() {
  this.stop();
  window.close();
};

KeyboardSettingsApp.prototype.requestClose = function() {
  // Until Haida lands this is how users could go back to Settings app
  Promise.resolve(new MozActivity({
    name: 'moz_configure_window',
    data: { target: 'device' }
  })).catch(function(e) {
    console.error(e);
  });
};

KeyboardSettingsApp.prototype.handleEvent = function(evt) {
  if (document.hidden) {
    this._closeLock =
      this.closeLockManager.requestLock('requestClose');
  } else if (this._closeLock) {
    this._closeLock.unlock();
    this._closeLock = null;
  }
};

exports.KeyboardSettingsApp = KeyboardSettingsApp;

})(window);
