var METADATA = {
  "mounts": {
    "site": "//17a.site.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "19", 
  "app_tag": "19a", 
  "app_key": "group"
};

acre.require(METADATA.mounts.site + "/lib/helper/helpers.sjs").extend_metadata(METADATA, "site");