var METADATA = {
  "mounts": {
    "lib": "//112a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "62", 
  "app_tag": "62a", 
  "app_key": "users"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
