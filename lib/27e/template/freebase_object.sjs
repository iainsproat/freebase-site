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

var topscope = this.__proto__;

var h = acre.require("helper/helpers.sjs");
var fh = acre.require("filter/helpers.sjs");
var service_lib = acre.require("handlers/service_lib.sjs");
var controller = acre.require("handlers/controller_handler.sjs");

function main(rule, object) {

  var tabs = rule.tabs = rule.tabs || [];
  var navs = rule.navs = rule.navs || [];
  var current_tab, current_nav, i, l;

  // look in tabs
  if (tabs.length) {
    for (i=0,l=tabs.length; i<l; i++) {
      var t = tabs[i];
      if (t.key in acre.request.params) {
        current_tab = t;
        break;
      }
    }
  }

  if (!current_tab) {
    // look in navs
    for (i=0,l=navs.length; i<l; i++) {
      var n = navs[i];
      if (n.key && n.key in acre.request.params) {
        current_nav = n;
        break;
      }
    }
  }

  if (!(current_tab || current_nav) && tabs.length) {
    current_tab = tabs[0];
  }

  var template_base_args = {
    object: object,
    tabs: tabs,
    current_tab: current_tab,
    navs: navs,
    filters: fh.global_filters(acre.request_params)
  };
  // extend object type (global) promises
  rule.promises && rule.promises.forEach(function(p) {
    var d = acre.require(p.app + "/" + p.script)[p.promise](object);
    template_base_args[p.key] = d;
  });

  var script, params;
  if (current_tab) {
    template_base_args.current_tab = current_tab;
    script = acre.require(current_tab.app + "/" + current_tab.script);
    params = current_tab.params;

    // extend tab promises
    current_tab.promises && current_tab.promises.forEach(function(p) {
      var d = acre.require(p.app + "/" + p.script)[p.promise](object);
      template_base_args[p.key] = d;
    });
  }
  else if (current_nav) {
    template_base_args.current_nav = current_nav;
    script = acre.require(current_nav.app + "/" + current_nav.script);
    params = current_nav.params;
  }
  else {
    throw "foo";
  }

  // Manually overlay tab context onto acre.request since we're not using acre.route
  h.extend(topscope.acre.request.params, template_base_args, params);
  topscope.acre.request.script = script.acre.current_script;

  var spec = script.SPEC;
  if (current_tab) {
    spec.template_base = "lib/template/freebase_object.mjt";
  }
  spec.template_base_args = template_base_args;

  // TODO (culbertson): try/catch and render error tab content on failure
  return controller.run_spec(spec, script);
};

