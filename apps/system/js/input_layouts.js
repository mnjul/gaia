/* global KeyboardHelper */

'use strict';

(function(exports) {

  /**
   * InputLayouts is responsible for processing and bookkeeping layouts returned
   * from KeyboardHelper for use by KeyboardManager.
   */
  var InputLayouts = function(keyboardManager) {
    this._keyboardManager = keyboardManager;

    /**
     *
     * The set of installed keyboard layouts grouped by type_group
     *                                                  (as in KeyboardManager)
     * This is a map from type_group to an object arrays.
     *
     * i.e:
     * {
     *   text: [ {...}, {...} ],
     *   number: [ {...}, {...} ]
     * }
     *
     * Each element in the arrays represents a keyboard layout:
     * {
     *    id: the unique id of the keyboard, the key of inputs
     *    name: the keyboard layout's name
     *    appName: the keyboard app name
     *    manifestURL: the keyboard's manifestURL
     *    path: the keyboard's launch path
     * }
     */
    this.layouts = {};
  };

  InputLayouts.prototype.start = function il_start() {

  };

  InputLayouts.prototype.stop = function il_stop() {

  };

  InputLayouts.prototype._transformLayout =
    function il_transformLayout(layout) {
    var transformedLayout = {
      id: layout.layoutId,
      origin: layout.app.origin,
      manifestURL: layout.app.manifestURL,
      path: layout.inputManifest.launch_path
    };

    // tiny helper - bound to the manifests
    var getName = function () {
      return this.name;
    };

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
  };

  InputLayouts.prototype.processLayouts = function il_processLayouts(layouts) {
    var enabledApps = new Set();

    // XXX: split the reduce+foreach first
    var reduceLayouts = function (carry, layout) {
      enabledApps.add(layout.app.manifestURL);
      // add the layout to each type and return the carry
      layout.inputManifest.types.filter(KeyboardHelper.isKeyboardType)
        .forEach(function(type) {
          carry[type] = carry[type] || [];
          carry[type].push(this._transformLayout(layout));
        }, this);

      return carry;
    };

    this.layouts = layouts.reduce(reduceLayouts.bind(this), {});

    // bug 1035117:
    // at this moment, if the 'fallback' groups (managed by KeyboardHelper)
    // doesn't have any layouts, inject the fallback layout into it.
    // (for example, user enables only CJKV IMEs, and for 'password'
    //  we need to enable 'en')
    Object.keys(KeyboardHelper.fallbackLayouts).filter(
      g => !(g in this.layouts)
    ).forEach(function (g) {
      var layout = KeyboardHelper.fallbackLayouts[g];

      enabledApps.add(layout.app.manifestURL);

      this.keyboardLayouts[g] = [this._transformLayout(layout)];
    }, this);

    for (var group in this.layouts) {
      this.layouts[group].activeLayout = 0;
    }

    // Let chrome know about how many keyboards we have
    // need to expose all input type from inputTypeTable
    var countLayouts = {};
    Object.keys(this.layouts).forEach(function(group) {
      var types = this._keyboardManager.inputTypeTable[group];
      types.forEach(function(type) {
        countLayouts[type] = this.layouts[group].length;
      }, this);
    }, this);

    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('mozContentEvent', true, true, {
      type: 'inputmethod-update-layouts',
      layouts: countLayouts
    });
    window.dispatchEvent(event);

    return enabledApps;
  };

  exports.InputLayouts = InputLayouts;

})(window);
