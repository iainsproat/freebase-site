var METADATA = {
  "mounts": {
    "lib": "//119a.lib.www.tags.svn.freebase-site.googlecode.dev"
  }, 
  "app_version": "91", 
  "app_tag": "91a", 
  "app_key": "triples"
};

acre.require(METADATA.mounts.lib + "/helper/helpers.sjs").extend_metadata(METADATA, "lib");
