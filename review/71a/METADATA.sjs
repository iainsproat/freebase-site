var METADATA = {
  "mounts": {
    "lib": "//119a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "71", 
  "app_tag": "71a", 
  "app_key": "review"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
