var METADATA = {
  "mounts": {
    "site": "//34a.site.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "41", 
  "app_tag": "41a", 
  "app_key": "topic"
};

acre.require(METADATA.mounts.site + "/lib/helper/helpers.sjs").extend_metadata(METADATA, "site");
