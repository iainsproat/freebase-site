var METADATA = {
  "mounts": {
    "lib": "//134a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "107", 
  "app_tag": "107a", 
  "app_key": "policies"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
