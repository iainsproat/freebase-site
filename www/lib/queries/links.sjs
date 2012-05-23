/*
 * Copyright 2012, Google Inc.
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
var i18n = acre.require("i18n/i18n.sjs");
var h = acre.require("helper/helpers.sjs");
var apis = acre.require("promise/apis.sjs");
var deferred = apis.deferred;
var freebase = apis.freebase;
var fh = acre.require("filter/helpers.sjs");
var proploader = acre.require("schema/proploader.sjs");
var creator = acre.require("queries/creator.sjs");

function links(id, filters, next) {
  filters = h.extend({}, filters);
  return creator.by(filters.creator, "/type/user")
    .then(function(creator_clause) {
      var promises = {
        incoming: links_incoming(id, filters, next, creator_clause),
        outgoing: links_outgoing(id, filters, next, creator_clause)
      };
      return deferred.all(promises)
        .then(function(result) {
          return links_sort(result.incoming, result.outgoing, filters);
        });
    });
};

function links_sort(a, b, filters) {
  if (a.length && b.length) {
    // TODO: assert a, b are sorted -timestamp
    var i;
    var a_ts = a[a.length - 1].timestamp;  // last timestamp of incoming
    var b_ts = b[b.length - 1].timestamp;  // last timestamp of outgoing
    if (a_ts < b_ts) {
      a = a.filter(function(l) {
        return l.timestamp > b_ts;
      });
    }
    else {
      b = b.filter(function(l) {
        return l.timestamp > a_ts;
      });
    }
  }
  return a.concat(b).sort(function(a, b) {
    return b.timestamp > a.timestamp;
  });
};

function links_incoming(id, filters, next, creator_clause) {
    filters = filters || {};
    var promises = {        
        links_incoming_master: 
                links_incoming_master(id, filters, next, creator_clause)
    };
    if (filters.domain || filters.type || filters.property) {
        /**
         * When filtering by domain, type, or property, 
         * we need to also consider the incoming master's
         * reverse_property. 
         * 
         * For example, the reverse_property of 
         * /music/album/artist is /music/artist/album.
         * So when the filter property=/music/artist/album,
         * we need to pick up the /music/album/artist links.
         * 
         * However, in order to prevent duplicates in
         * links_incoming_master and link_incoming_reverse,
         * we need to "forbid" the domain or type 
         * the reverse_property belongs to.
         * 
         * For example, when the filter domain=/music,
         * We will get both /music/album/artist (master_property)
         * and /music/artist/album (reverse_property), which are
         * the same links.
         */
        var forbid_clause;
        if (filters.domain) {
            forbid_clause = {
                "forbid:master_property": {
                        schema: {
                            domain: {
                                id: filters.domain,
                                optional: "forbidden"
                            }
                        }
                }
            };
        }
        else if (filters.type) {
            forbid_clause = {
                "forbid:master_property": {
                        schema: {
                            id: filters.type,
                            optional: "forbidden"
                        }
                    }
            };
        }        
        promises.links_incoming_reverse = 
            links_incoming_reverse(id, filters, next, creator_clause, forbid_clause);
    }
    return deferred.all(promises)
        .then(function(r) {
            var incoming = r.links_incoming_master || [];
            if (r.links_incoming_reverse) {
                incoming = links_sort(incoming, r.links_incoming_reverse, filters);
            }  
            return incoming;
        });
};

function links_incoming_master(id, filters, next, creator_clause, extend_clause) {
    var q = h.extend(links_incoming_query(id), creator_clause, extend_clause);
    if (next) {
        q['next:timestamp<'] = next;
    }
    apply_filters(q, filters);
    return freebase.mqlread([q], mqlread_options(filters))
        .then(function(env) {
            return env.result;
        });
};

function links_incoming_reverse(id, filters, next, creator_clause, extend_clause) {
    var q = h.extend(links_incoming_query(id), creator_clause, extend_clause);
    q.master_property.reverse_property = {
        id: null
    };
    if (next) {
        q['next:timestamp<'] = next;
    }
    apply_filters(q, filters);
    return freebase.mqlread([q], mqlread_options(filters))
        .then(function(env) {
            return env.result;
        });
};

function links_incoming_query(target) {
  return {
    type: "/type/link",
    master_property: {
      id: null
    },
    source: {id:null, mid:null, guid:null, name:i18n.mql.query.name()},
    "me:target": {id:target, guid:null},
    target_value: {},
    timestamp: null,
    sort: "-timestamp",
    optional: true
  };
};

