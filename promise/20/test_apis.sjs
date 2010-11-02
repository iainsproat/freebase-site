acre.require('/test/lib').enable(this);

var deferred = acre.require("deferred");
var freebase = acre.require("apis").freebase;
var urlfetch = acre.require("apis").urlfetch;

test("urlfetch_success", function() {
  // Basic url fetch should call the callback
  urlfetch("http://www.freebase.com")
    .then(function(result) {
      ok(result.body, "Make sure that we returned a result");
    }, function(failure) {
      ok(false, "Urlfetch returned an error: "+error);
    });

  acre.async.wait_on_results();

  // Multiple urlfetches should also work
  urlfetch("http://www.metaweb.com")
    .then(function(result) {
      ok(result.body, "Make sure that we returned a result");
    }, function(error) {
      ok(false, "Urlfetch returned an error: "+error);
    });

  acre.async.wait_on_results();
});

test("urlfetch_redirects", function() {
  // Make sure that we are following redirects on async urlfetchs

  urlfetch("http://freebase.com")
    .then(function(result) {
      ok(result.body, "Make sure that we returned a result");
    }, function(error) {
      if (error.info.status >= 300 && error.info.status < 400) {
        ok(false, "We should have redirected and not received this error.");
      } else {
        ok(false, "We shouldn't be erroring out here");
      }
    });

  acre.async.wait_on_results();
});

test("urlfetch_failure", function() {
  // Check that a 404 response calls the errback

  var errback_called = false;
  urlfetch("http://www.freebase.com/non-existent-page")
    .then(function(result) {
      ok(false, "Callback shouldn't have run on a 404 response.");
    })
    .then(null, function(error) {
      equals(error.info.status, 404);
      errback_called = true;
    });
  acre.async.wait_on_results();
  ok(errback_called, "Errback must be called on failed requests");

  // Check that bad urls call the errback
  var errback_called = false;
  urlfetch("bad_url")
    .then(function(result) {
      ok(false, "Callback shouldn't have run on a bad url.");
    })
    .then(null, function(error) {
      errback_called = true;
    });

  acre.async.wait_on_results();
  ok(errback_called, "Errback must be called on failed requests");

});

test("urlfetch_timeout", function() {
  // Check that a timeout calls the errback with the right error

  var errback_called = false;
  urlfetch("http://www.freebase.com", {timeout: .1})
    .then(function(result) {
      ok(false, "Callback shouldn't have run on timeout");
    })
    .then(null, function(error) {
      ok(error instanceof deferred.RequestTimeout, "Must be a timeout error: "+error.name);
      equals(error.message, "Time limit exceeded");
      errback_called = true;
    });
  acre.async.wait_on_results();
  ok(errback_called, "Errback must be called on failed requests");
});

test("mqlread_success", function() {
  // Basic mqlread should call the callback
  freebase.mqlread({id: "/en/bob_dylan", name: null})
    .then(function(envelope) {
      equals(envelope.result.name, "Bob Dylan");
    }, function(error) {
      ok(false, "Mqlread returned an error: "+error);
    });

  acre.async.wait_on_results();
});

test("get_static", function() {
  // We should get back results from this bdb call
  freebase.get_static("notable_types_2", "/en/metaweb")
    .then(function(envelope) {
      equals(envelope.types[0].t, "/business/company", "Should return the expected notable type");
    }, function(error) {
      ok(false, "get_static shouldn't return an error: "+error);
    });
  
  acre.async.wait_on_results();
});


acre.test.report();
