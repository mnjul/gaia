'use strict';

/* global SettingsView, HandwritingPadSettings, ViewBase */

(function(exports) {

var HandwritingSettingsGroupView = function(app) {
  this.app = app;

  this.container = null;
  this.handwritingSettingsView = null;
};

HandwritingSettingsGroupView.prototype = Object.create(ViewBase.prototype);

HandwritingSettingsGroupView.prototype.VIEW_ID = 'handwriting-settings';

HandwritingSettingsGroupView.prototype.start = function() {
  var container = this.container = document.getElementById(this.VIEW_ID);

  this.handwritingSettingsView =
    new SettingsView(this.app, container, HandwritingPadSettings);
  this.handwritingSettingsView.start();
};

HandwritingSettingsGroupView.prototype.stop = function() {
  this.container = null;
  this.handwritingSettingsView.stop();
  this.handwritingSettingsView = null;
};

exports.HandwritingSettingsGroupView = HandwritingSettingsGroupView;

})(window);
