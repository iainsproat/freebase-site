var METADATA = {
  "mounts": {
    "lib": "//118a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "88", 
  "app_tag": "88a", 
  "app_key": "query"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
