var METADATA = {
  "mounts": {
    "lib": "//130a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "81", 
  "app_tag": "81a", 
  "app_key": "mdo"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