function links_outgoing(id, filters, next, creator_clause) {
  var q = [h.extend({
    type: "/type/link",
    master_property: {
      id: null,
      unit: {
        optional: true,
        id: null,
        type: "/type/unit",
        "/freebase/unit_profile/abbreviation": null
      }
    },
    "me:source": {id: id},
    target: {id:null, mid:null, guid:null, name:i18n.mql.query.name(), optional:true},
    target_value: {},
    timestamp: null,
    sort: "-timestamp",
    optional: true
  }, creator_clause)];
  if (next) {
    q[0]["next:timestamp<"] = next;
  }
  apply_filters(q[0], filters);
  return freebase.mqlread(q, mqlread_options(filters))
    .then(function(env) {
      return env.result;
    });
};

function writes(id, object_type, filters, next) {
  filters = h.extend({}, filters);
  return creator.by(id, object_type)
    .then(function(links_clause) {
      var q = h.extend(links_clause, {
        type: "/type/link",
        source: {
          optional: true,
          id: null,
          mid: null,
          guid: null,
          name: i18n.mql.query.name()
        },
        target: {
          optional: true,
          id: null,
          mid: null,
          name: i18n.mql.query.name()
        },
        master_property: {
          id: null,
          unit: {
            optional: true,
            id: null,
            type: "/type/unit",
            "/freebase/unit_profile/abbreviation": null
          }
        },
        target_value: {},
        timestamp: null,
        sort: "-timestamp",
        optional: true
      });
      if (next) {
        q["next:timestamp<"] = next;
      }
      apply_filters(q, filters);
      return freebase.mqlread([q], mqlread_options(filters))
        .then(function(env) {
          return env.result;
        });
    }, function() {
      return [];
    });
};

function property_links(id, filters, next) {
  return proploader.load(id)
    .then(function(prop) {
      var master_prop = id;
      if (prop.master_property) {
        master_prop = prop.master_property.id;
      }
      filters = h.extend({}, filters);
      return creator.by(filters.creator, "/type/user")
        .then(function(links_clause) {
          var q = h.extend(links_clause, {
            type: "/type/link",
            master_property: {
              id: master_prop,
              unit: {
                optional: true,
                id: null,
                type: "/type/unit",
                "/freebase/unit_profile/abbreviation": null
              }
            },
            source: {id:null, mid:null, guid:null, name:i18n.mql.query.name(), optional:true},
            target: {id:null, mid:null, name:i18n.mql.query.name(), optional:true},
            target_value: {},
            timestamp: null,
            sort: "-timestamp"
          });
          if (next) {
            q["next:timestamp<"] = next;
          }
          apply_filters(q, filters);
          return freebase.mqlread([q], mqlread_options(filters))
            .then(function(env) {
              return env.result;
            });
        });
    });
};


/**
 * Apply filter constraint helpers
 */

function apply_filters(clause, filters) {
  if (!filters) {
    return clause;
  }
  // creator is already applied in links query
  apply_limit(clause, filters.limit);
  apply_timestamp(clause, filters.timestamp);
  apply_historical(clause, filters.historical);
  apply_domain_type_property(clause, filters.domain, filters.type, filters.property);
};

function apply_limit(clause, limit) {
  if (limit) {
    clause.limit = limit;
  }
  return clause;
};

function apply_timestamp(clause, timestamp) {
  if (timestamp) {
    if (!h.isArray(timestamp)) {
      timestamp = [timestamp];
    }
    var len = timestamp.length;
    if (len === 1) {
      clause["filter:timestamp>="] = fh.timestamp(timestamp[0]);
    }
    else if (len === 2) {
      timestamp.sort(function(a,b) {
        return b < a;
      });
      clause["filter:timestamp>="] = fh.timestamp(timestamp[0]);
      clause["filter:timestamp<"] = fh.timestamp(timestamp[1]);
    }
  }
  return clause;
};

function apply_historical(clause, historical) {
  if (historical) {
    clause.valid = null;
    clause.operation = null;
  }
  return clause;
};

function apply_domain_type_property(clause, domain, type, property) {
    clause = clause || {};
    if (clause.master_property && clause.master_property.reverse_property) {
        // apply filter on master_property.reverse_property if it 
        // exists
        if (domain) {
            clause["filter:master_property"] = {
                reverse_property: {
                    schema:{domain:domain}
                }
            };
        }
        else if (type) {
            clause["filter:master_property"] = {
                reverse_property: {
                    schema:type
                }
            };
        }
        else if (property) {
            clause["filter:master_property"] = {
                reverse_property: property
            };
        }
    }
    else {
        if (domain) {
            clause["filter:master_property"] = {schema:{domain:domain}};
        }
        else if (type) {
            clause["filter:master_property"] = {schema:type};
        }
        else if (property) {
            clause["filter:master_property"] = property;
        }
    }
    return clause;
};

function mqlread_options(filters) {
  var options = {};
  if (!filters) {
    return options;
  }
  if (filters.as_of_time) {
    options.as_of_time = filters.as_of_time;
  }
  return options;
};
