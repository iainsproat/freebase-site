var METADATA = {
  "mounts": {
    "lib": "//133a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "49", 
  "app_tag": "49a", 
  "app_key": "formbuilder"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
