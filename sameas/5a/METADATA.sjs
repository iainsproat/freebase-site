var METADATA = {
  "mounts": {
    "lib": "//15a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": 5, 
  "app_tag": "5a", 
  "app_key": "sameas"
};

acre.require(METADATA.mounts.lib + "/loader.sjs").extend_metadata(METADATA);