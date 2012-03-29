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

var apis = acre.require("lib/promise/apis.sjs");
var freebase = apis.freebase;
var deferred = apis.deferred;
var article = are.require("lib/queries/article.sjs");
var create_article = acre.require("lib/queries/create_article.sjs").create_article;
var update_article = acre.require("lib/queries/update_article.sjs").update_article;
var validators = acre.require("lib/validator/validators.sjs");
var i18n = acre.require("lib/i18n/i18n.sjs");

/**
 * Update an existing domain values (name, key, description).
 *
 * @param o:Object (required) - options specifying the updated values.
 */
function update_domain(options) {
  var o;
  try {
    o = {
      // required
      id: validators.MqlId(options, "id", {required:true}),

      // optional
      name: validators.String(options, "name", {if_empty:null}),
      namespace: validators.MqlId(options, "namespace", {if_empty:null}),  // assuming has permission on namespace
      key: validators.DomainKey(options, "key", {if_empty:null}),
      description: validators.String(options, "description", {if_empty:null}),
      lang: validators.LangId(options, "lang", {if_empty:"/lang/en"}),

      // an array of options to remove/delete (name, key, description);
      remove: validators.Array(options, "remove", {if_empty:[]})
    };
  }
  catch(e if e instanceof validators.Invalid) {
    return deferred.rejected(e);
  }

  var remove = {};
  o.remove.forEach(function(k) {
    remove[k] = true;
    o[k] = null;
  });


  var promises = {
      domain: freebase.mqlread({
              id: o.id,
              guid: null,
              mid: null,
              key: [{namespace:null,value:null,optional:true}],
              name: {value:null, lang:o.lang, optional:true}
          })
          .then(function(env) {
              return env.result;
          }),
      article: article.get_article(o.id, null, null, o.lang)
          .then(function(r) {
              return r[o.id];
          })
  };
  return deferred.all(promises)
    .then(function(r) {
      var old = r.domain;
      old["/common/topic/article"] = r.article;

      if (remove.key && o.namespace) {
        // delete key from o.namespace (required)
        for (var i=0,l=old.key.length; i<l; i++) {
          var k = old.key[i];
          if (k.namespace === o.namespace) {
            return freebase.mqlwrite({guid:old.guid, id:null, key:{namespace:o.namespace, value:k.value, connect:"delete"}})
              .then(function(env) {
                // old id may no longer be valid since we deleted the key
                old.id = env.result.id;
                return old;
              });
          }
        }
      }
      else if (o.namespace && o.key) {
        for (var i=0,l=old.key.length; i<l; i++) {
          var k = old.key[i];
          if (k.namespace === o.namespace && k.value !== o.key) {
            return freebase.mqlwrite({guid:old.guid, key:{namespace:o.namespace, value:k.value, connect:"delete"}})
              .then(function(env) {
                // insert new key
                return freebase.mqlwrite({guid:old.guid, id:null, key:{namespace:o.namespace, value:o.key, connect:"insert"}})
                  .then(function(env) {
                    // id may have changed
                    old.id = env.result.id;
                    return old;
                  });
              });
            }
        }
      }
      return old;
    })
    .then(function(old) {
      var update = {
        guid: old.guid
      };
      if (remove.name && old.name) {
        update.name = {value:old.name.value, lang:old.name.lang, connect:"delete"};
      }
      else if (o.name != null) {
        update.name = {value:o.name, lang:o.lang, connect:"update"};
      }
      var d = old;
      var keys = ["name"];
      for (var i=0,l=keys.length; i<l; i++) {
        if (keys[i] in update) {
          d = freebase.mqlwrite(update)
            .then(function(env) {
              return old;
            });
          break;
        }
      }
      return d;
    })
    .then(function(old) {
      var article = article.get_document_node(old, null, o.lang);
      if (remove.description && article) {
        return freebase.mqlwrite({id:old.mid, "/common/topic/article":{id:article.id, connect:"delete"}})
          .then(function() {
            return old.id;
          });
      }
      else if (o.description != null) {
        var promise;
        if (article) {
            promise = update_article(article.id, o.description, "text/plain", {
                lang: o.lang,
                use_permission_of: old.mid
            });
        }
        else {
            promise = create_article(old.mid, o.description, "text/plain", {
                lang: o.lang,
                use_permission_of: old.mid
            });                                      
        }
        return promise
          .then(function() {
              return old.id;
          });
      }
      return old.id;
    });
};
