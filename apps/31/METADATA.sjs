var METADATA = {
  "mounts": {
    "site":  "//site.www.trunk.svn.freebase-site.googlecode.dev",
    "libraries": "//2.libraries.apps.freebase.dev",
    "service": "//service"
  }
};

acre.require(METADATA.mounts.site + "/lib/helper/helpers.sjs").extend_metadata(METADATA, "site");
