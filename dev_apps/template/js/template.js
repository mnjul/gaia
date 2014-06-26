// App script goes here.

var App = {
  _numNoti: 0,

  _container: null,
  _addButton: null,
  _clearAllButton: null,

  _onAddButtonClicked: function() {
    var notificationNode = document.createElement('div');
    notificationNode.classList.add('item');
    notificationNode.appendChild(document.createTextNode(++this._numNoti));
    this._container.insertBefore(notificationNode,
      this._container.firstElementChild);

    this._setContainerMask();
  },

  _onClearAllButtonClicked: function() {
    while(this._container.firstChild){
      this._container.removeChild(this._container.firstChild);
    }

    this._setContainerMask();
  },

  _setContainerMask: function() {
      // mask
      if(this._container.clientHeight === this._container.scrollHeight){
        // no mask if the container can't be scrolled
        this._container.classList.remove('masked');
      }else{
        if(this._container.scrollTop === 0){
          this._container.classList.add('masked');
        }else{
          this._container.classList.remove('masked');
        }
      }
  },

  _onContainerScrolled: function() {
    this._setContainerMask();
  },

  init: function() {
    this._container = document.getElementById('container');
    this._addButton = document.getElementById('add');
    this._clearAllButton = document.getElementById('clear-all');

    this._container.addEventListener('scroll',
      this._onContainerScrolled.bind(this)
    );

    this._addButton.addEventListener('click',
      this._onAddButtonClicked.bind(this)
    );

    this._clearAllButton.addEventListener('click',
      this._onClearAllButtonClicked.bind(this)
    );
  }
};