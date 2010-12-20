
/** jquerytools, toolbox.expose.js **/
/**
 * @license 
 * jQuery Tools @VERSION / Expose - Dim the lights
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/toolbox/expose.html
 *
 * Since: Mar 2010
 * Date: @DATE 
 */
(function($) { 	

	// static constructs
	$.tools = $.tools || {version: '@VERSION'};
	
	var tool;
	
	tool = $.tools.expose = {
		
		conf: {	
			maskId: 'exposeMask',
			loadSpeed: 'slow',
			closeSpeed: 'fast',
			closeOnClick: true,
			closeOnEsc: true,
			
			// css settings
			zIndex: 9998,
			opacity: 0.8,
			startOpacity: 0,
			color: '#fff',
			
			// callbacks
			onLoad: null,
			onClose: null
		}
	};

	/* one of the greatest headaches in the tool. finally made it */
	function viewport() {
				
		// the horror case
		if ($.browser.msie) {
			
			// if there are no scrollbars then use window.height
			var d = $(document).height(), w = $(window).height();
			
			return [
				window.innerWidth || 							// ie7+
				document.documentElement.clientWidth || 	// ie6  
				document.body.clientWidth, 					// ie6 quirks mode
				d - w < 20 ? w : d
			];
		} 
		
		// other well behaving browsers
		return [$(document).width(), $(document).height()]; 
	} 
	
	function call(fn) {
		if (fn) { return fn.call($.mask); }
	}
	
	var mask, exposed, loaded, config, overlayIndex;		
	
	
	$.mask = {
		
		load: function(conf, els) {
			
			// already loaded ?
			if (loaded) { return this; }			
			
			// configuration
			if (typeof conf == 'string') {
				conf = {color: conf};	
			}
			
			// use latest config
			conf = conf || config;
			
			config = conf = $.extend($.extend({}, tool.conf), conf);

			// get the mask
			mask = $("#" + conf.maskId);
				
			// or create it
			if (!mask.length) {
				mask = $('<div/>').attr("id", conf.maskId);
				$("body").append(mask);
			}
			
			// set position and dimensions 			
			var size = viewport();
				
			mask.css({				
				position:'absolute', 
				top: 0, 
				left: 0,
				width: size[0],
				height: size[1],
				display: 'none',
				opacity: conf.startOpacity,					 		
				zIndex: conf.zIndex 
			});
			
			if (conf.color) {
				mask.css("backgroundColor", conf.color);	
			}			
			
			// onBeforeLoad
			if (call(conf.onBeforeLoad) === false) {
				return this;
			}
			
			// esc button
			if (conf.closeOnEsc) {						
				$(document).bind("keydown.mask", function(e) {							
					if (e.keyCode == 27) {
						$.mask.close(e);	
					}		
				});			
			}
			
			// mask click closes
			if (conf.closeOnClick) {
				mask.bind("click.mask", function(e)  {
					$.mask.close(e);		
				});					
			}			
			
			// resize mask when window is resized
			$(window).bind("resize.mask", function() {
				$.mask.fit();
			});
			
			// exposed elements
			if (els && els.length) {
				
				overlayIndex = els.eq(0).css("zIndex");

				// make sure element is positioned absolutely or relatively
				$.each(els, function() {
					var el = $(this);
					if (!/relative|absolute|fixed/i.test(el.css("position"))) {
						el.css("position", "relative");		
					}					
				});
			 
				// make elements sit on top of the mask
				exposed = els.css({ zIndex: Math.max(conf.zIndex + 1, overlayIndex == 'auto' ? 0 : overlayIndex)});			
			}	
			
			// reveal mask
			mask.css({display: 'block'}).fadeTo(conf.loadSpeed, conf.opacity, function() {
				$.mask.fit(); 
				call(conf.onLoad);
			});
			
			loaded = true;			
			return this;				
		},
		
		close: function() {
			if (loaded) {
				
				// onBeforeClose
				if (call(config.onBeforeClose) === false) { return this; }
					
				mask.fadeOut(config.closeSpeed, function()  {					
					call(config.onClose);					
					if (exposed) {
						exposed.css({zIndex: overlayIndex});
					}				
				});				
				
				// unbind various event listeners
				$(document).unbind("keydown.mask");
				mask.unbind("click.mask");
				$(window).unbind("resize.mask");
	
				loaded = false;
			}
			
			return this; 
		},
		
		fit: function() {
			if (loaded) {
				var size = viewport();				
				mask.css({width: size[0], height: size[1]});
			}				
		},
		
		getMask: function() {
			return mask;	
		},
		
		isLoaded: function() {
			return loaded;	
		}, 
		
		getConf: function() {
			return config;	
		},
		
		getExposed: function() {
			return exposed;	
		}		
	};
	
	$.fn.mask = function(conf) {
		$.mask.load(conf);
		return this;		
	};			
	
	$.fn.expose = function(conf) {
		$.mask.load(conf, this);
		return this;			
	};


})(jQuery);

