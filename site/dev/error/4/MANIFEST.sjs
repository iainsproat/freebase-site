
var MF = {
  "apps": {
    "core": "//5.core.site.freebase.dev",
    "template": "//6.template.site.freebase.dev"
  },
  stylesheet: {
    "error.mf.css": [
      ["template", "MANIFEST", "/freebase.mf.css"]
    ]
  },
  javascript: {
    "error.mf.js": [
      ["template", "MANIFEST", "/freebase.mf.js"]
    ]
  }
};

acre.require(MF.apps.core + "/MANIFEST").init(MF, this);
