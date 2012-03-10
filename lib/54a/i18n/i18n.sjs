/*
 * Copyright 2012, Google Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


var h = acre.require("helper/helpers.sjs");
var deferred = acre.require("promise/deferred");
var freebase = acre.require("promise/apis").freebase;

/**
 * @see https://sites.google.com/a/google.com/40-language-initiative/home/language-details
 *
 * These langs have multiple ids (keys)
 * /lang/pt-br   (/lang/pt)
 * /lang/zh      (/lang/zh-cn, /lang/zh-hans)
 * /lang/iw      (/lang/he)
 * /lang/zh-hant (/lang/zh-tw)
 */
var LANGS = [

  // Tier 0
  {
    "id": "/lang/en",
    "name": "English"
  },

  // Tier 1
  {
    "id": "/lang/en-gb",
    "name": "British English"
  },
  {
    "id": "/lang/fr",
    "name": "French"
  },
  {
    "id": "/lang/it",
    "name": "Italian"
  },
  {
    "id": "/lang/de",
    "name": "German"
  },
  {
    "id": "/lang/es",
    "name": "Spanish"
  },
  {
    "id": "/lang/nl",
    "name": "Dutch"
  },
  {
    "id": "/lang/zh",
    "o:id": ["/lang/zh-cn", "/lang/zh-hans"],
    "name": "Chinese"
  },
  {
    "id": "/lang/zh-hant",
    "o:id": ["/lang/zh-tw"],
    "name": "Chinese (traditional)"
  },
  {
    "id": "/lang/ja",
    "name": "Japanese"
  },
  {
    "id": "/lang/ko",
    "name": "Korean"
  },
  {
    "id": "/lang/pt-br",
    "o:id": ["/lang/pt"],
    "name": "Portuguese"
  },
  {
    "id": "/lang/ru",
    "name": "Russian"
  },
  {
    "id": "/lang/pl",
    "name": "Polish"
  },
  {
    "id": "/lang/tr",
    "name": "Turkish"
  },
  {
    "id": "/lang/th",
    "name": "Thai"
  },
  {
    "id": "/lang/ar",
    "name": "Arabic"
  },

  // Tier 2
  {
    "id": "/lang/sv",
    "name": "Swedish"
  },
  {
    "id": "/lang/fi",
    "name": "Finnish"
  },
  {
    "id": "/lang/da",
    "name": "Danish"
  },
  {
    "id": "/lang/pt-pt",
    "name": "Iberian Portuguese"
  },
  {
    "id": "/lang/ro",
    "name": "Romanian"
  },
  {
    "id": "/lang/hu",
    "name": "Hungarian"
  },
  {
    "id": "/lang/iw",
    "o:id": ["/lang/he"],
    "name": "Hebrew"
  },
  {
    "id": "/lang/id",
    "name": "Indonesian"
  },
  {
    "id": "/lang/cs",
    "name": "Czech"
  },
  {
    "id": "/lang/el",
    "name": "Greek"
  },
  {
    "id": "/lang/no",
    "name": "Norwegian"
  },
  {
    "id": "/lang/vi",
    "name": "Vietnamese"
  },
  {
    "id": "/lang/bg",
    "name": "Bulgarian"
  },
  {
    "id": "/lang/hr",
    "name": "Croatian"
  },
  {
    "id": "/lang/lt",
    "name": "Lithuanian"
  },
  {
    "id": "/lang/sk",
    "name": "Slovak"
  },
  {
    "id": "/lang/fil",
    "name": "Filipino"
  },
  {
    "id": "/lang/sl",
    "name": "Slovenian"
  },
  {
    "id": "/lang/sr",
    "name": "Serbian"
  },
  {
    "id": "/lang/ca",
    "name": "Catalan"
  },
  {
    "id": "/lang/lv",
    "name": "Latvian"
  },
  {
    "id": "/lang/uk",
    "name": "Ukrainian"
  },
  {
    "id": "/lang/hi",
    "name": "Hindi"
  },
  {
    "id": "/lang/fa",
    "name": "Persian"
  },
  {
    "id": "/lang/es-419",
    "name": "Latin American Spanish"
  }
];
var LANGS_BY_ID = {};
var LANGS_BY_CODE = {};
LANGS.forEach(function(l) {
  var code = h.lang_code(l.id);
  LANGS_BY_ID[l.id] = LANGS_BY_CODE[code] = l;
  if (l["o:id"]) {
    l["o:id"].forEach(function(id) {
      code = h.lang_code(id);
      LANGS_BY_ID[id] = LANGS_BY_CODE[code] = l;
    });
  }
});

