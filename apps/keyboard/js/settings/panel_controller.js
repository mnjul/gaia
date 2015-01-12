'use strict';

(function(exports) {

/*
 * Controls transitioning of different panels and dialogs. The concept is
 * largely the same with Settings app, but we're working under these bases here:
 *
 * 1) we only have two panels (root and user-dictionary-word-list), and one
 *    dialog (user-dictionary-edit).
 * 2) we either navigate to root from word list, or
 *    navigate from root to word list, or
 *    show the dict edit dialog when we're at word list.
 *
 * The transition between root and word list panels are written ad-hoc thereby.
 *
 * The architecture is like Settings app and we have a few exposed event hooks
 * required for each panel/dialog class, like:
 * - beforeShow(): when a panel/dialog is to be shown.
 * - show(): when a panel/dialog has fully transitioned in.
             Do event binding here.
 * - beforeHide(): when a panel/dialog is to be hidden. Do event unbinding here.
 * - hide(): when a panel/dialog has fully transitioned out.
 * Each event hook may optionally be asynchronous by returning a Promise.
 *
 * Additionally, each panel/dialog should initialize itself on first
 *  beforeShow() in its object lifetime.
 *
 * == Dialogs ==
 *
 * A dialog is of more limited use:
 *
 * Similr to Settings app, a dialog is always modal and may only be stacked on
 * top of another panel or another dialog, and cannot freely transition to
 * another panel.
 *
 * We should always open a dialog with DialogController -- we try to limit a
 * dialog object's ability to reach other components, and we only provide it
 * with DialogController such that it is able to open other dialogs only.
 *
 * A dialog has a onsubmit call back where it passes its result, which is
 * processed by openDialog, for subsequent clean-up and transition-out, and for
 * propogation the results through openDialog's originally returned Promise to
 * its caller.
 */

// in case transitionend event is interrupted due to whatever reason,
// we use a timeout to make sure that the sequence is not uncontrollably
// interruptted.
const TRANSITION_TIMEOUT = 600;

var PanelController = function(rootPanel) {
  this._rootPanel = rootPanel;
  this._currentPanel = null;
};

PanelController.prototype.start = function() {
  Promise.resolve(this._rootPanel.beforeShow())
  .then(this._rootPanel.show.bind(this._rootPanel))
  .catch(e => e && console.error(e));
};

PanelController.prototype.stop = function() {
  this._rootPanel = null;
  this._currentPanel = null;
};

PanelController.prototype._createTransitionPromise = function(target) {
  return new Promise(function(resolve){
    var transitionEnd = function(){
      clearTimeout(timeout);
      target.removeEventListener('transitionend', transitionEnd);

      resolve();
    };

    var timeout = setTimeout(transitionEnd, TRANSITION_TIMEOUT);
    target.addEventListener('transitionend', transitionEnd);
  });
};

PanelController.prototype.navigateToRoot = function() {
  // we assume we're always navigating from one-level-deep panel (=> word list)

  Promise.resolve(this._currentPanel.beforeHide())
  .then(() => this._rootPanel.beforeShow())
  .then(() => {
    var transitionPromise =
      this._createTransitionPromise(this._currentPanel._container);

    this._currentPanel._container.classList.remove('current');
    this._rootPanel._container.classList.remove('prev');
    this._rootPanel._container.classList.add('current');

    return transitionPromise;
  })
  .then(this._currentPanel.hide.bind(this._currentPanel))
  .then(this._rootPanel.show.bind(this._rootPanel))
  .then(() => {
    this._currentPanel = null;
  })
  .catch(e => e && console.error(e));
};

PanelController.prototype.navigateToPanel = function(panel, options) {
  // we assume we're always navigating from root

  this._currentPanel = panel;

  Promise.resolve(this._rootPanel.beforeHide())
  .then(() => panel.beforeShow(options))
  .then(() => {
    var transitionPromise = this._createTransitionPromise(panel._container);

    panel._container.classList.add('current');
    this._rootPanel._container.classList.remove('current');
    this._rootPanel._container.classList.add('prev');

    return transitionPromise;
  })
  .then(this._rootPanel.hide.bind(this._rootPanel))
  .then(panel.show.bind(panel))
  .catch(e => e && console.error(e));
};

var DialogController = function() {
};

DialogController.prototype.start = function() {
};

DialogController.prototype.stop = function() {
};

DialogController.prototype._createTransitionPromise =
  PanelController.prototype._createTransitionPromise;

DialogController.prototype.openDialog = function(dialog, options) {
  if (!('onsubmit' in dialog)) {
    return Promise.reject('Dialog does not have a onsubmit callback');
  }

  var resultPromiseResolve, resultPromiseReject;

  var resultPromise = new Promise(function(resolve, reject){
    resultPromiseResolve = resolve;
    resultPromiseReject = reject;
  });

  dialog.onsubmit = results => {
    resultPromiseResolve(results);

    Promise.resolve(dialog.beforeHide())
    .then(() => {
      var transitionPromise = this._createTransitionPromise(dialog._container);

      dialog._container.classList.remove('displayed');

      return transitionPromise;
    })
    .then(() => {
      dialog.onsubmit = undefined;
      return dialog.hide();
    })
    .catch(e => e && console.log(e));
  };

  options = options || {};
  options.dialogController = this;

  Promise.resolve(dialog.beforeShow(options))
  .then(() => {
    var transitionPromise = this._createTransitionPromise(dialog._container);

    dialog._container.classList.add('displayed');

    return transitionPromise;
  })
  .then(dialog.show.bind(dialog))
  .catch(e => resultPromiseReject(e));

  return resultPromise;
};

exports.PanelController = PanelController;
exports.DialogController = DialogController;

})(window);
