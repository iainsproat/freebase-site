var METADATA = {
  "mounts": {
    "lib": "//137a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "109", 
  "app_tag": "109a", 
  "app_key": "sample"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
