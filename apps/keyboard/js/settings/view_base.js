'use strict';

/*
 * The base class of everything that user can "view". This includes Panels,
 * Dialogs, and Views (a View is a visual section of a Panel or a Dialog, which
 * groups UI elements of related functionalities).
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
 * The beforeShow/show/beforeHide/hide hooks may optionally be asynchronous
 * by returning a Promise, which must be honored by its parent. These functions
 * are currently not used by Views (i.e. Panels and Dialogs' calls to children
 * views' event hooks essentially do nothing)
 * 
 * [*] if this object is a View, then parent is Panel/Dialog.
 *     if this object is a Panel/Dialog, then parent is PanelController/
 *                                                      DialogController
 */
 

(function(exports) {

var ViewBase = function() {
};

ViewBase.prototype.start = function() {
};

ViewBase.prototype.stop = function() {
};

ViewBase.prototype.beforeShow = function() {
};

ViewBase.prototype.show = function() {
};

ViewBase.prototype.beforeHide = function() {
};

ViewBase.prototype.hide = function() {
};

exports.ViewBase = ViewBase;

})(window);
