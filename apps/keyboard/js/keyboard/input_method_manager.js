'use strict';

/* global IMEngineSettings, Promise, KeyEvent */

/*
 * InputMethodManager manages life cycle of input methods.
 *
 * These input methods should have lived in their own worker scopes eventually,
 * (they loads their own workers currently any way), however we still loads them
 * into the main loop now, so it is given the opportunity to provide sync
 * feedback.
 *
 * ## Input methods
 *
 * Input methods are in subdirectories of imes/.  The latin input method
 * in imes/latin/ provides word suggestions, auto capitalization, and
 * punctuation assistance.
 *
 * Each input method implements the following interface which the keyboard
 * uses to communicate with it. init() and click() are the only two required
 * methods; the keyboard checks that other methods are defined before
 * invoking them:
 *
 *    init(keyboard):
 *      Keyboard is the object that the IM uses to communicate with the keyboard
 *
 *    activate(language, inputData, options):
 *      The keyboard calls this method when it becomes active.
 *      language is the current language. inputData is an object
 *      that holds the infomation of the input field or textarea
 *      being typed into. it includes type, inputmode, value,
 *      inputContext and selectionStart, selectionEnd attributes.
 *      options is also an object, it includes suggest, correct,
 *      layoutName attributes. suggest specifies whether the user
 *      wants word suggestions and correct specifies whether auto
 *      correct user's spelling mistakes, and layoutName is used
 *      for handwriting input methods only.
 *
 *    deactivate():
 *      Called when the keyboard is hidden.
 *
 *    empty:
 *      Clear any currently displayed candidates/suggestions.
 *      The latin input method does not use this, and it is not clear
 *      to me whether the Asian IMs need it either.
 *
 *    click(keycode, x, y):
 *      This is the main method: the keyboard calls this each time the
 *      user taps a key. The keyboard does not actually generate any
 *      key events until the input method tells it to. The x and y coordinate
 *      arguments can be used to improve the IM's word suggestions, in
 *      conjunction with the layout data from setLayoutParams().
 *      The coordinates aren't passed for the Backspace key, however.
 *
 *    select(word, data):
 *      Called when the user selects a displayed candidate or word suggestion.
 *
 *    setLayoutParams(params):
 *      Gives the IM information about the onscreen coordinates of
 *      each key. Used with latin IM only.  Can be used with click
 *      coordinates to improve predictions, but it may not currently
 *      be used.
 *
 *    getMoreCandidates(indicator, maxCount, callback):
 *      (optional) Called when the render needs more candidates to show on the
 *      candidate panel.
 *
 *    sendStrokePoints(strokePoints):
 *      (optional) Send stroke points to handwriting input method engine.
 *      Only handwrting input methods use it.
 *
 * The init method of each IM is passed an object that it uses to
 * communicate with the keyboard. That interface object defines the following
 * properties and methods:
 *
 *    path:
 *      A url that the IM can use to load dictionaries or other resources
 *
 *    sendCandidates(candidates):
 *      A method that makes the keyboard display candidates or suggestions
 *
 *    setComposition(symbols, cursor):
 *      Set current composing text. This method will start composition or update
 *      composition if it has started.
 *
 *    endComposition(text):
 *      End composition, clear the composing text and commit given text to
 *      current input field.
 *
 *    sendKey(keycode, isRepeat):
 *      Generate output. Typically the keyboard will just pass this
 *      keycode to inputcontext.sendKey(). The IM could call
 *      inputcontext.sendKey() directly, but doing it this way allows
 *      us to chain IMs, I think.
 *
 *    sendString(str):
 *      Outputs a string of text by repeated calls to sendKey().
 *
 *    setLayoutPage():
 *      Allows the IM to switch between default and symbol layouts on the
 *      keyboard. Used by the latin IM.
 *
 *    setUpperCase(state):
 *      Allows the IM to switch between uppercase and lowercase layout on the
 *      keyboard. Used by the latin IM.
 *        - state.isUpperCase: to enable the upper case or not.
 *        - state.isUpperCaseLocked: to change the caps lock state.
 *
 *    getNumberOfCandidatesPerRow():
 *      Allow the IM to know how many candidates the Render need in one row so
 *      the IM can reduce search time and run the remaining process when
 *      "getMoreCandidates" is called.
 *
 */

