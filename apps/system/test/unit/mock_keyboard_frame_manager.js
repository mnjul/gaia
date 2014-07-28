'use strict';

(function(exports) {
  var MockKeyboardFrameManager = function() {
    return this;
  };

  MockKeyboardFrameManager.prototype = {
    start: function mkfm_start() {
    },

    stop: function mkfm_stop() {
    },

    handleEvent: function mkfm_handleEvent() {
    },

    setupFrame: function mkfm_setupFrame() {
    },

    resetFrame: function mkfm_resetFrame() {
    },

    launchFrame: function mkfm_launchFrame() {
    },

    destroyFrame: function mkfm_destroyFrame() {
    },

    deleteRunningKeyboardRef: function mkfm_deleteRunningKeyboardRef() {
    },

    deleteRunningFrameRef: function mkfm_deleteRunningFrameRef() {
    }

  };

  exports.MockKeyboardFrameManager = MockKeyboardFrameManager;
}(window));
