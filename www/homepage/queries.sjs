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

var h = acre.require("helpers");
var i18n = acre.require("lib/i18n/i18n.sjs");
var schema_helpers = acre.require("helpers.sjs");
var feeds = acre.require('feeds');

var apis = acre.require("lib/promise/apis");
var freebase = apis.freebase;
var urlfetch = apis.urlfetch;
var deferred = apis.deferred;

/**
 * Get all "commons" domains. Domains with a key in "/".
 */
function common_domains() {
  var q = [{
    id: null,
    guid: null,
    name: i18n.mql.query.name(),
    type: "/type/domain",
    key: [{namespace: "/", limit: 0}],
    types: {"id": null, type: "/type/type", "return": "count"}
  }];
  return domains(q);
};

/**
 * Get all "commons" domains, an corresponding
 * topic fact counts
 */
function domains_topics_facts() {
  var q = [{
    id: null,
    guid: null,
    name: i18n.mql.query.name(),
    type: "/type/domain",
    key: [{namespace: "/", limit: 0}],
    types: {"id": null, type: "/type/type", "return": "count"}
  }];

  return freebase.mqlread(q)
    .then(function(envelope) {
      return envelope.result || [];
    })
    .then(function(domains) {
      // attach topic/fact counts to domains
      return _domain_topics_facts(domains);
    })
    .then(function(domains) {
      // calculate percentage values for bar graph display
      return _convert_totals_percentages(domains);
    })
    .then(function(domains) {
      // sort by topic count
      return domains.sort(sort_by_topic_count);
    });
};

function sort_by_topic_count(a,b) {
  return b.topics.value > a.topics.value;
};

function _domain_topics_facts(domains) {
  var promises = [];
  // Get activity for each domain
  domains.forEach(function(domain) {

    promises.push(freebase.get_static("activity", "summary_"+domain.guid.replace("#", "/guid/"))
      .then(function(activity) {
        if (!activity) {return activity;}

        domain.topics = {
          value: activity.total.t
        }
        domain.facts = {
          value: activity.total.e
        }

        return activity;
      }));
  });
  return deferred.all(promises).then(function() {return domains;});
};

function logx(val, base) {
  return Math.log(val) / Math.log(base);
};

function _convert_totals_percentages(domains) {

  // figure out the largest value for each object
  // I can't figure out how to do this without iterating
  // through the domain object twice: once to find higest
  // value for topics/facts, and the second to derive percent
  // of all other values
  var topics = [];
  var facts = [];

  domains.forEach(function(d) {
    topics.push(d.topics.value);
    facts.push(d.facts.value);
  });

  // get higest count of each group
  //var max_topic_count = Math.max.apply(Math, topics);
  //var max_fact_count = Math.max.apply(Math, facts);

  // get higest count of each group
  var max_topic_count = logx(Math.max.apply(Math, topics), 1.1);
  var max_fact_count = logx(Math.max.apply(Math, facts), 1.1);

  // divide to get perentage and re-attach
  // to the domain object

  var max_topics = 0,
      max_facts = 0;

  domains.forEach(function(d) {
    //d.topics.percent = Math.round((d.topics.value / max_topic_count) * 100) + "%";
    //d.facts.percent = Math.round((d.facts.value / max_fact_count) * 100) + "%";

    //d.topics.percent = Math.round((logx(d.topics.value, 1.1) / max_topic_count) * 100) + "%";
    //d.facts.percent = Math.round((logx(d.facts.value, 1.1) / max_fact_count) * 100) + "%";

    if (d.topics.value > max_topics) {
      max_topics = d.topics.value;
    }
    if (d.facts.value > max_facts) {
      max_facts = d.facts.value;
    }
  });

  domains.forEach(function(d) {
    d.topics.percent = (d.topics.value / max_topics) * 100;
    d.facts.percent = (d.facts.value / max_facts) * 100;
  });

  max_topics = 0,
  max_facts = 0;

  domains.forEach(function(d) {
    d.topics.log = Math.log(d.topics.percent + 1);
    if (d.topics.log > max_topics) {
      max_topics = d.topics.log;
    }
    d.facts.log = Math.log(d.facts.percent + 1);
    if (d.facts.log > max_facts) {
      max_facts = d.facts.log;
    }
  });



  domains.forEach(function(d) {
    d.topics.log = Math.max(Math.round(d.topics.log * 100/ max_topics), 1);
    d.facts.log = Math.max(Math.round(d.facts.log * 100 / max_facts), 1);




  });



  return domains;
};

/**
 * Do domains query and for each domain, get instance counts (activity bdb).
 */
