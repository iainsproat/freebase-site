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

function expandIncludedTypes(typesString, idsString, guidsString, typeArray, typeMap) {
  
  function enterUniqueType(type, explicit) {
    if (!(type in typeMap)) {
      typeMap[type] = { index: typeArray.length, explicit: explicit }; // we'll use this later for sorting
      typeArray.push(type);
    }
  }
  
  function enterUniqueTypes(types, explicit) {
    for (var i = 0; i < types.length; i++) {
      enterUniqueType(types[i], explicit);
    }
  }
  
  if (typesString !== undefined && typesString.length > 0) {
    enterUniqueTypes(typesString.split(","), true);
  }
  
  if (idsString !== undefined && idsString.length > 0) {
    try {
      var r = acre.freebase.mqlread([{
        "type" : "/type/type",
        "id" : null,
        "instance" : [{ "id|=" : idsString.split(",") }]
      }]).result;
      
      for (var i = 0; i < r.length; i++) {
        enterUniqueType(r[i].id, false);
      }
    } catch (e) {
      console.log(e);
    }
  }
  
  if (guidsString !== undefined && guidsString.length > 0) {
    try {
      var r = acre.freebase.mqlread([{
        "type" : "/type/type",
        "id" : null,
        "instance" : [{ "guid|=" : guidsString.split(",") }]
      }]).result;
      
      for (var i = 0; i < r.length; i++) {
        enterUniqueType(r[i].id, false);
      }
    } catch (e) {
      console.log(e);
    }
  }
  
  /*
   *  Get all the included types.
   */
  try {
    if (typeArray.length > 0) {
      var r = acre.freebase.mqlread(
        acre.freebase.extend_query(
          acre.require("cuecard/included-types").query,
          { "id|=" : typeArray }
        )
      ).result;
      
      for (var i = 0; i < r.length; i++) {
        var entry = r[i];
        if ("/freebase/type_hints/included_types" in entry && entry["/freebase/type_hints/included_types"] != null) {
          var a = entry["/freebase/type_hints/included_types"];
          for (var j = 0; j < a.length; j++) {
            enterUniqueType(a[j].id, false);
          }
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
      
  enterUniqueType("/type/object", true);
}

var valueTypes = {
  '/type/int': true,
  '/type/float': true,
  '/type/boolean': true,
  '/type/rawstring': true,
  '/type/uri': true,
  '/type/datetime': true,
  '/type/bytestring': true,
  '/type/id': true,
  '/type/key': true,
  '/type/value': true
};

function getPropertiesOfTypes(types, typeMap, visitor) {
  var propertyMap = {};
  try {
    var r = acre.freebase.mqlread(
      acre.freebase.extend_query(
        acre.require("cuecard/properties-query").query,
        { "id|=" : types }
      )
    ).result;
    
    r.sort(function(a, b) {
      return typeMap[a.id].index - typeMap[b.id].index;
    });
    
    var hasValueType = false;
    for (var i = 0; i < r.length; i++) {
      var typeEntry = r[i];
      if (typeEntry.id in valueTypes) {
        hasValueType = true;
      }
      
      if ("properties" in typeEntry && typeEntry.properties != null) {
        var explicit = (typeEntry.id in typeMap && "explicit" in typeMap[typeEntry.id]) ? typeMap[typeEntry.id].explicit : true;
        
        var propertyEntries = typeEntry.properties;
        propertyEntries.sort(function(a, b) {
          return a.id.localeCompare(b.id);
        });
        
        for (var j = 0; j < propertyEntries.length; j++) {
          var propertyEntry = propertyEntries[j];
          var expectedTypes = "expected_type" in propertyEntry ? propertyEntry.expected_type : [];
          
          var result;
          if (propertyEntry.id in propertyMap) {
            result = propertyMap[propertyEntry.id];
          } else {
            result = propertyMap[propertyEntry.id] = {
              expectedTypes: [], 
              explicit: explicit, 
              unique: "unique" in propertyEntry ? propertyEntry.unique : false
            };
            visitor(propertyEntry);
          }
          
          for (var x = 0; x < expectedTypes.length; x++) {
            var t = expectedTypes[x];
            result.expectedTypes.push(t);
            
            if ("/freebase/type_hints/mediator" in t) {
              t.isCVT = t["/freebase/type_hints/mediator"] === true;
              delete t["/freebase/type_hints/mediator"];
            }
          }
        }
      }
    }
    
    if (hasValueType) {
      propertyMap["value"] = {
        expectedTypes: [],
        explicit: true, 
        unique: true
      };
    }
  } catch (e) {
    console.log(e);
  }
  return propertyMap;
}

function addCVTProperties(properties, uniqueTypes, uniqueTypeMap) {
  var cvtProperties = {};
  for (var propertyID in properties) {
    var expectedTypes = properties[propertyID].expectedTypes;
    
    for (var t = 0; t < expectedTypes.length; t++) {
      var expectedType = expectedTypes[t];
      if (expectedType["isCVT"]) {
        var properties2 = getPropertiesOfTypes([ expectedType.id ], uniqueTypeMap, function() {});
        for (var propertyID2 in properties2) {
          if (!(propertyID2 in cvtProperties)) {
            var propertyEntry = properties2[propertyID2];
            propertyEntry.parentProperty = propertyID;
            cvtProperties[propertyID2] = propertyEntry;
          }
        }
      }
    }
  }
  
  for (var n in cvtProperties) {
    properties[n] = cvtProperties[n];
  }
}