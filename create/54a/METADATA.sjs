var METADATA = {
  "mounts": {
    "lib": "//84a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "54", 
  "app_tag": "54a", 
  "app_key": "create"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
