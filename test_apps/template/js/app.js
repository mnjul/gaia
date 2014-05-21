(function () {
'use strict';
/**
 * Global Application event handling and paging
 */
var App = {
  /**
   * Load the Tabs and Panels, attach events and navigate to the default view.
   */
  init: function() {
    var force = function(){
      var allowed = screen.mozLockOrientation('landscape-primary');
      if (!allowed) {
        console.log("unallowed");
      }
      setTimeout(force, 1);
    };

    force();
  }
};

App.init();

})();
