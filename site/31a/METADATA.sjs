var METADATA = {
  "app_version": 31, 
  "csrf_protection": "strong", 
  "app_key": "site", 
  "project": "freebase-site.googlecode.dev", 
  "mounts": {
    "lib": "//61.lib.www.branches.svn.freebase-site.googlecode.dev"
  }, 
  "app_tag": null
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
