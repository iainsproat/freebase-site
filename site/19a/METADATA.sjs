var METADATA = {
  "project": "freebase-site.googlecode.dev", 
  "mounts": {
    "lib": "//46a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_tag": "19a", 
  "app_version": "19", 
  "app_key": "site"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");