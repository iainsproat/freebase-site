var METADATA = {
  "mounts": {
    "lib": "//87a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "61", 
  "app_tag": "61a", 
  "app_key": "appeditor"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