var lang;
var bundle;
var bundle_path;
var undefined;


///////////
// gettext
///////////

/**
 * gettext accepts a msgid (key) in the string bundle.
 * If the string bundle does not exist or the msgid does not exist in the string bundle,
 * just returns msgid.
 */
function gettext(msgid) {
  if (bundle) {
    if (typeof bundle[msgid] === "string") {
      return bundle[msgid];
    }
    // TODO: disable until we're ready to localize
    //console.warn("[i18n]", bundle_path, msgid, undefined);
  }
  return msgid;
};


/////////////////
// view helpers
/////////////////

/**
 * Get the display name of a topic. If null, return default_value or topic id.
 */
function display_name(obj, default_value, key) {
  if (!key) {
    key = "name";
  }
  if (default_value == null) {
    default_value = obj.id;
  }
  return display_text(obj, default_value, key);
};

/**
 * Get the display text of obj[key]. If null, return default_value.
 */
function display_text(obj, default_value, key) {
  var text = mql.result.text(obj[key]);
  if (text) {
    return text.value;
  }
  if (default_value != null) {
    return default_value;
  }
  return null;
};

function display_name_node(obj, key) {
  key = key || "name";
  return display_text_node(obj, key);
};

function display_text_node(obj, key) {
  return mql.result.text(obj[key]);
};


/**
 * Usage:
 * var blob = display_article(obj, "blob");
 * var [blob] = display_article(obj, ["blob"]);
 * var [blob, blurb] = display_article(obj, ["blob", "blurb"]);
 *
 * @param keys:String or Array
 */
function display_article(obj, keys, article_key) {
  if (!article_key) {
    article_key = "/common/topic/article";
  }
  var is_string = false;
  var mykeys = keys;
  if (typeof mykeys === "string") {
    mykeys = [mykeys];
    is_string = true;
  }
  else if (!h.isArray(mykeys) || mykeys.length === 0) {
    return null;
  }
  var result = [];
  var article = mql.result.article(obj[article_key]);
  for (var i=0,l=mykeys.length; i<l; i++) {
    result.push(article && article[mykeys[i]] || null);
  }
  if (is_string) {
    return result[0];
  }
  return result;
};


/////////////////
// edit helpers
/////////////////

function get_edit_names(obj) {
  return get_edit_texts(obj, "name");
};

function get_edit_texts(obj, key) {
  var texts = obj[key] || [];
  return mql.get_texts(lang, texts);
};

function get_edit_articles(obj, key) {
  if (!key) {
    key = "/common/topic/article";
  }
  var articles = obj[key] || [];
  return mql.get_articles(lang, articles);
};


/////////////////
// mql helpers
/////////////////

