var MF = {
  "apps": {
      "core": "//11.core.site.freebase.dev",
      "template": "//11.template.site.freebase.dev",
      "jquerytools": "//11.jquerytools.site.freebase.dev",
      "domain": "//11.domain.site.freebase.dev",

      // external apps
      "jquery": "//release.jquery.libs.freebase.dev"
  },
  "stylesheet": {
    "policies.mf.css": [
      ["template", "freebase.mf.css"],
      "css-policies.css"
    ]
  },
  "javascript": {
    "policies.mf.js": [
      ["template", "freebase.mf.js"]
    ]
  },
};

if (/^https?\:\/\/devel\.(freebase|sandbox\-freebase|branch\.qa\.metaweb|trunk\.qa\.metaweb)\.com(\:\d+)?/.test(acre.request.app_url)) {
  MF.apps.core = "//core.site.freebase.dev";
}
acre.require(MF.apps.core + "/MANIFEST").init(MF, this, {"image_base_url": "http://freebaselibs.com/static/freebase_site/policies/3878e92f90f82758e133c135a63082fe", "static_base_url": "http://freebaselibs.com/static/freebase_site/policies/3878e92f90f82758e133c135a63082fe"});
