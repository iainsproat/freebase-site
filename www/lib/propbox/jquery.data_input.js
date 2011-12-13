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

  $.fn.data_input = function(options) {
    return this.each(function() {
      var $this = $(this);
      var inst = $this.data("$.data_input");
      if (inst) {
        inst._destroy();
      }
      inst = new $.data_input(this, options);
      $this.data("$.data_input", inst);
    });
  };

  $.data_input = function(container, options) {
    this.options = $.extend(true, {}, $.data_input.defaults, options);
    this.container = $(container);
    // original data
    this.metadata = this.container.metadata();
    this.input = $(":input", this.container);
    this.init();
    var self = this;
    this.input.bind("remove", function() {
      self._destroy();
    });
  };

  $.data_input.prototype = {
    init: function() {
      var self = this,
          c = this.container,
          i = this.input,
          o = this.options;

      i
        .bind("focusin.data_input", function() {
          self.container.addClass("focus");
        })
        .bind("focusout.data_input", function() {
          self.container.removeClass("focus");
        })
        .bind("valid.data_input", function(e, data) {
          var mydata = {
            name: self.input.attr("name")
          };
          if (data.id) {
            mydata.id = data.id;
          }
          else if (data.create_new) {
            mydata.create_new = data.create_new;
            mydata.lang = self.metadata.lang || o.lang;
          }
          else {
            mydata.value = data.value;
            if (self.metadata.type === "/type/text") {
              mydata.lang = self.metadata.lang || o.lang;
            }
          }
          function compatible_callback() {
            self.container.data("data", mydata);
            self.container.removeClass("error").addClass("valid");
            self.container.trigger("valid");
          }
          if (data.id && self.metadata.type && self.options.incompatible_types) {
            // perform incompatible type check
            self.options.incompatible_types.check(data.id, self.metadata.type,
                                                  compatible_callback,
                                                  self.options.incompatible_types.inline_suggest_incompatible_callback(self.input, compatible_callback));
          }
          else {
            compatible_callback();
          }
        })
        .bind("invalid.data_input", function() {
          self.container.removeData("data");
          self.container.removeClass("valid").addClass("error");
          self.container.trigger("invalid");
        })
        .bind("empty.data_input", function() {
          var mydata = {
            name: self.input.attr("name")
          };
          if (self.metadata && self.metadata.lang) {
            mydata.lang = self.metadata.lang;
          }
          self.container.data("data", mydata);
          self.container.removeClass("valid").removeClass("error");
          self.container.trigger("empty");
        })
        .bind("keypress.data_input", function(e) {
          if (e.keyCode === 13 && !e.isDefaultPrevented()) { // enter
            self.container.trigger("submit");
          }
        })
        .bind("keyup.data_input", function(e) {
          if (e.keyCode === 27) { // escape
            self.container.trigger("cancel");
          }
        });

      if (c.is(".topic")) {
        var type = self.metadata.type;
        var suggest_options = $.extend(true, {}, o.suggest,
                                       $.data_input.suggest_options(type, self.metadata.lang || o.lang));
        i.validate_topic(suggest_options)
          .bind("valid.data_input", function(e, data) {
            self.fb_select(data);
          })
          .bind("invalid.data_input", function() {
            self.fb_textchange();
          });
        if (this.metadata && this.metadata.id) {
          i.data("data.suggest", this.metadata);
          this.validate();
        }
      }
      else if (c.is(".text")) {
        i.validate_input({validator: $.validate_input.text});
      }
      else if (c.is(".datetime")) {
        i.validate_input({validator: $.validate_input.datetime, lang:o.lang});
      }
      else if (c.is(".enumerated")) {  // /freebase/type_hints/enumeration (<select>)
        i.validate_enumerated()
          .bind("valid.data_input", function(e, data) {
            self.fb_select(data);
          })
          .bind("invalid.data_input", function() {
            self.fb_textchange();
          });
        if (this.metadata && this.metadata.id) {
          this.validate();
        }
      }
      else if (c.is(".int")) {
        i.validate_input({validator: $.validate_input["int"], lang:o.lang});
      }
      else if (c.is(".float")) {
        i.validate_input({validator: $.validate_input["float"], lang:o.lang});
      }
      else if (c.is(".uri")) {
        i.validate_input({validator: $.validate_input.uri});
      }
      else if (c.is(".boolean")) {
        i.validate_boolean();
      }
      else if (c.is(".enumeration")) {  // /type/enumeration
        i.validate_input({validator: $.validate_input.mqlkey});
      }
      else if (c.is(".rawstring")) {
        i.validate_input({validator: $.validate_input.text});
      }
      else {
        throw new Error("Invalid data-input: " + c.attr("class"));
      }
    },

    _destroy: function() {
      this.input.unbind(".data_input");
    },

    validate: function() {
      // force validation
      var input = this.input;
      $.each(["$.validate_topic",
              "$.validate_input",
              "$.validate_enumerated",
              "$.validate_boolean"], function(i, name) {
        var validator = input.data(name);
        if (validator) {
          validator.validate(true);
          return false;
        }
      });
    },

    reset: function() {
      this.container.removeData("data");
      if (this.input.is(":text")) {
        this.input.val("");
      }
      else if (this.input.is("select")) {
        this.input[0].selectedIndex = 0;
      }
      else if (this.input.is(":radio")) {
        this.input.each(function() {
          this.checked = false;
        });
      }
    },

    fb_textchange: function(data) {
    },

    fb_select: function(data) {
    },

    ajax_beforeSend: function(jqXHR, settings) {
      if (!this.xhr_queue) {
        this.xhr_queue = [];
      }
      this.xhr_queue.push(jqXHR);
      this.container.trigger("loading");
    },

    ajax_complete: function(jqXHR, textStatus) {
      if (!this.xhr_queue) {
        this.xhr_queue = [];
      }
      for (var i=0,l=this.xhr_queue.length; i<l; i++) {
        if (jqXHR === this.xhr_queue[i]) {
          this.xhr_queue.splice(i, 1);
          break;
        }
      }
      if (this.xhr_queue.length === 0) {
        this.container.trigger("loading_complete");
      }
    }
  };

  $.extend($.data_input, {
    defaults: {
      suggest: {
        service_url: "http://www.freebase.com",
        service_path: "/private/suggest",
        flyout_service_url: "http://www.freebase.com",
        flyout_service_path: "/private/flyout",
        category: "object",
        type: "/common/topic"
      }
    },

    is_metaweb_system_type: function(type) {
      return (type.indexOf("/type/") === 0 ||
              (type.indexOf("/common/") === 0 && type !== "/common/topic") ||
              (type.indexOf("/freebase/") === 0 && type.indexOf("_profile") === (type.length - 8)));
    },

    suggest_options: function(type, lang) {
      /**
       * sameas as fb.suggest_options.instance()
       */
      var is_system_type = $.data_input.is_metaweb_system_type(type);
      var o = {
        category: "instance",
        type: type,
        type_strict: is_system_type ? "any" : "should",
        suggest_new: is_system_type ? false : "Create new",
        lang: (function(langs) {
          // @param langs - languages supported by new freebase search (googleapis)
          var l = (lang || "/lang/en").split("/").pop(); // get lang code of lang
          if (l !== "en" && langs[l]) {
            // en is the fallback
            return l += ",en";
          }
          return null;
        })({en:1,es:1,fr:1,de:1,it:1,pt:1,zh:1,ja:1,ko:1})
      };
      var filter = [
        "any",
        "type:" + type,
        "without:fus",
        "without:inst"
      ];
      $.each(["user", "domain", "type"], function(i, t) {
        if (type === "/freebase/" + t + "_profile") {
          filter.push("type:/type/" + t);
          return false;
        }
      });
      if (type === "/book/book_subject") {
        filter.push("type:/base/skosbase/skos_concept");
      }
      o.filter = "(" + filter.join(" ") + ")";
      return o;
    }

  });

  $.fn.validate_topic = function(options) {
    return this.each(function() {
      var $this = $(this);
      if (!$this.is(":text")) {
        return;
      }
      var inst = $this.data("$.validate_topic");
      if (inst) {
        inst._destroy();
      }
      inst =  new $.validate_topic(this, options);
      $this.data("$.validate_topic", inst);
    });
  };
  $.validate_topic = function(input, options) {
    this.options = $.extend(true, {}, options);
    this.input = $(input);
    this.init();
  };
  $.validate_topic.prototype = {
    init: function() {
      var self = this;
      this.input.suggest(this.options)
        .bind("fb-textchange.validate_topic", function() {
          if (self.input.val() === "") {
             self.empty();
           }
           else {
             self.invalid();
           }
        })
        .bind("fb-select.validate_topic", function(e, data) {
          self.input.val(data.name != null ? data.name : data.id);
          self.valid(data);
        })
        .bind("fb-select-new.validate_topic", function(e, data) {
          self.valid(data);
        });
    },

    invalid: function() {
      this.input.trigger("invalid");
    },

    valid: function(data) {
      if (typeof data === "string") {
        data = {create_new:data};
      }
      this.input.trigger("valid", data);
    },

    empty: function() {
      this.input.trigger("empty");
    },

    _destroy: function() {
      this.input.unbind(".validate_topic");
    },

    validate: function(force) {
      if (this.input.val() === "") {
        this.empty();
      }
      else {
        var data = this.input.data("data.suggest");
        if (data) {
          this.valid(data);
        }
        else {
          this.invalid();
        }
      }
    }
  };


  $.fn.validate_enumerated = function(options) {
    return this.each(function() {
      var $this = $(this);
      if (!$this.is("select")) {
        return;
      }
      var inst = $this.data("$.validate_enumerated");
      if (inst) {
        inst._destroy();
      }
      inst =  new $.validate_enumerated(this, options);
      $this.data("$.validate_enumerated", inst);
    });
  };

  $.validate_enumerated = function(input, options) {
    this.options = $.extend(true, {}, options);
    this.input = $(input);
    this.init();
  };

  $.validate_enumerated.prototype = {
    init: function() {
      var self = this;
      this.input.bind("change.validate_enumerated, keypress.validate_enumerated", function(e) {
        if (this.selectedIndex === 0) {
          self.empty();
        }
        else {
          self.valid({
            text: $(":selected", this).text(),
            id: this.value
          });
        }
      });
    },

    invalid: function() {
      this.input.trigger("invalid");
    },

    valid: function(data) {
      this.input.trigger("valid", data);
      this.input.trigger("fb-select", data);
    },

    empty: function() {
      this.input.trigger("empty");
    },

    _destroy: function() {
      this.input.unbind(".validate_enumerated");
    },

    validate: function(force) {
      var select = this.input[0];
      if (select.selectedIndex > 0) {
        this.valid({
          text: $(":selected", this.input).text(),
          id: select.value
        });
      }
      else {
        this.empty();
      }
    }
  };

  $.fn.validate_boolean = function(options) {
    var t,f;
    this.each(function() {
      var $this = $(this);
      if (!$this.is(":radio")) {
        return;
      }
      if ($this.val().toLowerCase() === "true") {
        t = $this;
      }
      else if ($this.val().toLowerCase() === "false") {
        f = $this;
      }
    });
    if (t && f) {
      var inst = t.data("$.validate_boolean");
      if (inst) {
        inst._destroy();
      }
      inst = new $.validate_boolean(t, f, options);
      t.data("$.validate_boolean", inst);
    }
    else {
      // TODO: assert 2 radio buttons
    }
    return this;
  };

  $.validate_boolean = function(true_radio, false_radio, options) {
    this.options = $.extend(true, {}, options);
    this.tradio = true_radio;
    this.fradio = false_radio;
    this.input = this.tradio;
    this.init();
  };

  $.validate_boolean.prototype = {
    init: function() {
      var self = this;
      this.tradio.bind("change.validate_boolean", function() {
        self.validate();
      });
    },

    _destroy: function() {
      this.input.unbind(".validate_boolean");
    },

    valid: function(data) {
      this.input.trigger("valid", data);
    },

    empty: function() {
      this.input.trigger("empty");
    },

    validate: function(force) {
      var checked;
      if (this.tradio.is(":checked")) {
        this.valid({text:this.tradio.text(), value:true});
      }
      else if (this.fradio.is(":checked")) {
        this.valid({text:this.fradio.text(), value:false});
      }
      else {
        this.empty();
      }
    }
  };

})(jQuery);
