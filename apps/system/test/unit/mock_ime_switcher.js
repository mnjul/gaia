'use strict';

(function(exports) {
  var MockIMESwitcher = function() {
    return this;
  };

  MockIMESwitcher.prototype = {
    start: function mis_start() {
    },

    show: function mis_show() {
    },

    hide: function mis_hide() {
    }
  };

  exports.MockIMESwitcher = MockIMESwitcher;
}(window));
