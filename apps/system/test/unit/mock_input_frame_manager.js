'use strict';

(function(exports) {
  var MockInputFrameManager = function() {
    return this;
  };

  MockInputFrameManager.prototype = {
    start: function mifm_start() {
    },

    stop: function mifm_stop() {
    },

    handleEvent: function mifm_handleEvent() {
    },

    setupFrame: function mifm_setupFrame() {
    },

    resetFrame: function mifm_resetFrame() {
    },

    launchFrame: function mifm_launchFrame() {
    },

    destroyFrame: function mifm_destroyFrame() {
    },

    deleteRunningKeyboardRef: function mifm_deleteRunningKeyboardRef() {
    },

    deleteRunningFrameRef: function mifm_deleteRunningFrameRef() {
    }

  };

  exports.MockInputFrameManager = MockInputFrameManager;
}(window));
