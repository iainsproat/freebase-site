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

var h = acre.require("helper/helpers_util.sjs");

test("trim", function() {
  expect(9);

  var nbsp = String.fromCharCode(160);

  equals( h.trim("hello "), "hello", "trailing space" );
  equals( h.trim(" hello"), "hello", "leading space" );
  equals( h.trim(" hello "), "hello", "space on both sides" );
  equals( h.trim(" " + nbsp + "hello " + nbsp + " "), "hello", "&nbsp;" );

  equals( h.trim(), "", "Nothing in." );
  equals( h.trim( undefined ), "", "Undefined" );
  equals( h.trim( null ), "", "Null" );
  equals( h.trim( 5 ), "5", "Number" );
  equals( h.trim( false ), "false", "Boolean" );
});

test("type", function() {
  expect(18);

  equals( h.type(null), "null", "null" );
  equals( h.type(undefined), "undefined", "undefined" );
  equals( h.type(true), "boolean", "Boolean" );
  equals( h.type(false), "boolean", "Boolean" );
  equals( h.type(Boolean(true)), "boolean", "Boolean" );
  equals( h.type(0), "number", "Number" );
  equals( h.type(1), "number", "Number" );
  equals( h.type(Number(1)), "number", "Number" );
  equals( h.type(""), "string", "String" );
  equals( h.type("a"), "string", "String" );
  equals( h.type(String("a")), "string", "String" );
  equals( h.type({}), "object", "Object" );
  equals( h.type(/foo/), "regexp", "RegExp" );
  equals( h.type(new RegExp("asdf")), "regexp", "RegExp" );
  equals( h.type([1]), "array", "Array" );
  equals( h.type(new Date()), "date", "Date" );
  equals( h.type(new Function("return;")), "function", "Function" );
  equals( h.type(function(){}), "function", "Function" );
});

test("isPlainObject", function() {
  expect(11);

  // The use case that we want to match
  ok(h.isPlainObject({}), "{}");

  // Not objects shouldn't be matched
  ok(!h.isPlainObject(""), "string");
  ok(!h.isPlainObject(0) && !h.isPlainObject(1), "number");
  ok(!h.isPlainObject(true) && !h.isPlainObject(false), "boolean");
  ok(!h.isPlainObject(null), "null");
  ok(!h.isPlainObject(undefined), "undefined");

  // Arrays shouldn't be matched
  ok(!h.isPlainObject([]), "array");

  // Instantiated objects shouldn't be matched
  ok(!h.isPlainObject(new Date), "new Date");

  var fn = function(){};

  // Functions shouldn't be matched
  ok(!h.isPlainObject(fn), "fn");

  // Again, instantiated objects shouldn't be matched
  ok(!h.isPlainObject(new fn), "new fn (no methods)");

  // Makes the function a little more realistic
  // (and harder to detect, incidentally)
  fn.prototype = {someMethod: function(){}};

  // Again, instantiated objects shouldn't be matched
  ok(!h.isPlainObject(new fn), "new fn");
});

test("isFunction", function() {
  expect(13);

  // Make sure that false values return false
  ok( !h.isFunction(), "No Value" );
  ok( !h.isFunction( null ), "null Value" );
  ok( !h.isFunction( undefined ), "undefined Value" );
  ok( !h.isFunction( "" ), "Empty String Value" );
  ok( !h.isFunction( 0 ), "0 Value" );

  // Check built-ins
  // Safari uses "(Internal Function)"
  ok( h.isFunction(String), "String Function("+String+")" );
  ok( h.isFunction(Array), "Array Function("+Array+")" );
  ok( h.isFunction(Object), "Object Function("+Object+")" );
  ok( h.isFunction(Function), "Function Function("+Function+")" );

  // When stringified, this could be misinterpreted
  var mystr = "function";
  ok( !h.isFunction(mystr), "Function String" );

  // When stringified, this could be misinterpreted
  var myarr = [ "function" ];
  ok( !h.isFunction(myarr), "Function Array" );

  // When stringified, this could be misinterpreted
  var myfunction = { "function": "test" };
  ok( !h.isFunction(myfunction), "Function Object" );

  // Make sure normal functions still work
  var fn = function(){};
  ok( h.isFunction(fn), "Normal Function" );
});

