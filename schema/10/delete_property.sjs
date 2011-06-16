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
var deferred = acre.require("lib/promise/deferred");
var freebase = acre.require("lib/promise/apis").freebase;

/**
 * Delete a property. If the property is being "used", throws an exception unless force=true.
 * You can also pass dry_run=true to see what will be deleted.
 *
 * A property is "used" if one or moer of the following is true:
 *   1. it has one or more /type/link instances with the property as the master or reverse property.
 *   2. it has an incoming /type/property/master_property link
 *   3. it has one or more incoming /type/property/delegated link
 *
 * Delete property by:
 *   1. remove /type/property
 *   2. remove schema link
 *   3. remove keys from type
 *   4. remove expected_type
 *   5. remove master_property
 *   6. remove incoming /type/property/master_property, if you have permission
 *   7. remove delegated
 *   8. remove incoming /type/property/delegated on properties you have permission on
 *
 * @param prop_id:String (required) - property id
 * @param user_id:String (required) - user id permitted to delete this type
 * @param dry_run:Boolean (optional) - don't write, just return what will be deleted.
 *                                     dry_run takes precedence over force.
 * @param force:Boolean (optional) - delete property even if type is being "used"
 * @throws prop_info:Object if force != true and property is being "used".
 * @return a tuple [prop_info, result] where prop_info is what was deleted
 * and result is the mqlwrite result of deleting the property.
 */
function delete_property(prop_id, user_id, dry_run, force) {
  return prop_info(prop_id, user_id)
    .then(function(info) {
      if (dry_run) {
        return [info, null];
      }
      if (!force &&
          (info.used ||
           info.reverse_property.permitted ||
           info.reverse_property.not_permitted ||
           info.delegated_by.permitted.length ||
           info.delegated_by.not_permitted.length)) {
        throw deferred.rejected(JSON.stringify(info));
      }

      var q = {
        guid: info.guid,
        type: {id: "/type/property", connect: "delete"},
        "/type/property/schema": {id: info.schema.id, connect:"delete"},
        "/dataworld/gardening_task/async_delete": {value:true, connect:"update"}
      };

      if (info.key.length) {
        q.key = [{namespace:k.namespace, value:k.value, connect:"delete"} for each (k in info.key)];
      }
      if (info.expected_type) {
        q["/type/property/expected_type"] = {id:info.expected_type.id, connect:"delete"};
      }
      if (info.master_property) {
        q["/type/property/master_property"] = {id:info.master_property.id, connect:"delete"};
      }
      if (info.reverse_property.permitted) {
        q["/type/property/reverse_property"]  = {id:info.reverse_property.permitted.id, connect:"delete"};
      }
      if (info.delegated) {
        q["/type/property/delegated"]  = {id:info.delegated.id, connect:"delete"};
      }
      if (info.delegated_by.permitted.length) {
        q["!/type/property/delegated"] = [{id:d.id, connect:"delete"} for each (d in info.delegated_by.permitted)];
      }

      return freebase.mqlwrite(q)
        .then(function(env) {
          return env.result;
        })
        .then(function(result) {
          result.schema = result["/type/property/schema"];
          result.expected_type = result["/type/property/expected_type"];
          result.master_property = result["/type/property/master_property"];
          result.reverse_property = result["/type/property/reverse_property"];
          result.delegated = result["/type/property/delegated"];
          return [info, result];
        });
    });
};

/**
 * Undo delete_property.
 *
 * @param prop_info:Object (required) - the prop info returned by delete_property
 */
