'use strict';

/* global MocksHelper, KeyboardFrameManager, MockKeyboardManager */

require('/test/unit/mock_keyboard_manager.js');
require('/js/keyboard_frame_manager.js');

var mocksForKeyboardFrameManager = new MocksHelper([
  'KeyboardManager'
]).init();

suite('KeyboardFrameManager', function() {
  mocksForKeyboardFrameManager.attachTestHelpers();

  test('mozbrowserresize event', function() {
    var keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);
    var evt = {
      type: 'mozbrowserresize',
      detail: {
        height: 123
      },
      stopPropagation: function() {}
    };
    this.sinon.stub(MockKeyboardManager, 'resizeKeyboard');
    keyboardFrameManager.handleEvent(evt);
    assert.isTrue(MockKeyboardManager.resizeKeyboard.calledWith(evt));
  });

  suite('setup & reset frame', function() {
    var layout;
    var frame;
    var stubSetFrameActive;
    var keyboardFrameManager;
    setup(function(){
      layout = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'en',
      };

      frame = {
        classList: {
          add: this.sinon.spy(),
          remove: this.sinon.spy(),
        },
        addEventListener: this.sinon.spy(),
        removeEventListener: this.sinon.spy()
      };

      keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);
      keyboardFrameManager._runningLayouts[layout.manifestURL] = {};
      keyboardFrameManager._runningLayouts[layout.manifestURL][layout.id] =
        frame;

      stubSetFrameActive = sinon.stub(keyboardFrameManager, '_setFrameActive');
    });
    test('setupFrame', function(){
      keyboardFrameManager.setupFrame(layout);
      assert.isTrue(frame.classList.remove.calledWith('hide'));
      assert.isTrue(stubSetFrameActive.calledWith(frame, true));
      assert.isTrue(
        frame.addEventListener.calledWith(
          'mozbrowserresize', keyboardFrameManager, true
        )
      );
    });
    test('resetFrame', function(){
      keyboardFrameManager.resetFrame(layout);
      assert.isTrue(frame.classList.add.calledWith('hide'));
      assert.isTrue(stubSetFrameActive.calledWith(frame, false));
      assert.isTrue(
        frame.removeEventListener.calledWith(
          'mozbrowserresize', keyboardFrameManager, true
        )
      );
    });
  });

  test('setFrameActive', function(){
    var keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);

    var frame = {
      setVisible: this.sinon.spy(),
      setInputMethodActive: this.sinon.spy(),
      dataset: {
        frameManifestURL: null,
        framePath: null
      }
    };

    var stubSetHasActiveKB =
      this.sinon.stub(MockKeyboardManager, 'setHasActiveKeyboard');

    keyboardFrameManager._setFrameActive(frame, true);

    assert.isTrue(frame.setVisible.calledWith(true));
    assert.isTrue(frame.setInputMethodActive.calledWith(true));
    assert.isTrue(stubSetHasActiveKB.calledWith(true));

    frame.setVisible.reset();
    frame.setInputMethodActive.reset();
    stubSetHasActiveKB.reset();

    keyboardFrameManager._setFrameActive(frame, false);

    assert.isTrue(frame.setVisible.calledWith(false));
    assert.isTrue(frame.setInputMethodActive.calledWith(false));
    assert.isTrue(stubSetHasActiveKB.calledWith(false));
  });

  suite('launchFrame', function() {
    var keyboardFrameManager;
    var layout;
    var frame;
    setup(function(){
      keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);

      layout = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'en',
        path: '/index.html#en'
      };

      frame = {
        classList: {
          add: this.sinon.spy()
        },
        dataset: {
          frameName: null,
          framePath: null,
          frameManifestURL: null
        }
      };
    });
    test('layout is already running', function(){
      var stubIsRunningLayout =
        this.sinon.stub(keyboardFrameManager, '_isRunningLayout').returns(true);

      var stubIsRunningKeyboard =
        this.sinon.stub(keyboardFrameManager, '_isRunningKeyboard');

      keyboardFrameManager.launchFrame(layout);

      assert.isTrue(stubIsRunningLayout.calledWith(layout));
      assert.isFalse(stubIsRunningKeyboard.called);
    });

    test('layout not running, keyboard running, getExistingFrame succeeds',
      function(){
      this.sinon.stub(keyboardFrameManager, '_isRunningLayout').returns(false);

      var stubIsRunningKeyboard =
        this.sinon.stub(keyboardFrameManager, '_isRunningKeyboard')
        .returns(true);

      var stubInsertFrameRef =
        this.sinon.stub(keyboardFrameManager, '_insertFrameRef');

      var stubGetFrame =
        this.sinon.stub(keyboardFrameManager, '_getFrameFromExistingKeyboard')
        .returns(frame);

      var stubLoadKeyboardLayout =
        this.sinon.stub(keyboardFrameManager, '_loadKeyboardLayoutToFrame');

      keyboardFrameManager.launchFrame(layout);

      assert.isTrue(stubIsRunningKeyboard.calledWith(layout));
      assert.isTrue(stubGetFrame.calledWith(layout));

      assert.isFalse(stubLoadKeyboardLayout.called);

      assert.equal(frame.dataset.frameName, layout.id);
      assert.equal(frame.dataset.framePath, layout.path);

      assert.isTrue(stubInsertFrameRef.calledWith(layout, frame));
    });

    test('layout not running, keyboard running, getExistingFrame fails',
      function(){
      this.sinon.stub(keyboardFrameManager, '_isRunningLayout').returns(false);

      this.sinon.stub(keyboardFrameManager, '_isRunningKeyboard').returns(true);

      this.sinon.stub(keyboardFrameManager, '_insertFrameRef');

      this.sinon.stub(keyboardFrameManager, '_getFrameFromExistingKeyboard')
      .returns(null);

      var stubLoadKeyboardLayout =
        this.sinon.stub(keyboardFrameManager, '_loadKeyboardLayoutToFrame')
        .returns(frame);

      var stubSetFrameActive =
        this.sinon.stub(keyboardFrameManager, '_setFrameActive');

      keyboardFrameManager.launchFrame(layout);

      assert.isTrue(stubLoadKeyboardLayout.calledWith(layout));
      assert.isTrue(stubSetFrameActive.calledWith(frame, false));
      assert.isTrue(frame.classList.add.calledWith('hide'));
      assert.equal(frame.dataset.frameManifestURL, layout.manifestURL);
    });

    test('layout & keyboard not running', function(){
      this.sinon.stub(keyboardFrameManager, '_isRunningLayout').returns(false);
      this.sinon.stub(keyboardFrameManager, '_isRunningKeyboard')
        .returns(false);

      var stubGetFrame =
        this.sinon.stub(keyboardFrameManager, '_getFrameFromExistingKeyboard');

      var stubLoadKeyboardLayout =
        this.sinon.stub(keyboardFrameManager, '_loadKeyboardLayoutToFrame')
        .returns(frame);

      this.sinon.stub(keyboardFrameManager, '_setFrameActive');
      this.sinon.stub(keyboardFrameManager, '_insertFrameRef');

      keyboardFrameManager.launchFrame(layout);

      assert.isFalse(stubGetFrame.called);
      assert.isTrue(stubLoadKeyboardLayout.calledWith(layout));
    });
  });

  test('loadKeyboardLayoutToFrame', function(){
    var keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);

    var stubConstructFrame =
      this.sinon.stub(keyboardFrameManager, '_constructFrame').returns('kb');

    var oldKBFrameContainer = MockKeyboardManager.keyboardFrameContainer;
    MockKeyboardManager.keyboardFrameContainer = {
      appendChild: this.sinon.spy()
    };

    var k = keyboardFrameManager._loadKeyboardLayoutToFrame('layout');

    assert.equal(k, 'kb');
    assert.isTrue(stubConstructFrame.calledWith('layout'));
    assert.isTrue(
      MockKeyboardManager.keyboardFrameContainer.appendChild.calledWith('kb')
    );

    MockKeyboardManager.keyboardFrameContainer = oldKBFrameContainer;
  });

  test('destroyFrame', function(){
    var keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);
    var layout = {
      manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
      id: 'en'
    };
    var frame = {
      parentNode: {
        removeChild: this.sinon.spy()
      }
    };

    keyboardFrameManager._runningLayouts[layout.manifestURL] = {};
    keyboardFrameManager._runningLayouts[layout.manifestURL][layout.id] = frame;

    keyboardFrameManager.destroyFrame(layout.manifestURL, layout.id);

    assert.isTrue(frame.parentNode.removeChild.calledWith(frame));
  });

  suite('constructFrame', function() {
    var keyboardFrameManager;
    var fakeKeyboardElem = {
      src: null,
      setAttribute: sinon.spy()
    };
    var oldWindowApplications;
    var layout = {
      origin: 'app://keyboard.gaiamobile.org',
      path: '/index.html#en',
      manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp'
    };
    suiteSetup(function() {
      sinon.stub(console, 'log');
    });
    setup(function() {
      keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);
      this.sinon.stub(document, 'createElement').returns(fakeKeyboardElem);
      oldWindowApplications = window.applications;
      window.applications = {
        getByManifestURL: function() {}
      };
    });
    teardown(function() {
      fakeKeyboardElem.src = null;
      fakeKeyboardElem.setAttribute.reset();
      window.applications = oldWindowApplications;
    });
    test('constructFrame, OOP enabled, uncertified, memory >= 512', function(){
      var oldIsOutOfProcessEnabled = MockKeyboardManager.isOutOfProcessEnabled;
      var oldTotalMemory = MockKeyboardManager.totalMemory;
      MockKeyboardManager.isOutOfProcessEnabled = true;
      MockKeyboardManager.totalMemory = 1024;

      var manifest = {
        type: 'unknown'
      };
      var stubGetManifestURL =
        this.sinon.stub(window.applications, 'getByManifestURL').returns({
          manifest: manifest
        });

      var k = keyboardFrameManager._constructFrame(layout);

      assert.equal(k, fakeKeyboardElem);
      assert.equal(k.src, layout.origin + layout.path);
      assert.isTrue(k.setAttribute.calledWith('mozapptype', 'inputmethod'));
      assert.isTrue(k.setAttribute.calledWith('mozbrowser', 'true'));
      assert.isTrue(k.setAttribute.calledWith('mozpasspointerevents', 'true'));
      assert.isTrue(k.setAttribute.calledWith('mozapp', layout.manifestURL));

      assert.isTrue(k.setAttribute.calledWith('remote', 'true'));
      assert.isTrue(k.setAttribute.calledWith('ignoreuserfocus', 'true' ));

      assert.isTrue(stubGetManifestURL.calledWith(layout.manifestURL));

      MockKeyboardManager.isOutOfProcessEnabled = oldIsOutOfProcessEnabled;
      MockKeyboardManager.totalMemory = oldTotalMemory;
    });
    test('constructFrame (partial), OOP enabled, certified, memory < 512',
      function(){
      var oldIsOutOfProcessEnabled = MockKeyboardManager.isOutOfProcessEnabled;
      var oldTotalMemory = MockKeyboardManager.totalMemory;
      MockKeyboardManager.isOutOfProcessEnabled = true;
      MockKeyboardManager.totalMemory = 256;

      var manifest = {
        type: 'certified'
      };
      this.sinon.stub(window.applications, 'getByManifestURL').returns({
        manifest: manifest
      });

      var k = keyboardFrameManager._constructFrame(layout);

      assert.equal(k, fakeKeyboardElem);
      assert.isFalse(k.setAttribute.calledWith('remote', 'true'));
      assert.isFalse(k.setAttribute.calledWith('ignoreuserfocus', 'true' ));

      MockKeyboardManager.isOutOfProcessEnabled = oldIsOutOfProcessEnabled;
      MockKeyboardManager.totalMemory = oldTotalMemory;
    });
    test('constructFrame (partial), OOP disabled', function(){
      var oldIsOutOfProcessEnabled = MockKeyboardManager.isOutOfProcessEnabled;
      MockKeyboardManager.isOutOfProcessEnabled = false;

      var manifest = {
        type: 'unknown'
      };
      this.sinon.stub(window.applications, 'getByManifestURL').returns({
        manifest: manifest
      });

      var k = keyboardFrameManager._constructFrame(layout);

      assert.equal(k, fakeKeyboardElem);
      assert.isFalse(k.setAttribute.calledWith('remote', 'true'));
      assert.isFalse(k.setAttribute.calledWith('ignoreuserfocus', 'true' ));

      MockKeyboardManager.isOutOfProcessEnabled = oldIsOutOfProcessEnabled;
    });
  });

  suite('getFrameFromExistingKeyboard', function() {
    var keyboardFrameManager;
    var newLayout;
    setup(function() {
      keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);
      newLayout = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'en',
        path: '/index.html#en'
      };
    });
    test('found existing keyboard to use', function(){
      var frame = {
        dataset: {
          framePath: newLayout.path
        }
      };
      keyboardFrameManager._runningLayouts[newLayout.manifestURL] = {};
      keyboardFrameManager
      ._runningLayouts[newLayout.manifestURL][newLayout.id] = frame;

      var stubFrameManagerDelete =
        this.sinon.stub(keyboardFrameManager, 'deleteRunningFrameRef');
      var stubKBManagerDelete =
        this.sinon.stub(keyboardFrameManager._keyboardManager,
                        'deleteRunningLayout');
      var f = keyboardFrameManager._getFrameFromExistingKeyboard(newLayout);

      assert.equal(f, frame);
      assert.equal(f.src, newLayout.origin + newLayout.path);
      assert.isTrue(
        stubFrameManagerDelete.calledWith(newLayout.manifestURL, newLayout.id)
      );
      assert.isTrue(
        stubKBManagerDelete.calledWith(newLayout.manifestURL, newLayout.id)
      );
    });
    test('didn\'t find existing keyboard to use', function(){
      var oldLayout = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'fr',
        path: '/other.html#fr'
      };

      var frame = {
        dataset: {
          framePath: oldLayout.path
        }
      };

      keyboardFrameManager._runningLayouts[oldLayout.manifestURL] = {};
      keyboardFrameManager
      ._runningLayouts[oldLayout.manifestURL][oldLayout.id] = frame;

      var stubFrameManagerDelete =
        this.sinon.stub(keyboardFrameManager, 'deleteRunningFrameRef');
      var stubKBManagerDelete =
        this.sinon.stub(MockKeyboardManager, 'deleteRunningLayout');

      var f = keyboardFrameManager._getFrameFromExistingKeyboard(newLayout);

      assert.strictEqual(f, null);
      assert.isFalse(stubFrameManagerDelete.called);
      assert.isFalse(stubKBManagerDelete.called);
    });
  });

  suite('runningLayouts helpers', function() {
    var keyboardFrameManager;
    setup(function() {
      keyboardFrameManager = new KeyboardFrameManager(MockKeyboardManager);
    });
    test('insertFrameRef: existing manifest', function(){
      var layout = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'en'
      };
      var layout2 = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'fr'
      };
      keyboardFrameManager._runningLayouts[layout.manifestURL] = {};
      keyboardFrameManager
      ._runningLayouts[layout.manifestURL][layout.id] = 'dummy';

      keyboardFrameManager._insertFrameRef(layout2, 'frame2');

      assert.equal(
        keyboardFrameManager._runningLayouts[layout2.manifestURL][layout2.id],
        'frame2'
      );
    });
    test('insertRunningLayout: existing manifest', function(){
      var layout = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'en'
      };
      keyboardFrameManager._insertFrameRef(layout, 'frame');

      assert.equal(
        keyboardFrameManager._runningLayouts[layout.manifestURL][layout.id],
        'frame'
      );
    });
    test('deleteRunningFrameRef', function(){
      var layout = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'en'
      };
      keyboardFrameManager.runningLayouts = {};

      keyboardFrameManager._runningLayouts[layout.manifestURL] = {};
      keyboardFrameManager._runningLayouts[layout.manifestURL][layout.id] =
        'dummy';

      keyboardFrameManager.deleteRunningFrameRef(layout.manifestURL, layout.id);

      assert.isFalse(
        keyboardFrameManager._runningLayouts[layout.manifestURL]
        .hasOwnProperty(layout.id)
      );
    });
    test('deleteRunningKeyboardRef', function(){
      var layout = {
        manifestURL: 'app://keyboard.gaiamobile.org/manifest.webapp',
        id: 'en'
      };
      keyboardFrameManager._runningLayouts = {};

      keyboardFrameManager._runningLayouts[layout.manifestURL] = {};

      keyboardFrameManager.deleteRunningKeyboardRef(layout.manifestURL);

      assert.isFalse(
        keyboardFrameManager._runningLayouts.hasOwnProperty(layout.manifestURL)
      );
    });
  });

});