var mql = {

  /**
   * mql.query.* return mql query clauses
   */
  query: {
    text: function() {
      return mql.text_clause(lang);
    },
    name: function() {
      return mql.query.text();
    },
    article: function() {
      return mql.article_clause(lang);
    }
  },

  /**
   * mql.result.* can parse the mql results from using mq.query.* clauses
   */
  result: {
    text: function(result) {
      return mql.get_text(lang, result);
    },
    name: function(result) {
      return mql.result.text(result);
    },
    article: function(result) {
      return mql.get_article(lang, result);
    },
    articles: function(result) {
      return mql.get_articles(lang, result);
    }
  },

  /**
   * Get all freebase/mql lang equivalents (/lang/<code>) of the languages in the 40+ language initiative
   * @see https://sites.google.com/a/google.com/40-language-initiative/home/language-details
   */
  langs: function(sorted) {
    if (sorted) {
      if (!mql.langs.sorted) {
        mql.langs.sorted = LANGS.slice().sort(function(a,b) {
          return b.name < a.name;
        });
      }
      return mql.langs.sorted;
    }
    return LANGS;
  },

  text_clause: function(lang) {
    var langs = [];
    if (lang) {
      langs.push(lang);
    }
    if (lang !== "/lang/en") {
      langs.push("/lang/en");
    }
    return [{
      lang: null,
      "lang|=": langs,
      value: null,
      optional: true
    }];
  },

  article_clause: function(lang) {
    var langs = [lang];
    if (lang !== "/lang/en") {
      langs.push("/lang/en");
    }
    return [{
      optional:   true,
      id:         null,
      timestamp:  null,
      updated: null,
      creator: null,
      type:       "/common/document",
      source_uri: null,   // wikipedia articles
      "nolang:content": { // old (pre-i18n) articles do not have language set
        optional: true,
        id:       null,
        type:     "/type/content",
        language: {
          id: null,
          optional: "forbidden"
        }
      },
      "lang:content": {   // new (post-i18n) articles have language set
        optional: true,
        id:       null,
        type:     "/type/content",
        language: {
          id: null,
          "id|=": langs
        }
      }
    }];
  },

  /**
   * Return a padded array of texts in lang and "/lang/en".
   * If lang != "/lang/en", this will always return length == 2
   * If lang == "/lang/en", this will always return length == 1
   * The padded text will have value = null;
   *
   * So if lang == "/lang/ko" and there is no "/lang/ko" value, the result might look like:
   *
   * [{value:null, lang:"/lang/ko"}, {value:"foo", lang:"/lang/en"}]
   *
   * And similarly, if there is a "/lang/ko" but not a "/lang/en" value, the result would look like:
   *
   * [{value:"bar", lang:"/lang/ko"}, {value:null, lang:"/lang/en"}]
   *
   * And if there are neither values:
   *
   * [{value:null, lang:"/lang/ko"}, {value:null, lang:"/lang/en"}]
   *
   * And if lang == "/lang/en", the result would be length == 1:
   *
   * [{value:"foo", lang:"/lang/en"}]
   */
  get_texts: function(lang, result) {
    var map = h.map_array(result || [], "lang");
    var texts = [];
    if (lang !== "/lang/en") {
      if (lang in map) {
        texts.push(map[lang]);
      }
      else {
        texts.push({value:null, lang:lang});
      }
    }
    if ("/lang/en" in map) {
      texts.push(map["/lang/en"]);
    }
    else {
      texts.push({value:null, lang:"/lang/en"});
    }
    return texts;
  },

  /**
   * Get the first non-null text value
   * @see get_texts
   */
  get_text: function(lang, result, lang_match) {
    var texts = mql.get_texts(lang, result);
    for (var i=0,l=texts.length; i<l; i++) {
      if (texts[i].value !== null) {
        if (lang_match) {
          if (texts[i].lang === lang) {
            return texts[i];
          }
        }
        else {
          return texts[i];
        }
      }
    }
    return null;
  },

  /**
   * Similar to get_texts, but padded array of articles where the padded article will have id = null.
   *
   * So if lang == "/lang/ko" and there is no "/lang/ko" article, the result might look like:
   *
   * [{id:null, lang:"/lang/ko"}, {id:"foo", lang:"/lang/en"}]
   *
   * And similarly, if there is a "/lang/ko" but not a "/lang/en" article, the result would look like:
   *
   * [{id:"bar", lang:"/lang/ko"}, {id:null, lang:"/lang/en"}]
   *
   * And if there are neither values:
   *
   * [{id:null, lang:"/lang/ko"}, {id:null, lang:"/lang/en"}]
   *
   * And if lang == "/lang/en", the result would be length == 1:
   *
   * [{id:"foo", lang:"/lang/en"}]
   */
  get_articles: function(lang, result) {
    var wp_lang_article;
    var wp_en_article;
    var nolang_article;
    var lang_article;
    var en_article;
    var lang_code = h.lang_code(lang);
    var wp_lang_uri = h.sprintf("http://wp/%s/", lang_code);
    result.forEach(function(article) {
      if (article.source_uri) {
        if (lang !== "/lang/en" && article.source_uri.indexOf(wp_lang_uri) === 0) {
          if (wp_lang_article) {
            if (article.timestamp > wp_lang_article.timestamp) {
              wp_lang_article = article;
            }
          }
          else {
            wp_lang_article = article;
          }
          wp_lang_article.lang = lang;
        }
        else if (article.source_uri.indexOf("http://wp/en/") === 0) {
          if (wp_en_article) {
            if (article.timestamp > wp_en_article.timestamp) {
              wp_en_article = article;
            }
          }
          else {
            wp_en_article = article;
          }
          wp_en_article.lang = "/lang/en";
        }
      }
      else if (article["nolang:content"]) {
        if (nolang_article) {
            if (article.timestamp > nolang_article.timestamp) {
              nolang_article = article;
            }
        }
        else {
          nolang_article = article;
        }
        nolang_article.lang = "/lang/en";
      }
      else if (article["lang:content"]) {
        var language = article["lang:content"].language.id;
        if (lang !== "/lang/en" && lang === language) {
          if (lang_article) {
            if (article.timestamp > lang_article.timestamp) {
              lang_article = article;
            }
          }
          else {
            lang_article = article;
          }
          lang_article.lang = lang;
        }
        else if (language === "/lang/en") {
          if (en_article) {
            if (article.timestamp > en_article.timestamp) {
              en_article = article;
            }
          }
          else {
            en_article = article;
          }
          en_article.lang = "/lang/en";
        }
      }
    });

    var articles = [];
    var article;
    if (lang !== "/lang/en") {
      article = lang_article || wp_lang_article;
      if (article) {
        article.lang = lang;
        articles.push(article);
      }
      else {
        articles.push({id:null, lang:lang});
      }
    }
    article = en_article || nolang_article || wp_en_article;
    if (article) {
      articles.push(article);
    }
    else {
      articles.push({id:null, lang:"/lang/en"});
    }
    return articles;
    //return lang_article || en_article || nolang_article || wp_lang_article || wp_en_article || null;
  },

  /**
   * Get the first non-null article id
   * @see get_articles
   */
  get_article: function(lang, result, lang_match) {
    var articles = mql.get_articles(lang, result);
    for (var i=0,l=articles.length; i<l; i++) {
      if (articles[i].id !== null) {
        if (lang_match) {
          if (articles[i].lang === lang) {
            return articles[i];
          }
        }
        else {
          return articles[i];
        }
      }
    }
    return null;
  }
};