function undo(prop_info) {
  var q = {
    guid: prop_info.guid,
    type: {id: "/type/property", connect: "insert"},
    "/type/property/schema": {id: prop_info.schema.id, connect: "update"},
    "/dataworld/gardening_task/async_delete": {value:true, connect:"delete"}
  };
  if (prop_info.key.length) {
    q.key = [{namespace:k.namespace, value:k.value, connect:"insert"} for each (k in prop_info.key)];
  }
  if (prop_info.expected_type) {
    q["/type/property/expected_type"] = {id:prop_info.expected_type.id, connect:"update"};
  }
  if (prop_info.master_property) {
    q["/type/property/master_property"] = {id:prop_info.master_property.id, connect:"update"};
  }
  if (prop_info.reverse_property.permitted) {
    q["/type/property/reverse_property"]  = {id:prop_info.reverse_property.permitted.id, connect:"update"};
  }
  if (prop_info.delegated) {
    q["/type/property/delegated"] = {id:prop_info.delegated.id, connect:"update"};
  }
  if (prop_info.delegated_by.permitted.length) {
    q["!/type/property/delegated"] = [{id:d.id, connect:"insert"} for each (d in prop_info.delegated_by.permitted)];
  }
  return freebase.mqlwrite(q)
    .then(function(env) {
      return env.result;
    })
    .then(function(result) {
      // cleanup result
      result.schema = result["/type/property/schema"];
      result.expected_type = result["/type/property/expected_type"];
      result.master_property = result["/type/property/master_property"];
      result.reverse_property = result["/type/property/reverse_property"];
      result.delegated = result["/type/property/delegated"];
      return [prop_info, result];
    });
};


function prop_info(prop_id, user_id) {
  var promises = [];
  // prop info
  promises.push(prop_info_query(prop_id, user_id));
  // prop used?
  promises.push(queries.property_used(prop_id));
  return deferred.all(promises)
    .then(function([info, used]) {
      info.used = used;
      return info;
    });
};

function prop_info_query(prop_id, user_id) {
  var q = {
    id: prop_id,
    guid: null,
    mid: null,
    name: null,
    type: "/type/property",
    schema: {id: null, mid:null, name: null},
    key: [{
      optional: true,
      namespace: {
        id: null,
        mid: null,
        permission: [{permits: [{member: {id: user_id}}]}]
      },
      value: null
    }],
    expected_type: {
      id: null,
      mid: null,
      optional: true
    },
    master_property: {
      id: null,
      mid: null,
      optional: true
    },
    reverse_property: {
      id: null,
      mid: null,
      optional: true,
      permission: [{permits: [{member: {id: user_id}}]}]
    },
    "opp:reverse_property": {
      id: null,
      mid: null,
      optional: true,
      permission:[{"permits": [{optional:"forbidden", member:{id: user_id}}]}]
    },
    delegated: {
      id: null,
      mid: null,
      optional: true
    },
    "!/type/property/delegated": [{
      id: null,
      mid: null,
      optional: true,
      permission: [{permits: [{member: {id: user_id}}]}]
    }],
    "!opp:/type/property/delegated": [{
      id: null,
      mid: null,
      optional: true,
      permission:[{"permits": [{optional:"forbidden", member:{id: user_id}}]}]
    }]
  };
  return freebase.mqlread(q)
    .then(function(env) {
      return env.result || {};
    })
    .then(function(result) {
      var info = {
        id: result.id,
        guid: result.guid,
        mid: result.mid,
        name: result.name,
        schema: {id:result.schema.mid, name:result.schema.domain},
        key: [{namespace:k.namespace.mid, value:k.value} for each (k in result.key)],
        expected_type: result.expected_type ? {id:result.expected_type.mid} : null,
        master_property: result.master_property ? {id:result.master_property.mid} : null,
        reverse_property: {
          permitted: result.reverse_property ? {id:result.reverse_property.mid} : null,
          not_permitted: result["opp:reverse_property"] ? {id:result["opp:reverse_property"].mid} : null
        },
        delegated: result.delegated ? {id:result.delegated.mid} : null,
        delegated_by: {
          permitted:  [{id:d.mid} for each (d in result["!/type/property/delegated"])],
          not_permitted: [{id:d.mid} for each (d in result["!opp:/type/property/delegated"])]
        }
      };
      return info;
    });
};
