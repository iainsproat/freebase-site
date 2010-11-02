var mf = {
  "apps" : {
    "core": "//16.core.site.freebase.dev"
  },
  "suggest" : {
    "version": "1.2.1",
    "base_url": "http://freebaselibs.com/static/suggest/"
  },
  "jquery" : {
    "version" : "1.4"
  },
  "javascript": {
    "freebase.mf.js": [
      "jquery.cookie.js",
      "jquery.placeholder.js",
      "jquery.metadata.js",
      ["jqueryui", "jquery.ui.core.mf.js"],
      "freebase.js"/*,
      ["toolbox", "toolbox.js"]*/
    ],
    "freebase-permission.mf.js": [
      "freebase.mf.js",
      ["permission", "permission.js"]
    ]
  },
  "stylesheet": {
    "freebase.mf.css": [
      "freebase.less",
      "components.less"/*,
      ["toolbox", "toolbox.less"]*/
    ]
  }
};
mf.suggest.base_url += mf.suggest.version;

acre.require(mf.apps.core + "/MANIFEST").init(mf, this, {"image_base_url": "http://freebaselibs.com/static/freebase_site/template/e30e6ea6cb05ede82ff93f33c7066322", "static_base_url": "http://freebaselibs.com/static/freebase_site/template/e30e6ea6cb05ede82ff93f33c7066322"});
