var METADATA = {
  "mounts": {
    "lib": "//23.lib.www.branches.svn.freebase-site.googlecode.dev"
  }, 
  "app_tag": null, 
  "app_version": 5, 
  "app_key": "history"
};

acre.require(METADATA.mounts.lib + "/loader.sjs").extend_metadata(METADATA);