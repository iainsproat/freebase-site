var config = JSON.parse(acre.require("CONFIG.json").body);
var mf = acre.require(config.apps.core + "/MANIFEST").init(this, config, {"image_base_url": "http://freebaselibs.com/static/freebase_site/template/abec104e9f98b64fad83ae392a914883", "static_base_url": "http://freebaselibs.com/static/freebase_site/template/abec104e9f98b64fad83ae392a914883"});
