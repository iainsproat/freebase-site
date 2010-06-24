var MF = {

  "apps" : {
    "routing" : "//routing.site.freebase.dev",
    "promise" : "//promise.site.freebase.dev",
    "jquery" : "//release.jquery.libs.freebase.dev",
    "service" : "//release.service.libs.freebase.dev",
    "libraries" : "//release.libraries.apps.freebase.dev"
  },

  "freebase": {
    "resource": {
      "hash" : "dd20b6623a39c3624ab666c6f4e69f80423c7186ab9f8add7c53dd927ad389fa",
      "base_url": "http://res.freebase.com/s/"
      }
  }
};
MF.freebase.resource.base_url += MF.freebase.resource.hash;

var h_util = acre.require("helpers_util");
var h_url = acre.require("helpers_url");
var h_acre = acre.require("helpers_acre");
var freebase_static_resource_url;


/**
 * usage:
 *   var MF = {...};
 *   acre.require("/freebase/site/core/MANIFEST").init(MF, this);
 */
function init(MF, scope, options) {
  extend_manifest(MF, scope, options);
  if (scope.acre.current_script === scope.acre.request.script) {
    MF.main();
  }
  // routes hack to call sjs main()
  scope.main = MF.main;
};

/**
 * All apps' MANIFEST.MF must extend the base_manifest to be able to:
 * - serve (less)css/js as defined in the MANIFEST
 * - serve MANIFEST.MF as json/p
 */
function extend_manifest(MF, scope, options) {
  var orig = h_util.extend({}, MF, options);
  return h_util.extend(MF, base_manifest(MF, scope), orig);
};

/**
 * The base MANIFEST core library.
 */
