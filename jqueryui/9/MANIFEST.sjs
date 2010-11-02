/**
 * jquery-ui 1.8.2 (Stable, for jQuery 1.4+)
 * http://jqueryui.com/
 */
var MF = {
  "apps": {
    "core": "//9.core.site.freebase.dev"
  },
  "javascript": {
    "jquery.ui.core.mf.js": ["jquery.ui.core.js", "jquery.ui.widget.js", "jquery.ui.mouse.js", "jquery.ui.position.js"]
  }
};

if (/^https?\:\/\/devel\.(freebase|sandbox\-freebase|branch\.qa\.metaweb|trunk\.qa\.metaweb)\.com(\:\d+)?/.test(acre.request.app_url)) {
  MF.apps.core = "//core.site.freebase.dev";
}
acre.require(MF.apps.core + "/MANIFEST").init(MF, this, {"image_base_url": "http://freebaselibs.com/static/freebase_site/jqueryui/2fc61612bb4c4166edf4abd07d37ddcc", "static_base_url": "http://freebaselibs.com/static/freebase_site/jqueryui/2fc61612bb4c4166edf4abd07d37ddcc"});
