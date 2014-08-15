'use strict';

(function(exports) {
  var MockImeMenu = function(listItems, title, successCb, cancelCb) {
    return this;
  };

  MockImeMenu.prototype = {
    start: function mim_start() {
    },
  };

  exports.MockImeMenu = MockImeMenu;
}(window));
