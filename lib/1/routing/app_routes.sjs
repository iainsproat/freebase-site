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

/**
  Routes for mapping between url space to apps/scripts
  1. There must be a 1-1 mapping between a url prefix and (app,script) combo
  2. Please place your app in the correct section depending on type of url
  3. If you are ever taking away a url for a user-facing app then you
     must provide a legacy redirect to an appropriate page.
 */

var router = acre.require("routing/router");
var rules = new router.PrefixRouter();

var app_labels = {
  "admin"             : "//12f.admin.site.tags.svn.freebase-site.googlecode.dev",
  "appeditor"         : "//appeditor.site.freebase.dev",
  "appeditor-services": "//appeditor-services.site.freebase.dev",
  "apps"              : "//apps.site.freebase.dev",
  "cubed"             : "//cubed.dfhuynh.user.dev",
  "cuecard"           : "//cuecard.site.freebase.dev",
  "codemirror"        : "//codemirror.site.freebase.dev",
  "devdocs"           : "//devdocs.site.freebase.dev",
  "domain"            : "//domain.site.freebase.dev",
  "error"             : "//error.site.freebase.dev",
  "homepage"          : "//homepage.site.freebase.dev",
  "labs"              : "//labs-site.dfhuynh.user.dev",
  "parallax"          : "//parallax.dfhuynh.user.dev",
  "permission"        : "//permission.site.freebase.dev",
  "policies"          : "//policies.site.freebase.dev",
  "queryeditor"       : "//cuecard.dfhuynh.user.dev",
  "sample"            : "//sample.site.freebase.dev",
  "app_template_barebones"  : "//app_template_barebones.site.freebase.dev",
  "app_template_freebase"   : "//app_template_freebase.site.freebase.dev",
  "schema"            : "//schema.site.freebase.dev",
  "tasks"             : "//tasks.site.freebase.dev",
  "tmt"               : "//tmt.zenkat.user.dev",
  "toolbox"           : "//toolbox.site.freebase.dev",
  "topicblocks"       : "//topicbox.daepark.user.dev",
  "triples"           : "//triples.site.freebase.dev",
  "template"          : "//template.site.freebase.dev"
};

// map[path] = app label
var _app_paths = {};
for (var app in app_labels) {
  var path = app_labels[app];
  _app_paths[path] = app;
}
function get_app(path, version) {
  return _app_paths[path];
};

// add test routing rules to test non-user facing apps (core libraries, etc.)
if (!/www.(freebase|sandbox\-freebase)\.com$/.test(acre.request.server_name)) {
  var tests = [
    "/test/core", "core", "//core.site.freebase.dev",
    "/test/i18n", "i18n", "//i18n.site.freebase.dev",
    "/test/manifest", "manifest", "//manifest.site.freebase.dev",
    "/test/promise", "promise", "//promise.site.freebase.dev",
    "/test/queries", "queries", "//queries.site.freebase.dev",
    "/test/routing", "routing", "//routing.site.freebase.dev",
    "/test/test", "test", "//test.site.freebase.dev",
    "/test/validator", "validator", "//validator.site.freebase.dev"
  ];
  for (var i=0,l=tests.length; i<l; i+=3) {
    var prefix = tests[i];
    var app_label = tests[i+1];
    var path = tests[i+2];
    app_labels[app_label] = path;
    _app_paths[path] = app_label;
    rules.add([{prefix:prefix, app:app_label}]);
  }
}

// Urls for user-facing apps
rules.add([
  {prefix:"/",                   app:"homepage", script: "index"},
  {prefix:"/index",              url:"/", redirect:301},
  {prefix:"/home",               app:"homepage", script: "home"},
  {prefix:"/homepage",           app:"homepage"},
  {prefix:"/schema",             app:"schema"},
  {prefix:"/apps",               app:"apps"},
  {prefix:"/docs",               app:"devdocs"},
  {prefix:"/policies",           app:"policies"},
  {prefix:"/appeditor",          app:"appeditor"},
  {prefix:"/about",              app:"about"},
  {prefix:"/labs/cubed",         app:"cubed"},
  {prefix:"/labs/parallax",      app:"parallax"},
  {prefix:"/labs",               app:"labs"},
  {prefix:"/queryeditor",        app:"queryeditor"},
  {prefix:"/inspect",            app:"triples"}
]);

// Urls for exposed ajax libraries and static resources
rules.add([
  {prefix:"/permission",         app:"permission"},
  {prefix:"/toolbox",            app:"toolbox"},
  {prefix:"/cuecard",            app:"cuecard" },
  {prefix:"/appeditor/services", app:"appeditor-services" },
  {prefix:"/template",           app:"template"},
  {prefix:"/codemirror",         app:"codemirror"}
]);

// Urls for administrative tools
rules.add([
  {prefix:"/app/admin",          app:"admin"},
  {prefix:"/app/tmt",            app:"tmt"}
]);

// Urls for development purposes only
rules.add([
  {prefix:"/sample",             app:"sample"},
  {prefix:"/app_template_barebones",  app:"app_template_barebones"},
  {prefix:"/app_template_freebase",   app:"app_template_freebase"}
]);

