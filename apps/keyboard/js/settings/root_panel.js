'use strict';

/* global GeneralSettingsGroupView, HandwritingSettingsGroupView */

(function(exports) {

var RootPanel = function(app) {
  this._initialized= false;

  this._container = null;
  this._menuUDItem = null;

  this.app = app;

  this._generalSettingsGroupView = null;
  this._handwritingSettingsGroupView = null;
};

RootPanel.prototype.CONTAINER_ID = 'root';

RootPanel.prototype.init = function() {
  this._initialized = true;

  this._container = document.getElementById(this.CONTAINER_ID);

  this._menuUDItem = document.getElementById('menu-userdict');

  this.generalSettingsGroupView = new GeneralSettingsGroupView(this.app);
  this.generalSettingsGroupView.init();

  // We might not have handwriting settings
  if (typeof HandwritingSettingsGroupView === 'function') {
    this.handwritingSettingsGroupView =
      new HandwritingSettingsGroupView(this.app);
    this.handwritingSettingsGroupView.init();
  }
};

RootPanel.prototype.uninit = function() {
  this._initialized = false;
  this._container = null;
  this._menuUDItem = null;

  this.generalSettingsGroupView.uninit();
  this.generalSettingsGroupView = null;

  if (this.handwritingSettingsGroupView) {
    this.handwritingSettingsGroupView.uninit();
    this.handwritingSettingsGroupView = null;
  }
};

RootPanel.prototype.beforeShow = function() {
  if (!this._initialized) {
    this.init();
  }
};

RootPanel.prototype.show = function() {
  this.generalSettingsGroupView.start();

  if (this.handwritingSettingsGroupView) {
    this.handwritingSettingsGroupView.start();
  }

  this._container.querySelector('gaia-header').addEventListener('action', this);

  // we might not have user dict
  if (this._menuUDItem) {
    this._menuUDItem.addEventListener('click', this);
  }
};

RootPanel.prototype.beforeHide = function() {
  this.generalSettingsGroupView.stop();

  if (this.handwritingSettingsGroupView) {
    this.handwritingSettingsGroupView.stop();
  }

  this._container.querySelector('gaia-header')
    .removeEventListener('action', this);

  if (this._menuUDItem) {
    this._menuUDItem.removeEventListener('click', this);
  }
};

RootPanel.prototype.hide = function() {
};

RootPanel.prototype.handleEvent = function(evt) {
  switch (evt.type) {
    case 'action':
      this.app.requestClose();
      break;

    case 'click':
      this.app.panelController.navigateToPanel(
        this.app.userDictionaryListPanel
      );
      evt.preventDefault();
      break;
  }
};

exports.RootPanel = RootPanel;

})(window);
