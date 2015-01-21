'use strict';

/* global PanelBase, ViewBase, GeneralSettingsGroupView,
          HandwritingSettingsGroupView */

(function(exports) {

var GeneralPanel = function(app) {
  this._menuUDItem = null;

  this.app = app;
};

GeneralPanel.prototype = Object.create(PanelBase.prototype);

GeneralPanel.prototype.CONTAINER_ID = 'general';
GeneralPanel.prototype.USER_DICT_ITEM_ID = 'menu-userdict';

GeneralPanel.prototype.start = function() {
  PanelBase.prototype.start.call(this);

  this._menuUDItem = document.getElementById(this.USER_DICT_ITEM_ID);

  this.views.general = new GeneralSettingsGroupView(this.app);
  this.views.general.start();

  // We might not have handwriting settings
  if (typeof HandwritingSettingsGroupView === 'function') {
    this.views.handwriting = new HandwritingSettingsGroupView(this.app);
    this.views.handwriting.start();
  } else {
    // drop in a dummy View to avoid future if-then-else'.
    this.views.handwriting = new ViewBase();
    this.views.handwriting.start();
  }
};

GeneralPanel.prototype.stop = function() {
  PanelBase.prototype.stop.call(this);

  this._menuUDItem = null;

  this.views.general.stop();
  delete this.views.general;

  this.views.handwriting.stop();
  delete this.views.handwriting;
};

GeneralPanel.prototype.show = function() {
  this.container.querySelector('gaia-header').addEventListener('action', this);

  // we might not have user dict
  if (this._menuUDItem) {
    this._menuUDItem.addEventListener('click', this);
  }

  return PanelBase.prototype.show.call(this);
};

GeneralPanel.prototype.beforeHide = function() {
  this.container.querySelector('gaia-header')
    .removeEventListener('action', this);

  if (this._menuUDItem) {
    this._menuUDItem.removeEventListener('click', this);
  }

  return PanelBase.prototype.hide.call(this);
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
