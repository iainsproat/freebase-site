acre.require('/test/lib').enable(this);

var mf = acre.require("MANIFEST").mf;
var validators = mf.require("validators");

var undefined;
function fn() {};

var tests = {
  Boolean: {
    valid: [true, false],
    invalid: ["boolean", 0, undefined, fn, null, [], {}]
  },
  String: {
    valid: ["", "FooBar"],
    invalid: [true, -1, undefined, fn, null, ["string"], {a:1}]
  },
  Number: {
    valid: [-1, 0, 1, 1.0],
    invalid: ["number", false, undefined, fn, null, [2], {a:2}]
  },
  Undefined: {
    valid: [undefined],
    invalid: ["undefined", 3.14, true, fn, null, [undefined], {a:undefined}]
  },
  Function: {
    valid: [fn],
    invalid: ["function", -1, false, undefined, null, [fn], {a:fn}]
  },
  Null: {
    valid: [null],
    invalid: ["null", 0, false, undefined, fn, [], {}]
  },
  Array: {
    valid: [[], [null]],
    invalid: ["[0]", 0, true, undefined, fn, null, {a:[]}]
  },
  Dict: {
    valid: [{}, {a:null}],
    invalid: ["{}", 1, false, undefined, fn, null, [{}]]
  }
};

for (var env in tests) {
  test("validators."+env, tests[env], function() {

    var valid = tests[env].valid;
    var invalid = tests[env].invalid;
    var validator = validators[env];

    // test valids
    valid.forEach(function(ok) {
      strictEqual(validator(ok), ok);
    });

    // test invalids
    invalid.forEach(function(nok) {
      try {
        validator(nok);
        ok(false, env + " validator accepted " + (typeof nok) + " value");
      }
      catch(e if e instanceof validators.Invalid) {
        ok(e, e.toString());
      }
      catch(e) {
        ok(false, "unexpected exception " + e);
      }

      // if_invalid
      try {
        strictEqual(validator(nok, {if_invalid: "hello"}), "hello");
      }
      catch(e) {
        ok(false, "option if_invalid ignored");
      }
    });

    // if_empty, required
    ["", [], {}, null, undefined].forEach(function(empty) {
      try {
        strictEqual(validator(empty, {if_empty: "world"}), "world");
      }
      catch (e) {
        ok(false, "option if_empty ignored");
      }
      try {
        validator(empty, {required: true});
        ok(false, "option required ignored");
      }
      catch (e if e instanceof validators.Invalid) {
        ok(e, e.toString());
      }
      catch(e) {
        ok(false, "unexpected exception " + e);
      }
    });
  });
}

var truthy = [true, "true", "yes", "1", "-1", [0], [{}], {a:null}];
test("validators.StringBool", truthy, function() {
  truthy.forEach(function(t) {
    strictEqual(validators.StringBool(t), true);
  });
});

var falsey = [false, "false", "no", "", "0", undefined, [], {}];
test("validators.StringBool", falsey, function() {
  falsey.forEach(function(f) {
    strictEqual(validators.StringBool(f), false);
  });
});

var guid_test = {
  valid: ["#9202a8c04000641f80000000010c3935"],
  invalid: ["#", "#9202a8c04000641f80000000010c393g", "#9202a8c04000641f80000000010c39350", "#00000000000000000000000000000000", "/m/01z0366", "/freebase", "foobar"]
};
test("validators.Guid", guid_test, function() {
  guid_test.valid.forEach(function(guid) {
    strictEqual(validators.Guid(guid), guid);
  });

  guid_test.invalid.forEach(function(guid) {
    try {
      validators.Guid(guid);
      ok(false, "expected invalid guid " + guid);
    }
    catch(e if e instanceof validators.Invalid) {
      ok(e, e.toString());
    }
    catch(e) {
      ok(false, "unexpected exception " + e);
    }
  });
});


var mqlid_test = {
  valid: ["/", "/freebase", "/type/type", "/film/film/property"],
  allow: ["!/film/film/property", "#9202a8c04000641f80000000010c3935"],
  invalid: ["/freebase/", "#9202a8c04000641f80000000010c393g", "#00000000000000000000000000000000", "foobar"]
};
test("validators.MqlId", mqlid_test, function() {
  mqlid_test.valid.concat(mqlid_test.allow).forEach(function(id) {
    strictEqual(validators.MqlId(id, {guid:true, reverse:true}), id);
  });

  mqlid_test.invalid.concat(mqlid_test.allow).forEach(function(id) {
    try {
      validators.MqlId(id);
      ok(false, "expected invalid mql id " + id);
    }
    catch(e if e instanceof validators.Invalid) {
      ok(e, e.toString());
    }
    catch(e) {
      ok(false, "unexpected exception " + e);
    }
  });
});


var oneof_test = {
  "boolean": {
    oneof: [true, false],
    valid: [true, false],
    invalid: ["true", "false"]
  },
  "string": {
    oneof: ["option 1", "option 2", "option n", ""],
    valid: ["option 1", "option 2", "option n", ""],
    invalid: [1, 2, null]
  },
  "number": {
    oneof: [1, 2, 3],
    valid: [3, 2],
    invalid: [0, -1, -2]
  },
  "mixed": {
    oneof: [true, 1, "true", undefined, null],
    valid: [true, 1, "true", undefined, null],
    invalid: [0, "false", false]
  }
};
test("valdiators.OneOf", oneof_test, function() {
  for (var env in oneof_test) {
    var testing = oneof_test[env];
    var oneof = testing.oneof;
    var valid = testing.valid;
    var invalid = testing.invalid;

    valid.forEach(function(val) {
      strictEqual(validators.OneOf(val, {oneof:oneof}), val);
    });

    invalid.forEach(function(val) {
      try {
        validators.OneOf(val, {oneof:oneof});
        ok(false, "not oneof " + val);
      }
      catch(e if e instanceof validators.Invalid) {
        ok(e, e.toString());
      }
      catch(e) {
        ok(false, "unexpected exception " + e);
      }
    });
  }
});

acre.test.report();
