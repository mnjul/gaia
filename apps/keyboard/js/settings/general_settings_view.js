'use strict';

/* global SettingsView, ViewBase,
          SoundFeedbackSettings, VibrationFeedbackSettings, IMEngineSettings */

(function(exports) {

var GeneralSettingsGroupView = function GeneralSettingsGroupView(app) {
  ViewBase.apply(this);

  this.app = app;
};

GeneralSettingsGroupView.prototype = Object.create(ViewBase.prototype);

GeneralSettingsGroupView.prototype.CONTAINER_ID = 'general-settings';

GeneralSettingsGroupView.prototype.start = function() {
  ViewBase.prototype.start.call(this);

  this.subViews.soundFeedbackSettings =
    new SettingsView(this.app, this.container, SoundFeedbackSettings);
  this.subViews.soundFeedbackSettings.start();

  this.subViews.vibrationFeedbackSettings =
    new SettingsView(this.app, this.container, VibrationFeedbackSettings);
  this.subViews.vibrationFeedbackSettings.start();

  this.subViews.imEngineSettings =
    new SettingsView(this.app, this.container, IMEngineSettings);
  this.subViews.imEngineSettings.start();
};

GeneralSettingsGroupView.prototype.stop = function() {
  ViewBase.prototype.stop.call(this);

  this.subViews.soundFeedbackSettings.stop();
  delete this.subViews.soundFeedbackSettings;

  this.subViews.vibrationFeedbackSettings.stop();
  delete this.subViews.vibrationFeedbackSettings;

  this.subViews.imEngineSettings.stop();
  delete this.subViews.imEngineSettings;
};

exports.GeneralSettingsGroupView = GeneralSettingsGroupView;

})(window);
