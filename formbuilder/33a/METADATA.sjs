var METADATA = {
  "mounts": {
    "lib": "//116a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "33", 
  "app_tag": "33a", 
  "app_key": "formbuilder"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
