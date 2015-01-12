'use strict';

/* global SettingsView, HandwritingPadSettings */

(function(exports) {

var HandwritingSettingsGroupView = function(app) {
  this.app = app;

  this.container = null;
  this.handwritingSettingsView = null;
};

HandwritingSettingsGroupView.prototype.PANEL_ID = 'handwriting-settings';

HandwritingSettingsGroupView.prototype.init = function() {
  var container = this.container = document.getElementById(this.PANEL_ID);

  this.handwritingSettingsView =
    new SettingsView(this.app, container, HandwritingPadSettings);
  this.handwritingSettingsView.init();
};

HandwritingSettingsGroupView.prototype.start = function() {
  this.handwritingSettingsView.start();
};

HandwritingSettingsGroupView.prototype.stop = function() {
  this.handwritingSettingsView.stop();
};

HandwritingSettingsGroupView.prototype.uninit = function() {
  this.container = null;
  this.handwritingSettingsView.uninit();
  this.handwritingSettingsView = null;
};

exports.HandwritingSettingsGroupView = HandwritingSettingsGroupView;

})(window);
