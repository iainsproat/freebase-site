var METADATA = {
  "mounts": {
    "acreassist": "//release.acreassist.dfhuynh.user.dev", 
    "mql": "//release.mql.jdouglas.user.dev", 
    "libtopic": "//release.libtopic.fbclient.user.dev", 
    "site": "//15.site.www.branches.svn.freebase-site.googlecode.dev", 
    "mjt": "//release.templates.jdouglas.user.dev", 
    "acredocs": "//release.acredocs.stefanomazzocchi.user.dev", 
    "datadocs": "//release.datadocs.dfhuynh.user.dev", 
    "jscheatsheet": "//release.jscheatsheet.stefanomazzocchi.user.dev"
  }, 
  "app_tag": null, 
  "app_version": 18, 
  "app_key": "devdocs", 
  "urls": {
    "client_libraries": "http://wiki.freebase.com/wiki/Libraries", 
    "acre_wiki": "http://wiki.freebase.com/wiki/Acre", 
    "data_dumps": "http://wiki.freebase.com/wiki/Data_dumps", 
    "cheatsheet": "http://download.freebase.com/MQLcheatsheet-081208.pdf", 
    "query_recipes": "http://wiki.freebase.com/wiki/MQL_Recipes", 
    "acre_recipes": "http://wiki.freebase.com/wiki/Acre_Recipes"
  }
};

acre.require(METADATA.mounts.site + "/lib/helper/helpers.sjs").extend_metadata(METADATA, "site");