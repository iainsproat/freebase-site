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

var queries = acre.require("queries");

var FEATURED_DOMAIN_IDS =  [
  "/tv", "/film", "/book",
  "/people", "/location", "/business",
  "/government", "/music"
];

function domain_sort(func) {
  return function(a, b) {
    if (a.id.match("/default_domain$")) {
      return -1;
    } else if (b.id.match("/default_domain$")) {
      return 1;
    } else {
      return func(a, b);
    }
  };
}

var cache_policy = "public";

var p_domains;
if (acre.request.params.category) {
  p_domains = queries.domains_for_category(acre.request.params.category);

} else if (acre.request.params.domains === "featured") {
  p_domains = queries.domains_for_ids(FEATURED_DOMAIN_IDS);

} else if (acre.request.params.domains === "all") {
  acre.require("lib/template/renderer").render_def(
    null,
    acre.require("templates"),
    "domain_toc_panel",
    queries.alphabetically_grouped_domains(true)
  );
  acre.require("lib/core/cache").set_cache_policy(cache_policy);
  acre.exit();
} else if (acre.request.params.domains) {
  p_domains = queries.domains_for_letter(acre.request.params.domains);

} else if (acre.request.params.user) {
  cache_policy = "private";
  p_domains = queries.domains_for_user(acre.request.params.user);
}

p_domains
  .then(function(domains) {

    // Sort the domains as specified
    if (acre.request.params.sort === "name") {
      // Sort domains alphabetically by name
      return domains.sort(domain_sort(function(a, b) {
        if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        } else {
          return 0;
        }
      }));

    } else if (acre.request.params.sort === "members") {
       // Sort domains by total members
       return domains.sort(domain_sort(function(a, b) {
         return b.member_count - a.member_count;
       }));

    } else if (acre.request.params.sort === "facts") {
      // Sort domains by total facts
      return domains.sort(domain_sort(function(a, b) {
        var a_facts = a.activity ? a.activity.total.e : 0;
        var b_facts = b.activity ? b.activity.total.e : 0;
        return b_facts - a_facts;
      }));

    } else if (acre.request.params.sort === "topics") {
       // Sort domains by total topics
       return domains.sort(domain_sort(function(a, b) {
         var a_topics = a.activity ? a.activity.total.t : 0;
         var b_topics = b.activity ? b.activity.total.t : 0;
         return b_topics - a_topics;
       }));

    } else {
      // Sort domains by recent activity
      return domains.sort(domain_sort(function(a, b) {
        var a_activity = a.activity ? a.activity.weeks[a.activity.weeks.length-1].e : 0;
        var b_activity = b.activity ? b.activity.weeks[b.activity.weeks.length-1].e : 0;
        return b_activity - a_activity;
      }));
    }
  });

acre.require("lib/template/renderer").render_def(
  null,
  acre.require("templates"),
  "category_panel",
  p_domains
);

acre.require("lib/core/cache").set_cache_policy(cache_policy);
