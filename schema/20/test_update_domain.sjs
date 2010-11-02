acre.require('/test/lib').enable(this);

var mf = acre.require("MANIFEST").mf;
var sh = mf.require("helpers");
var h = mf.require("test", "helpers");
var update_domain = mf.require("update_domain").update_domain;

// this test requires user to be logged in
var user = acre.freebase.get_user_info();

test("login required", function() {
  ok(user, "login required");
});

if (!user) {
  acre.test.report();
  acre.exit();
}

test("update_domain name", function() {
  var domain = h.create_domain(user.id);
  try {
    var updated;
    update_domain({
      id: domain.id,
      name: domain.name + "updated"
    })
    .then(function(id) {
      updated = id;
    });
    acre.async.wait_on_results();
    ok(updated, updated);

    var result = acre.freebase.mqlread({id:updated, name:null}).result;
    equal(result.name, domain.name + "updated");
  }
  finally {
    if (domain) {
      h.delete_domain(domain);
    }
  }
});


test("update_domain key", function() {
  var domain = h.create_domain(user.id);
  try {
    var updated;
    update_domain({
      id: domain.id,
      namespace: user.id,
      key: sh.generate_domain_key(domain.name+"updated")
    })
    .then(function(id) {
      updated = id;
    });
    acre.async.wait_on_results();
    ok(updated, updated);

    var result = acre.freebase.mqlread({id:updated, key:{namespace:user.id, value:null}}).result;
    equal(result.key.value, sh.generate_domain_key(domain.name+"updated"));
  }
  finally {
    if (domain) {
      h.delete_domain(domain);
    }
  }
});

test("update_domain description", function() {
  var domain = h.create_domain(user.id);
  try {
    var updated, description;
    update_domain({
      domain: user.id,
      id: domain.id,
      description: domain.name + "updated"
    })
    .then(function(id) {
      updated = id;
    });
    acre.async.wait_on_results();
    ok(updated, updated);

    var result = acre.freebase.mqlread({id: updated, "/common/topic/article": {id: null}}).result;
    var blurb = acre.freebase.get_blob(result["/common/topic/article"].id, "blurb").body;
    equal(blurb, domain.name + "updated");
  }
  finally {
    if (domain) {
      h.delete_domain(domain);
    }
  }
});



acre.test.report();
