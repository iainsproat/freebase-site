var METADATA = {
  "mounts": {
    "site": "//18c.site.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "20", 
  "app_tag": "20a", 
  "app_key": "query"
};

acre.require(METADATA.mounts.site + "/lib/helper/helpers.sjs").extend_metadata(METADATA, "site");