test("isEmptyObject", function(){
  expect(2);
  equals(true, h.isEmptyObject({}), "isEmptyObject on empty object literal" );
  equals(false, h.isEmptyObject({a:1}), "isEmptyObject on non-empty object literal" );
});

test("isArray", function() {
  expect(11);

  ok(h.isArray([]), "[] is an array");
  var tests = [null, undefined, "string", true, false, 0, {}, /foo/, new Date(), arguments];
  for(var i=0,l=tests.length; i<l; i++) {
    ok(!h.isArray(tests[i]), tests[i] + " is not an array");
  }
});

test("extend", function() {
  expect(33);

  var document = "I am a document";

  var settings = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" },
          options = { xnumber2: 1, xstring2: "x", xxx: "newstring" },
          optionsCopy = { xnumber2: 1, xstring2: "x", xxx: "newstring" },
          merged = { xnumber1: 5, xnumber2: 1, xstring1: "peter", xstring2: "x", xxx: "newstring" },
          deep1 = { foo: { bar: true } },
          deep1copy = { foo: { bar: true } },
          deep2 = { foo: { baz: true }, foo2: document },
          deep2copy = { foo: { baz: true }, foo2: document },
          deepmerged = { foo: { bar: true, baz: true }, foo2: document },
          arr = [1, 2, 3],
          nestedarray = { arr: arr };

  h.extend(settings, options);
  same( settings, merged, "Check if extended: settings must be extended" );
  same( options, optionsCopy, "Check if not modified: options must not be modified" );

  h.extend(settings, null, options);
  same( settings, merged, "Check if extended: settings must be extended" );
  same( options, optionsCopy, "Check if not modified: options must not be modified" );

  h.extend(true, deep1, deep2);
  same( deep1.foo, deepmerged.foo, "Check if foo: settings must be extended" );
  same( deep2.foo, deep2copy.foo, "Check if not deep2: options must not be modified" );
  equals( deep1.foo2, document, "Make sure that a deep clone was not attempted on the document" );

  ok( h.extend(true, {}, nestedarray).arr !== arr, "Deep extend of object must clone child array" );

  // #5991
  ok( h.isArray( h.extend(true, { arr: {} }, nestedarray).arr ), "Cloned array heve to be an Array" );
  ok( h.isPlainObject( h.extend(true, { arr: arr }, { arr: {} }).arr ), "Cloned object heve to be an plain object" );

  var empty = {};
  var optionsWithLength = { foo: { length: -1 } };
  h.extend(true, empty, optionsWithLength);
  same( empty.foo, optionsWithLength.foo, "The length property must copy correctly" );

  empty = {};
  var optionsWithDate = { foo: { date: new Date } };
  h.extend(true, empty, optionsWithDate);
  same( empty.foo, optionsWithDate.foo, "Dates copy correctly" );

  var myKlass = function() {};
  var customObject = new myKlass();
  var optionsWithCustomObject = { foo: { date: customObject } };
  empty = {};
  h.extend(true, empty, optionsWithCustomObject);
  ok( empty.foo && empty.foo.date === customObject, "Custom objects copy correctly (no methods)" );

  // Makes the class a little more realistic
  myKlass.prototype = { someMethod: function(){} };
  empty = {};
  h.extend(true, empty, optionsWithCustomObject);
  ok( empty.foo && empty.foo.date === customObject, "Custom objects copy correctly" );

  var ret = h.extend(true, { foo: 4 }, { foo: new Number(5) } );
  ok( ret.foo == 5, "Wrapped numbers copy correctly" );

  var nullUndef;
  nullUndef = h.extend({}, options, { xnumber2: null });
  ok( nullUndef.xnumber2 === null, "Check to make sure null values are copied");

  nullUndef = h.extend({}, options, { xnumber2: undefined });
  ok( nullUndef.xnumber2 === options.xnumber2, "Check to make sure undefined values are not copied");

  nullUndef = h.extend({}, options, { xnumber0: null });
  ok( nullUndef.xnumber0 === null, "Check to make sure null values are inserted");

  var target = {};
  var recursive = { foo:target, bar:5 };
  h.extend(true, target, recursive);
  same( target, { bar:5 }, "Check to make sure a recursive obj doesn't go never-ending loop by not copying it over" );

  var ret = h.extend(true, { foo: [] }, { foo: [0] } ); // 1907
  equals( ret.foo.length, 1, "Check to make sure a value with coersion 'false' copies over when necessary to fix #1907" );

  var ret = h.extend(true, { foo: "1,2,3" }, { foo: [1, 2, 3] } );
  ok( typeof ret.foo != "string", "Check to make sure values equal with coersion (but not actually equal) overwrite correctly" );

  var ret = h.extend(true, { foo:"bar" }, { foo:null } );
  ok( typeof ret.foo !== 'undefined', "Make sure a null value doesn't crash with deep extend, for #1908" );

  var obj = { foo:null };
  h.extend(true, obj, { foo:"notnull" } );
  equals( obj.foo, "notnull", "Make sure a null value can be overwritten" );

  function func() {}
  h.extend(func, { key: "value" } );
  equals( func.key, "value", "Verify a function can be extended" );

  var defaults = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" },
          defaultsCopy = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" },
          options1 = { xnumber2: 1, xstring2: "x" },
          options1Copy = { xnumber2: 1, xstring2: "x" },
          options2 = { xstring2: "xx", xxx: "newstringx" },
          options2Copy = { xstring2: "xx", xxx: "newstringx" },
          merged2 = { xnumber1: 5, xnumber2: 1, xstring1: "peter", xstring2: "xx", xxx: "newstringx" };

  var settings = h.extend({}, defaults, options1, options2);
  same( settings, merged2, "Check if extended: settings must be extended" );
  same( defaults, defaultsCopy, "Check if not modified: options1 must not be modified" );
  same( options1, options1Copy, "Check if not modified: options1 must not be modified" );
  same( options2, options2Copy, "Check if not modified: options2 must not be modified" );

  deepEqual(h.extend({foo:"bar"}, {hello:"world"}, {a:{b:"c"}}), {foo:"bar", hello:"world", a: {b:"c"}});

  deepEqual(h.extend({}, {foo:"bar"}, {hello:"world"}, {a:{b:"c"}}), {foo:"bar", hello:"world", a: {b:"c"}});

  function fn() {};
  deepEqual(h.extend({foo:"bar"}, {fn:fn}), {foo:"bar", fn:fn});

  var obj = {};
  var obj2 = h.extend(obj, {foo:"bar"});
  strictEqual(obj2, obj);


  deepEqual(h.extend({foo:"bar"}, null), {foo:"bar"});
});

test("first_element", function() {
  expect(3);

  equal(h.first_element([0,1]), 0, "expected 0 has first_element");
  equal(h.first_element("foo"), "foo", "expected argument to be passed back");
  same(h.first_element([]), null, "expected null");
});

test("intersect", function() {
  equal(h.intersect(null, null), false);
  equal(h.intersect([], []), false);
  equal(h.intersect([1,2], []), false);
  equal(h.intersect([], [1,2]), false);

  equal(h.intersect(1, 1), true);
  equal(h.intersect(1, [1]), true);
  equal(h.intersect([1], 1), true);
  equal(h.intersect([1], [1]), true);

  equal(h.intersect([1,2,3], 4), false);
  equal(h.intersect([1,2,3], [3,4,5]), true);
});

acre.test.report();
