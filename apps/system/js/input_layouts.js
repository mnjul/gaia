'use strict';

(function(exports) {

  /**
   * InputLayouts is responsible for processing and holding layouts returned
   * from KeyboardHelper for use by KeyboardManager.
   */
  var InputLayouts = function(keyboardManager) {
    this._keyboardManager = keyboardManager;

  };

  InputLayouts.prototype.start = function il_start() {

  };

  InputLayouts.prototype.stop = function il_stop() {

  };


  InputLayouts.prototype._transformLayout = function il_transformLayout() {
    var transformedLayout = {
      id: layout.layoutId,
      origin: layout.app.origin,
      manifestURL: layout.app.manifestURL,
      path: layout.inputManifest.launch_path
    };

    // tiny helper - bound to the manifests
    function getName() {
      return this.name;
    }

    // define properties for name that resolve at display time
    // to the correct language via the ManifestHelper
    Object.defineProperties(transformedLayout, {
      name: {
        get: getName.bind(layout.inputManifest),
        enumerable: true
      },
      appName: {
        get: getName.bind(layout.manifest),
        enumerable: true
      }
    });

    return transformedLayout;
  },

  updateLayouts: function km_updateLayouts(layouts) {
    var enabledApps = new Set();

    var self = this;

    // XXX: split the reduce+foreach first
    function reduceLayouts(carry, layout) {
      enabledApps.add(layout.app.manifestURL);
      // add the layout to each type and return the carry
      layout.inputManifest.types.filter(KeyboardHelper.isKeyboardType)
        .forEach(function(type) {
          carry[type] = carry[type] || [];
          carry[type].push(self.kmul_transformLayout(layout));
        });

      return carry;
    }

    this.keyboardLayouts = layouts.reduce(reduceLayouts, {});

    // bug 1035117:
    // at this moment, if the 'fallback' groups (managed by KeyboardHelper)
    // doesn't have any layouts, inject the fallback layout into it.
    // (for example, user enables only CJKV IMEs, and for 'password'
    //  we need to enable 'en')
    for (var group in KeyboardHelper.fallbackLayouts) {
      if (!(group in this.keyboardLayouts)) {
        var layout = KeyboardHelper.fallbackLayouts[group];

        enabledApps.add(layout.app.manifestURL);

        // XXX: init activelayout later
        this.keyboardLayouts[group] = [self.kmul_transformLayout(layout)];
      }
    }

    for(var group in this.keyboardLayouts) {
      this.keyboardLayouts[group].activeLayout = 0;
    }

    // XXX this should finish layout generation

    // Let chrome know about how many keyboards we have
    // need to expose all input type from inputTypeTable
    var countLayouts = {};
    Object.keys(this.keyboardLayouts).forEach(function(k) {
      var typeTable = this.inputTypeTable[k];
      for (var i in typeTable) {
        var inputType = typeTable[i];
        countLayouts[inputType] = this.keyboardLayouts[k].length;
      }
    }, this);

    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('mozContentEvent', true, true, {
      type: 'inputmethod-update-layouts',
      layouts: countLayouts
    });
    window.dispatchEvent(event);
  }

  exports.InputLayouts = InputLayouts;

})(window);
