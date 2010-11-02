acre.require('/test/lib').enable(this);

var mf = acre.require("MANIFEST").mf;
var sh = mf.require("helpers");
var h = mf.require("test", "helpers");
var create_type = mf.require("create_type").create_type;

// this test requires user to be logged in
var user = acre.freebase.get_user_info();

test("login required", function() {
  ok(user, "login required");
});

if (!user) {
  acre.test.report();
  acre.exit();
}

var user_domain = user.id + "/default_domain";

function get_name() {
  return  "test_create_type_" + h.random();
};

test("create_type", function() {
  var type;
  try {
    var name = get_name();
    create_type({
      domain: user_domain,
      name: name,
      key: sh.generate_type_key(name)
    })
    .then(function(r) {
      type = r;
    });
    acre.async.wait_on_results();
    ok(type);
    equal(type.key.value, sh.generate_type_key(name));

    // assert included type /common/topic
    var result = acre.freebase.mqlread({
      id: type.id,
      "/freebase/type_hints/included_types": {id:"/common/topic"},
      permission: {
        id: null,
        "!/type/object/permission": {id: user_domain}
      }
    }).result;
    ok(result);
    equal(result["/freebase/type_hints/included_types"].id, "/common/topic");
    equal(result.permission["!/type/object/permission"].id,  user_domain);
  }
  finally {
    if (type) {
      h.delete_type(type);
    }
  }
});

test("create_type mediator", function() {
  var type;
  try {
    var name = get_name();
    create_type({
      domain: user_domain,
      name: name,
      key: sh.generate_type_key(name),
      mediator: true
    })
    .then(function(r) {
      type = r;
    });
    acre.async.wait_on_results();
    ok(type);
    equal(type.key.value, sh.generate_type_key(name));

    // assert /freebase/type_hints/mediator
    // and no included types
    var result = acre.freebase.mqlread({
      id: type.id,
      "/freebase/type_hints/mediator": null,
      "/freebase/type_hints/included_types": []
    }).result;
    ok(result);
    ok(result["/freebase/type_hints/mediator"]);
    var common_topic = [t for each (t in result["/freebase/type_hints/included_types"]) if (t === "/common/topic")];
    ok(!common_topic.length);
  }
  finally {
    if (type) {
      h.delete_type(type);
    }
  }
});

test("create_type enumeration", function() {
  var type;
  try {
    var name = get_name();
    create_type({
      domain: user_domain,
      name: name,
      enumeration: true,
      key: sh.generate_type_key(name)
    })
    .then(function(r) {
      type = r;
    });
    acre.async.wait_on_results();
    ok(type);
    equal(type.key.value, sh.generate_type_key(name));

    // assert included type /common/topic
    var result = acre.freebase.mqlread({
      id:type.id,
      "/freebase/type_hints/enumeration": null,
      "/freebase/type_hints/included_types": []
    }).result;
    ok(result);
    ok(result["/freebase/type_hints/enumeration"]);
    var common_topic = [t for each (t in result["/freebase/type_hints/included_types"]) if (t === "/common/topic")];
    ok(common_topic.length);
  }
  finally {
    if (type) {
      h.delete_type(type);
    }
  }
});


test("create_type no name", function() {
  var type, error;
  var name = get_name();
  create_type({
    domain: user_domain,
    name: "",
    key: sh.generate_type_key(name)
  })
  .then(function(r) {
    type = r;
  }, function(e) {
    error = e;
  });
  acre.async.wait_on_results();
  ok(error, ""+error);
});

test("create_type no key", function() {
  var type, error;
  var name = get_name();
  create_type({
    domain: user_domain,
    name: name
  })
  .then(function(r) {
    type = r;
  }, function(e) {
    error = e;
  });
  acre.async.wait_on_results();
  ok(error, ""+error);
});

test("create_type bad key", function() {
  var type, error;
  var name = get_name();
  create_type({
    domain: user_domain,
    name: name,
    key: "!@#$%^&*()_+"
  })
  .then(function(r) {
    type = r;
  }, function(e) {
    error = e;
  });
  acre.async.wait_on_results();
  ok(error, ""+error);
});

test("create_type no domain", function() {
  var type, error;
  var name = get_name();
  create_type({
    name: name,
    key: sh.generate_type_key(name)
  })
  .then(function(r) {
    type = r;
  }, function(e) {
    error = e;
  });
  acre.async.wait_on_results();
  ok(error, ""+error);
});


test("create_type with description", function() {
  var type;
  try {
    var name = get_name();
    create_type({
      domain: user_domain,
      name: name,
      key: sh.generate_type_key(name),
      description: name
    })
    .then(function(r) {
      type = r;
    });
    acre.async.wait_on_results();
    ok(type);

    // assert /common/topic/article
    var result = acre.freebase.mqlread({
      id: type.id,
      "/common/topic/article": {
        id: null,
        permission: {
          id: null,
          "!/type/object/permission": {
            id: user.id + "/default_domain"
          }
        }
      }
    }).result;

    var blurb = acre.freebase.get_blob(result["/common/topic/article"].id, "blurb").body;
    equal(blurb, name);
  }
  finally {
      if (type) {
        h.delete_type(type);
      }
  }
});

acre.test.report();