(function(exports) {

// InputMethod modules register themselves in this object, for now.
var InputMethods = {};

// The default input method is trivial: when the keyboard passes a key
// to it, it just sends that key right back. Real input methods implement
// a number of other methods.
InputMethods['default'] = {
  init: function(glue) {
    this._glue = glue;
  },
  click: function(keyCode, isRepeat) {
    this._glue.sendKey(keyCode, isRepeat);
  },
  displaysCandidates: function() {
    return false;
  }
};

var InputMethodGlue = function InputMethodGlue() {
  this.app = null;
};

InputMethodGlue.prototype.SOURCE_DIR = './js/imes/';

InputMethodGlue.prototype.init = function(app, imEngineName) {
  this.app = app;
  this.imEngineName = imEngineName;
  this.path = this.SOURCE_DIR + imEngineName;
};

InputMethodGlue.prototype.sendCandidates = function(candidates) {
  this.app.console.trace();
  if (!this.app.inputContext) {
    console.warn('InputMethodGlue: call sendCandidates() when ' +
      'inputContext does not exist.');
    return;
  }
  this.app.candidatePanelManager.updateCandidates(candidates);
};

InputMethodGlue.prototype.setComposition = function(symbols, cursor) {
  this.app.console.trace();
  if (!this.app.inputContext) {
    console.warn('InputMethodGlue: call setComposition() when ' +
      'inputContext does not exist.');
    return;
  }
  cursor = cursor || symbols.length;
  this.app.console.info('inputContext.setComposition()');
  this.app.inputContext.setComposition(symbols, cursor).catch(function(e) {
    console.warn('InputMethodGlue: setComposition() rejected with error', e);
    this.app.console.log(symbols, cursor);

    return Promise.reject(e);
  }.bind(this));
};

InputMethodGlue.prototype.endComposition = function(text) {
  this.app.console.trace();
  if (!this.app.inputContext) {
    console.warn('InputMethodGlue: call endComposition() when ' +
      'inputContext does not exist.');
    return;
  }
  text = text || '';
  this.app.console.info('inputContext.endComposition()');
  return this.app.inputContext.endComposition(text).catch(function(e) {
    console.warn('InputMethodGlue: endComposition() rejected with error', e);
    this.app.console.log(text);

    return Promise.reject(e);
  }.bind(this));
};

InputMethodGlue.prototype.sendKey = function(keyCode, isRepeat) {
  this.app.console.trace();
  if (!this.app.inputContext) {
    console.warn('InputMethodGlue: call sendKey() when ' +
      'inputContext does not exist.');
    return Promise.reject();
  }

  var promise;

  this.app.console.info('inputContext.sendKey()');
  switch (keyCode) {
    case KeyEvent.DOM_VK_BACK_SPACE:
      promise = this.app.inputContext.sendKey(keyCode, 0, 0, isRepeat);
      break;

    case KeyEvent.DOM_VK_RETURN:
      promise = this.app.inputContext.sendKey(keyCode, 0, 0);
      break;

    default:
      promise = this.app.inputContext.sendKey(0, keyCode, 0);
      break;
  }

  return promise.catch(function(e) {
    console.warn('InputMethodGlue: sendKey() rejected with error', e);
    this.app.console.log(keyCode, isRepeat);

    return Promise.reject(e);
  }.bind(this));
};

// XXX deprecated
InputMethodGlue.prototype.sendString = function(str) {
  this.app.console.trace();
  for (var i = 0; i < str.length; i++) {
    this.sendKey(str.charCodeAt(i));
  }
};

InputMethodGlue.prototype.setLayoutPage = function(newpage) {
  this.app.console.trace();
  if (!this.app.inputContext) {
    console.warn('InputMethodGlue: call setLayoutPage() when ' +
      'inputContext does not exist.');
    return;
  }
  if (newpage !== this.app.layoutManager.PAGE_INDEX_DEFAULT) {
    throw new Error('InputMethodGlue: ' +
      'imEngine is only allowed to switch to default page');
  }
  this.app.setLayoutPage(newpage);
};

InputMethodGlue.prototype.setUpperCase = function(state) {
  this.app.console.trace();
  if (!this.app.inputContext) {
    console.warn('InputMethodGlue: call setUpperCase() when ' +
      'inputContext does not exist.');
    return;
  }
  this.app.upperCaseStateManager.switchUpperCaseState(state);
};

InputMethodGlue.prototype.isCapitalized = function() {
  this.app.console.trace();
  return this.app.upperCaseStateManager.isUpperCase;
};

InputMethodGlue.prototype.replaceSurroundingText = function(text, offset,
                                                            length) {
  this.app.console.trace();

  if (!this.app.inputContext) {
    console.warn('InputMethodGlue: call replaceSurroundingText() when ' +
      'inputContext does not exist.');
    return Promise.reject();
  }

  this.app.console.info('inputContext.replaceSurroundingText()');
  var p = this.app.inputContext.replaceSurroundingText(text, offset, length);
  p.catch(function(e) {
    console.warn('InputMethodGlue: ' +
      'replaceSurroundingText() rejected with error', e);
    this.app.console.log(text, offset, length);

    return Promise.reject(e);
  }.bind(this));

  return p;
};

InputMethodGlue.prototype.getNumberOfCandidatesPerRow = function() {
  return this.app.viewManager.getNumberOfCandidatesPerRow();
};

InputMethodGlue.prototype.getData = function(dataPath) {
  return this.app.inputMethodDatabaseLoader.load(this.imEngineName, dataPath);
};

var InputMethodLoader = function(app) {
  this.app = app;
};

InputMethodLoader.prototype.SOURCE_DIR = './js/imes/';

InputMethodLoader.prototype.start = function() {
  this._initializedIMEngines = {};
  this._imEnginesPromises = {};
  this.initPreloadedInputMethod();
};

InputMethodLoader.prototype.initPreloadedInputMethod = function() {
  var imEngineName;
  var InputMethods = exports.InputMethods;
  for (imEngineName in InputMethods) {
    this.initInputMethod(imEngineName);
    this._imEnginesPromises[imEngineName] =
      Promise.resolve(this._initializedIMEngines[imEngineName]);
  }
};

InputMethodLoader.prototype.getInputMethod = function(imEngineName) {
  return this._initializedIMEngines[imEngineName];
};

// This method returns a promise and resolves when the IMEngine script
// is loaded.
InputMethodLoader.prototype.getInputMethodAsync = function(imEngineName) {
  if (this._imEnginesPromises[imEngineName]) {
    return this._imEnginesPromises[imEngineName];
  }

  var p = new Promise(function(resolve, reject) {
    var script = document.createElement('script');
    script.onload = function() {
      this.initInputMethod(imEngineName);
      resolve(this._initializedIMEngines[imEngineName]);
    }.bind(this);
    script.onerror = function() {
      this._imEnginesPromises[imEngineName] = null;
      console.error('InputMethodLoader: unable to load ' + imEngineName + '.');
      reject();
    }.bind(this);
    script.src = this.SOURCE_DIR + imEngineName + '/' + imEngineName + '.js';
    document.body.appendChild(script);
  }.bind(this));

  this._imEnginesPromises[imEngineName] = p;
  return p;
};

InputMethodLoader.prototype.initInputMethod = function(imEngineName) {
  var InputMethods = exports.InputMethods;
  if (!(imEngineName in InputMethods)) {
    throw new Error('InputMethodLoader: ' + imEngineName +
      ' did not expose itself correctly.');
  }

  var imEngine = InputMethods[imEngineName];
  var glue = new InputMethodGlue();
  glue.init(this.app, imEngineName);

  this._initializedIMEngines[imEngineName] = InputMethods[imEngineName];
  InputMethods[imEngineName] = null;

  imEngine.init(glue);
};

var InputMethodManager = function InputMethodManager(app) {
  this._targetIMEngineName = null;
  this.currentIMEngine = null;
  this.app = app;
};

InputMethodManager.prototype.start = function() {
  this.loader = new InputMethodLoader(this.app);
  this.loader.start();

  this.imEngineSettings = new IMEngineSettings();
  this.imEngineSettings.promiseManager = this.app.settingsPromiseManager;
  this.imEngineSettings.initSettings().catch(function rejected() {
    console.error('Fatal Error! Failed to get initial imEngine settings.');
  });

  this.currentIMEngine = this.loader.getInputMethod('default');
  this._inputContextData = null;
};

/*
 * When the inputcontext is ready, the layout might not be ready yet so it's
 * not known which IMEngine we should switch to.
 * However, before that, updateInputContextData() can be called to update
 * the data needs to activate the IMEngine.
 */
InputMethodManager.prototype.updateInputContextData = function() {
  this.app.console.log('InputMethodManager.updateInputContextData()');
  // Do nothing if there is already a promise or there is no inputContext
  if (!this.app.inputContext) {
    return;
  }

  // Save inputContext as a local variable;
  // It is important that the promise is getting the inputContext
  // it calls getText() on when resolved/rejected.
  var inputContext = this.app.inputContext;

  var p = inputContext.getText().then(function(value) {
    this.app.console.log('updateInputContextData:promise resolved');

    // Resolve to this object containing information of inputContext
    return {
      type: inputContext.inputType,
      inputmode: inputContext.inputMode,
      selectionStart: inputContext.selectionStart,
      selectionEnd: inputContext.selectionEnd,
      value: value
    };
  }.bind(this), function(error) {
    console.warn('InputMethodManager: inputcontext.getText() was rejected.');

    // Resolve to this object containing information of inputContext
    // With empty string as value.
    return {
      type: inputContext.inputType,
      inputmode: inputContext.inputMode,
      selectionStart: inputContext.selectionStart,
      selectionEnd: inputContext.selectionEnd,
      value: ''
    };
  }.bind(this));

  this._inputContextData = p;
};

/*
 * Switch switchCurrentIMEngine() will switch the current method to the
 * desired IMEngine.
 *
 * This method returns a promise.
 * Before the promise resolves (when the IM is active), the currentIMEngine
 * will be the default IMEngine so we won't block keyboard rendering.
 *
 */
InputMethodManager.prototype.switchCurrentIMEngine = function(imEngineName) {
  this.app.console.log(
    'InputMethodManager.switchCurrentIMEngine()', imEngineName);

  // dataPromise is the one we previously created with updateInputContextData()
  var dataPromise = this._inputContextData;

  if (!dataPromise && imEngineName !== 'default') {
    console.warn('InputMethodManager: switchCurrentIMEngine() called ' +
      'without calling updateInputContextData() first.');
  }

  // Deactivate and switch the currentIMEngine to 'default' first.
  if (this.currentIMEngine && this.currentIMEngine.deactivate) {
    this.app.console.log(
      'InputMethodManager::currentIMEngine.deactivate()');
    this.currentIMEngine.deactivate();
  }
  if (this.app.inputContext) {
    this.app.inputContext.removeEventListener('selectionchange', this);
    this.app.inputContext.removeEventListener('surroundingtextchange', this);
  }
  this.currentIMEngine = this.loader.getInputMethod('default');

  // Create our own promise by resolving promise from loader and the passed
  // dataPromise, then do our things.
  var loaderPromise = this.loader.getInputMethodAsync(imEngineName);
  var settingsPromise = this.imEngineSettings.initSettings();

  var p = Promise.all([loaderPromise, dataPromise, settingsPromise])
  .then(function(values) {
    var imEngine = values[0];
    if (typeof imEngine.activate === 'function') {
      var dataValues = values[1];
      var settingsValues = values[2];
      var currentPage = this.app.layoutManager.currentPage;
      var lang = this.app.layoutManager.currentPage.autoCorrectLanguage ||
                 this.app.layoutManager.currentPage.handwritingLanguage;
      var correctPunctuation =
        'autoCorrectPunctuation' in currentPage ?
          currentPage.autoCorrectPunctuation :
          true;

      this.app.console.log(
        'InputMethodManager::currentIMEngine.activate()');
      imEngine.activate(lang, dataValues, {
        suggest: settingsValues.suggestionsEnabled,
        correct: settingsValues.correctionsEnabled,
        correctPunctuation: correctPunctuation
      });
    }

    if (typeof imEngine.selectionChange === 'function') {
      this.app.inputContext.addEventListener('selectionchange', this);
    }

    if (typeof imEngine.surroundingtextChange === 'function') {
      this.app.inputContext.addEventListener('surroundingtextchange', this);
    }
    this.currentIMEngine = imEngine;

    // Unset the used promise so it will get filled when
    // updateInputContextData() is called.
    this._inputContextData = null;
  }.bind(this));

  return p;
};

InputMethodManager.prototype.handleEvent = function(evt) {
  this.app.console.info('InputMethodManager.handleEvent()', evt);
  switch (evt.type) {
    case 'selectionchange':
      this.app.console.log(
        'InputMethodManager::currentIMEngine.selectionChange()', evt.detail);
      this.currentIMEngine.selectionChange(evt.detail);

      break;

    case 'surroundingtextchange':
      this.app.console.log(
        'InputMethodManager::currentIMEngine.surroundingtextChange()',
        evt.detail);
      this.currentIMEngine.surroundingtextChange(evt.detail);

      break;
  }
};

// Benchmark on predictions with and without user dictionaries.
// Connect WebIDE to Keyboard. At console, type:
// var cases = InputMethodManager._bm_genLatinInputs(100);
// InputMethodManager._bm_latinPrediction(cases, true);
// ...and observe 100 cases' average results.
// InputMethodManager._bm_latinPrediction(cases, false);
// ...and observe 100 cases' average results.
//
// You need to populate the dictionary first, though,
// see UserDictionary.prototype._bm_oneSave().

InputMethodManager._bm_genLatinInputs = function(numCases) {
  var getRandomChar = () =>
    String.fromCharCode(Math.floor(Math.random() * 26) + 'a'.charCodeAt(0));

  var range = (to) => {
    var rangeGenerator = function *() {
      for(var i = 0; i < to; i++){
        yield i;
      }
    };

    return Array.from(rangeGenerator());
  };

  var getRandomString = () => range(3 + Math.floor(Math.random() * 3)).reduce(
    (str, _) => str + getRandomChar(), '');

  return range(numCases).map(() => getRandomString());
};

InputMethodManager._bm_latinPrediction = function(cases, useUserDict) {
  const USER_DICT_DB_NAME = 'UserDictLatin';

  var dbStore = new PromiseStorage(USER_DICT_DB_NAME);
  dbStore.start();

  var databaseLoader = new InputMethodDatabaseLoader();
  databaseLoader.start();

  var enNearByKeys = JSON.parse('{"46":{"98":0.19181633764327974,"109":0.423379813234514,"110":0.423379813234514},"97":{"100":0.17535400390625,"101":0.19181633764327974,"113":0.423379813234514,"115":0.701416015625,"119":0.423379813234514,"122":0.29144229503160113},"98":{"46":0.19181633764327974,"99":0.17535400390625,"103":0.29144229503160113,"104":0.49862291921977125,"106":0.29144229503160113,"109":0.17535400390625,"110":0.701416015625,"118":0.701416015625},"99":{"98":0.17535400390625,"100":0.29144229503160113,"102":0.49862291921977125,"103":0.29144229503160113,"118":0.701416015625,"120":0.701416015625,"122":0.17535400390625,"65533":0.19181633764327974},"100":{"97":0.17535400390625,"99":0.29144229503160113,"101":0.423379813234514,"102":0.701416015625,"103":0.17535400390625,"114":0.423379813234514,"115":0.701416015625,"116":0.19181633764327974,"119":0.19181633764327974,"120":0.49862291921977125,"122":0.29144229503160113},"101":{"97":0.19181633764327974,"100":0.423379813234514,"102":0.19181633764327974,"113":0.17535400390625,"114":0.701416015625,"115":0.423379813234514,"116":0.17535400390625,"119":0.701416015625},"102":{"99":0.49862291921977125,"100":0.701416015625,"101":0.19181633764327974,"103":0.701416015625,"104":0.17535400390625,"114":0.423379813234514,"115":0.17535400390625,"116":0.423379813234514,"118":0.29144229503160113,"120":0.29144229503160113,"121":0.19181633764327974},"103":{"98":0.29144229503160113,"99":0.29144229503160113,"100":0.17535400390625,"102":0.701416015625,"104":0.701416015625,"106":0.17535400390625,"114":0.19181633764327974,"116":0.423379813234514,"117":0.19181633764327974,"118":0.49862291921977125,"121":0.423379813234514},"104":{"98":0.49862291921977125,"102":0.17535400390625,"103":0.701416015625,"105":0.19181633764327974,"106":0.701416015625,"107":0.17535400390625,"110":0.29144229503160113,"116":0.19181633764327974,"117":0.423379813234514,"118":0.29144229503160113,"121":0.423379813234514},"105":{"104":0.19181633764327974,"106":0.423379813234514,"107":0.423379813234514,"108":0.19181633764327974,"111":0.701416015625,"112":0.17535400390625,"117":0.701416015625,"121":0.17535400390625},"106":{"98":0.29144229503160113,"103":0.17535400390625,"104":0.701416015625,"105":0.423379813234514,"107":0.701416015625,"108":0.17535400390625,"109":0.29144229503160113,"110":0.49862291921977125,"111":0.19181633764327974,"117":0.423379813234514,"121":0.19181633764327974},"107":{"104":0.17535400390625,"105":0.423379813234514,"106":0.701416015625,"108":0.701416015625,"109":0.49862291921977125,"110":0.29144229503160113,"111":0.423379813234514,"112":0.19181633764327974,"117":0.19181633764327974},"108":{"105":0.19181633764327974,"106":0.17535400390625,"107":0.701416015625,"109":0.29144229503160113,"111":0.423379813234514,"112":0.423379813234514},"109":{"46":0.423379813234514,"98":0.17535400390625,"106":0.29144229503160113,"107":0.49862291921977125,"108":0.29144229503160113,"110":0.701416015625},"110":{"46":0.423379813234514,"98":0.701416015625,"104":0.29144229503160113,"106":0.49862291921977125,"107":0.29144229503160113,"109":0.701416015625,"118":0.17535400390625},"111":{"105":0.701416015625,"106":0.19181633764327974,"107":0.423379813234514,"108":0.423379813234514,"112":0.701416015625,"117":0.17535400390625},"112":{"105":0.17535400390625,"107":0.19181633764327974,"108":0.423379813234514,"111":0.701416015625},"113":{"97":0.423379813234514,"101":0.17535400390625,"115":0.19181633764327974,"119":0.701416015625},"114":{"100":0.423379813234514,"101":0.701416015625,"102":0.423379813234514,"103":0.19181633764327974,"115":0.19181633764327974,"116":0.701416015625,"119":0.17535400390625,"121":0.17535400390625},"115":{"97":0.701416015625,"100":0.701416015625,"101":0.423379813234514,"102":0.17535400390625,"113":0.19181633764327974,"114":0.19181633764327974,"119":0.423379813234514,"120":0.29144229503160113,"122":0.49862291921977125},"116":{"100":0.19181633764327974,"101":0.17535400390625,"102":0.423379813234514,"103":0.423379813234514,"104":0.19181633764327974,"114":0.701416015625,"117":0.17535400390625,"121":0.701416015625},"117":{"103":0.19181633764327974,"104":0.423379813234514,"105":0.701416015625,"106":0.423379813234514,"107":0.19181633764327974,"111":0.17535400390625,"116":0.17535400390625,"121":0.701416015625},"118":{"98":0.701416015625,"99":0.701416015625,"102":0.29144229503160113,"103":0.49862291921977125,"104":0.29144229503160113,"110":0.17535400390625,"120":0.17535400390625},"119":{"97":0.423379813234514,"100":0.19181633764327974,"101":0.701416015625,"113":0.701416015625,"114":0.17535400390625,"115":0.423379813234514},"120":{"99":0.701416015625,"100":0.49862291921977125,"102":0.29144229503160113,"115":0.29144229503160113,"118":0.17535400390625,"122":0.701416015625,"65533":0.423379813234514},"121":{"102":0.19181633764327974,"103":0.423379813234514,"104":0.423379813234514,"105":0.17535400390625,"106":0.19181633764327974,"114":0.17535400390625,"116":0.701416015625,"117":0.701416015625},"122":{"97":0.29144229503160113,"99":0.17535400390625,"100":0.29144229503160113,"115":0.49862291921977125,"120":0.701416015625,"65533":0.423379813234514},"65533":{"99":0.19181633764327974,"120":0.423379813234514,"122":0.423379813234514}}');

  var worker = new Worker('js/imes/latin/worker.js');
  worker.postMessage({ cmd: 'setNearbyKeys', args: [enNearByKeys]});

  Promise.all([
    databaseLoader.load('latin', 'dictionaries/en_us.dict'),
    dbStore.getItem('dictblob')
  ]).then(values => {
    var builtInDict = values[0];
    var userDict = values[1];

    worker.postMessage({
      cmd: 'setLanguage',
      args: ['en_us', builtInDict, useUserDict ? userDict : undefined]
    }, [builtInDict]);

    const STEP_INTERVAL = 500;

    var count = 0;
    var resolves = [];
    var promises = cases.map((_, i) => new Promise(res => {resolves[i] = res;}));

    // lock-stepping on setTimeout, each case 0.5s

    var t0;

    var step = () => {
      var input = cases[count];
      console.log(`case ${count}, input ${input}`);

      t0 = window.performance.now();
      worker.postMessage({cmd: 'predict', args: [input]});
    };

    worker.onmessage = e => {
      if ('predictions' === e.data.cmd){
        resolves[count](window.performance.now() - t0);

        console.log('result: ' + JSON.stringify(e.data.suggestions));

        count++;

        if (count < cases.length) {
          setTimeout(step, STEP_INTERVAL);
        }
      }
    };

    setTimeout(step, STEP_INTERVAL);

    Promise.all(promises).then(predictDiffs => {
      var stats = diffs => {
        var mean = diffs.reduce((res, curr) => (res + curr), 0) / diffs.length;
        var stddev = Math.sqrt(
          diffs.reduce((res, curr) => (res + Math.pow(curr - mean, 2)), 0) /
          (diffs.length - 1)
        );

        var max = Math.max(...diffs);
        var min = Math.min(...diffs);

        return [mean, stddev, max, min];
      };

      var predictStats = stats(predictDiffs);

      predictStats = predictStats.map(s => s.toFixed(3));

      console.log(`${cases.length} predictions, useUserDict: ${useUserDict}:
        mean: ${predictStats[0]}, max: ${predictStats[2]}, min: ${predictStats[3]},
        stddev: ${predictStats[1]}`);

      worker.terminate();
      databaseLoader.stop();
    });
  }).catch(e => {
    console.log(e);
  });
};

// InputMethod modules register themselves in this object, for now.
exports.InputMethods = InputMethods;

exports.InputMethodGlue = InputMethodGlue;
exports.InputMethodLoader = InputMethodLoader;
exports.InputMethodManager = InputMethodManager;

})(window);
