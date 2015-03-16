'use strict';

/* global PromiseStorage, WordListConverter */

(function(exports) {

// The "model" of user dictionary (controller logic is currently kept at app)

var UserDictionary = function UserDictionary() {
  this._wordSet = null;
  this._saveQueue = null;
  this._dbStore = null;
  this._started = false;
};

UserDictionary.prototype.start = function() {
  if (this._started) {
    console.error('UserDictionary: attempting to start twice');
    return;
  }

  this._started = true;
  this._saveQueue = Promise.resolve();
  this._dbStore = new PromiseStorage(this.DB_NAME);
  this._dbStore.start();
};

UserDictionary.prototype.stop = function() {
  if (this._started) {
    this._wordSet = null;
    this._saveQueue = null;
    this._dbStore.stop();
  }
};

UserDictionary.prototype.DB_NAME = 'UserDictLatin';

// Get the list of words from indexedDB
UserDictionary.prototype.getList = function() {
  if (!this._started) {
    return Promise.reject('UserDictionary not started');
  }

  return this._dbStore.getItem('wordlist').then(list => {
    list = list || [];
    this._wordSet = new Set(list);
    return this._wordSet;
  }).catch(e => {
    e && console.error(e);
    this._wordSet = new Set([]);
    return this._wordSet;
  });
};

// Save the list of words and the dictionary blob to indexedDB.
// We queue the saves such that firing successive saves won't easily break.
// Meanwhile, the queued save has to resolve back to the view to update the
// UI accordingly.
// Returns the list of words as it has been sorted here.
// XXX: implement abortable queue for successive saves such that we skip
//      not-yet-executed intermediate saves.
// XXX: blob generation can be time-consuming. WebWorker-ize it?
UserDictionary.prototype._saveDict = function() {
  // Keep the words sorted.
  // XXX: We're not yet able to do true lexicographical sort, see bug 866301.
  //      But here, let's at least do some case insensitive sort, though.
  var wordList = Array.from(this._wordSet);
  wordList = wordList.sort((a, b) =>
    a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));
  this._wordSet = new Set(wordList);

  var dictBlob =
    0 === wordList.length ?
    undefined :
    new WordListConverter(wordList).toBlob();

  var p = this._saveQueue.then(
    () => {
      this._dbStore.setItems({
        'wordlist': wordList,
        'dictblob': dictBlob
      });

      return wordList;
    }
  );

  this._saveQueue = p;

  this._saveQueue = this._saveQueue.catch(e => {
    console.error(e);
  });

  return p;
};

UserDictionary.prototype.addWord = function(word) {
  if (!this._started) {
    return Promise.reject('UserDictionary not started');
  }

  word = word.trim();

  if (this._wordSet.has(word)) {
    return Promise.reject('existing');
  }

  this._wordSet.add(word);

  return this._saveDict();
};

UserDictionary.prototype.updateWord = function(oldWord, word) {
  if (!this._started) {
    return Promise.reject('UserDictionary not started');
  }

  word = word.trim();

  if (oldWord === word) {
    return Promise.resolve(Array.from(this._wordSet));
  }

  // if new word already exists, delete the old and save,
  // but tell view about this scenario
  this._wordSet.delete(oldWord);
  if (this._wordSet.has(word)) {
    // XXX: word list resolved from saveDict is lost, but we don't really care
    //      since we'll only be deleteing something at view
    return this._saveDict().then(() => Promise.reject('existing'));
  } else {
    this._wordSet.add(word);
    return this._saveDict();
  }
};

UserDictionary.prototype.removeWord = function(word) {
  if (!this._started) {
    return Promise.reject('UserDictionary not started');
  }

  this._wordSet.delete(word);

  return this._saveDict();
};

// A small helper function to ease debugging. This is *not* used in real-world
// scenario as the blob is only retrieved by prediction engine.
UserDictionary.prototype._getBlob = function() {
  return this._dbStore.getItem('dictblob');
};

// Benchmark on saving of user dictionary words, including
// TST blob generation & saving to IndexedDB.
// Connect WebIDE to KeyboardSettingsApp. At console, type:
// app.panelController.userDictionaryListPanel._model._bm_saves(100);
// ...and observe 100 cases' average results.
UserDictionary.prototype._bm_oneSave = function(numWords, resultResolve) {
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

  var getRandomString = () => range(4 + Math.floor(Math.random() * 8)).reduce(
    (str, _) => str + getRandomChar(), '');

  var wordList = range(numWords).map(() => getRandomString());

  // console.log('Sanity, wordList: ', JSON.stringify(wordList));
  // console.log('Sanity, wordList length: ', wordList.length);

  this._wordSet = new Set(wordList);

  var t0, tdiff1, tdiff2;

  t0 = window.performance.now();

  var dictBlob =
    0 === wordList.length ?
    undefined :
    new WordListConverter(wordList).toBlob();

  tdiff1 = window.performance.now() - t0;

  var p = this._saveQueue.then(
    () => {
      t0 = window.performance.now();
      this._dbStore.setItems({
        'wordlist': wordList,
        'dictblob': dictBlob
      }).then(() => {
        tdiff2 = window.performance.now() - t0;

        resultResolve([tdiff1, tdiff2]);
      });

      return wordList;
    }
  );

  this._saveQueue = p;

  this._saveQueue = this._saveQueue.catch(e => {
    console.error(e);
  });

  return p;
};

UserDictionary.prototype._bm_saves = function(numWords) {
  const NUM_CASES = 20;
  const STEP_INTERVAL = 1500;

  var range = (to) => {
    var rangeGenerator = function *() {
      for(var i = 0; i < to; i++){
        yield i;
      }
    };

    return Array.from(rangeGenerator());
  };

  var resolves = [];
  var promises = [for (i of range(NUM_CASES))
                  new Promise(res => {resolves[i] = res;})];

  // lock-stepping on setTimeout, each case 1.5s

  var count = 0;
  var step = () => {
    console.log(`case ${count}`);
    this._bm_oneSave(numWords, resolves[count]);
    count++;

    if (count < NUM_CASES) {
      setTimeout(step, STEP_INTERVAL);
    }
  };

  setTimeout(step);

  Promise.all(promises).then(results2D => {
    var blobDiffs = results2D.map(r => r[0]);
    var saveDiffs = results2D.map(r => r[1]);

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

    var blobStats = stats(blobDiffs);
    var saveStats = stats(saveDiffs);

    blobStats = blobStats.map(s => s.toFixed(3));
    saveStats = saveStats.map(s => s.toFixed(3));

    console.log(`${numWords} words: Blob generation:
      mean: ${blobStats[0]}, max: ${blobStats[2]}, min: ${blobStats[3]},
      stddev: ${blobStats[1]}`);

    console.log(`${numWords} words: IndexedDB save:
      mean: ${saveStats[0]}, max: ${saveStats[2]}, min: ${saveStats[3]},
      stddev: ${saveStats[1]}`);
  });
};

exports.UserDictionary = UserDictionary;

})(window);
