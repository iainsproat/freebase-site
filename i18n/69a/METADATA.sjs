var METADATA = {
  "mounts": {
    "lib": "//155a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "69", 
  "app_tag": "69a", 
  "app_key": "i18n"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
