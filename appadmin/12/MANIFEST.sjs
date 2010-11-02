var MF = {
  "apps" : {
    "core": "//11.core.site.freebase.dev",
    "template": "//11.template.site.freebase.dev",
      "promise": "//11.promise.site.freebase.dev",
      "ae" : "//release.appeditor.apps.freebase.dev"
  },
  "stylesheet": {
    "appadmin.mf.css": [
      ["template", "freebase.mf.css"],
      "appadmin_core.css"
    ]
  },
  "javascript": {
    "appadmin.mf.js": [
      ["template", "freebase.mf.js"],
      "appadmin_core.js"
    ]
  }
};

if (/^https?\:\/\/devel\.(freebase|sandbox\-freebase|branch\.qa\.metaweb|trunk\.qa\.metaweb)\.com(\:\d+)?/.test(acre.request.app_url)) {
  MF.apps.core = "//core.site.freebase.dev";
}
acre.require(MF.apps.core + "/MANIFEST").init(MF, this, {"image_base_url": "http://freebaselibs.com/static/freebase_site/appadmin/af40efa1e1ca3c1618a540e648c69f24", "static_base_url": "http://freebaselibs.com/static/freebase_site/appadmin/af40efa1e1ca3c1618a540e648c69f24"});