// Redirects for legacy urls
rules.add([
  // Signin
  {prefix:"/signin/recoverPassword",   url:"/signin/recoverpassword", redirect:301},
  {prefix:"/signin/recoverPassword3",  url:"/signin/changepassword", redirect:301},
  {prefix:"/private/account/activate", url:"/signin/activate", redirect:301},
  {prefix:"/signin/app",               url:"/signin/authorize_token", redirect:301},

  // Account settings
  {prefix:"/view/account",       url:"/user/settings/account", redirect:301},
  {prefix:"/user/account",       url:"/user/settings/account", redirect:301},

  // Wiki
  {prefix:"/help",               url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/help/faq",           url:"http://wiki.freebase.com/wiki/FAQ", redirect:301},
  {prefix:"/developer",          url:"http://wiki.freebase.com/wiki/Developers", redirect:301},
  {prefix:"/view/developer",     url:"http://wiki.freebase.com/wiki/Developers", redirect:301},
  {prefix:"/view/faq",           url:"http://wiki.freebase.com/wiki/FAQ", redirect:301},
  {prefix:"/view/documentation", url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/view/helpsearch",    url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/view/helpcenter",    url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/view/tutorial",      url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/view/discussionhub", url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/discuss/hub",        url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/tools",              url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/community",          url:"http://wiki.freebase.com", redirect:301},
  {prefix:"/build",              url:"http://wiki.freebase.com", redirect:301},

  // Feedback
  {prefix:"/view/feedback",        url:"/site/feedback", redirect:301},
  {prefix:"/view/feedback_thanks", url:"/site/feedback_thanks", redirect:301},

  // Discuss
  {prefix:"/view/discuss",       url:"/discuss/threads", redirect:301},
  {prefix:"/view/mydiscuss",     url:"/user/replies", redirect:301},
  {prefix:"/user/discuss",       url:"/user/replies", redirect:301},

  // Homepage
  {prefix:"/view/mydomains",     url:"/home", redirect:301},
  {prefix:"/user/domains",       url:"/home", redirect:301},
  {prefix:"/signin",             url:"/", redirect:301},
  {prefix:"/signin/signin",      url:"/", redirect:301},
  {prefix:"/signin/signin.html", url:"/", redirect:301},
  {prefix:"/site/data",          url:"/", redirect:301},
  {prefix:"/view/allDomains",    url:"/", redirect:301},
  {prefix:"/data",               url:"/", redirect:301},
  {prefix:"/explore",            url:"/", redirect:301},

  // User profile
  {prefix:"/view/user",          url:"/user/profile", redirect:301},

  // History
  {prefix:"/view/history",       url:"/history/view", redirect:301},
  {prefix:"/history/user",       url:"/history/view", redirect:301},
  {prefix:"/history/topic",      url:"/history/view", redirect:301},

  // Schema
  {prefix:"/view/schema",        url:"/schema", redirect:301},
  {prefix:"/tools/schema",       url:"/schema", redirect:301},
  {prefix:"/type/schema",        url:"/schema", redirect: 301},

  // Queryeditor
  {prefix:"/app/queryeditor",    url:"/queryeditor", redirect:301},
  {prefix:"/tools/queryeditor",  url:"/queryeditor", redirect:301},
  {prefix:"/view/queryeditor",   url:"/queryeditor", redirect:301},

  // Inspect
  {prefix:"/tools/explore",      url:"/inspect", redirect:301},
  {prefix:"/tools/explore2",     url:"/inspect", redirect:301},

  // Appeditor
  {prefix:"/tools/appeditor",    url:"/appeditor", redirect:301},

  // Review queue
  {prefix:"/tools/pipeline/home",     url:"/tools/flags/review", redirect:301},
  {prefix:"/tools/pipeline/showtask", url:"/tools/flags/review", redirect:301},

  // List Importer
  {prefix:"/import/list",        url:"/importer/list", redirect:301},

  // Search
  {prefix:"/view/search",        url:"/search", redirect:301},

  // Policies
  {prefix:"/signin/tos",         url:"/policies/tos", redirect:301},
  {prefix:"/signin/cc",          url:"/policies/copyright", redirect:301},
  {prefix:"/signin/freebaseid",  url:"/policies/freebaseid", redirect:301},
  {prefix:"/signin/licensing",   url:"/policies/licensing", redirect:301},
  {prefix:"/signin/privacy",     url:"/policies/privacy", redirect:301},

  // View
  {prefix:"/view/filter",           url:"/view", redirect:301},
  {prefix:"/view/domain",           url:"/view", redirect:301},
  {prefix:"/view/image",            url:"/view", redirect:301},
  {prefix:"/view/document",         url:"/view", redirect:301},
  {prefix:"/view/usergroup",        url:"/view", redirect:301},
  {prefix:"/view/fb",               url:"/view", redirect:301},
  {prefix:"/view/query",            url:"/view", redirect:301},
  {prefix:"/view/api/metaweb/view", url:"/view", redirect:301},
  {prefix:"/view/guid/filter",      url:"/view", redirect:301},
  {prefix:"/helptopic",             url:"/view", redirect:301},
  {prefix:"/view/help",             url:"/view", redirect:301},
  {prefix:"/iv/fb",                 url:"/edit/topic", redirect:301},

  // Other
  {prefix:"/view/userdomains",      url:"/domain/users", redirect:301},
  {prefix:"/newsfeed",              url:"/private/newsfeed", redirect:301}
]);

// Host redirects
var host_redirects = {
  "freebase.com": "http://www.freebase.com",
  "sandbox-freebase.com": "http://www.sandbox-freebase.com",
  "sandbox.freebase.com": "http://www.sandbox-freebase.com",
  "acre.freebase.com": "http://www.freebase.com/appeditor",
  "acre.sandbox-freebase.com": "http://www.sandbox-freebase.com/appeditor",
  "api.freebase.com": "http://wiki.freebase.com/wiki/Freebase_API",
  "api.sandbox-freebase.com": "http://wiki.freebase.com/wiki/Freebase_API"
};

// Dump all routing info and rules.
// This is primarily for our automated buildbot/testrunners
if (acre.current_script === acre.request.script) {
  var all_routes = rules.all_routes();
  var config = {
    app_labels: app_labels,
    app_paths: _app_paths,
    rules: all_routes
  };
  acre.write(JSON.stringify(config, null, 2));
}
