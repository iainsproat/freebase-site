var METADATA = {
  "project": "freebase-site.googlecode.dev", 
  "mounts": {
    "lib": "//53a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_tag": "24a", 
  "app_version": "24", 
  "app_key": "site"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
