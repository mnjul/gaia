'use strict';

/* global UserDictionary, UserDictionaryEditView */

(function(exports) {

var UserDictionaryView = function(app) {
  this.app = app;

  this._model = new UserDictionary(this);
  this.editView = new UserDictionaryEditView(app, this._model, this);
  this._populated = false;

  this._container = null;
  this._listContainer = null;

  this._wordIdCounter = 0;
};

UserDictionaryView.prototype.CONTAINER_ID = 'panel-ud-wordlist';

UserDictionaryView.prototype.start = function() {
  this._container = document.getElementById(this.CONTAINER_ID);
  this._listContainer = this._container.querySelector('#ud-wordlist-list');
  this._model.start();
  this.editView.start();

  this._container.querySelector('#ud-addword-btn')
    .addEventListener('click', this);

  this._listContainer.addEventListener('click', this);
};

UserDictionaryView.prototype.stop = function() {
  this._container = null;
  this._listContainer = null;
  this._model.stop();
  this.editView.stop();
};

UserDictionaryView.prototype.handleEvent = function(evt) {
  var target = evt.target;
  if ('ud-addword-btn' === target.id) {
    this.app.navigatePanel('ud-editword');
  } else if ('a' === target.tagName.toLowerCase()) {
    // remove "#ud-editword-" by substring
    var wordId = parseInt(target.getAttribute('href').substring(13));
    var word = target.textContent;
    this.app.navigatePanel('ud-editword', {word: word, wordId: wordId});

    evt.preventDefault();
  }
};

UserDictionaryView.prototype._appendList = function(word) {
  this._container.classList.remove('empty');

  var item = document.createElement('a');
  item.setAttribute('href', '#ud-editword-' + this._wordIdCounter);
  item.textContent = word.trim();
  var li = document.createElement('li');
  li.id = 'ud-word-' + this._wordIdCounter;
  li.appendChild(item);
  this._wordIdCounter++;
  this._listContainer.appendChild(li);
};

UserDictionaryView.prototype._removeFromList = function(wordId) {
  this._listContainer.removeChild(
    this._listContainer.querySelector(
      `li#ud-word-${wordId}`
    )
  );

  if (0 === this._listContainer.childNodes.length) {
    this._container.classList.add('empty');
  }
};

UserDictionaryView.prototype._setWord = function(wordId, newWord) {
  this._listContainer.querySelector(
    `li#ud-word-${wordId} > a`
  ).textContent = newWord;
};

UserDictionaryView.prototype.populate = function() {
  if (this._populated) {
    return;
  }

  this._populated = true;

  this._model.getList().then(words => {
    if (!words || words.size === 0) {
      this._container.classList.add('empty');
    } else {
      words.forEach(word => this._appendList(word));
    }
  }).catch(e => {
    console.error(e);
  });
};

exports.UserDictionaryView = UserDictionaryView;

})(window);