function domains(q) {
  return freebase.mqlread(q)
    .then(function(envelope) {
      return envelope.result || [];
    })
    .then(function(domains) {
      return add_domain_activity(domains);
    })
    .then(function(domains) {
      return domains.sort(schema_helpers.sort_by_id);
    });
};

function groupBy(array, key) {
  var res = {};
  array.forEach(function(x) {
    var k = (typeof key === "function" ? key.apply(this, [x]) : x[key]);
    var v = res[k];
    if (!v) { v = res[k] = []; }
    v.push(x);
  });
  return res;
}

var categories = function () {
  var q_categories = acre.require("categories").query;

  return freebase.mqlread(q_categories)
    .then(function(envelope) {
      return envelope.result.map(function(category) {
        return {
          "id": category.id,
          "name": category.name
        };
      });
    }, function(error) {
      return [];
    });
};

var all_domains = function(commons_only) {
  var q_domains = acre.require("domain_info");
  if (commons_only) {
    q_domains = q_domains.extend({"key": {"namespace": "/", "limit": 0}});
  }

  return freebase.mqlread(q_domains.query)
    .then(function(envelope) {
      return envelope.result.map(function(domain) {
        return {
          "id": domain.id,
          "name": domain.name
        };
      });
    }, function (error) {
      return [];
    });
};

var alphabetically_grouped_domains = function(commons_only) {
  return all_domains(commons_only)
    .then(function(domains) {
      return groupBy(domains, function(r) {
        return r.name[0].toLowerCase();
      });
    });
};

function get_top_user(users) {
  var top_user = {e:0};
  for (var userid in users) {
    var edits = users[userid];
    if (edits > top_user.e) {
      top_user = {"e": edits, "id": userid};
    }
  }
  return top_user.e > 0 ? top_user : null;
}

var add_domain_activity = function(domains) {
  var promises = [];

  // Get activity for each domain
  domains.forEach(function(domain) {

    promises.push(freebase.get_static("activity", "summary_"+domain.guid.replace("#", "/guid/"))
      .then(function(activity) {
        if (!activity) {return activity;}

        domain.activity = activity;

        domain.top_user = get_top_user(activity.users.h);
        if (!domain.top_user) {
          domain.top_user = get_top_user(activity.users.s);
        }

        return activity;
      }));
  });

  return deferred.all(promises).then(function() {return domains;});
};

var process_domains = function(envelope) {
  return envelope.result.map(function(domain) {
    return {
      "id": domain.id,
      "guid": domain.guid,
      "name": domain.name,
      "member_count": domain["/freebase/domain_profile/users"] || 0
    };
  });
};

var domains_for_ids = function(domain_ids) {
  if (!domain_ids || domain_ids.length === 0) {
    return [];
  }

  var q_domains = acre.require("domain_info").extend(
    {"id|=": domain_ids}
  );

  return freebase.mqlread(q_domains.query)
    .then(process_domains)
    .then(add_domain_activity);
};

var domains_for_category = function(category_id) {
  var q_category = acre.require("domain_info").extend(
    {"!/freebase/domain_category/domains.id": category_id}
  );

  return freebase.mqlread(q_category.query)
    .then(process_domains)
    .then(add_domain_activity);
};

var domains_for_letter = function(letter) {
  var q_commons = acre.require("domain_info").extend({
    "letter:name~=": "^"+letter+"*",
    "key": {"namespace": "/", "limit": 0},
    "limit": 100
  });
  var q_bases = acre.require("domain_info").extend({
    "letter:name~=": "^"+letter+"*",
    "key": {"namespace": "/base", "limit": 0},
    "limit": 100,
    "/freebase/domain_profile/hidden": {
      "value": true,
      "optional": "forbidden"
    },
    "types": [{
      "type": "/type/type",
      "!/freebase/domain_profile/base_type": {
        "id": null,
        "optional": "forbidden"
      },
      "instance": {"return": "estimate-count"}
    }],
    "/freebase/domain_profile/featured_views": {"return": "estimate-count"}
  });

  var p_commons = freebase.mqlread(q_commons.query);
  var p_bases = freebase.mqlread(q_bases.query)
    .then(function(envelope) {
      envelope.result = envelope.result.filter(function(domain) {
        if (domain["/freebase/domain_profile/featured_views"] < 6) {
          return false;
        }

        var instances = 0;
        domain.types.forEach(function(type) {
          instances += type.instance;
        });
        if (instances < 100) {
          return false;
        }
        return true;
      });
      return envelope;
    });

  return deferred.all([p_commons, p_bases])
    .then(function([commons, bases]) {
      return {"result": commons.result.concat(bases.result)};
    })
    .then(process_domains)
    .then(add_domain_activity);
};

