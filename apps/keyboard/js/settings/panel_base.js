'use strict';

/* global ViewBase */

/*
 * The base class of a Panel/Dialog, as a subclass of ViewBase.
 *
 * Panels/Dialogs may have child Views which we propogate beforeShow/show/
 * beforeHide/hide event hooks and make sure the asynchronousness is preserved.
 *
 * Additionally, we accept |options| parameter at beforeShow for initialization
 * of a Panel/Dialog
 */
 

(function(exports) {

var PanelBase = function() {
};

PanelBase.prototype = Object.create(ViewBase.prototype);

PanelBase.prototype.CONTAINER_ID = '';

PanelBase.prototype.container = null;

// A map from view names to Views.
PanelBase.prototype.views = {};

PanelBase.prototype.start = function() {
  this.container = document.getElementById(this.CONTAINER_ID);
};

PanelBase.prototype.stop = function() {
  this.container = null;
};

PanelBase.prototype.beforeShow = function(options) {
  return Promise.all(Object.keys(this.views).map(
    name => this.views[name].beforeShow()));
};

PanelBase.prototype.show = function() {
  return Promise.all(Object.keys(this.views).map(
    name => this.views[name].show()));
};

PanelBase.prototype.beforeHide = function() {
  return Promise.all(Object.keys(this.views).map(
    name => this.views[name].beforeHide()));
};

PanelBase.prototype.hide = function() {
  return Promise.all(Object.keys(this.views).map(
    name => this.views[name].hide()));
};

exports.PanelBase = PanelBase;

})(window);
