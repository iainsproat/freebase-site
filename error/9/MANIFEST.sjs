
var MF = {
  "apps": {
    "core": "//9.core.site.freebase.dev",
    "template": "//9.template.site.freebase.dev"
  },
  stylesheet: {
    "error.mf.css": [
      ["template", "freebase.mf.css"]
    ]
  },
  javascript: {
    "error.mf.js": [
      ["template", "freebase.mf.js"]
    ]
  }
};

if (/^https?\:\/\/devel\.(freebase|sandbox\-freebase|branch\.qa\.metaweb|trunk\.qa\.metaweb)\.com(\:\d+)?/.test(acre.request.app_url)) {
  MF.apps.core = "//core.site.freebase.dev";
}
acre.require(MF.apps.core + "/MANIFEST").init(MF, this, {"image_base_url": "http://freebaselibs.com/static/freebase_site/error/1c3e6997ff897304aa90798dcd4495a7", "static_base_url": "http://freebaselibs.com/static/freebase_site/error/1c3e6997ff897304aa90798dcd4495a7"});