/** jquerytools, overlay.js **/
/**
 * @license 
 * jQuery Tools @VERSION Overlay - Overlay base. Extend it.
 * 
 * NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.
 * 
 * http://flowplayer.org/tools/overlay/
 *
 * Since: March 2008
 * Date: @DATE 
 */
(function($) { 

	// static constructs
	$.tools = $.tools || {version: '@VERSION'};
	
	$.tools.overlay = {
		
		addEffect: function(name, loadFn, closeFn) {
			effects[name] = [loadFn, closeFn];	
		},
	
		conf: {  
			close: null,	
			closeOnClick: true,
			closeOnEsc: true,			
			closeSpeed: 'fast',
			effect: 'default',
			
			// since 1.2. fixed positioning not supported by IE6
			fixed: !$.browser.msie || $.browser.version > 6, 
			
			left: 'center',		
			load: false, // 1.2
			mask: null,  
			oneInstance: true,
			speed: 'normal',
			target: null, // target element to be overlayed. by default taken from [rel]  
			top: '10%'
		}
	};

	
	var instances = [], effects = {};
		
	// the default effect. nice and easy!
	$.tools.overlay.addEffect('default', 
		
		/* 
			onLoad/onClose functions must be called otherwise none of the 
			user supplied callback methods won't be called
		*/
		function(pos, onLoad) {
			
			var conf = this.getConf(),
				 w = $(window);				 
				
			if (!conf.fixed)  {
				pos.top += w.scrollTop();
				pos.left += w.scrollLeft();
			} 
				
			pos.position = conf.fixed ? 'fixed' : 'absolute';
			this.getOverlay().css(pos).fadeIn(conf.speed, onLoad); 
			
		}, function(onClose) {
			this.getOverlay().fadeOut(this.getConf().closeSpeed, onClose); 			
		}		
	);		

	
	function Overlay(trigger, conf) {		
		
		// private variables
		var self = this,
			 fire = trigger.add(self),
			 w = $(window), 
			 closers,            
			 overlay,
			 opened,
			 maskConf = $.tools.expose && (conf.mask || conf.expose),
			 uid = Math.random().toString().slice(10);		
		
			 
		// mask configuration
		if (maskConf) {			
			if (typeof maskConf == 'string') { maskConf = {color: maskConf}; }
			maskConf.closeOnClick = maskConf.closeOnEsc = false;
		}			 
		 
		// get overlay and triggerr
		var jq = conf.target || trigger.attr("rel");
		overlay = jq ? $(jq) : null || trigger;	
		
		// overlay not found. cannot continue
		if (!overlay.length) { throw "Could not find Overlay: " + jq; }
		
		// trigger's click event
		if (trigger && trigger.index(overlay) == -1) {
			trigger.click(function(e) {				
				self.load(e);
				return e.preventDefault();
			});
		}   			
		
		// API methods  
		$.extend(self, {

			load: function(e) {
				
				// can be opened only once
				if (self.isOpened()) { return self; }
				
				// find the effect
		 		var eff = effects[conf.effect];
		 		if (!eff) { throw "Overlay: cannot find effect : \"" + conf.effect + "\""; }
				
				// close other instances?
				if (conf.oneInstance) {
					$.each(instances, function() {
						this.close(e);
					});
				}
				
				// onBeforeLoad
				e = e || $.Event();
				e.type = "onBeforeLoad";
				fire.trigger(e);				
				if (e.isDefaultPrevented()) { return self; }				

				// opened
				opened = true;
				
				// possible mask effect
				if (maskConf) { $(overlay).expose(maskConf); }				
				
				// position & dimensions 
				var top = conf.top,					
					 left = conf.left,
					 oWidth = overlay.outerWidth({margin:true}),
					 oHeight = overlay.outerHeight({margin:true}); 
				
				if (typeof top == 'string')  {
					top = top == 'center' ? Math.max((w.height() - oHeight) / 2, 0) : 
						parseInt(top, 10) / 100 * w.height();			
				}				
				
				if (left == 'center') { left = Math.max((w.width() - oWidth) / 2, 0); }

				
		 		// load effect  		 		
				eff[0].call(self, {top: top, left: left}, function() {					
					if (opened) {
						e.type = "onLoad";
						fire.trigger(e);
					}
				}); 				

				// mask.click closes overlay
				if (maskConf && conf.closeOnClick) {
					$.mask.getMask().one("click", self.close); 
				}
				
				// when window is clicked outside overlay, we close
				if (conf.closeOnClick) {
					$(document).bind("click." + uid, function(e) { 
						if (!$(e.target).parents(overlay).length) { 
							self.close(e); 
						}
					});						
				}						
			
				// keyboard::escape
				if (conf.closeOnEsc) { 

					// one callback is enough if multiple instances are loaded simultaneously
					$(document).bind("keydown." + uid, function(e) {
						if (e.keyCode == 27) { 
							self.close(e);	 
						}
					});			
				}

				
				return self; 
			}, 
			
			close: function(e) {

				if (!self.isOpened()) { return self; }
				
				e = e || $.Event();
				e.type = "onBeforeClose";
				fire.trigger(e);				
				if (e.isDefaultPrevented()) { return; }				
				
				opened = false;
				
				// close effect
				effects[conf.effect][1].call(self, function() {
					e.type = "onClose";
					fire.trigger(e); 
				});
				
				// unbind the keyboard / clicking actions
				$(document).unbind("click." + uid).unbind("keydown." + uid);		  
				
				if (maskConf) {
					$.mask.close();		
				}
				 
				return self;
			}, 
			
			getOverlay: function() {
				return overlay;	
			},
			
			getTrigger: function() {
				return trigger;	
			},
			
			getClosers: function() {
				return closers;	
			},			

			isOpened: function()  {
				return opened;
			},
			
			// manipulate start, finish and speeds
			getConf: function() {
				return conf;	
			}			
			
		});
		
		// callbacks	
		$.each("onBeforeLoad,onStart,onLoad,onBeforeClose,onClose".split(","), function(i, name) {
				
			// configuration
			if ($.isFunction(conf[name])) { 
				$(self).bind(name, conf[name]); 
			}

			// API
			self[name] = function(fn) {
				$(self).bind(name, fn);
				return self;
			};
		});
		
		// close button
		closers = overlay.find(conf.close || ".close");		
		
		if (!closers.length && !conf.close) {
			closers = $('<a class="close"></a>');
			overlay.prepend(closers);	
		}		
		
		closers.click(function(e) { 
			self.close(e);  
		});	
		
		// autoload
		if (conf.load) { self.load(); }
		
	}
	
	// jQuery plugin initialization
	$.fn.overlay = function(conf) {   
		
		// already constructed --> return API
		var el = this.data("overlay");
		if (el) { return el; }	  		 
		
		if ($.isFunction(conf)) {
			conf = {onBeforeLoad: conf};	
		}

		conf = $.extend(true, {}, $.tools.overlay.conf, conf);
		
		this.each(function() {		
			el = new Overlay($(this), conf);
			instances.push(el);
			$(this).data("overlay", el);	
		});
		
		return conf.api ? el: this;		
	}; 
	
})(jQuery);


