'use strict';

/* global SettingsView, HandwritingPadSettings, ViewBase */

(function(exports) {

var HandwritingSettingsGroupView = function(app) {
  ViewBase.apply(this);

  this.app = app;
};

HandwritingSettingsGroupView.prototype = Object.create(ViewBase.prototype);

HandwritingSettingsGroupView.prototype.CONTAINER_ID = 'handwriting-settings';

HandwritingSettingsGroupView.prototype.start = function() {
  ViewBase.prototype.start.call(this);

  this.subViews.handwritingSettings =
    new SettingsView(this.app, this.container, HandwritingPadSettings);
  this.subViews.handwritingSettings.start();
};

HandwritingSettingsGroupView.prototype.stop = function() {
  ViewBase.prototype.stop.call(this);

  this.subViews.handwritingSettings.stop();
  delete this.subViews.handwritingSettings;
};

exports.HandwritingSettingsGroupView = HandwritingSettingsGroupView;

})(window);
