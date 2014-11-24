'use strict';

/* global SettingsPromiseManager, CloseLockManager, UserDictionaryView,
          GeneralSettingsGroupView, HandwritingSettingsGroupView,
          MozActivity */

(function(exports) {

var KeyboardSettingsApp = function KeyboardSettingsApp() {
  this.closeLockManager = null;
  this.generalSettingsGroupView = null;
  this.handwritingSettingsGroupView = null;
  this.userDictionaryView = null;

  this._closeLock = null;
};

KeyboardSettingsApp.prototype.start = function() {
  this.closeLockManager = new CloseLockManager();
  this.closeLockManager.start();

  // SettingsPromiseManager wraps Settings DB methods into promises.
  // This must be available to *GroupView.
  this.settingsPromiseManager = new SettingsPromiseManager();

  this.generalSettingsGroupView = new GeneralSettingsGroupView(this);
  this.generalSettingsGroupView.start();

  this.userDictionaryView = new UserDictionaryView(this);
  this.userDictionaryView.start();

  // We might not have handwriting settings
  if (typeof HandwritingSettingsGroupView === 'function') {
    this.handwritingSettingsGroupView = new HandwritingSettingsGroupView(this);
    this.handwritingSettingsGroupView.start();
  }

  // |action| evt doesn't bubble, so let's iterate one by one
  for (var header of document.getElementsByTagName('gaia-header')) {
    header.addEventListener('action', this);
  }

  document.addEventListener('visibilitychange', this);

  document.getElementById('menu-userdict').addEventListener('click', this);
};

KeyboardSettingsApp.prototype.stop = function() {
  this.closeLockManager.stop();
  this.closeLockManager = null;

  this.settingsPromiseManager = null;

  this.generalSettingsGroupView.stop();
  this.generalSettingsGroupView = null;

  if (this.handwritingSettingsGroupView) {
    this.handwritingSettingsGroupView.stop();
    this.handwritingSettingsGroupView = null;
  }

  for (var header of document.getElementsByTagName('gaia-header')) {
    header.removeEventListener('action', this);
  }

  document.removeEventListener('visibilitychange', this);

  document.getElementById('menu-userdict').removeEventListener('click', this);
};

KeyboardSettingsApp.prototype.handleEvent = function(evt) {
  var target = evt.target;
  switch (evt.type) {
    case 'action':
      if ('root-header' === target.id) {
        // Until Haida lands this is how users could go back to Settings app
        Promise.resolve(new MozActivity({
          name: 'moz_configure_window',
          data: { target: 'device' }
        })).catch(function(e) {
          console.error(e);
        });
      } else {
        this.navigatePanel(target.dataset.href.substring(1));
      }

      break;

    case 'visibilitychange':
      if (document.hidden) {
        this._closeLock =
          this.closeLockManager.requestLock('requestClose');
      } else if (this._closeLock) {
        this._closeLock.unlock();
        this._closeLock = null;
      }

      break;

    case 'click':
      this.navigatePanel(evt.currentTarget.getAttribute('href').substring(1));
      evt.preventDefault();
  }
};

KeyboardSettingsApp.prototype.navigatePanel = function(target, param) {
  // we only have three panels for now, let's use if-then-else for a simple
  // state transition implementation
  var current = document.body.dataset.activePanel;
  if ('root' === current && 'ud-wordlist' === target) {
    this.userDictionaryView.populate();
  } else if ('ud-editword' === target) {
    this.userDictionaryView.editView.reinit(param);
  }

  document.body.dataset.activePanel = target;
};

exports.KeyboardSettingsApp = KeyboardSettingsApp;

})(window);
