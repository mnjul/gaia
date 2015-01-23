'use strict';

/*
 * The base class of everything that user can "view". The derived classes
 * include Panels, Dialogs, and Views (a View is defined as a visual group
 * of UI elements of related functionalities).
 *
 * A view may contain sub-Views in itself.
 *
 * A view exposes the following functions:
 *
 * start() and stop() is the beginning and termination of the object's
 * lifecycle.
 *
 * beforeShow() is called by parent[*] when this is to be shown.
 *
 * show() is called by parent when this view has fully transitioned in. 
 *        Usually, do event binding here.
 *
 * beforeHide() is called by parent when this is to be hidden.
 *              Usually, do event unbinding here.
 *
 * hide() is called by parent when this view has has fully transitioned out.
 *
 * [*] parent = Containing view, or PanelController/DialogController.
 *
 * The beforeShow/show/beforeHide/hide hooks may optionally be asynchronous
 * by returning a Promise, which must be honored by its parent. These functions
 * are currently not used by Views (i.e. Panels and Dialogs' calls to child
 * Views' event hooks essentially do nothing).
 *
 * By default, a ViewBase-derived object propogates beforeShow/show/beforeHide/
 * hide event hooks to its child views and makes sure the asynchronousness is
 * preserved.
 *
 * Additionally, we accept |options| parameter at beforeShow for initialization
 * of a view.
 */

(function(exports) {

var ViewBase = function() {
  this.subViews = {};
};

// A map from view names to Views.
ViewBase.prototype.subViews = null;

ViewBase.prototype.CONTAINER_ID = null;

ViewBase.prototype.container = null;

ViewBase.prototype.start = function() {
  if (this.CONTAINER_ID) {
    this.container = document.getElementById(this.CONTAINER_ID);
  }
};

ViewBase.prototype.stop = function() {
  this.container = null;
};

ViewBase.prototype.beforeShow = function(options) {
  return Promise.all(Object.keys(this.subViews).map(
    name => this.subViews[name].beforeShow()));
};

ViewBase.prototype.show = function() {
  return Promise.all(Object.keys(this.subViews).map(
    name => this.subViews[name].show()));
};

ViewBase.prototype.beforeHide = function() {
  return Promise.all(Object.keys(this.subViews).map(
    name => this.subViews[name].beforeHide()));
};

ViewBase.prototype.hide = function() {
  return Promise.all(Object.keys(this.subViews).map(
    name => this.subViews[name].hide()));
};

exports.ViewBase = ViewBase;

})(window);
