var METADATA = {
  "mounts": {
    "lib": "//117a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "89", 
  "app_tag": "89a", 
  "app_key": "sample"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