//////////////////
// get_blurb
// get_blob
///////////////////

/**
 * get and attach blurb to a mql result that has a "/common/topic/article" key
 *
 * @param topic:Object (required) - A mql result that has a "/common/topic/article" key
 * @param options:Object (optional) - Params to pass to acre.freebase.get_blob
 * @param label:String (optional) - The key to use to attach the blurb/blob content to o. Default is "blurb"
 * @param key:String (optional) - The key of the article attached to topic. Default is "/common/topic/article".
 */
function get_blurb(topic, options, label, key) {
  return _get_blob(topic, options, label, key, "blurb");
};

/**
 * get and attach blob to a mql result that has a "/common/topic/article" key
 *
 * @param topic:Object (required) - A mql result that has a "/common/topic/article" key
 * @param options:Object (optional) - Params to pass to acre.freebase.get_blob
 * @param label:String (optional) - The key to use to attach the blurb/blob content to o. Default is "blob"
 * @param key:String (optional) - The key of the article attached to topic. Default is "/common/topic/article".
 */
function get_blob(topic, options, label, key) {
  return _get_blob(topic, options, label, key, "blob");
};

function _get_blob(topic, options, label, key, mode) {
  key = key || "/common/topic/article";
  var articles = mql.result.articles(topic[key]);
  if (!articles.length) {
    return topic;
  }
  options = options || {};
  mode = mode || "blurb";
  label = label || mode;
  if (mode === "blurb") {
    if (! ("maxlength" in options)) {
      options.maxlength = 100;
    }
  }
  var promises = [];
  var blob = (mode === "blob");
  for (var i=0,l=articles.length; i<l; i++) {
    var article = articles[i];
    if (article.id) {
      if (blob) {
        promises.push(_get_blob.closure(article, "raw", options, label));
      }
      else {
        promises.push(_get_blob.closure(article, "blurb", options, label));
      }
    }
  }
  return deferred.all(promises)
    .then(function() {
      return topic;
    });
};
_get_blob.closure = function(article, mode, options, label) {
  return freebase.get_blob(article.id, mode, options)
    .then(function(blob) {
      article[label] = blob.body;
      return article;
    }, function(error) {
      console.error("[i18n]", "freebase.get_blob", "error", ""+error);
      article[label] = null;
      return article;
    });
};

