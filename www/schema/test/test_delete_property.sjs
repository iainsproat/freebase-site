/*
 * Copyright 2010, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

acre.require('/test/lib').enable(this);

var freebase = acre.require("lib/promise/apis").freebase;
var h = acre.require("lib/test/helpers");
var delete_property = acre.require("delete_property").delete_property;
var undo = acre.require("delete_property").undo;

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

test("delete_property", function() {
  var type = h.create_type(user_domain);
  var type2 = h.create_type(user_domain);
  var prop = h.create_property(type.id, {"/type/property/expected_type": {id: type2.id}});
  try {
    var info, result;
    delete_property(prop.id, user.id, false, true)
      .then(function([prop_info, delete_result]) {
        info = prop_info;
        result = delete_result;
      });
    acre.async.wait_on_results();
    ok(result);

    ok(result.type.id === "/type/property" &&
       result.type.connect === "deleted", "type link deleted: " + prop.id);

    ok(result.key[0].value === prop.key.value &&
       result.key[0].namespace === prop.key.namespace &&
       result.key[0].connect === "deleted", "key deleted: " + prop.key.value);

    ok(result.schema.id === prop.schema.id &&
       result.schema.connect === "deleted", "schema link deleted: " + prop.schema.id);

    ok(result.expected_type.id === type2.id &&
       result.expected_type.connect === "deleted", "expected_type link deleted: " + type2.id);

    ok(result["/dataworld/gardening_task/async_delete"].value === true &&
       result["/dataworld/gardening_task/async_delete"].connect === "inserted",
       "/dataworld/gardening_task/async_delete set");
  }
  finally {
    if (prop) h.delete_property(prop);
    if (type2) h.delete_type(type2);
    if (type) h.delete_type(type);
  }
});

test("undo", function() {
  var type = h.create_type(user_domain);
  var type2 = h.create_type(user_domain);
  var prop = h.create_property(type.id, {"/type/property/expected_type": {id: type2.id}});

  try {
    var info, result;
    delete_property(prop.id, user.id)
      .then(function([prop_info, delete_result]) {
        info = prop_info;
        result = delete_result;
      });
    acre.async.wait_on_results();
    ok(result);
    ok(result.type.id === "/type/property" &&
       result.type.connect === "deleted", "type link deleted: " + prop.id);

    // undo
    undo(info)
      .then(function([prop_info, undo_result]) {
        info = prop_info;
        result = undo_result;
      });
    acre.async.wait_on_results();
    ok(result);
    ok(result.type.id === "/type/property" && result.type.connect === "inserted", JSON.stringify(result));

    ok(result["/dataworld/gardening_task/async_delete"].value === true &&
       result["/dataworld/gardening_task/async_delete"].connect === "deleted",
       "/dataworld/gardening_task/async_delete unset");
  }
  finally {
    if (prop) h.delete_property(prop);
    if (type2) h.delete_type(type2);
    if (type) h.delete_type(type);
  }
});

test("delete_property with master_property", function() {
  var type = h.create_type(user_domain);
  var type2 = h.create_type(user_domain);
  var prop2 = h.create_property(type2.id);
  var prop = h.create_property(type.id, {"/type/property/master_property": {id: prop2.id}});

  // assert master_property present
  var result = acre.freebase.mqlread({id:prop.id, type:"/type/property", master_property: null}).result;
  equal(result.master_property, prop2.id);

  try {
    var info;
    delete_property(prop.id, user.id, false, true)
      .then(function([prop_info, delete_result]) {
        info = prop_info;
        result = delete_result;
      });
    acre.async.wait_on_results();
    ok(result);

    result = acre.freebase.mqlread({id:prop.guid, "/type/property/master_property": null}).result;
    ok(!result["/type/property/master_property"]);

    undo(info);
    acre.async.wait_on_results();

    result = acre.freebase.mqlread({id:prop.id, type:"/type/property", master_property: null}).result;
    equal(result.master_property, prop2.id);
  }
  finally {
    if (prop) h.delete_property(prop);
    if (prop2) h.delete_property(prop2);
    if (type2) h.delete_type(type2);
    if (type) h.delete_type(type);
  }
});

test("delete_property with reverse_property", function() {
  var type = h.create_type(user_domain);
  var type2 = h.create_type(user_domain);
  var prop2 = h.create_property(type2.id);
  var prop = h.create_property(type.id, {"/type/property/master_property": {id: prop2.id}});

  // assert master_property present
  var result = acre.freebase.mqlread({id:prop2.id, type:"/type/property", reverse_property: null}).result;
  equal(result.reverse_property, prop.id);

  try {
    var info;
    delete_property(prop2.id, user.id, false, true)
      .then(function([prop_info, delete_result]) {
        info = prop_info;
        result = delete_result;
      });
    acre.async.wait_on_results();
    ok(result, JSON.stringify(info));

    result = acre.freebase.mqlread({id:prop2.guid, "/type/property/reverse_property": null}).result;
    ok(!result["/type/property/reverse_property"]);

    undo(info);
    acre.async.wait_on_results();

    result = acre.freebase.mqlread({id:prop2.id, type:"/type/property", reverse_property: null}).result;
    equal(result.reverse_property, prop.id);
  }
  finally {
    if (prop) h.delete_property(prop);
    if (prop2) h.delete_property(prop2);
    if (type2) h.delete_type(type2);
    if (type) h.delete_type(type);
  }
});

test("delete_property with delegated property", function() {
  var type = h.create_type(user_domain);
  var type2 = h.create_type(user_domain);
  var prop2 = h.create_property(type2.id);
  var prop = h.create_property(type.id, {"/type/property/delegated": {id: prop2.id}});

  // assert master_property present
  var result = acre.freebase.mqlread({id:prop.id, type:"/type/property", delegated: null}).result;
  equal(result.delegated, prop2.id);

  try {
    var info;
    delete_property(prop.id, user.id, false, true)
      .then(function([prop_info, delete_result]) {
        info = prop_info;
        result = delete_result;
      });
    acre.async.wait_on_results();
    ok(result);

    result = acre.freebase.mqlread({id:prop.guid, "/type/property/delegated": null}).result;
    ok(!result["/type/property/delegated"]);

    undo(info);
    acre.async.wait_on_results();

    result = acre.freebase.mqlread({id:prop.id, type:"/type/property", delegated: null}).result;
    equal(result.delegated, prop2.id);
  }
  finally {
    if (prop) h.delete_property(prop);
    if (prop2) h.delete_property(prop2);
    if (type2) h.delete_type(type2);
    if (type) h.delete_type(type);
  }
});

test("delete_property delegated by a property", function() {
  var type = h.create_type(user_domain);
  var type2 = h.create_type(user_domain);
  var prop2 = h.create_property(type2.id);
  var prop = h.create_property(type.id, {"/type/property/delegated": {id: prop2.id}});

  // assert master_property present
  var result = acre.freebase.mqlread({id:prop2.id, "!/type/property/delegated": null}).result;
  equal(result["!/type/property/delegated"], prop.id);

  try {
    var info;
    delete_property(prop2.id, user.id, false, true)
      .then(function([prop_info, delete_result]) {
        info = prop_info;
        result = delete_result;
      });
    acre.async.wait_on_results();
    ok(result);

    result = acre.freebase.mqlread({id:prop2.guid, "!/type/property/delegated": null}).result;
    ok(!result["!/type/property/delegated"]);

    undo(info);
    acre.async.wait_on_results();

    result = acre.freebase.mqlread({id:prop2.id, "!/type/property/delegated": null}).result;
    equal(result["!/type/property/delegated"], prop.id);
  }
  finally {
    if (prop) h.delete_property(prop);
    if (prop2) h.delete_property(prop2);
    if (type2) h.delete_type(type2);
    if (type) h.delete_type(type);
  }
});

acre.test.report();
