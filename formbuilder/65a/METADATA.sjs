var METADATA = {
  "mounts": {
    "lib": "//149a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "65", 
  "app_tag": "65a", 
  "app_key": "formbuilder"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
