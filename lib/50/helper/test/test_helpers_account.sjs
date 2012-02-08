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

var h = acre.require("helper/helpers.sjs");
var scope = this;

test("set_account_cookie",function() {
  var user_info = {
    id: "/user/goober",
    mid: "/m/02kw8rn",
    username: "goober",
    name: "Goober McDweeb"
  };
  h.set_account_cookie(user_info);
  var cookie = acre.response.cookies["fb-account-name"];
  equal(cookie.value, "goober");
  equal(cookie.path, "/");
  equal(cookie.domain.indexOf("."), 0);
});

test("get_account_cookie",function() {
  acre.request.cookies["fb-account-name"] = "goober";
  var cookie = h.get_account_cookie();
  same(cookie, {id:"/user/goober", name:"goober"});
});

test("clear_account_cookie",function() {
  h.clear_account_cookie();
  var cookie = acre.response.cookies["fb-account-name"];
  equal(cookie.value, "");
  equal(cookie.path, "/");
  equal(cookie.domain.indexOf("."), 0);
  equal(cookie.max_age, 0);
});

test("account_provider",function() {
  var provider = h.account_provider();
  same(provider.cookie, h.account_cookie_options());
  var writeuser_provider = h.account_provider("freebase_writeuser");
  notEqual(provider, writeuser_provider);
});


acre.test.report();

