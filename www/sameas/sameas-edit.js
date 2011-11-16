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


(function($, fb, formlib) {

  var edit = fb.sameas.edit = {

    /**
     * ADD KEY
     */

    add_key_begin: function(trigger, body) {
      $.ajax($.extend(formlib.default_begin_ajax_options(), {
        url: fb.h.ajax_url("add_key_begin.ajax"),
        data: {id: fb.c.id},
        onsuccess: function(data) {
          var html = $(data.result.html);
          var head_row = $(".edit-row-head", html);
          var edit_row = $(".edit-row", html);
          var submit_row = $(".edit-row-submit", html);
          var event_prefix = "fb.sameas.add_key.";
          var options = {
            event_prefix: event_prefix,
            // callbacks
            init: edit.add_key_init,
            validate: edit.add_key_validate,
            submit: edit.add_key_submit,
            reset: edit.add_key_reset,
            // submit ajax options
            ajax: {
              url: fb.h.ajax_url("edit_key_submit.ajax")
            },
            // jQuery objects
            trigger: trigger,
            body: body,
            head_row: head_row,
            edit_row: edit_row,
            submit_row: submit_row
          };
          edit_row
            .bind(event_prefix + "cancel", function(e) {
              trigger.removeClass("editing");
            });
          formlib.init_inline_add_form(options);
        }
      }));
    },

    add_key_init: function(options) {
      var select = $(":input[name=namespace]", options.edit_row).chosen();
      var key = $(":input[name=key]", options.edit_row);
      fb.disable(key);
      select.change(function(e) {
        key.val("");
        if (this.value) {
          formlib.init_mqlkey(key, {
            mqlread: fb.mqlread,
            namespace: this.value
          });
          key
            .bind("valid", function() {
              formlib.enable_submit(options);
            })
            .bind("invalid", function() {
              formlib.disable_submit(options);
            });
          fb.enable(key);
          key.focus();
        }
        else {
          fb.disable(key);
        }
        formlib.disable_submit(options);
      });
    },

    add_key_validate: function(options) {
      var select = $(":input[name=namespace]", options.edit_row);
      var key = $(":input[name=key]", options.edit_row);
      if (!select.val()) {
        options.edit_row.trigger(options.event_prefix + "error", "Please select an authority/namespace");
        return false;
      }
      return formlib.validate_mqlkey(options, key);
    },

    add_key_submit: function(options, ajax_options) {
      var namespace = $(":input[name=namespace]", options.edit_row).val();
      var key = $(":input[name=key]", options.edit_row).val();
      ajax_options.data.o = JSON.stringify([{
        namespace: namespace,
        value: key,
        connect: "insert"
      }]);
      $.ajax($.extend(ajax_options, {
        onsuccess: function(data) {
          var new_row = $(data.result.html);
          formlib.success_inline_add_form(options, new_row);
        },
        onerror: function(errmsg) {
          options.edit_row.trigger(options.event_prefix + "error", errmsg);
        }
      }));
    },

    add_key_reset: function(options) {
      var select = $(":input[name=namespace]", options.edit_row);
      var key = $(":input[name=key]", options.edit_row);
      key.val("").focus().trigger("textchange")
        .next(".key-status").text("").removeClass("loading");
      formlib.disable_submit(options);
    },


    /**
     * EDIT KEY
     */

    edit_key_begin: function(key_row) {
      var key = key_row.metadata();
      $.ajax($.extend(formlib.default_begin_ajax_options(), {
        url: fb.h.ajax_url("edit_key_begin.ajax"),
        data: {id: fb.c.id, namespace:key.namespace, value:key.value},
        onsuccess: function(data) {
          var html = $(data.result.html);
          var head_row = $(".edit-row-head", html);
          var edit_row = $(".edit-row", html);
          var submit_row = $(".edit-row-submit", html);
          var event_prefix = "fb.sameas.edit_key.";
          var options = {
            event_prefix: event_prefix,
            // callbacks
            init: edit.edit_key_init,
            validate: edit.edit_key_validate,
            submit: edit.edit_key_submit,
            // submit ajax options
            ajax: {
              url: fb.h.ajax_url("edit_key_submit.ajax")
            },
            // jQuery objects
            row: key_row,
            head_row: head_row,
            edit_row: edit_row,
            submit_row: submit_row
          };
          edit_row
            .bind(event_prefix + "success", function(e) {
              key_row.removeClass("editing");
            })
            .bind(event_prefix + "cancel", function(e) {
              key_row.removeClass("editing");
            });
          formlib.init_inline_edit_form(options);
        }
      }));
    },

    edit_key_init: function(options) {
      var namespace = $(":input[name=namespace]", options.edit_row).val();
      var key = $(":input[name=key]", options.edit_row);
      formlib.init_mqlkey(key, {
        mqlread: fb.mqlread,
        namespace: namespace
      });
      key
        .bind("valid", function() {
          formlib.enable_submit(options);
        })
        .bind("invalid", function() {
          formlib.disable_submit(options);
        })
        .select()
        .focus();
    },

    edit_key_validate: function(options) {
      var key = $(":input[name=key]", options.edit_row);
      return formlib.validate_mqlkey(options, key);
    },

    edit_key_submit: function(options, ajax_options) {
      var namespace = $(":input[name=namespace]", options.edit_row);
      var key = $(":input[name=key]", options.edit_row);
      // unique namespace?
      var unique = namespace.attr("data-unique") === "true";
      namespace = namespace.val();
      // same key value?
      var old_value = options.row.metadata().value;
      var new_value = key.val();
      if (new_value === old_value) {
        options.edit_row.trigger(options.event_prefix + "cancel");
        return;
      }
      if (unique) {
        ajax_options.data.o = JSON.stringify([{
          namespace: namespace,
          value: new_value,
          connect: "update"
        }]);
      }
      else {
        ajax_options.data.o = JSON.stringify([{
          namespace: namespace,
          value: old_value,
          connect: "delete"
        },{
          namespace: namespace,
          value: new_value,
          connect: "insert"
        }]);
      }
      $.ajax($.extend(ajax_options, {
        onsuccess: function(data) {
          var new_row = $(data.result.html);
          formlib.success_inline_edit_form(options, new_row);
        },
        onerror: function(errmsg) {
          options.edit_row.trigger(options.event_prefix + "error", errmsg);
        }
      }));
    },


    /**
     * DELETE KEY
     */
    delete_key_begin: function(key_row) {
     var key = key_row.metadata();
      $.ajax($.extend(formlib.default_submit_ajax_options(), {
        url: fb.h.ajax_url("edit_key_submit.ajax"),
        data: {
          s: fb.c.id,
          p: "/type/object/key",
          o: JSON.stringify([{
            namespace: key.namespace,
            value: key.value,
            connect: "delete"
          }]),
          lang: fb.lang
        },
        onsuccess: function(data) {
          var msg_row = $(data.result.html);
          formlib.success_inline_delete(key_row, msg_row, function() {
            $.ajax($.extend(formlib.default_submit_ajax_options(),  {
              url: fb.h.ajax_url("edit_key_submit.ajax"),
              data: {
                s: fb.c.id,
                p: "/type/object/key",
                o: JSON.stringify([{
                  namespace: key.namespace,
                  value: key.value,
                  connect: "insert"
                }]),
                lang: fb.lang
              },
              onsuccess: function(data) {
                formlib.success_inline_delete_undo(msg_row);
              }
            }));
          });
          key_row.removeClass("editing");
        }
      }));
    }
  };

})(jQuery, window.freebase, window.formlib);
