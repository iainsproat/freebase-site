var MF = {
  "apps": {
      "core": "//6.core.site.freebase.dev",
      "template": "//6.template.site.freebase.dev",
      "jquerytools": "//6.jquerytools.site.freebase.dev",
      "domain": "//6.domain.site.freebase.dev",

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
acre.require(MF.apps.core + "/MANIFEST").init(MF, this, {"image_base_url": "http://freebaselibs.com/static/freebase_site/policies/f601a3b02c03a62712ff8236bb789d81", "static_base_url": "http://freebaselibs.com/static/freebase_site/policies/f601a3b02c03a62712ff8236bb789d81"});
