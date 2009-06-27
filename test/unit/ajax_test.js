new Test.Unit.Runner({

  'setup': function() {
    $('content').update('');
    $('content2').update('');
  },

  'teardown': function() {
    // hack to cleanup responders
    Fuse.Ajax.Responders.responders = {
      'onCreate':   Fuse.List(function() { Fuse.Ajax.activeRequestCount++ } ),
      'onComplete': Fuse.List(function() { Fuse.Ajax.activeRequestCount-- } )
    };
  },

  'testSynchronousRequest': function() {
    this.assertEqual('', getInnerHTML('content'));
    this.assertEqual(0,  Fuse.Ajax.activeRequestCount);

    Fuse.Ajax.Request('../fixtures/hello.js', {
      'asynchronous': false,
      'method':      'GET',
      'evalJS':      'force'
    });

    this.assertEqual(0, Fuse.Ajax.activeRequestCount);

    var h2 = $('content').firstChild;
    this.assertEqual('hello world!', getInnerHTML(h2));
  },

  'testAsynchronousRequest': function() {
    this.assertEqual('', getInnerHTML('content'));

    Fuse.Ajax.Request('../fixtures/hello.js', {
      'asynchronous': true,
      'method':      'get',
      'evalJS':      'force'
    });

    this.wait(1000, function() {
      var h2 = $('content').firstChild;
      this.assertEqual('hello world!', getInnerHTML(h2));
    });
  },

  'testRequestWithNoUrl': function() {
    var test = this,  suceeded = false;
    Fuse.Ajax.Request(null, {
      'asynchronous': true,
      'method':      'get',
      'onSuccess':   function() { suceeded = true }
    });

    this.wait(1000, function() { this.assert(suceeded) });
  },

  'testUpdater': function() {
    this.assertEqual('', getInnerHTML('content'));

    Fuse.Ajax.Updater('content', '../fixtures/content.html', { 'method': 'get' });

    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));

      $('content').update('');
      this.assertEqual('', getInnerHTML('content'));

      Fuse.Ajax.Updater({ 'success': 'content', 'failure': 'content2' },
        '../fixtures/content.html', { 'method': 'get', 'parameters': { 'pet': 'monkey' } });

      Fuse.Ajax.Updater('', '../fixtures/content.html',
        { 'method': 'get', 'parameters': 'pet=monkey' });

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));
        this.assertEqual('', getInnerHTML('content2'));
      });
    });
  },

  'testUpdaterWithInsertion': function() {
    $('content').update();

    Fuse.Ajax.Updater('content', '../fixtures/content.html', {
      'method':   'get',
      'insertion': function(element, content) {
        Element.insert(element, { 'top': content });
      }
    });

    this.wait(1000, function() {
      this.assertEqual(sentence, getInnerHTML('content'));
 
      $('content').update();
      Fuse.Ajax.Updater('content','../fixtures/content.html',
        { 'method': 'get', 'insertion': 'bottom' });

      this.wait(1000, function() {
        this.assertEqual(sentence, getInnerHTML('content'));

        $('content').update();
        Fuse.Ajax.Updater('content', '../fixtures/content.html',
          { 'method': 'get', 'insertion': 'after' });

        this.wait(1000, function() {
          this.assertEqual('five dozen', getInnerHTML($('content').next()));
        });
      });
    });
  },

  'testUpdaterOptions': function() {
    var options = {
      'method':       'get',
      'asynchronous': false,
      'evalJS':       'force',
      'onComplete':   Fuse.emptyFunction
    };

    var request = Fuse.Ajax.Updater('content', '../fixtures/hello.js', options);
    request.options.onComplete = function() { };
    this.assertIdentical(Fuse.emptyFunction, options.onComplete);
  },

  'testResponders': function(){
    // check for internal responder
    var count = 0;
    for (var i in Fuse.Ajax.Responders.responders) count++;
    this.assertEqual(2, count);

    var dummyResponder = { 'onComplete': function(req) { /* dummy */ } };

    Fuse.Ajax.Responders.register(dummyResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onComplete'].length);

    // don't add twice
    Fuse.Ajax.Responders.register(dummyResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onComplete'].length);

    Fuse.Ajax.Responders.unregister(dummyResponder);
    this.assertEqual(1, Fuse.Ajax.Responders.responders['onComplete'].length);

    var responder = {
      'onCreate':   function(req){ responderCounter++ },
      'onLoading':  function(req){ responderCounter++ },
      'onComplete': function(req){ responderCounter++ }
    };

    Fuse.Ajax.Responders.register(responder);

    this.assertEqual(0, responderCounter);
    this.assertEqual(0, Fuse.Ajax.activeRequestCount);

    Fuse.Ajax.Request('../fixtures/content.html',
      { 'method': 'get', 'parameters': 'pet=monkey' });

    this.assertEqual(1, responderCounter);
    this.assertEqual(1, Fuse.Ajax.activeRequestCount);

    this.wait(1000, function() {
      this.assertEqual(3, responderCounter);
      this.assertEqual(0, Fuse.Ajax.activeRequestCount);
    });
  },

  'testRespondersCanBeHash': function(){
    var hashResponder = $H({ 'onComplete': function(req) { /* dummy */ } });

    Fuse.Ajax.Responders.register(hashResponder);
    this.assertEqual(2, Fuse.Ajax.Responders.responders['onComplete'].length);
    Fuse.Ajax.Responders.unregister(hashResponder);
  },

  'testEvalResponseShouldBeCalledBeforeOnComplete': function() {
    if (this.isRunningFromRake) {
      this.assertEqual('', getInnerHTML('content'));
      this.assertEqual(0,  Fuse.Ajax.activeRequestCount);

      Fuse.Ajax.Request('../fixtures/hello.js',
        extendDefault({
          'onComplete': Fuse.Function.bind(function(response) {
            this.assertNotEqual('', getInnerHTML('content')) }, this)
        }));

      this.assertEqual(0, Fuse.Ajax.activeRequestCount);

      var h2 = $('content').firstChild;
      this.assertEqual('hello world!', getInnerHTML(h2));
    }
    else this.info(message);
  },

  'testContentTypeSetForSimulatedVerbs': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/inspect', extendDefault({
        'method':      'put',
        'contentType': 'application/bogus',
        'onComplete':  Fuse.Function.bind(function(response) {
          this.assertEqual('application/bogus; charset=UTF-8', response.responseJSON.headers['content-type']);
        }, this)
      }));
    }
    else this.info(message);
  },

  'testOnCreateCallback': function() {
    Fuse.Ajax.Request('../fixtures/content.html',
      extendDefault({
        'onCreate': Fuse.Function.bind(
          function(response) { this.assertEqual(0, response.readyState) }, this),
        'onComplete': Fuse.Function.bind(
          function(response) { this.assertNotEqual(0, response.readyState) }, this)
    }));
  },

  'testEvalJS': function() {
    if (this.isRunningFromRake) {
      $('content').update();

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.js,
          'onComplete': Fuse.Function.bind(function(response) {
            var h2 = $('content').firstChild;
            this.assertEqual('hello world!', getInnerHTML(h2));
          }, this)
      }));

      $('content').update();

      Fuse.Ajax.Request('/response',
        extendDefault({
          'evalJS':     false,
          'parameters': Fixtures.js,
          'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('', getInnerHTML('content'));
          }, this)
      }));
    }
    else this.info(message);

    $('content').update();

    Fuse.Ajax.Request('../fixtures/hello.js',
      extendDefault({
        'evalJS':     'force',
        'onComplete': Fuse.Function.bind(function(response) {
          var h2 = $('content').firstChild;
          this.assertEqual('hello world!', getInnerHTML(h2));
        }, this)
    }));
  },

  'testCallbacks': function() {
    var options = extendDefault({
      'onCreate': Fuse.Function.bind(
        function(response) { this.assertInstanceOf(Fuse.Ajax.Response, response) }, this)
    });

    Fuse.Ajax.Request.Events.each(function(state){
      options['on' + state] = options.onCreate;
    });

    Fuse.Ajax.Request('../fixtures/content.html', options);
  },

  'testResponseText': function() {
    Fuse.Ajax.Request('../fixtures/empty.html',
      extendDefault({
        'onComplete': Fuse.Function.bind(
          function(response) { this.assertEqual('', response.responseText) }, this)
    }));

    Fuse.Ajax.Request('../fixtures/content.html',
      extendDefault({
        'onComplete': Fuse.Function.bind(
          function(response) { this.assertEqual(sentence, response.responseText.toLowerCase()) }, this)
    }));
  },

  'testResponseXML': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.xml,
          'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('foo', response.responseXML.getElementsByTagName('name')[0].getAttribute('attr'))
          }, this)
      }));
    }
    else this.info(message);
  },

  'testResponseJSON': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.json,
          'onComplete': Fuse.Function.bind(
            function(response) { this.assertEqual(123, response.responseJSON.test) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': {
            'Content-Length': 0,
            'Content-Type':   'application/json'
          },
          'onComplete': Fuse.Function.bind(
            function(response) { this.assertNull(response.responseJSON) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'evalJSON':   false,
          'parameters': Fixtures.json,
          'onComplete': Fuse.Function.bind(
            function(response) { this.assertNull(response.responseJSON) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.jsonWithoutContentType,
          'onComplete': Fuse.Function.bind(
            function(response) { this.assertNull(response.responseJSON) }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'sanitizeJSON': true,
          'parameters':   Fixtures.invalidJson,
          'onException':  Fuse.Function.bind(function(request, error) {
            this.assert(Fuse.String.contains(error.message, 'Badly formed JSON string'));
            this.assertInstanceOf(Fuse.Ajax.Request, request);
          }, this)
      }));
    }
    else this.info(message);

    Fuse.Ajax.Request('../fixtures/data.json',
      extendDefault({
        'evalJSON':   'force',
        'onComplete': Fuse.Function.bind(
          function(response) { this.assertEqual(123, response.responseJSON.test) }, this)
    }));
  },

  'testHeaderJSON': function() {
    function decode(value) {
      return decodeURIComponent(escape(value));
    }

    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.headerJson,
          'onComplete': Fuse.Function.bind(function(response, json) {
            // Normally you should set the proper encoding charset on your page
            // such as charset=ISO-8859-7 and handle decoding on the serverside.
            // PHP server-side ex:
            // $value = utf8_decode($_GET['X-JSON']);
            // or for none superglobals values
            // $value = utf8_decode(urldecode($encoded));
            var expected = 'hello #\u00E9\u00E0 '; // hello #éà
            this.assertEqual(expected, decode(response.headerJSON.test));
            this.assertEqual(expected, decode(json.test));
          }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'onComplete': Fuse.Function.bind(function(response, json) {
            this.assertNull(response.headerJSON)
            this.assertNull(json)
          }, this)
      }));
    }
    else this.info(message);
  },

  'testGetHeader': function() {
    if (this.isRunningFromRake) {
     Fuse.Ajax.Request('/response',
       extendDefault({
         'parameters': { 'X-TEST': 'some value' },
         'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('some value', response.getHeader('X-Test'));
            this.assertNull(response.getHeader('X-Inexistant'));
          }, this)
      }));
    }
    else this.info(message);
  },

  'testParametersCanBeHash': function() {
    if (this.isRunningFromRake) {
      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': $H({ 'one': 'two', 'three': 'four' }),
          'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('two',  response.getHeader('one'));
            this.assertEqual('four', response.getHeader('three'));
            this.assertNull(response.getHeader('toObject'));
          }, this)
      }));
    }
    else this.info(message);
  },

  'testRequestHeaders': function() {
    if (this.isRunningFromRake) {
      this.assertNothingRaised(function() {
        Fuse.Ajax.Request('/response',
          extendDefault({
            'requestHeaders': ['X-Foo', 'foo', 'X-Bar', 'bar']
        }));
      }, 'requestHeaders as array');

      this.assertNothingRaised(function() {
        Fuse.Ajax.Request('/response',
          extendDefault({
            'requestHeaders': { 'X-Foo': 'foo', 'X-Bar': 'bar' }
        }));
      }, 'requestHeaders as object');

      this.assertNothingRaised(function() {
        Fuse.Ajax.Request('/response',
          extendDefault({
            'requestHeaders': $H({ 'X-Foo': 'foo', 'X-Bar': 'bar' })
        }));
      }, 'requestHeaders as hash object');
    }
    else this.info(message);
  },

  'testIsSameOrigin': function() {
    if (this.isRunningFromRake) {
      var isSameOrigin = Fuse.Object.isSameOrigin;
      Fuse.Object.isSameOrigin = function() { return false };

      $('content').update('same origin policy');

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters': Fixtures.js,
          'onComplete': Fuse.Function.bind(function(response) {
            this.assertEqual('same origin policy', getInnerHTML('content'));
          }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters':  Fixtures.invalidJson,
          'onException': Fuse.Function.bind(function(request, error) {
            this.assert(Fuse.String.contains(error.message, 'Badly formed JSON string'));
          }, this)
      }));

      Fuse.Ajax.Request('/response',
        extendDefault({
          'parameters':  { 'X-JSON': '{});window.attacked = true;({}' },
          'onException': Fuse.Function.bind(function(request, error) {
            this.assert(Fuse.String.contains(error.message, 'Badly formed JSON string'));
          }, this)
      }));

      // restore original method
      Fuse.Object.isSameOrigin = isSameOrigin;
    }
    else this.info(message);
  }
});