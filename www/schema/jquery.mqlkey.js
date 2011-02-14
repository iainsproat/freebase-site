/*
 * Copyright 2010, Google Inc.
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
;(function($) {

  /***
    * If you change schema key validation logic please update:
    *
    * lib/validator/validators.sjs
    * schema/schema-edit.js
    * schema/helpers.sjs
    * schema/jquery.mqlkey.js
    */



  /**
   * Validate key input on text change. If options.check_key is TRUE (default),
   * the key value will be checked against options.namespace ("/" default) of whether
   * or not the key already exists using the mqlread service specified by
   * options.mqlread_url (http://www.freebase.com/api/service/mqlread default).
   */
  $.fn.mqlkey = function (options) {
    return this.each(function() {
      var $this = $(this);
      if (!$this.is(":text")) {
        return;
      }
      var inst = $this.data("mqlkey");
      if (inst) {
        inst._destroy();
      }
      inst = new mqlkey(this, options);
      $this.data("mqlkey", inst);
    });
  };

  // property and type names have more restrictive rules that match the rules for javascript identifiers.
  var __high_ident_str = "[a-z](?:_?[a-z0-9])*";

  // this is the validity checker for property and type names
  var valid_high_idname = new RegExp("^(?:/|/" + __high_ident_str + "(?:/" + __high_ident_str + ")*)$");

  // a high_idname with an optional prefix and optional leading ! for reversal.
  var valid_mql_key =  new RegExp("^(\\!)?(?:(" + __high_ident_str + ")\\:)?(/|/?" + __high_ident_str + "(?:/" + __high_ident_str + ")*)$");

  function mqlkey(input, options) {
    this.options = $.extend(true, {}, mqlkey.defaults, options);
    this.options.jsonp = mqlkey.use_jsonp(this.options.mqlread_url);
    this.input = $(input);
    this.original = this.input.val();
    this.init();
  };
  mqlkey.prototype = {
    init: function() {
      var self = this;
      this.input
        .bind("keyup.mqlkey", function(e) {
          self.textchange(e);
        })
        .bind($.browser.msie ? "paste.mqlkey" : "input.mqlkey", function(e) {
          self.textchange(e);
        });

      if (this.options.source) {
        this.source = $(this.options.source);
        this.source_generate = true;
        this.input.bind("change.mqlkey", function() {
          self.source_generate = false;
        });
        this.source.bind("change.mqlkey", function() {
          if (self.source_generate) {
            var key = mqlkey.from(self.source.val());
            self.input.val(key).trigger("keyup");
          }
        });
      }
    },
    _destroy: function() {
      this.input.unbind(".mqlkey");
      if (this.source) {
        this.source.unbind("change.mqlkey");
      }
    },
    textchange: function(e) {
      clearTimeout(this.textchange_timeout);
      var self = this;
      this.textchange_timeout = setTimeout(function() {
        self.textchange_delay(e);
      }, 0);
    },
    textchange_delay: function(e) {
      this.input.trigger("textchange");
      var val = $.trim(this.input.val());
      if (val === this.original && val !== "") {
        return this.valid(val);
      }
      else if (mqlkey.reserved_word(val)) {
        return this.invalid(val, val + " is a reserved word.");
      }
      else if (!valid_mql_key.test(val)) {
        return this.invalid(val);
      }
      else if (val.length < this.options.minlen) {
        return this.invalid(val);
      }
      else if (this.options.check_key) {
        return this.check_key(val);
      }
      else {
        return this.valid(val);
      }
    },

    check_key: function(val) {
      var self = this;
      if (this.xhr) {
        this.xhr.abort();
        this.xhr = null;
      }
      var q = {
        query: '{"query": {"id": null, "key": {"namespace": "'+ this.options.namespace + '", "value": "' + val + '"}}}'
      };
      // delayed query
      clearTimeout(this.check_key.timeout);

      var ajax_options = {
        url: this.options.mqlread_url,
        data: q,
        success: function(data) {
          if (data.code === "/api/status/ok") {
            if (data.result) {
              return self.invalid(val, "Key already exists");
            }
            else {
              return self.valid(val);
            }
          }
        },
        error: function(xhr) {
          if (xhr) {
            return self.invalid(xhr.responseText());
          }
        },
        dataType: self.options.jsonp ? "jsonp" : "json"
      };

      this.check_key.timeout = setTimeout(function() {
        self.ac_xhr = $.ajax(ajax_options);
      }, 200);
    },

    valid: function(val) {
      this.input.trigger("valid", val);
    },

    invalid: function(val, msg) {
      if (!msg) {
        if (this.options.minlen > 1) {
          msg = "Key must be " + this.options.minlen + " or more alphanumeric characters";
        }
        else {
          msg = "Key must be alphanumeric";
        }
        msg += ", lowercase, begin with a letter and not end with a non-alphanumeric character. Underscores are allowed but not consecutively.";
      }

      this.input.trigger("invalid", msg);
    }
  };

  $.extend(mqlkey, {
    defaults: {
      minlen: 1,
      check_key: true,  // If TRUE, check if key already exists in namespace. namespace and mqlread_url must be specified. Otherwise, just apply valid_mql_key regular expression
      namespace: "/",
      mqlread_url: "http://www.freebase.com/api/service/mqlread",
      source: null // jQuery selector to auto generate key from
    },
    use_jsonp: function(service_url) {
      /*
       * if we're on the same host,
       * then we don't need to use jsonp.
       * This greatly increases our cachability
       */
      if (!service_url) {
        return false; // no host == same host == no jsonp
      }
      var pathname_len = window.location.pathname.length;
      var hostname = window.location.href;
      hostname = hostname.substr(0, hostname.length -
                                 pathname_len);
      //console.log("Hostname = ", hostname);
      if (hostname === service_url) {
        return false;
      }
      return true;
    },
    from: function(val) {
      var key = val.toLowerCase();
      key = key.replace(/[^a-z0-9]/g, '_');    // remove all non-alphanumeric
      key = key.replace(/\_\_+/g, '_');        // replace __+ with _
      key = key.replace(/[^a-z0-9]+$/, '');    // strip ending non-alphanumeric
      key = key.replace(/^[^a-z]+/, '');       // strip beginning non-alpha
      if (mqlkey.reserved_word(key)) {
        key = "x_" + key;
      }
      return key;
    },
    reservedwords: 'meta typeguid left right datatype scope attribute relationship property link class future update insert delete replace create destroy default sort limit offset optional pagesize cursor index !index for while as in is if else return count function read write select var connect this self super xml sql mql any all macro estimate-count',

    typeonlywords: 'guid id object domain name key type keys value timestamp creator permission namespace unique schema reverse',

    _reserved_word: null,

    reserved_word: function(word) {
      if (!mqlkey._reserved_word) {
        mqlkey._reserved_word = {};
        // lazily build up reserved word dictionary
        $.each([mqlkey.reservedwords, mqlkey.typeonlywords], function(i, words) {
          $.each(words.split(' '), function(j, word) {
            mqlkey._reserved_word[word] = 1;
          });
        });
      }
      return mqlkey._reserved_word[word] === 1;
    }
  });

})(jQuery);
