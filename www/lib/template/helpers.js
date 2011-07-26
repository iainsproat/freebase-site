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

(function($, fb) {

  /**
   * IMPORTANT!!!
   * If you are modifying helpers (especially url helpers), please update the corresponding server-side helpers
   * so that their functionality and usages (method signatures) are the same.
   */

  var h = fb.h = {

    /**
     * cached way of doing "typeof xxx"
     */
    type: $.type || (function() {
      //
      // from jQuery > 1.4.4
      //
      // [[Class]] -> type pairs
      var class2type = {};
      "Boolean Number String Function Array Date RegExp Object".split(" ").forEach(function(c) {
        class2type["[object " + c + "]"] = c.toLowerCase();
      });
      return function(obj) {
        return obj == null ? String(obj) : class2type[Object.prototype.toString.call(obj)] || "object";
      };
    })(),

   /**
    * params can be an array of tuples
    *
    * @param params:Object,Array - Query string parameters can be
    *                              a dictonary of {name: value, ...} or
    *                              an array of [ [name, value] .., ] tuples.
    */
    parse_params: function(params) {
      if ($.isArray(params)) {
        var dict = {};
        $.each(params, function(i, p) {
          dict[p[0]] = p[1];
        });
        return dict;
      }
      return params;
    },

  /**
   * All url helpers take variable number of arguments (varargs),
   * where you can pass it a list of paths followed by
   * a querystring dicionary or tuple array (@see parse_params).
   *
   * xxx_url(path1, path2, path3, ..., params) => path1 + path2 + path3 + ? + $.params(params)
   */

   /**
    * build url
    * Use to construct urls to any host
    * (i.e, host/path?params)
    */
    build_url: function(host /**, path1, path2, ..., params **/) {
      if (host && host.indexOf('://') === -1) {
        throw "Host must contain scheme: " + host;
      }
      var url = (host || "");
      var path;
      var params;
      if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        var paths = [];
        for(var i=0,l=args.length; i<l; i++) {
          var arg = args[i];
          var t = h.type(arg);
          if (t === "string") {
            paths.push(arg);
          }
          else {
            // last argument(s) are the params dictionary or array
            params = {};
            for (var j=i; j<l; j++) {
              params = $.extend(params, h.parse_params(args[j]));
            }
            break;
          }
        };
        path = paths.join("");
      }
      if (path && path.indexOf("/") !== 0) {
        throw "Path must begin with a '/': " + path;
      }
      if (path) {
        url += path;
      }
      if (url === "") {
        url = "/";
      }
      if (!$.isEmptyObject(params)) {
        url += ("?" + $.param(params, true));
      }
      return url;
    },

   /**
    * freebase url
    * Use to link to pages on freebase.com
    * (i.e, http://www.freebase.com/path?params)
    */
    fb_url: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(null); // host is null to specify relative url
      if (fb.lang !== "/lang/en") {
        args.push({lang:fb.lang});
      }
      return h.build_url.apply(null, args);
    },

    /**
     * ajax url
     * Use to call ajax entry points
     */
    ajax_url: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("/ajax");
      return h.reentrant_url.apply(null, args);
    },

    static_url: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("/static");
      return h.reentrant_url.apply(null, args);
    },

    reentrant_url: function(prefix, path) {
      path = h.resolve_reentrant_path(path);
      path = path.replace(/^\/\//, prefix + "/");
      var args = Array.prototype.slice.call(arguments, 2);
      args.unshift(path);
      args.unshift(null); // relative url
      return h.build_url.apply(null, args);
    },

    resolve_reentrant_path: function(path) {
      path = path || "";
      if (path.indexOf("//") == 0) {
        return path;
      }
      if (path.indexOf("lib/") === 0) {
        /**
         * acre.current_script is always lib since fb.acre variable is initialized in lib/template/freebase.mjt
         */
        return fb.acre.current_script.app.path + path.substring(3);
      }
      else {
        if (path && path[0] != "/") {
          path = "/" + path;
        }
        /**
         * Everything else resolves to acre.request.script
         */
        return fb.acre.request.script.app.path + path;
      }
    },

    /**
     * suggest url is used by the suggest widget
     * returns an apiary API url or a metaweb legacy URL depending
     * on acre configuration.
     * TODO: change this once apiary_url and service_url have been
     * figured out
     * tests will be added once everyone is running on apiary by default
     */

    suggest_url: function() {
      if (fb.acre.freebase.apiary_url) {
        return h.build_url(fb.acre.freebase.apiary_url, "/search");
      }
      else {
        return h.legacy_fb_url("/private/suggest");
      }
    },

    flyout_url: function() {
      return h.legacy_fb_url("/private/flyout");
    },

    /**
     * legacy freebase url
     * Use for pages that haven't been ported to acre yet
     * (i.e, http://www.freebase.com/path?params)
     */
    legacy_fb_url: function() {
      var args = Array.prototype.slice.call(arguments);
      var host = fb.acre.freebase.site_host
        .replace(/^(https?\:\/\/)([^\.]+)\./, '$1www.')
        .replace(':'+fb.acre.request.server_port, '');
      args.unshift(host);
      return h.build_url.apply(null, args);
    },

    /**
     * freebase api url (legacy freebase apis)
     * Use for links to freebase apis
     * (i.e., http://api.freebase.com/path?params)
     */
    fb_api_url: function() {
      var args = Array.prototype.slice.call(arguments);
      args.unshift(fb.acre.freebase.service_url);
      return h.build_url.apply(null, args);
    },

    /**
     * freebase apiary url (new googleapis/apiary urls)
     * Use for links to freebase apis
     * (i.e., https://www.googleapis.com/freebase/v1/path?params)
     */
    fb_apiary_url: function() {
      if (fb.acre.freebase.apiary_url) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(fb.acre.freebase.apiary_url);
        return h.build_url.apply(null, args);
      }
      throw "fb.acre.freebase.apiary_url is not defined";
    },

   /**
    * freebase wiki url
    * Use for links to the freebase wiki
    * (i.e., http://wiki.freebase.com/wiki//<page>)
    *
    * Note that this is a little bit different from other forms of url helpers
    * in that the path, "/wiki/" is automatically prepended to the page parameter
    * so that you only need to pass the name of the wiki page
    *
    * wiki_url("Enumerated_type") => http://wiki.freebase.com/wiki/Enumerated_type
    */
    wiki_url: function(page) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift("http://wiki.freebase.com", "/wiki/");
      return h.build_url.apply(null, args);
    },


    lib_base_url: function(key) {
      var lib = fb.acre.metadata.libs[key];
      return lib.base_url + lib.version;
    },


    image_url: function(id, params) {
      return fb.acre.freebase.imgurl(id, params.maxwidth, params.maxheight, params.mode, params.pad, params.errorid);
    },


    is_metaweb_system_type: function(type_id) {
      return (type_id.indexOf("/type/") === 0 ||
              (type_id.indexOf("/common/") === 0 && type_id !== "/common/topic") ||
              (type_id.indexOf("/freebase/") === 0 && type_id.indexOf("_profile") === (type_id.length - 8)));
    }

  };

})(jQuery, window.freebase);