function base_manifest(MF, scope, undefined) {
  var base = {
    /**
     * MF.apps, MF.stylesheet, MF.javascript default to empty dictionary
     */
    apps: {},
    stylesheet: {},
    javascript: {},

    /**
     * The base url prefix for retrieving css and js. All apps who extend the base_manifest
     * will have a "/MANIFEST/..." entry-point to serve css and js as specified in their MF.stylesheet
     * and MF.javascript.
     *
     * The idea is that once an app is branched/deployed, this static_base_url will be changed
     * to a permanent static server (i.e., http://freebaselibs.com/statc/freebase_site/foo/[version]/...).
     * But when developing, we want the resources to be served dynamically through "/MANIFEST/...".
     *
     */
    static_base_url: scope.acre.current_script.app.base_url +  "/MANIFEST",

    /**
     * This is like static_base_url but for images (*.png, *.gif, etc.).
     *
     */
    image_base_url: scope.acre.current_script.app.base_url,

    /**
     * Generate the proper url to serve the css resource(s) specified by MF.stylesheet[key].
     * MF.stylesheet[key] value must be an array of strings (local file) and/or tuples defining
     * the app label, file and any additional parameters.
     *
     * var MF = {
     *   ...
     *   stylesheet: {
     *     "my.mf.css": [
     *       "local.css",    // local css
     *       ["external_app_label", "external.less"],  // external css
     *       ["external_app_label", "MANIFEST", "/external.mf.css"]  // external manifest css
     *     ],
     *   ...
     *   }
     * }
     * For the tuple declarations, you MUST specify the app label in MF.apps.
     *
     * usage:
     *   <link rel="stylesheet" type="text/css" href="${MF.css_src("my.mf.css")}"/>
     */
    css_src: function(key) {
      return MF.static_base_url + "/" + key;
    },
    /** DEPRECATED: use css_src **/
    link_href: function(key) {
      return MF.css_src(key);
    },

    /**
     * Generate the proper url to serve the js resource(s) specified by MF.javascript[key].
     * MF.javascript[key] value must be an array of strings (local file) and/or tuples defining
     * the app label, file and any additional parameters.
     * var MF = {
     *   ...
     *   javascript: {
     *     "my.mf.js": [
     *       "local.js",    // local js
     *       ["external_app_label", "external.js"],  // external js
     *       ["external_app_label", "MANIFEST", "/external.mf.js"]  // external manifest js
     *     ],
     *   ...
     *   }
     * }
     * For the tuple declarations, you MUST specify the app label in MF.apps.
     *
     * usage:
     *   <script type="text/javascript" src="${MF.script_src("my.mf.js")}"></script>
     */
    js_src: function(key) {
      return MF.static_base_url + "/" + key;
    },
    /** DEPRECATED: use js_src **/
    script_src: function(key) {
      return MF.js_src(key);
    },

    /**
     * Helper method to parse app label, file arguments.
     */
    _parse_args: function(app, file) {
      var local = typeof file === "undefined";
      return {
        "app": local ? null : app,
        "file": local ? app : file,
        "local": local
      };
    },


    /**
     * Generate the proper url to serve an image resource.
     * If one argument, first argument is the local image resource.
     * If two arguments, first argument is the app label and second is the file name.
     *
     * usage:
     *   <img src="${MF.img_src('local.png')}" /><!-- local image -->
     *   <img src="${MF.img_src('some_app_label', 'external.png')}" /><!-- external image -->
     */
    img_src: function(app, file) {
      var args = MF._parse_args(app, file);
      if (args.local) {
        // local image files relative to the current app
        return MF.image_base_url + "/" + args.file;
      }
      else {
        // get the url through the external app MANIFEST.MF.img_src(resource.name)
        var ext_mf = MF.require(args.app, "MANIFEST").MF;
        return ext_mf.img_src(args.file);
      }
    },

    /**
     * less (css) parser.
     */
    less: function(data /*required*/, callback /*required*/, errback /*optional*/) {
      if (!MF.less.parser) {
          MF.less.parser = new(MF.require("core", "less").less.Parser)({optimization:3});
      }
      MF.less.parser.parse(data, function(e, root) {
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
     * Serve (acre.write) all css declared in MF.stylesheet[key].
     * Run the less css parser on all of the css afterwards
     */
    css: function(key, scope, buffer) {
      if (!MF.stylesheet[key]) {
        return MF.not_found();
      }
      scope.acre.response.set_header("content-type", "text/css");

      var buf = [];
      MF.stylesheet[key].forEach(function(ss) {
        if (!(ss instanceof Array)) {
          ss = [ss];
        }
        if (ss.length === 3 && ss[1] === "MANIFEST") {
          var f = ss[2].split("/", 2).pop();
          buf = buf.concat(MF.require(ss[0], "MANIFEST").MF.css(f, scope, true));
        }
        else {
          try {
            // css preprocessor to replace url(...) declarations
            buf.push(MF.css_preprocessor(MF.require.apply(null, ss).body));
          }
          catch (ex) {
            scope.acre.write("\n/** " + ex.toString() + " **/\n");
            acre.exit();
          }
        }
      });

      if (buffer) {
        return buf;
      }

      // run less on concatenated css/less
      MF.less(buf.join(""),
              scope.acre.write,
              function(e) {
                scope.acre.write(scope.JSON.stringify(e, null, 2));
              });
    },

    css_preprocessor: function(str) {
      if (!freebase_static_resource_url) {
        freebase_static_resource_url = MF.require("core", "helpers_url2").freebase_static_resource_url;
      }
      var buf = [];
      var m, regex = /url\s*\(\s*([^\)]+)\s*\)/gi;
      str.split(/[\n\r\f]/).forEach(function(l) {
        buf.push(l.replace(regex, function(m, group) {
          var url = group.replace(/^\s+|\s+$/g, "");
          if (url.indexOf("http://") == 0 || url.indexOf("https://") === 0) {
            return m;
          }
          else if (url.indexOf("static://") === 0) {
            return "url(" + freebase_static_resource_url(url.substring(9)) + ")";
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
            return "url(" + MF.resource_url.apply(null, params) + ")";
          }
        }));
      });
      return buf.join("\n");
    },

    /**
     * Serve (acre.write) all js declared in MF.javascript[key].
     */
    js: function(key, scope) {
      if (!MF.javascript[key]) {
        return MF.not_found();
      }
      scope.acre.response.set_header("content-type", "text/javascript");
      MF.javascript[key].forEach(function(script) {
        if (!(script instanceof Array)) {
          script = [script];
        }
        if (script.length === 3 && script[1] === "MANIFEST") {
          var f = script[2].split("/", 2).pop();
          MF.require(script[0], "MANIFEST").MF.js(f, scope);
        }
        else {
          try {
            scope.acre.write(MF.require.apply(null, script).body);
          }
          catch (ex) {
            scope.acre.write("\n/** " + ex.toString() + " **/\n");
            return;
          }
        }
      });
    },

    require: function(app, file) {
      var args = MF._parse_args(app, file);
      if (args.local) {
        return scope.acre.require(args.file);
      }
      if (!MF.apps[args.app]) {
        throw("An app label for " + args.app + " must be declared in the MANIFEST.");
      }
      var path = [MF.apps[args.app], args.file];
      var res = h_acre.parse_path(path.join("/"), scope);
      return scope.acre.require(res.id, res.version);
    },

    resource_url: function(app, file) {
      var args = MF._parse_args(app, file);
      if (args.local) {
        var path = [scope.acre.current_script.app.id, args.file];
        return h_url.resource_url(path.join("/"));
      }
      if (!MF.apps[args.app]) {
        throw("An app label for " + args.app + " must be declared in the MANIFEST.");
      }
      var path = [MF.apps[args.app], args.file];
      var res = h_acre.parse_path(path.join("/"), scope);
      return h_url.resource_url(res.id, res.version);
    },

    not_found: function() {
      scope.acre.response.status = 404;
      scope.acre.exit();
    },

    /**
     * Main block. DO NOT MODIFY!
     *
     * Responsible for routing request to "/MANIFEST/..." or serve MF (json/p).
     *
     * usage:
     *   var MF = {...};
     *   acre.require("/freebase/site/core/MANIFEST").extend_manifest(MF, this);
     *   if (acre.current_script == acre.request.script) {
     *     MF.main();
     *   };
     */
    main: function() {
      console.log("main", scope.acre.request);

      if (scope.acre.request.path_info && scope.acre.request.path_info.length) {
        var path = scope.acre.request.path_info.substring(1);
        if (/\.js$/.exec(path)) {
          return MF.js(path, scope);
        }
        else if (/\.css$/.exec(path)) {
          return MF.css(path, scope);
        }
        else if (scope.acre.request.path_info !== "/") {
          return MF.not_found();
        }
      }
      var service = scope.acre.require("/freebase/libs/service/lib", "release");
      service.GetService(function() {
        return MF;
      }, scope);
    }
  };

  return base;
};

console.log("this.init");
this.init(MF, this);
