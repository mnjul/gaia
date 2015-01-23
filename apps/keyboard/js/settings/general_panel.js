'use strict';

/* global ViewBase, GeneralSettingsGroupView, HandwritingSettingsGroupView */

(function(exports) {

var GeneralPanel = function(app) {
  ViewBase.apply(this);

  this._menuUDItem = null;

  this.app = app;
};

GeneralPanel.prototype = Object.create(ViewBase.prototype);

GeneralPanel.prototype.CONTAINER_ID = 'general';
GeneralPanel.prototype.USER_DICT_ITEM_ID = 'menu-userdict';

GeneralPanel.prototype.start = function() {
  ViewBase.prototype.start.call(this);

  this._menuUDItem = document.getElementById(this.USER_DICT_ITEM_ID);

  this.subViews.general = new GeneralSettingsGroupView(this.app);
  this.subViews.general.start();

  // We might not have handwriting settings
  if (typeof HandwritingSettingsGroupView === 'function') {
    this.subViews.handwriting = new HandwritingSettingsGroupView(this.app);
    this.subViews.handwriting.start();
  } else {
    // drop in a dummy View to avoid future if-then-else'.
    this.subViews.handwriting = new ViewBase();
    this.subViews.handwriting.start();
  }
};

GeneralPanel.prototype.stop = function() {
  ViewBase.prototype.stop.call(this);

  this._menuUDItem = null;

  this.subViews.general.stop();
  delete this.subViews.general;

  this.subViews.handwriting.stop();
  delete this.subViews.handwriting;
};

GeneralPanel.prototype.show = function() {
  this.container.querySelector('gaia-header').addEventListener('action', this);

  // we might not have user dict
  if (this._menuUDItem) {
    this._menuUDItem.addEventListener('click', this);
  }

  return ViewBase.prototype.show.call(this);
};

GeneralPanel.prototype.beforeHide = function() {
  this.container.querySelector('gaia-header')
    .removeEventListener('action', this);

  if (this._menuUDItem) {
    this._menuUDItem.removeEventListener('click', this);
  }

  return ViewBase.prototype.hide.call(this);
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
