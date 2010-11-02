acre.require('/test/lib').enable(this);

var q = acre.require("queries");
var mql = acre.require("mql");

function assert_keys(keys, o, null_check) {
  var errors = [];
  keys.forEach(function(key) {
    if (! (key in o)) {
      errors.push(key);
    }
    if (null_check && o[key] == null) {
      errors.push(key + " null");
    }
  });
  if (errors.length) {
    ok(false, JSON.stringify(errors));
  }
  else {
    ok(true, JSON.stringify(keys));
  }
};

function assert_domain(domain) {
  assert_keys(["id", "name", "types", "instance_count"], domain, true);
};

test("domains", function() {
  var result;
  q.domains(mql.domains({"id":"/base/slamdunk",key:[]}))
    .then(function(domains) {
       result = domains;
    });
  acre.async.wait_on_results();
  ok(result);
  ok(result.length === 1);
  result = result[0];
  equal(result.id, "/base/slamdunk");
  assert_domain(result);
});

test("common_domains", function() {
  var result;
  q.common_domains()
    .then(function(domains) {
      result = domains;
    });
  acre.async.wait_on_results();
  ok(result);
  ok(result.length);
  result.forEach(function(domain) {
    assert_domain(domain);
  });
});

test("user_domains", function() {
  var result;
  q.user_domains("/user/daepark")
    .then(function(domains) {
      result = domains;
    });
  acre.async.wait_on_results();
  ok(result);
  ok(result.length);
  var slamdunk_base;
  result.forEach(function(domain) {
    assert_domain(domain);
    if (domain.id === "/base/slamdunk") {
      slamdunk_base = domain;
    }
  });
  ok(slamdunk_base);
});


test("domain", function() {
  function assert_type(type, mediator) {
    assert_keys(["name", "id", "properties", "instance_count", "blurb", "mediator", "enumeration"], type, true);
    equal(type["mediator"], mediator);
  };

  var result;
  q.domain("/base/slamdunk")
    .then(function(d) {
      result = d;
    });
  acre.async.wait_on_results();
  ok(result);
  assert_keys(["id", "name", "creator",  "owners", "timestamp", "date",
               "blurb", "blob", "types", "mediator:types"], result, true);
  // regular types
  ok(result.types && result.types.length);
  result.types.forEach(function(type) {
    assert_type(type, false);
  });
  // mediators
  var mediators = result["mediator:types"];
  if (mediators && mediators.length) {
    mediators.forEach(function(mediator) {
      assert_type(mediator, true);
    });
  }
});

function assert_prop(prop) {
  assert_keys(["id", "name", "expected_type",
               "tip", "disambiguator", "display_none"], prop, true);
  assert_keys(["unique", "unit", "master_property", "reverse_property"], prop);
  if (prop.expected_type && typeof prop.expected_type === "object") {
    assert_keys(["mediator"], prop.expected_type);
  }
}

function assert_type(type) {
  assert_keys(["id", "name", "domain",
               "mediator", "enumeration", "included_types",
               "creator", "timestamp", "date",
               "blurb", "blob",
               "instance_count",
               "properties"], type);
  if (type.properties && type.properties.length) {
    type.properties.forEach(function(p) {
      assert_prop(p);
    });
  }
};

test("base_type", function() {
  var result;
  q.base_type("/base/slamdunk/player")
    .then(function(t) {
      result = t;
    });
  acre.async.wait_on_results();
  ok(result);
  assert_type(result);
});

test("type", function() {
  var result;
  q.type("/base/slamdunk/player")
    .then(function(t) {
      result = t;
    });
  acre.async.wait_on_results();
  ok(result);
  assert_type(result);
  ok(result.incoming);
  assert_keys(["domain", "commons", "bases"], result.incoming);
});

test("typediagram", function() {
  var result;
  q.typediagram("/base/slamdunk/player")
    .then(function(t) {
      result = t;
    });
  acre.async.wait_on_results();
  ok(result);
  assert_type(result);
  ok(result.incoming);
  assert_keys(["domain", "commons", "bases"], result.incoming);
});


test("type_properties", function() {
  var result;
  q.type_properties("/base/slamdunk/player")
    .then(function(props) {
      result = props;
    });
  acre.async.wait_on_results();
  ok(result);
  result.forEach(function(prop) {
    assert_prop(prop);
  });
});

test("property", function() {
  var result;
  q.property("/film/film/starring")
    .then(function(p) {
      result = p;
    });
  acre.async.wait_on_results();
  ok(result);
  assert_prop(result);
});


test("incoming_from_domain", function() {
  var result;
  q.incoming_from_domain("/film/film", "/film")
    .then(function(props) {
      result = props;
    });
  acre.async.wait_on_results();
  ok(result && (result instanceof Array));

  // check all prop ids start with /film/
  var errors = [];
  result.forEach(function(p) {
    if (p.id.indexOf("/film/") !== 0) {
      errors.push(p.id);
    }
  });
  ok(!errors.length, errors.join(","));
});

test("incoming_from_domain count", function() {
  var result;
  q.incoming_from_domain("/film/film", "/film", true)
    .then(function(props) {
      result = props;
    });
  acre.async.wait_on_results();
  ok(typeof result === "number", ""+result);
});

test("incoming_from_commons", function() {
  var result;
  q.incoming_from_commons("/film/film", "/film")
    .then(function(props) {
      result = props;
    });
  acre.async.wait_on_results();
  ok(result && (result instanceof Array));

  // check all prop ids are NOT /film/... since we're excluding it
  var errors = [];
  result.forEach(function(p) {
    if (p.id.indexOf("/film/") === 0) {
      errors.push(p.id);
    }
  });
  ok(!errors.length, errors.join(","));
});

test("incoming_from_commons count", function() {
  var result;
  q.incoming_from_commons("/film/film", "/film", true)
    .then(function(props) {
      result = props;
    });
  acre.async.wait_on_results();
  ok(typeof result === "number", ""+result);
});

test("incoming_from_bases", function() {
  var result;
  q.incoming_from_bases("/base/truereligion/jeans", "/base/truereligion")
    .then(function(props) {
      result = props;
    });
  acre.async.wait_on_results();
  ok(result && (result instanceof Array));

  // check all prop ids are NOT /base/truereligion/... since we're excluding it
  var errors = [];
  result.forEach(function(p) {
    if (p.id.indexOf("/base/truereligion/") === 0) {
      errors.push(p.id);
    }
  });
  ok(!errors.length, errors.join(","));
});

test("incoming_from_bases count", function() {
  var result;
  q.incoming_from_commons("/base/slamdunk/player", "/base/slamdunk", true)
    .then(function(props) {
      result = props;
    });
  acre.async.wait_on_results();
  ok(typeof result === "number", ""+result);
});


test("minimal_type", function() {
  var result;
  q.minimal_type("/film/film")
    .then(function(type) {
      result = type;
    });
  acre.async.wait_on_results();
  ok(result);
  assert_keys(["name", "id", "properties", "instance_count", "blurb", "mediator", "enumeration"], result, true);
});

acre.test.report();