/** jquery.mqlkey.js **/
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
      return key;
    }
  });

})(jQuery);

/** schema-edit.js **/
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


(function($, fb) {
  $(window).ajaxSend(function(event, xhr, options) {
    if (options.type === "POST") {
      xhr.setRequestHeader("x-acre-cache-control", "max-age: 3600");
    }
  });

  var se = fb.schema.edit = {

    /**
     * This is an attempt at separating out the common logic
     * when adding/editing a row in a schema table.
     * This logic is currently shared by the domain and type schema page:
     * 1. Adding a type on the domain page.
     * 2. Editing a type on the domain page.
     * 3. Adding a property on the type page.
     * 4. Editing a property on the type page
     *
     * @param form:Object (required) - A set of key/value pairs specifying form options:
     * - mode:String (required) - Mode to specify the actual edit mode (add|edit)
     * - event_prefix:String (required) - This is the prefix of all events that will be
     *                                    triggered in the course of the form editing.
     *                                    (event_prefix[submit|cancel|error|success])
     * - init_form:Function (required) - A hook to initialize the form row.
     * - validate_form:Function (required) - A hook to validating the form row.
     * - submit_form:Function (required)
     *
     * - table:jQuery (required)
     * - trigger:jQuery (required)
     * - trigger_row:jQuery (required)
     * - row:jQuery (required)
     * - submit_row:jQuery (required)
     */
    init_edit_form: function(form) {
      if (form.mode === "add") {
        $("tbody", form.table).append(form.row);
      }
      else if (form.mode === "edit") {
        form.trigger_row.before(form.row);
      }
      else {
        throw "Unknown edit type mode: " + form.mode;
      }
      form.trigger_row.before(form.submit_row);

      var event_prefix = form.event_prefix || "fb.schema.edit.";
      form.row
        .bind(event_prefix + "submit", function() {
          // console.log(event_prefix + "submit");
          se.submit_edit_form(form);
        })
        .bind(event_prefix + "cancel", function() {
          // console.log(event_prefix + "cancel");
          se.cancel_edit_form(form);
        })
        .bind(event_prefix + "error", function(e, row, error) {
          // console.log(event_prefix + "error", row, error);
          se.row_error(row, error);
          form.row.removeClass("loading");
        })
        .bind(event_prefix + "success", function() {
          // console.log(event_prefix + "success");
          form.row.removeClass("loading");
        });

      // submit handler
      $(".button-submit", form.submit_row).click(function() {
        form.row.trigger(event_prefix + "submit");
      });
      // cancel handler
      $(".button-cancel", form.submit_row).click(function() {
        form.row.trigger(event_prefix + "cancel");
      });

      form.row.showRow(function() {
        // init edit-row
        if (typeof form.init_form === "function") {
          form.init_form(form);
        }
      });
      form.trigger_row.hide();
      form.submit_row.show();

      $("[placeholder]", form.row).placeholder();
      $(window).bind("fb.lang.select", function(e, lang) {
        se.toggle_lang(form.row, lang);
      });
    },

    cancel_edit_form: function(form) {
      form.row.hideRow(function() {
        $(this).remove();
      });
      se.clear_row_message(form.row);
      form.submit_row.remove();
      form.trigger_row.show();
      form.trigger.removeClass("editing");
    },

    submit_edit_form: function(form) {
      // are we already submitting?
      if (form.row.is(".loading")) {
        return;
      }

      // remove focus from activeElement
      if (document.activeElement) {
        $(document.activeElement).blur();
      }

      // clear messages
      se.clear_row_message(form.row);

     // validate edit-row
      if (typeof form.validate_form === "function") {
        form.validate_form(form);
      }

      // any pre-submit errors?
      if (se.has_row_message(form.row, "error")) {
        return;
      }

      // add a loading class to flag we are submitting the form
      form.row.addClass("loading");

      // submit edit-row
      if (typeof form.submit_form === "function") {
        form.submit_form(form);
      }
    },

    ajax_error_handler: function(xhr, row, form) {
      var msg;
      try {
        msg = JSON.parse(xhr.responseText);
        msg = msg.messages[0].message; // display the first message
      }
      catch(e) {
        msg = xhr.responseText;
      }
      // TODO: make error expandable to see whole error message
      if (row) {
        se.row_error(row, msg);
        row.removeClass("loading");
      }
      else if (form) {
        se.form_error(form, msg);
        form.removeClass("loading");
      }
    },

    row_error: function(row, msg) {
      return se.row_message(row, msg, "error");
    },

    row_message: function(row, msg, type) {
      var close = $('<a class="close-msg" href="#">Close</a>').click(function(e) {
        return fb.schema.close_message.apply(this, [e, '.row-msg:first']);
      });
      var span = $("<span>").text(msg);
      var td = $('<td colspan="5">').append(close).append(span);
      var row_msg = $('<tr class="row-msg">').append(td);
      if (type) {
        row_msg.addClass("row-msg-" + type);
      }

      // prepend row_msg to row
      row.before(row_msg);
      row_msg.hide().showRow();

      var msg_data = row.data("row-msg");
      if (!msg_data) {
        msg_data = {};
        row.data("row-msg", msg_data);
      }
      if (!msg_data[type]) {
        msg_data[type] = [row_msg];
      }
      else {
        msg_data[type].push(row_msg);
      }
      return row_msg;
    },

    clear_row_message: function(row) {
      var msg_data = row.data("row-msg");
      if (msg_data) {
        $.each(msg_data, function(type,msgs) {
          $.each(msgs, function(i,msg) {
            msg.remove();
          });
        });
        row.removeData("row-msg");
      }
    },

    has_row_message: function(row, type) {
      var msg_data = row.data("row-msg");
      if (type) {
        return msg_data && msg_data[type] && msg_data[type].length;
      }
      return msg_data != null;
    },

    init_modal_form: function(form) {

      $(document.body).append(form.form.hide());

      var event_prefix = form.event_prefix || "fb.schema.edit.modal.";
      form.form
       .bind(event_prefix + "submit", function() {
          // console.log(event_prefix + "submit");
          se.submit_modal_form(form);
        })
        .bind(event_prefix + "error", function(e, error) {
          // console.log(event_prefix + "error", error);
          se.form_error(form.form, error);
        })
        .bind(event_prefix + "success", function() {
          // console.log(event_prefix + "success");
          form.form.removeClass("loading");
        });

     // submit handler
      $(".modal-buttons .button-submit", form.form).click(function() {
        form.form.trigger(event_prefix + "submit");
      });

      form.form.overlay({
          close: ".modal-buttons .button-cancel",
          closeOnClick: false,
          load: true,
          mask: {
            color: '#000',
	    loadSpeed: 200,
	    opacity: 0.5
	  },
          onLoad: function() {
            // init form
            if (typeof form.init_form === "function") {
              form.init_form(form);
            }
          }
        });

      $("[placeholder]", form.form).placeholder();
      fb.schema.init_modal_help(form.form);

      $(window).bind("fb.lang.select", function(e, lang) {
        se.toggle_lang(form.form, lang);
      });
    },

    submit_modal_form: function(form) {
      // are we already submitting?
      if (form.form.is(".loading")) {
        return;
      }

      // remove focus from activeElement
      if (document.activeElement) {
        $(document.activeElement).blur();
      }

      // clear messages
      se.clear_form_message(form.form);

      // validate edit-row
      if (typeof form.validate_form === "function") {
        form.validate_form(form);
      }

      // any pre-submit errors?
      if (se.has_form_message(form.form, "error")) {
        return;
      }

      // add a loading class to flag we are submitting the form
      form.form.addClass("loading");

      // submit edit-row
      if (typeof form.submit_form === "function") {
        form.submit_form(form);
      }
    },

    form_error: function(form, msg) {
      return se.form_message(form, msg, "error");
    },

    form_message: function(form, msg, type) {
      var form_msg = $("<div class='form-msg'>").text(msg).hide();

      $(".form-group", form).prepend(form_msg);
      form_msg.slideDown();

      var msg_data = form.data("form-msg");
      if (!msg_data) {
        msg_data = {};
        form.data("form-msg", msg_data);
      }
      if (!msg_data[type]) {
        msg_data[type] = [form_msg];
      }
      else {
        msg_data[type].push(form_msg);
      }
      return form_msg;
    },

    clear_form_message: function(form) {
      var msg_data = form.data("form-msg");
      if (msg_data) {
        $.each(msg_data, function(type,msgs) {
          $.each(msgs, function(i,msg) {
            msg.remove();
          });
        });
        form.removeData("form-msg");
      }
    },

    has_form_message: function(form, type) {
      var msg_data = form.data("form-msg");
      if (type) {
        return msg_data && msg_data[type] && msg_data[type].length;
      }
      return msg_data != null;
    },

    toggle_lang: function(context, lang) {
      var elts = $("[lang]", context).each(function() {
        var elt = $(this);
        var elt_lang = $(this).attr("lang");
        if (elt_lang === lang) {
          elt.show().focus().blur();
        }
        else {
          elt.hide();
        }
      });
    },

    init_mqlkey: function(input, mqlkey_options) {
      input
        .mqlkey(mqlkey_options)
        .bind("valid", function(e, val) {
          $(this).next(".key-status")
            .removeClass("invalid")
            .removeClass("loading")
            .addClass("valid")
            .text("valid")
            .attr("title", "Key is available");
        })
        .bind("invalid", function(e, msg) {
          $(this).next(".key-status")
            .removeClass("valid")
            .removeClass("loading")
            .addClass("invalid")
            .text("invalid")
            .attr("title", msg);
        })
        .bind("textchange", function(e) {
          $(this).next(".key-status")
            .removeClass("invalid")
            .removeClass("valid")
            .addClass("loading");
        });
    },

    validate_mqlkey: function(form, input) {
      var form_elt = form.form || form.row;
      var key_status = input.next(".key-status");
      var keyval = input.val();
      if (keyval === "") {
        //console.log("VALIDATE MQLKEY", "EMPTY");
        form_elt.trigger(form.event_prefix + "error", "Key is required");
        return false;
      }
      if (keyval === input.data("mqlkey").original) {
        //console.log("VALIDATE MQLKEY", "ORIGINAL");
        return true;
      }
      if (key_status.is(".invalid")) {
        //console.log("VALIDATE MQLKEY", "INVALID");
        form_elt.trigger(form.event_prefix + "error", key_status.attr("title"));
        return false;
      }
      else if (key_status.is(".loading")) {
        //console.log("VALIDATE MQLKEY", "LOADING");
        return false;
      }
      //console.log("VALIDATE MQLKEY", "VALID");
      return true;
    },


    /**
     * If you change this, please change key generation methods in //schema.freebase.site.dev/helpers
     */
    auto_key: function(input, output, type) {
      var original_key = output.val();
      if (original_key) {
        // output already contains value, we do not want to overwrite
        output.data("original", original_key);
      }
      else {
        output.data("autogen", true);
        output.change(function() {
          output.data("autogen", false);
        });
        input.change(function() {
          if (output.data("autogen")) {
            var key = $.trim(input.val()).toLowerCase();
            key = key.replace(/[^a-z0-9]/g, '_');    // remove all non-alphanumeric
            key = key.replace(/\_\_+/g, '_');        // replace __+ with _
            key = key.replace(/[^a-z0-9]+$/, '');    // strip ending non-alphanumeric
            key = key.replace(/^[^a-z]+/, '');       // strip beginning non-alpha
            try {
              se.check_key(key, type);
            }
            catch (ex) {
              return;
            }
            output.val(key);
          }
        });
      }
    },

    check_key: function(key, type) {
      if (type === "/type/domain") {
        return se.check_key_domain(key);
      }
      else if (type === "/type/type") {
        return se.check_key_type(key);
      }
      else if (type === "/type/property") {
        return se.check_key_property(key);
      }
      else {
        return se.check_key_default(key);
      }
    },

    check_key_domain: function(key) {
      return se.check_key_default(key, 5);
    },

    check_key_type: function(key) {
      return se.check_key_default(key);
    },

    check_key_property: function(key) {
      return se.check_key_default(key);
    },

    check_key_default: function(key, minlen) {
      if (!minlen) {
        minlen = 1;
      }
      if (minlen === 1 && key.length === 1) {
        if (/^[a-z]$/.test(key)) {
          return key;
        }
      }
      else {
        var pattern = "^[a-z][a-z0-9_]";
        if (minlen > 1) {
          pattern += "{" + (minlen - 1) + ",}$";
        }
        else {
          pattern += "+$";
        }
        var re = RegExp(pattern);
        if (re.test(key)) {
          if (! (key.match(/__+/) ||
                 key.match(/[^a-z0-9]+$/))) {
            return key;
          }
        }
      }
      var msg;
      if (minlen > 1) {
        msg = "Key must be " + minlen + " or more alphanumeric characters";
      }
      else {
        msg = "Key must be alphanumeric";
      }
      msg += ", lowercase, begin with a letter and not end with a non-alphanumeric character. Underscores are allowed but not consecutively.";
      throw(msg);
    }
  };
})(jQuery, window.freebase);
