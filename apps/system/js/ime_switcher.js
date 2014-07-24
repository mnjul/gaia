'use strict';

(function(exports) {

  /**
   * IMESwitcher is responsible for showing a fake notification
   * in utility tray, which indicates the activate keyboard
   * and may be interacted upon for showing IME selection menu. 
   */
  var IMESwitcher = function() {
    this._notifIMEContainer = null;
    this._fakenoti = null;
    this._fakenotiMessage = null;
    this._fakenotiTip = null;
    this._showAllCallback = undefined;
  };

  IMESwitcher.prototype.start = function is_start(showAllCallback) {
    this._notifIMEContainer =
      document.getElementById('keyboard-show-ime-list');

    this._fakenoti =
      this._notifIMEContainer.querySelector('.fake-notification');
    this._fakenotiMessage = this._fakenoti.querySelector('.message');
    this._fakenotiTip = this._fakenoti.querySelector('.tip');

    this._fakenoti.addEventListener('mousedown', this);

    this._showAllCallback = showAllCallback;
  };

  IMESwitcher.prototype.stop = function is_stop() {
    this._fakenoti.removeEventListener('mousedown', this);
    this._notifIMEContainer = null;
    this._fakenoti = null;
    this._fakenotiMessage = null;
    this._fakenotiTip = null;
    this._showAllCallback = undefined;
  };

  IMESwitcher.prototype.show = function is_show(appName_, imeName) {
    var _ = navigator.mozL10n.get;

    window.dispatchEvent(new CustomEvent('keyboardimeswitchershow'));

    this._fakenotiMessage.textContent = _('ime-switching-title', {
      appName: appName_,
      name: imeName
    });
    this._fakenotiTip.textContent = _('ime-switching-tip');

    // Instead of create DOM element dynamically, we can just turn the message
    // on/off and add message as we need. This save the time to create and
    // append element.
    this._fakenoti.classList.add('activated');
  };

  IMESwitcher.prototype.hide = function is_hide() {
    this._fakenoti.classList.remove('activated');
    window.dispatchEvent(new CustomEvent('keyboardimeswitcherhide'));
  };

  IMESwitcher.prototype.handleEvent = function is_handleEvent(evt) {
    switch(evt.type){
      case 'mousedown':
        if(evt.currentTarget === this._fakenoti){
          evt.preventDefault();
          this._showAllCallback();
        }
        break;
    }
  };

  exports.IMESwitcher = IMESwitcher;

})(window);
