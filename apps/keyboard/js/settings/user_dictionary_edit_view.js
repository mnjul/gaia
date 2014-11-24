'use strict';

/* global KeyEvent */

(function(exports) {

var UserDictionaryEditView = function(app, model, listView) {
  this.app = app;
  this._model = model;
  this._listView = listView;
  this._container = null;
  this._currentWordId = undefined;
  this._oldWord = undefined;

  this._inputField = undefined;
};

UserDictionaryEditView.prototype.CONTAINER_ID = 'panel-ud-editword';

UserDictionaryEditView.prototype.start = function() {
  this._container = document.getElementById(this.CONTAINER_ID);

  this._container.querySelector('#ud-saveword-btn')
    .addEventListener('click', this);
  this._container.querySelector('#ud-editword-input')
    .addEventListener('keydown', this);
  this._container.querySelector('#ud-editword-delete-btn')
    .addEventListener('click', this);
  this._container.querySelector('#ud-editword-dialog-cancel-btn')
    .addEventListener('click', this);
  this._container.querySelector('#ud-editword-dialog-delete-btn')
    .addEventListener('click', this);

  this._inputField = this._container.querySelector('#ud-editword-input');
};

UserDictionaryEditView.prototype.stop = function() {
  this._container = null;
  this._currentWordId = undefined;
  this._inputField = undefined;
};

UserDictionaryEditView.prototype.handleEvent = function(evt) {
  var commitWord = () => {
    if (undefined !== this._currentWordId) {
      this._editWord(this._inputField.value);
    } else {
      this._addWord(this._inputField.value);
    }
  };

  switch (evt.type) {
    case 'transitionend':
      this._container.removeEventListener('transitionend', this);
      this._inputField.focus();
      break;
    case 'click':
      switch (evt.target.id) {
        case 'ud-saveword-btn':
          commitWord();
          break;
        case 'ud-editword-delete-btn':
          navigator.mozL10n.setAttributes(
            this._container.querySelector('#ud-editword-delete-prompt'),
            'userDictionaryDeletePrompt', {word: this._oldWord});
          this._container.querySelector('#ud-editword-delete-dialog')
            .removeAttribute('hidden');
          break;
        case 'ud-editword-dialog-delete-btn':
          this._removeWord();
        /* falls through */
        case 'ud-editword-dialog-cancel-btn':
          this._container.querySelector('#ud-editword-delete-dialog')
            .setAttribute('hidden', true);
          break;
      }
      break;
    case 'keydown':
      if (evt.keyCode === KeyEvent.DOM_VK_RETURN) {
        commitWord();
        this._inputField.blur();
      }
      break;
  }
};

UserDictionaryEditView.prototype.reinit = function(param) {
  // if param has word and wordId, we're in edit mode.
  // wordId is such that our parent view knows which html node to edit/delete.
  if (param && 'word' in param) {
    this._container.classList.remove('add-mode');
    this._inputField.value = param.word;
    this._currentWordId = param.wordId;
    this._oldWord = param.word;
  } else {
    this._container.classList.add('add-mode');
    this._inputField.value = '';
    this._currentWordId = undefined;
    this._oldWord = undefined;
  }

  // input.focus() won't work right now, so need to wait...
  this._container.addEventListener('transitionend', this);
};

UserDictionaryEditView.prototype._addWord = function(word) {
  word = word.trim();

  if (word.length > 0) {
    var awakeLock = this.app.closeLockManager.requestLock('stayAwake');
    this._model.addWord(word).then(() => {
      awakeLock.unlock();
      this._listView._appendList(word);
    }).catch(e => {
      awakeLock.unlock();
      if ('existing' === e) {
        return;
      } else {
        console.error(e);
      }
    });
  }

  this.app.navigatePanel('ud-wordlist');
};

UserDictionaryEditView.prototype._editWord = function(word) {
  word = word.trim();

  if (word.length > 0 && this._oldWord !== word) {
    var awakeLock = this.app.closeLockManager.requestLock('stayAwake');
    this._model.editWord(this._oldWord, word).then(() => {
      awakeLock.unlock();
      this._listView._setWord(this._currentWordId, word);
    }).catch(e => {
      awakeLock.unlock();
      if ('existing' === e) {
        this._listView._removeFromList(this._currentWordId);
      } else {
        console.error(e);
      }
    });
  }

  this.app.navigatePanel('ud-wordlist');
};


UserDictionaryEditView.prototype._removeWord = function() {
  var awakeLock = this.app.closeLockManager.requestLock('stayAwake');
  this._model.removeWord(this._oldWord).then(() => {
    awakeLock.unlock();
    this._listView._removeFromList(this._currentWordId);
  }).catch(e => {
    awakeLock.unlock();
    console.error(e);
  });

  this.app.navigatePanel('ud-wordlist');
};

exports.UserDictionaryEditView = UserDictionaryEditView;

})(window);
