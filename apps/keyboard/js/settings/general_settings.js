'use strict';

/* global SettingsView,
          SoundFeedbackSettings, VibrationFeedbackSettings, IMEngineSettings */

(function(exports) {

var GeneralSettingsGroupView = function GeneralSettingsGroupView(app) {
  this.app = app;

  this.container = null;
  this.soundFeedbackSettingsView = null;
  this.vibrationFeedbackSettingsView = null;
  this.imEngineSettingsView = null;
};

GeneralSettingsGroupView.prototype.PANEL_ID = 'general-settings';

GeneralSettingsGroupView.prototype.init = function() {
  var container = this.container = document.getElementById(this.PANEL_ID);

  this.soundFeedbackSettingsView =
    new SettingsView(this.app, container, SoundFeedbackSettings);
  this.soundFeedbackSettingsView.init();

  this.vibrationFeedbackSettingsView =
    new SettingsView(this.app, container, VibrationFeedbackSettings);
  this.vibrationFeedbackSettingsView.init();

  this.imEngineSettingsView =
    new SettingsView(this.app, container, IMEngineSettings);
  this.imEngineSettingsView.init();
};

GeneralSettingsGroupView.prototype.start = function() {
  this.soundFeedbackSettingsView.start();
  this.vibrationFeedbackSettingsView.start();
  this.imEngineSettingsView.start();
};

GeneralSettingsGroupView.prototype.stop = function() {
  this.soundFeedbackSettingsView.stop();
  this.vibrationFeedbackSettingsView.stop();
  this.imEngineSettingsView.stop();
};

GeneralSettingsGroupView.prototype.uninit = function() {
  this.container = null;
  this.soundFeedbackSettingsView.uninit();
  this.soundFeedbackSettingsView = null;
  this.vibrationFeedbackSettingsView.uninit();
  this.vibrationFeedbackSettingsView = null;
  this.imEngineSettingsView.uninit();
  this.imEngineSettingsView = null;
};

exports.GeneralSettingsGroupView = GeneralSettingsGroupView;

})(window);
