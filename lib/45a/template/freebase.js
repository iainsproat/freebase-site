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


/**
 * everything should go under the freebase namespace.
 */
;(function($) {
  window.freebase = window.fb = {mwLWTReloading: false};
  if (window.SERVER && typeof window.SERVER === "object") {
    $.extend(window.freebase, window.SERVER);
  }
  
  // copy over our inlined cookie function
  $.cookie = window.freebase.cookie;
})(jQuery);

(function($, fb) {

  if (fb.mwLWTReloading) {
    // we're in the process of reloading because of mwLastWriteTime
    // don't perform any inits
    return;
  }

  if (!window.console) {
    window.console = {
      log: $.noop,
      info: $.noop,
      debug: $.noop,
      warn: $.noop,
      error: $.noop
    };
  }

  /**
   * simple event dispatcher
   */
  fb.dispatch = function(event, fn, args, thisArg) {
    if (typeof fn !== "function") {
      return false;
    }
    event = $.event.fix(event || window.event);
    if (!args) {
      args = [];
    }
    if (!thisArg) {
      thisArg = this;
    }
    return fn.apply(thisArg, [event].concat(args));
  };

  /**
   * simple dynamic javascript loader which caches the script_url,
   * so that it does not do multiple gets and executions.
   */
  fb.get_script = function(script_url, callback) {
    var cache = fb.get_script.cache;
    // check_cache
    var cached = cache[script_url];
    if (cached) {
      if (cached.state === 1) {  // requesting
        // add to the list of callbacks
        cached.callbacks.push(callback);
      }
      else if (cached.state === 4) { // already loaded
        // immediately callback
        callback();
      }
    }
    else {
      // not yet requested
      cached = cache[script_url] = {
        state: 0, // initialized
        callbacks: [callback]
      };
      $.ajax({
        url: script_url,
        dataType: 'script',
        beforeSend: function() {
          cached.state = 1;
        },
        success: function() {
          cached.state = 4;
          $.each(cached.callbacks, function(i,callback) {
            callback();
          });
        },
        error: function() {
          // TODO: handle error
          cached.state = -1;
        }
      });
    }
  };
  fb.get_script.cache = {};

  /**
   * init user signed-in state
   *
   * 1. mw_user cookie
   * 2. set a fb.user object: {id:String, guid:String: name:String}
   * 3. update signin/out state
   */
   $(window)
     .bind("fb.user.signedin", function(e, user) {
       console.log("fb.user.signedin", user.id);
       fb.user = user;
       // signed in
       var u = $("#nav-username");
       if (u.length) {
         console.log(fb.user, fb.user.id, fb.user.name);
         u[0].href += fb.user.id.substring(1);
         var MAX_SIZE = 25;
         var MODE = "fillcropmid";
         var params = {
           maxwidth: MAX_SIZE,
           maxheight: MAX_SIZE,
           mode: MODE
         };
         var image_api = fb.h.image_url(user.id, params);
         var user_image = $('<a class="user-thumb" href="' + user.id + '"><img src="' + image_api + '" /></a>');
         u.prepend(user_image);
       }
       $("#signedin").show();
     })
     .bind("fb.user.signedout", function(e) {
       console.log("fb.user.signedout");
       // signed out
       $("#signedout").show();
     })
     .bind("fb.user.unauthorized", function() {
       // TODO: invoke fb.login_popup() without the popup blocker
       // for now, go directly to signin page
       window.location.href = fb.h.fb_url("/account/signin", {onsignin:window.location.href});
     });

  // get user info from cookie:
  var account_name = $.cookie("fb-account-name");
  if (account_name) {
    var user = {
      id: '/user/'+account_name,
      name: account_name
    };
    setTimeout(function() {
      $(window).trigger("fb.user.signedin", user);
    }, 0);
  }
  else {
    setTimeout(function() {
      $(window).trigger("fb.user.signedout");
    }, 0);
  }


  fb.window_position = function() {
    var position = {};

    if (typeof(window.innerWidth) == 'number' ) {
      //Non-IE
      position['width'] = window.outerWidth;
      position['height'] = window.outerHeight;
      position['top'] = window.screenY;
      position['left'] = window.screenX;
    } else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
      //IE 6+ in 'standards compliant mode'
      position['width'] = document.body.clientWidth;
      position['height'] = document.body.clientHeight;
      position['top'] = window.screenTop;
      position['left'] = window.screenLeft;
    }

    return position;
  };
  
  fb.status = (function(){
      var SECONDS = 1000;

      var timer;
      var hide_func;
      var last_level;
      
      function _show(log_type,str,duration) {
          var el = '#page-state';
          if (last_level && last_level === 'error') {
              // If we already displaying an error then don't display any more messages
              // (The previous error should have terminated all tasks, so we shouldn't get here)
              console.error('MessagePanel: Already displaying error. Ignoring: '+log_type+': '+str);
          } else {
              // TODO - figure out how to get the tid
              var tid = null;
              $(el).hide().addClass(log_type).text(str);
              last_level = log_type;
              window.clearTimeout(timer);
              hide_func = function(){
                  $(el).slideUp(300).empty().removeClass(log_type);
                  hide_func = null;
                  last_level = null;
              };
              timer = window.setTimeout(hide_func, duration);
              $(el).slideDown(300);
          }
      }

      function _clear() {
          window.clearTimeout(timer);
          if (hide_func) { hide_func(); }
      }

      // doing() is for tasks that take time - the message MUST be cancelled with info() or error()
      return {
          doing : function(str, tid) {  _show('notice',str, 2000 * SECONDS, tid); return ''; },
          info  : function(str, tid) {  _show('info', str,    4 * SECONDS, tid); return ''; },
          error : function(str, tid) {  _show('error',str,    6 * SECONDS, tid); return ''; },
          clear : _clear
      };
  })();

  fb.popup = function(url, width, height, windowname) {
    width = width || 300;
    height = height || 300;

    var pos = fb.window_position();
    var left = Math.floor((pos['width']-width)/2) + pos['left'];
    var top = Math.floor((pos['height']-height)/2) + pos['top'];

    // Chrome might fix this bug, but until then add some padding
    //  to the height of the popup for the urlbar
    var is_chrome = /chrome/.test(navigator.userAgent.toLowerCase());
    if (is_chrome) {
        height += 50;
    }

    var params = {
      width: width,
      height: height,
      top: top,
      left: left,
      directories: 'no',
      location: 'no',
      menubar: 'no',
      resizable: 'no',
      scrollbars: 'yes',
      status: 'no',
      toolbar: 'no'
    };

    var params_list = [];
    for (var key in params) {
      params_list.push(key+"="+params[key]);
    }
    return window.open(url, windowname || "", params_list.join());
  };

  fb.login_popup = function(success) {
    var width = 900;
    var height = 600;

    if (!success) {
      success = function(data) {
        window.location.reload();
      };
    }

    var newwin = fb.popup("/account/signin", width, height, "Freebase");

    if (newwin.opener == null) newwin.opener = self;
    window.onsignin = success;
    if (window.focus) {
      newwin.focus();
    }
    return false;
  };

  fb.logout_popup = function(success) {
    var width = 900;
    var height = 600;

    if (!success) {
      success = function(data) {
        window.location.href = "/";
      };
    }

    var newwin = fb.popup("/account/signout", width, height, "Freebase");

    if (newwin.opener == null) newwin.opener = self;
    window.onsignout = success;
    if (window.focus) {
      newwin.focus();
    }
    return false;
  };

  /**
   * init universal language picker
   */

  $(function() {
    var $picker = $("#header > #nav-utilities > .language-picker");
    var $label = $(".current-lang", $picker);
    var $dropdown = $("select", $picker).bind("change", function(e){
      var $selected = $(this).find(":selected").text();
      $label.text($selected);
    });
  });


  /**
   * Add all suggest options helpers here
   */
  $(function() {
    fb.suggest_options = {

      service_defaults: {
        service_url: fb.h.suggest_url(),
        service_path: "",
        flyout_service_url: fb.h.flyout_url(),
        flyout_service_path: "",
        key: fb.acre.freebase.api_key
      },

      /**
       *  suggest option for site search
       */
      search: function() {
        var o = $.extend({}, fb.suggest_options.service_defaults, {
          status: null,
          parent: "#site-search-box",
          align: "right",
          category: "object",         // old suggest
          filter: "(all without:fus)" // new suggest
        });
        return o;
      },

      _operator: function(/** any|all|should, type_1, type_2, ..., type_N **/) {
        var args = Array.prototype.slice.call(arguments);
        var op = args.shift();
        var o = $.extend({}, fb.suggest_options.service_defaults, {
          type: args.length === 1 ? args[0] : args,
          type_strict: op
        });
        var filter = [op];
        $.each(args, function(i, t) {
          filter.push("type:" + t);
        });
        o.filter = "(" + filter.join(" ") + ")";
        return o;
      },

      any: function(/** type_1, type_2, ..., type_N **/) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("any");
        return fb.suggest_options._operator.apply(null, args);
      },

      all: function(/** type_1, type_2, ..., type_N **/) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("all");
        return fb.suggest_options._operator.apply(null, args);
      },

      should: function(/** type_1, type_2, ..., type_N **/) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("should");
        return fb.suggest_options._operator.apply(null, args);
      },

      instance: function(type) {
        var o = $.extend({}, fb.suggest_options.service_defaults, {
          category: "instance",
          type: type,
          type_strict: fb.h.is_metaweb_system_type(type) ? "any" : "should"
        });
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
      },

      /**
       * Add a type to (cotype) a topic.
       */
      cotype: function() {
        var o = $.extend({}, fb.suggest_options.service_defaults, {
          category: "cotype"
        });
        var filter = [
          "all",
          "type:/type/type",
          "(not domain:/type)",
          "(not domain:/freebase)",
          "(any (not domain:/common) (any type:/common/topic type:/common/uri_template type:/common/uri_property))"
        ];
        if (fb.user) {
          filter.push("(any without:hidden source:" + fb.user.id + ")");
        }
        else {
          filter.push("without:hidden");
        }
        o.filter = "(" + filter.join(" ") + ")";
        if (fb.acre.freebase.googleapis_url) {
          o.mql_filter = [{
            "/freebase/type_hints/enumeration": {value:true, optional:"forbidden"},
            "/freebase/type_hints/mediator": {value:true, optional:"forbidden"}
          }];
        }
        return o;
      },

      /*
       * Add /freebase/type_hints/included_type to a type.
       * Same as cotype.
       */
      included_type: function() {
        return fb.suggest_options.cotype();
      },

      /**
       * Add /type/property/expected_type to a type
       */
      expected_type: function() {
        var o = $.extend({}, fb.suggest_options.service_defaults, {
          category: "expected_type"
        });
        var filter = [
          "all",
          "type:/type/type"
        ];
        if (fb.user) {
          filter.push("(any without:hidden source:" + fb.user.id + ")");
        }
        else {
          filter.push("without:hidden");
        }
        o.filter = "(" + filter.join(" ") + ")";
        return o;
      },

      /**
       * Delegate a property
       */
      delegate_property: function() {
        var o = $.extend({}, fb.suggest_options.service_defaults, {
          type: "/type/property",
          type_strict: "any"
        });
        var filter = [
          "all",
          "type:/type/property",
          "(not domain:/type)"
        ];
        if (fb.user) {
          filter.push("(any without:hidden source:" + fb.user.id + ")");
        }
        else {
          filter.push("without:hidden");
        }
        o.filter = "(" + filter.join(" ") + ")";
        return o;
      }
    };
  });

  /**
   * init freebase site header search box (suggest)
   */
  $(function() {
    var search = $("#SearchBox .SearchBox-input,#fb-search-input");
    var search_container = $("#fb-search");
    var root = fb.acre.freebase.site_host;
    // Get rid of devel and port to use the legacy python client in development

    search.suggest(fb.suggest_options.search());

    var search_label = $("#site-search-label"),
    search_suggest = $("#site-search-box .fbs-pane");

    search
      .bind("fb-select", function(e, data) {
        window.location = fb.h.fb_url(data.id);
        return false;
      })
      .bind("fb-pane-show", function(e, data) {
        search_label.html("<span>Select an item from the list</span>").removeClass("loading");
      })
      .bind("fb-textchange", function (e, data) {
        if ($.trim(search.val()) === "") {
          search_label.html("<span>Start typing to get some suggestions</span>").removeClass("loading");
        }
        else {
          search_label.html("<span>Searching...</span>").addClass("loading");
        }
      })
      .bind("fb-error", function() {
        search_label.html("<span>Sorry, something went wrong. Please try again later</span>").removeClass("loading");
      })
      .focus(function(e) {
        if (!search_label.is(":visible")) {
          $('#site-search-label').slideDown("fast");
          search_container.addClass("active");
        }
      })
      .blur(function(e) {
        if (!search_suggest.is(":visible") && search_label.is(":visible")) {
          $('#site-search-label').slideUp("fast");
          search_container.removeClass("active");
        }
      });

      $('.SearchBox-form').submit(function(e) {
        /* Do not allow form to be submitted without content */
        if ($.trim($("#fb-search-input").val()).length == 0){
          return false;
        }
        else{
          return true;
        }
      });
    });

  /**
   * enable/disable and html element
   */
   fb.disable = function(elt) {
     $(elt).attr("disabled", "disabled").addClass("disabled");
   };

   fb.enable = function(elt) {
     $(elt).removeAttr("disabled").removeClass("disabled");
   };

   fb.lang_select = function(e, lang) {
     if (lang === "/lang/en") {
       // remove lang input from form
       $(this).removeAttr("name");
       if (!$(":input[name]", this.form).length) {
         window.location = $(this.form).attr("action");
         return;
       }
     }
     this.form.submit();
   };

   fb.edit_lang_select = function(e, lang) {
     setTimeout(function() {
       $(window).trigger("fb.edit.lang.select", lang);
     }, 0);
   };

   fb.devbar = {
     div: $("#devbar"),

     touch: function() {
       if (/\.(freebase|sandbox\-freebase)\.com$/.test(fb.acre.request.server_name)) {
         $.ajax({
           url:  fb.acre.freebase.googleapis_url ? fb.h.fb_googleapis_url("/touch") : fb.h.fb_api_url("/api/service/touch"),
           dataType: "jsonp"
         });
       }
       else {
         $.ajax({url: "/acre/touch"});
       }
       return false;
     },

     txn_ids: [],
     txn: function(e) {
       return fb.devbar.view_txn(this.href, fb.devbar.txn_ids);
     },

     view_txn: function(base_url, ids) {
       if (ids && ids.length) {
         window.location = base_url + "?" + $.param({tid:ids}, true);
       }
       return false;
     },

     ajaxComplete: function(xhr, status) {
       if (xhr && xhr.readyState === 4) {
         var tid = xhr.getResponseHeader("x-metaweb-tid");
         if (tid) {
           fb.devbar.txn_ids.push(tid);
         }
       }
     },

     init: function() {
       $nav_user_controls = $(".nav-user-controls");
       $user_controls = $("#user-controls");
       $("#signedin .trigger").click(
         function() {
           if($user_controls.is(":hidden")) {
             $user_controls.fadeIn();
             $nav_user_controls.addClass("active");
             return false;
           }
           else {
             $user_controls.fadeOut();
             $nav_user_controls.removeClass("active");
             return false;
           }
         }
       );
       $('html').click(function() {
         if($user_controls.is(":visible")) {
           $user_controls.fadeOut();
           $nav_user_controls.removeClass("active");
         }
       });
       $user_controls.click(function(e) {
         e.stopPropagation();
       });
       $("#devbar-touch > a").click(fb.devbar.touch);
       if (fb.tid) {
         fb.devbar.txn_ids.push(fb.tid);
       }
       $("#devbar-txn > a").click(fb.devbar.txn);
       $.ajaxSetup({complete:fb.devbar.ajaxComplete});
     }
   };
   fb.devbar.init();

})(jQuery, window.freebase);
