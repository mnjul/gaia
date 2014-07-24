'use strict';

(function(exports) {

  /**
   * IMESwitcher is responsible for showing a fake notification
   * in utility tray, which indicates the activate keyboard
   * and may be interacted upon for showing IME selection menu. 
   */
  var IMESwitcher = function() {
    this._utilityTrayContainer = null;
    this._notificationContainer = null;
    this._notificationTitle = null;
    this._notificationTip = null;
    this._showAllCallback = undefined;
  };

  IMESwitcher.prototype.start = function is_start(showAllCallback) {
    this._utilityTrayContainer =
      document.getElementById('keyboard-show-ime-list');

    this._notificationContainer =
      this._utilityTrayContainer.querySelector('.fake-notification');
    this._notificationTitle = this._notificationContainer.querySelector('.message');
    this._notificationTip = this._notificationContainer.querySelector('.tip');

    this._notificationContainer.addEventListener('mousedown', this);

    this._showAllCallback = showAllCallback;
  };

  IMESwitcher.prototype.stop = function is_stop() {
    this._notificationContainer.removeEventListener('mousedown', this);
    this._utilityTrayContainer = null;
    this._notificationContainer = null;
    this._notificationTitle = null;
    this._notificationTip = null;
    this._showAllCallback = undefined;
  };

  IMESwitcher.prototype.show = function is_show(appName_, imeName) {
    window.dispatchEvent(new CustomEvent('keyboardimeswitchershow'));

    navigator.mozL10n.localize(this._notificationTitle, 'ime-switching-title', {
      appName: appName_,
      name: imeName
    });
    navigator.mozL10n.localize(this._notificationTip, 'ime-switching-tip');

    // Instead of create DOM element dynamically, we can just turn the message
    // on/off and add message as we need. This save the time to create and
    // append element.
    this._notificationContainer.classList.add('activated');
  };

  IMESwitcher.prototype.hide = function is_hide() {
    this._notificationContainer.classList.remove('activated');
    window.dispatchEvent(new CustomEvent('keyboardimeswitcherhide'));
  };

  IMESwitcher.prototype.handleEvent = function is_handleEvent(evt) {
    switch(evt.type){
      case 'mousedown':
        if(evt.currentTarget === this._notificationContainer){
          evt.preventDefault();
          this._showAllCallback();
        }
        break;
    }
  };

  exports.IMESwitcher = IMESwitcher;

})(window);
