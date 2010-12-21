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

var base_config = JSON.parse(acre.require("CONFIG.json").body);

function init(scope, config, options) {
  var app_mf = new Manifest(scope, extend({}, config, options));
  if (scope.acre.current_script === scope.acre.request.script) {
    app_mf.main();
  }
  return app_mf;
}


function Manifest(scope, config) {
  this.init.apply(this, arguments);
};
Manifest.prototype = {
  init: function(scope, config) {
    this.scope = scope;

    this.config = extend({}, base_config, config);  // extend with base_config
    var apps = extend({}, base_config.apps);
    if (config) {
      extend(apps, config.apps);
    }
    extend(this.config.apps, apps); // update config.apps with base_config.

    this.apps = this.config.apps || {};
    this.stylesheet = this.config.stylesheet || {};
    this.javascript = this.config.javascript || {};

    //new-style static urls - the presence of all these keys in the CONFIG file
    //mean we need to print out a /fss/<app_key>/<app_tag>/<bundle_filename> url
    //if we are in a freebase.com host or if use_static_urls is passed as a url param
    if (("use_static_urls" in acre.request.params || (this.is_freebase_host() && "static" in this.config)) && 'app_key' in this.config && 'app_tag' in this.config) { 
        this.static_base_url = this.image_base_url = "/fss/" + this.config.app_key + "/" + this.config.app_tag;
    } else { 
        this.static_base_url = this.config.static_base_url || this.get_app_base_url() + "/MANIFEST";
        this.image_base_url = this.config.image_base_url || this.get_app_base_url();
    }
  },

  is_freebase_host: function() { 
    return /\.(freebase|sandbox\-freebase)\.com$/.test(acre.request.server_name)
  },

  get_app_base_url: function() {
    return this.scope.acre.current_script.app.base_url;
  },

  css_src: function(key) {
    return this.static_base_url + "/" + key;
  },

  js_src: function(key) {
    return this.static_base_url + "/" + key;
  },

  require_args: function(app, file) {
    var args = [arg for each (arg in [app, file]) if (arg)];
    if (!args.length) {
      throw("bad require args");
    }
    if (args.length > 1) {
      return {app:args[0], file:args[1], local:false};
    }
    else {
      return {app:null, file:args[0], local:true};
    }
  },

  img_src: function(app, file) {
    var args = this.require_args(app, file);
    if (args.local) {
      // local image files relative to the current app
      return this.image_base_url + "/" + args.file;
    }
    else {
      // get the url through the external app MANIFEST.mf.img_src(resource.name)
      var ext_mf = this.require(args.app, "MANIFEST").mf;
      return ext_mf.img_src(args.file);
    }
  },

  less: function(data /*required*/, callback /*required*/, errback /*optional*/) {
    if (!this.less_parser) {
      this.less_parser = new(base_mf.require("less").less.Parser)({optimization:3});
    }
    this.less_parser.parse(data, function(e, root) {
      if (e) {
        if (errback) {
          errback(e);
        }
      }
      else {
        callback(root.toCSS());
      }
    });
  },

  /**
   * Serve (acre.write) all css declared in mf.stylesheet[key].
   * Run the less css parser on all of the css afterwards
   */
  css: function(key, buffer, use_acre_url) {
    var mf_ss = this.stylesheet[key];
    if (! mf_ss) {
      return this.not_found(this.scope.acre.current_script.app.id + "/MANIFEST/" + key);
    }
    this.scope.acre.response.set_header("content-type", "text/css");
    var buf = [];
    for (var i=0,l=mf_ss.length; i<l; i++) {
      var ss = mf_ss[i];
      if (!(ss instanceof Array)) {
        ss = [ss];
      }
      if (ss.length === 2) {
        buf.push("\n/** " + ss[0] + ", " + ss[1] + "**/\n");
        var ext_md = this.get_metadata(ss[0]);
        if ("MANIFEST" in ext_md.files) {
          // Go through external app's mf
          var ext_mf = this.require(ss[0], "MANIFEST").mf;
          if (ss[1] in ext_mf.stylesheet) {
            // Go through external app's mf.css() if ss[1] is in external app's mf.stylesheet
            buf = buf.concat(ext_mf.css(ss[1], true, use_acre_url));
          }
          else {
            // Otherwise, use external app's mf.css_preprocessor on the contents
            // of the external app's file
            try {
              buf.push(ext_mf.css_preprocessor(ext_mf.get_source(ss[1]), use_acre_url));
            }
            catch (ex) {
              console.log(ex.toString());
              acre.write("\n/** " + ex.toString() + " **/\n");
              acre.response.status = 500;
              acre.exit();
            }
          }
        }
        else {
          // If no external app MANIFEST then just include the contents
          // of the external file
          try {
            buf.push(this.get_source(ss[0], ss[1]));
          }
          catch (ex) {
            console.log(ex.toString());
            acre.write("\n/** " + ex.toString() + " **/\n");
            acre.response.status = 500;
            acre.exit();
          }
        }
      }
      else if (ss.length === 1) {
        buf.push("\n/** " + ss[0] + "**/\n");
        if (ss[0] in this.stylesheet) {
          // you can chain mf.stylesheet declarations
          // WARNING! DOES NOT CHECK FOR CIRCULAR DEPENDENCIES!!!
          buf = buf.concat(this.css(ss[0], true, use_acre_url));
        }
        else {
          try {
            // css preprocessor to replace url(...) declarations
            buf.push(this.css_preprocessor(this.get_source(ss[0]), use_acre_url));
          }
          catch (ex) {
            acre.write("\n/** Processing file '" + ss[0] + "' - " + ex.toString() + ". **/\n");
            acre.exit();
          }
        }
      }
    }

    if (buffer) {
      return buf;
    }

    // run less on concatenated css/less
    var scope = this.scope;
    this.less(buf.join(""), acre.write, function(e) {
      acre.write(scope.JSON.stringify(e, null, 2));
    });
  },

  css_resource_url: function(url, use_acre_url) {
    return this.quoted_css_url(url);
  },

  quoted_css_url: function(url) {
    if (url.indexOf('"') !== 0 && url.indexOf("'") !== 0) {
      url = '"'+url+'"';
    }
    return 'url('+url+')';
  },

  css_preprocessor: function(str, use_acre_url) {
    var buf = [];
    var m;
    var url_regex = /url\s*\(\s*([^\)]+)\s*\)/gi;
    var scheme_regex = /^\w+\:\/\//;
    var self = this;
    str.split(/[\n\r\f]/).forEach(function(l) {
      buf.push(l.replace(url_regex, function(m, group) {
        var url = group.replace(/^\s+|\s+$/g, "");
        if (url.indexOf("http://") == 0 || url.indexOf("https://") === 0) {
          return self.quoted_css_url(url);
        }
        else if (scheme_regex.test(url)) {
          return self.css_resource_url(url, use_acre_url);
        }
        else {
          var params = [];
          if (url.indexOf(",") === -1) {
            params.push(url);
          }
          else {
            var [app, file] = url.split(",", 2);
            params.push(app.replace(/^\s+|\s+$/g, ""));
            params.push(file.replace(/^\s+|\s+$/g, ""));
          }
          if (use_acre_url) {
            var args = self.require_args.apply(self, params);
            var app_path = args.local ? self.scope.acre.current_script.app.path : self.apps[args.app];
            return self.quoted_css_url(app_path + "/" + args.file);
          }
          else {
            return self.quoted_css_url(self.img_src.apply(self, params).replace(/\s/g, '%20'));
          }
        }
      }));
    });
    return buf.join("\n");
  },

  /**
   * Helper function for compiling .mjt files as javascript files to send to the browser.
   *  Triggers an event with the template source that must be handled to use the template.
   *  ["mjt", "mjt-template.mf.js"] contains the necessary code to handle the event and run the template.
   */
  compile_mjt: function(source, pkgid) {
    var code = [];
    code.push("if (jQuery) {\n");
      code.push("jQuery(window).trigger('acre.template.register', {pkgid: '" + pkgid + "', source: ");
        code.push(this.scope.acre.template.string_to_js(source, pkgid));
      code.push("});\n");
    code.push("}\n");
    return code.join("");
  },

  /**
   * Serve (acre.write) all js declared in mf.javascript[key].
   */
  js: function(key) {
    var mf_script = this.javascript[key];
    if (!mf_script) {
      return this.not_found(this.scope.acre.current_script.app.id + "/MANIFEST/" + key);
    }
    this.scope.acre.response.set_header("content-type", "text/javascript");
    for (var i=0,l=mf_script.length; i<l; i++) {
      var script = mf_script[i];
      if (!(script instanceof Array)) {
        script = [script];
      }
      if (script.length === 2) {
        acre.write("\n/** " + script[0] + ", " + script[1] + " **/\n");
        var ext_md = this.get_metadata(script[0]);
        if ("MANIFEST" in ext_md.files) {
          // Go through external app's mf
          // for further mf.js chaining if script[1] in external app's mf.javascript.
          var ext_mf = this.require(script[0], "MANIFEST").mf;
          if (script[1] in ext_mf.javascript) {
            ext_mf.js(script[1]);
            continue;
          }
        }
        // otherwise, just mf.require the contents of the external app's file
        try {
            var app = this.get_metadata(script[0]);
            var file = app.files[script[1]];
            var source = this.get_mjt_source(script[0], script[1]);
            if (file && file.handler && file.handler === 'mjt') {
              source = this.compile_mjt(source, "//" + app.host + "/" + file.name);
            }
            this.scope.acre.write(source);
          }
          catch (ex) {
            console.log(ex.toString());
            this.scope.acre.write("\n/** " + ex.toString() + " **/\n");
            acre.response.status = 500;
            acre.exit();
          }
      }
      else if (script.length === 1) {
        acre.write("\n/** " + script[0] + " **/\n");
        if (script[0] in this.javascript) {
          // you can chain mf.javascript declarations
          // WARNING! DOES NOT CHECK FOR CIRCULAR DEPENDENCIES!!!
          this.js(script[0]);
        }
        else {
          try {
            var app = this.get_metadata();
            var file = app.files[script[0]];
            var source = this.get_mjt_source(script[0]);
            if (file && file.handler && file.handler === 'mjt') {
              source = this.compile_mjt(source, "//" + app.host + "/" + file.name);
            }
            this.scope.acre.write(source);
          }
          catch (ex) {
            console.log(ex.toString());
            this.scope.acre.write("\n/** " + ex.toString() + " **/\n");
            acre.response.status = 500;
            acre.exit();
          }
        }
      }
    }
  },

  require: function(app, file) {
    var args = this.require_args(app, file);
    if (args.local) {
      return this.scope.acre.require(args.file);
    }
    if (!this.apps[args.app]) {
      throw("An app label for \"" + args.app + "\" must be declared in the MANIFEST.");
    }
    var path = [this.apps[args.app], args.file].join("/");
    return this.scope.acre.require(path);
  },

  get_source: function(app, file) {
    var args = this.require_args(app, file);
    if (args.local) {
      return this.scope.acre.require(args.file).body;
    }
    if (!this.apps[args.app]) {
      throw("An app label for \"" + args.app + "\" must be declared in the MANIFEST.");
    }
    var path = [this.apps[args.app], args.file].join("/");
    return this.scope.acre.require(path).body;
  },
  
  get_mjt_source: function(app, file) {
    var args = this.require_args(app, file);
    if (args.local) {
      return this.scope.acre.get_source(args.file);
    }
    if (!this.apps[args.app]) {
      throw("An app label for \"" + args.app + "\" must be declared in the MANIFEST.");
    }
    var path = [this.apps[args.app], args.file].join("/");
    return this.scope.acre.get_source(path);
  },

  get_metadata: function(app) {
    if (!app) {
      return this.scope.acre.get_metadata();
    }
    if (!this.apps[app]) {
      throw("An app label for \"" + app + "\" must be declared in the MANIFEST.");
    }
    return this.scope.acre.get_metadata(this.apps[app]);
  },

  not_found: function(id) {
    this.error("Not Found: " + id);
  },

  error: function(errObj) {
    throw(JSON.stringify(errObj, null, 2));
  },

  main: function() {
    var path_info = this.scope.acre.request.path_info;
    if (path_info && path_info.length) {
      var path = path_info.substring(1);
      if (/\.js$/.exec(path)) {
        return this.js(path);
      }
      else if (/\.css$/.exec(path)) {
        var use_acre_url = this.scope.acre.request.params.use_acre_url;
        return this.css(path, false, use_acre_url);
      }
      else if (path_info !== "/") {
        return this.not_found(this.scope.acre.current_script.app.id + path_info);
      }
    }

    var config = this.config;
    this.require("service", "lib").GetService(function() {
      return config;
    }, this.scope);
  }
};

/**
 * Merge the contents of two or more objects together into the first object.
 * @see jQuery.extend()
 */
function extend() {
  var a = arguments[0];
  for (var i=1,len=arguments.length; i<len; i++) {
    var b = arguments[i];
    for (var prop in b) {
      a[prop] = b[prop];
    }
  }
  return a;
};

// the base MANIFEST.mf
var mf = init(this);
var base_mf = mf;
