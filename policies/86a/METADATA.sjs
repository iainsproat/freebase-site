var METADATA = {
  "mounts": {
    "lib": "//113a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "86", 
  "app_tag": "86a", 
  "app_key": "policies"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
