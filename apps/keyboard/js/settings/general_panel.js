'use strict';

/* global GeneralSettingsGroupView, HandwritingSettingsGroupView */

(function(exports) {

var GeneralPanel = function(app) {
  this._started= false;

  this.container = null;
  this._menuUDItem = null;

  this.app = app;

  this._generalSettingsGroupView = null;
  this._handwritingSettingsGroupView = null;
};

GeneralPanel.prototype.CONTAINER_ID = 'general';
GeneralPanel.prototype.USER_DICT_ITEM_ID = 'menu-userdict';

GeneralPanel.prototype.start = function() {
  this._started = true;

  this.container = document.getElementById(this.CONTAINER_ID);

  this._menuUDItem = document.getElementById(this.USER_DICT_ITEM_ID);

  this.generalSettingsGroupView = new GeneralSettingsGroupView(this.app);
  this.generalSettingsGroupView.start();

  // We might not have handwriting settings
  if (typeof HandwritingSettingsGroupView === 'function') {
    this.handwritingSettingsGroupView =
      new HandwritingSettingsGroupView(this.app);
    this.handwritingSettingsGroupView.start();
  }
};

GeneralPanel.prototype.stop = function() {
  this._started = false;
  this.container = null;
  this._menuUDItem = null;

  this.generalSettingsGroupView.stop();
  this.generalSettingsGroupView = null;

  if (this.handwritingSettingsGroupView) {
    this.handwritingSettingsGroupView.stop();
    this.handwritingSettingsGroupView = null;
  }
};

GeneralPanel.prototype.beforeShow = function() {
  if (!this._started) {
    this.start();
  }
};

GeneralPanel.prototype.show = function() {
  this.container.querySelector('gaia-header').addEventListener('action', this);

  // we might not have user dict
  if (this._menuUDItem) {
    this._menuUDItem.addEventListener('click', this);
  }
};

GeneralPanel.prototype.beforeHide = function() {
  this.container.querySelector('gaia-header')
    .removeEventListener('action', this);

  if (this._menuUDItem) {
    this._menuUDItem.removeEventListener('click', this);
  }
};

GeneralPanel.prototype.hide = function() {
};

GeneralPanel.prototype.handleEvent = function(evt) {
  switch (evt.type) {
    case 'action':
      this.app.requestClose();
      break;

    case 'click':
      this.app.panelController.navigateToPanel(
        this.app.panelController.userDictionaryListPanel
      );
      evt.preventDefault();
      break;
  }
};

exports.GeneralPanel = GeneralPanel;

})(window);