///////////////////////////////
// determine lang and bundle
///////////////////////////////

/**
 * lang is determined by the "?lang=" parameter, where the value must be a valid mql lang id
 *
 * The language bundle used for chrome is determined by the "accept-language' request header..
 */
var accept_langs = get_accept_langs();
set_bundle(accept_langs);
set_lang(acre.request.params.lang || acre.request.body_params.lang || "/lang/en");

function set_lang(lang_id_or_code) {
  /**
   * Allow simple lang code parameters like lang=ko instead of (lang=%2Flang%2Fko).
   */
  var lang_id = h.lang_id(lang_id_or_code);
  var l = LANGS_BY_ID[lang_id];
  if (!l) {
    l = LANGS[0]; // lang/en
  }
  // mql lang id
  lang = l.id;
};

function set_bundle(lang_codes) {
  if (!h.isArray(lang_codes)) {
    lang_codes = [lang_codes];
  }
  var lib = acre.get_metadata();
  var app = acre.get_metadata(acre.request.script.app.path);
  var lib_bundle;
  var app_bundle;
  lang_codes.every(function(lang_code) {
    var lang_by_code = LANGS_BY_CODE[lang_code];
    if (lang_by_code) {
      var filename = lang_code + ".properties";
      if (!lib_bundle && filename in lib.files) {
        lib_bundle = lib.path + "/" + filename;
      }
      if (!app_bundle && filename in app.files) {
        app_bundle = app.path + "/" + filename;
      }
      if (lib_bundle && app_bundle) {
        return false;
      }
    }
    return true;
  });
  if (lib_bundle) {
    lib_bundle = acre.require(lib_bundle).bundle;
  }
  if (app_bundle) {
    app_bundle = acre.require(app_bundle).bundle;
  }
  bundle = h.extend(true, lib_bundle || {}, app_bundle);
};

function get_accept_langs() {
  var accept_langs = acre.request.headers['accept-language'];
  if (accept_langs) {
    accept_langs = accept_langs.split(",");
  }
  else {
    return ["en-US"];
  }
  var qvalues = {};
  var lang_codes = [];
  var i,l;
  accept_langs.forEach(function(accept_lang) {
    var lang_parts = h.trim(accept_lang).split(";");
    var lang_code = h.trim(lang_parts[0]);
    /**
     * qvalue is a value from 0 to 1. 1 being the most preferred. qvalue defaults to 1 if not present.
     * so if you have the following:
     *
     * accept-language: ko-KR,ko;q=0.8,en-us;q=0.5,en;q=0.3
     *
     * ko-KR is the preferred, then ko if ko-KR is not available, then en-us, then en.
     *
     * @see http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
     */
    var qvalue = 1;
    if (lang_parts.length > 1) {
      var qvalue_parts = lang_parts[1].split("=");
      if (qvalue_parts.length > 1) {
        qvalue = parseFloat(h.trim(qvalue_parts[1]));
      }
    }
    if (lang_code in qvalues) {
      // take the larger qvalue
      if (qvalues[lang_code] < qvalue) {
        qvalues[lang_code] = qvalue;
      }
    }
    else {
      qvalues[lang_code] = qvalue;
    }
    lang_codes.push(lang_code);
  });
  // /lang/en must be present
  if (!("en-US" in qvalues)) {
    qvalues["en-US"] = 0;
    lang_codes.push("en-US");
  }
  lang_codes.sort(function(a,b) {
    return qvalues[b] - qvalues[a];
  });
  return lang_codes;
};






var dojo = {
  locale: function() {
    var locale = h.lang_code(lang);
    if (locale === "iw") {
      locale = "he";
    }
    return locale;
  }
};


function normalize_lang(lang_id) {
  var l = LANGS_BY_ID[lang_id];
  if (l) {
    return l.id;
  }
  else {
    return lang_id;
  }
};