var domains_for_user = function(user_id) {
  var q_members = [{
    "id": null,
    "type": "/type/domain",
    "/freebase/domain_profile/users": {"id": user_id},
    "limit": 1000
  }];
  var q_admins = [{
    "id": null,
    "type": "/type/domain",
    "/type/domain/owners": {
      "/type/usergroup/member": {"id": user_id},
      "limit": 0
    },
    "limit": 1000
  }];

  return deferred.all([freebase.mqlread(q_members), freebase.mqlread(q_admins)])
    .then(function(envelopes) {
      var ids = [];
      envelopes.forEach(function(envelope) {
        envelope.result.forEach(function(domain) {
          ids.push(domain.id);
        });
      });

      return domains_for_ids(ids)
        .then(function(domains) {
          domains.forEach(function(domain) {
            if (domain.id === user_id+"/default_domain") {
              domain.name = domain.name.replace("types", "profile");
            }
          });
          return domains;
        });
    });
};

var messages = function(user_id) {
  var q_messages = acre.require("messages")
    .extend({"post.author.id": user_id})
    .extend({"replies:post.author.id!=": user_id})
    .query;

  return freebase.mqlread(q_messages)
    .then(function(envelope) {
      var message_count = 0;
      envelope.result.forEach(function(result) {
        var replies = result['replies:post'];
        var timestamp = result.post.timestamp;

        replies.forEach(function(reply) {
          if (reply.timestamp > timestamp) {
            message_count += 1;
          }
        });
      });

      return message_count;
    });
};

var user_info = function(user_id) {
  var deferreds = {};
  var q_user = acre.require("user_info").extend({"id": user_id}).query;
  deferreds.user = freebase.mqlread(q_user);
  deferreds.activity = freebase.get_static("activity", user_id);
  deferreds.messages = messages(user_id);

  return deferred.all(deferreds)
    .then(function(results) {
      var user = results.user.result;
      var activity = results.activity || {};

      return {
        "id": user.id,
        "name": user.name,
        "created": acre.freebase.date_from_iso(user.timestamp),
        "following_count": user['/freebase/user_profile/watched_items'] || 0,
        "followers_count": user['!/freebase/user_profile/watched_items'] || 0,
        "messages_count": results.messages || 0,
        "assertions": activity.total || 0
      };
    });
};

var is_registration_off = function() {
  return freebase.mqlread({
      "id": "/freebase/maintenance",
      "/freebase/maintenance_profile/registration_off": null
    })
    .then(function(envelope) {
      return envelope.result["/freebase/maintenance_profile/registration_off"];
    });
};

var has_membership = function(user_id) {
  var q_members = [{
    "id": null,
    "type": "/type/domain",
    "/freebase/domain_profile/users": {"id": user_id},
    "limit": 2
  }];
  var q_admins = [{
    "id": null,
    "type": "/type/domain",
    "/type/domain/owners": {
      "/type/usergroup/member": {"id": user_id},
      "limit": 0
    },
    "limit": 2
  }];

  return deferred.all([freebase.mqlread(q_members), freebase.mqlread(q_admins)])
    .then(function(envelopes) {
      var domain_count = false;
      envelopes.forEach(function(envelope) {
        domain_count += envelope.result.length;
      });
      return domain_count > 1;
    });
};

///////////////////
// Freebase Blog //
///////////////////
function blog_entries(maxcount) {
  maxcount = maxcount || 2;
  var url = 'http://blog.freebase.com';
  var rss_url = 'http://feeds.feedburner.com/FreebaseBlog'; // skip blog.freebase.com/feed redirect for speed
  return feeds.get_rss_entries(rss_url, maxcount)
    .then(null, function(error) {return [];})
    .then(function(items) {
      return {items:items, url:url, rss_url:rss_url};
    });
}

///////////////////
// Freebase Wiki //
///////////////////
function wiki_entries(maxcount) {
  maxcount = maxcount || 2;
  var url = 'http://wiki.freebase.com';
  var rss_url = url + '/w/index.php?title=Special:RecentChanges&feed=rss';
  var user_url = url + '/wiki/User';
  return feeds.get_rss_entries(rss_url, maxcount, feeds.filter_wiki_entries)
    .then(null, function(error) {return [];})
    .then(function(items) {
      items.forEach(function(item) {
        var link_url = h.parse_uri(item.link);
        if (link_url.params.title) {
          item.link = h.wiki_url(link_url.params.title);
        }
      });

      return {items:items, url:url, rss_url:rss_url, user_url:user_url};
    });
}


