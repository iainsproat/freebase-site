var METADATA = {
  "mounts": {
    "lib": "//84a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "36", 
  "app_tag": "36a", 
  "app_key": "mdo"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
