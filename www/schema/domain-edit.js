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

  var se = fb.schema.edit;   // required;

  var de = fb.schema.domain.edit = {

    /**
     * domain settings form
     */
    domain_settings_begin: function(trigger, domain_id) {
      $.ajax({
        url: fb.h.ajax_url("domain_settings_begin.ajax"),
        data: {id:domain_id, lang:fb.lang},
        dataType: "json",
        success: function(data, status, xhr) {
          var html = $(data.result.html);
          var form = {
            event_prefix: "fb.schema.domain.settings.",
            ajax: {
              url: fb.h.ajax_url("domain_settings_submit.ajax"),
              data: {id: domain_id}
            },

            init_form: de.init_domain_settings_form,
            validate_form: de.validate_domain_settings_form,
            submit_form: de.submit_domain_settings_form,

            form: html
          };

          se.init_modal_form(form);

          form.form
            .bind(form.event_prefix + "success", function(e, data) {
              window.location = data.location;
            });
        }
      });
    },

    init_domain_settings_form: function(form) {
      var name = $("input[name=name]", form.form);
      var key = $("input[name=key]", form.form);

      var domain_ns = $("input[name=namespace]", form.form).val();
      se.init_mqlkey(key, {
        minlen: 5,
        source: name,
        namespace: domain_ns,
        mqlread_url: fb.acre.freebase.googleapis_url ? fb.h.fb_googleapis_url("/mqlread") : fb.h.fb_api_url("/api/service/mqlread"),
        schema: true
      });

      // enter key
      $(":input:not(textarea)", form.form)
        .keypress(function(e) {
          if (e.keyCode === 13 && !e.isDefaultPrevented()) { // enter
            form.form.trigger(form.event_prefix + "submit");
          }
        });

      //Confirm dialog for deleting a domain
      $(".button.delete", form.form).click(function() {
        var container = $(this).parent().siblings().find(".modal-content");
        var button_row = $(".modal-buttons", form.form).animate({opacity:0}, 500);
        var confirm_dialog = $(".modal-help", container).height(container.height()).slideDown();
        var cancel_button = $(".button.cancel", container).click(function(e) {
          button_row.animate({opacity:1}, 500);
          confirm_dialog.slideUp();
        });
        var delete_button = $(".button.save", container).click(function(e) {
          if (form.form.is(".loading")) {
            return;
          }
          form.form.addClass("loading");
          var data = {
            id : form.ajax.data.id,
            user: fb.user.id
          };
          $.ajax({
            url: fb.h.ajax_url("delete_domain_submit.ajax"),
            type: "POST",
            dataType: "json",
            data: data,
            success: function(data, status, xhr) {
              if (data.code === "/api/status/error") {
                return se.ajax_error_handler(xhr, null, form.form);
              }
              form.form.trigger(form.event_prefix + "success", data.result);
            },
            error: function(xhr) {
              se.ajax_error_handler(xhr, null, form.form);
              cancel_button.click();
            }
          });
        });
      });
    },

    validate_domain_settings_form: function(form) {
      var name = $.trim($("input[name=name]:visible", form.form).val());
      if (name === "") {
        form.form.trigger(form.event_prefix + "error", "Name is required");
      }
      var key = $("input[name=key]", form.form);
      se.validate_mqlkey(form, key);
    },

    submit_domain_settings_form: function(form) {
      var key = $("input[name=key]", form.form);
      if (!se.validate_mqlkey(form, key)) {
        form.form.removeClass("loading");
        return;
      }

      var data = {
        name: $.trim($("input[name=name]:visible", form.row).val()),
        key: key.val(),
        namespace: $("input[name=namespace]", form.form).val(),
        description: $.trim($("textarea[name=description]:visible", form.form).val()),
        lang: $("select[name=lang]", form.form).val()
      };

      $.ajax({
        url: form.ajax.url,
        type: "POST",
        dataType: "json",
        data: $.extend(data, form.ajax.data),
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, null, form.form);
          }
          form.form.trigger(form.event_prefix + "success", data.result);
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, null, form.form);
        }
      });
    },

    /**
     * retrieve add_type form (ajax).
     */
    add_type_begin: function(trigger, domain_id, mediator) {
      $.ajax({
        url: fb.h.ajax_url("add_type_begin.ajax"),
        data: {id: domain_id, mediator: mediator, lang: fb.lang},
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, row);
          }
          // add edit-form after the edit button
          var html = $(data.result.html);
          var form = {
            mode: "add",
            event_prefix: "fb.schema.domain.add.type.",
            ajax: {
              url: fb.h.ajax_url("add_type_submit.ajax")
            },

            init_form: de.init_type_form,
            validate_form: de.validate_type_form,
            submit_form: de.submit_type_form,

            table: trigger.parents("table:first"),
            trigger: trigger,
            trigger_row: trigger.parents("tr:first"),
            row: $(".edit-row", html).hide(),
            submit_row: $(".edit-row-submit", html).hide()
          };

          se.init_edit_form(form);

          /**
           * after submit success, re-init form for additional adds
           */
          form.row.bind("fb.schema.domain.add.type.success", function() {
            // show headers if showing the empty message
            var empty_msg = $("thead:first .table-empty-column", form.table);
            if (empty_msg.length) {
              empty_msg.parents("tr:first").hide().prev("tr").show();
            }
            $(".button.cancel", form.submit_row).text("Done");
            de.init_type_form(form);
          });
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, row);
        }
      });
    },

    /**
     * edit type
     */
    edit_type_begin: function(trigger, type_id) {
      $.ajax({
        url: fb.h.ajax_url("edit_type_begin.ajax"),
        data: {id: type_id, lang: fb.lang},
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, row);
          }
          // add edit-form after the edit button
          var html = $(data.result.html);
          var form = {
            mode: "edit",
            event_prefix: "fb.schema.domain.edit.type.",
            ajax: {
              url: fb.h.ajax_url("edit_type_submit.ajax"),
              data: {id: type_id}
            },

            init_form: de.init_type_form,
            validate_form: de.validate_type_form,
            submit_form: de.submit_type_form,


            table: trigger.parents("table:first"),
            trigger: trigger,
            trigger_row: trigger.parents("tr:first"),
            row: $(".edit-row", html).hide(),
            submit_row: $(".edit-row-submit", html).hide()
          };

          se.init_edit_form(form);

          /**
           * after submit success, we're done editing, remove form and old row
           */
          form.row.bind("fb.schema.domain.edit.type.success", function() {
            form.trigger_row.remove(); // old row
            form.row.remove();
            form.submit_row.remove();
          });
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, row);
        }
      });
    },

    /**
     * init add_type row
     */
    init_type_form: function(form) {
      var name = $("input[name=name]", form.row);
      var key =  $("input[name=key]", form.row);

      if (form.mode === "add") {
        name.val("");
        key.val("");
        $("textarea[name=description]", form.row).val("");
        $("input[name=enumeration]", form.row).removeAttr("checked");
      }

      if (!form.row.data("initialized")) {
        var domain = $("input[name=domain]", form.row).val();
        se.init_mqlkey(key, {
          source: name,
          namespace: domain,
          mqlread_url:  fb.acre.freebase.googleapis_url ? fb.h.fb_googleapis_url("/mqlread") : fb.h.fb_api_url("/api/service/mqlread"),
          schema: true
        });

        // enter/escape key handler
        $(":input:not(textarea)", form.row).keypress(function(e) {
          if (e.keyCode === 13) { // enter
            form.row.trigger(form.event_prefix + "submit");
          }
          else if (e.keyCode === 27) { // escape
            form.row.trigger(form.event_prefix + "cancel");
          }
        });
        form.row.data("initialized", true);
      }
      name.focus();
    },

    /**
     * validate rows, if no errors submit
     */
    submit_type_form: function(form) {
      var key = $("input[name=key]", form.row);
      if (!se.validate_mqlkey(form, key)) {
        form.row.removeClass("loading");
        return;
      }

      var data = {
        domain:  $("input[name=domain]", form.row).val(),
        name: $.trim($("input[name=name]:visible", form.row).val()),
        key: key.val(),
        description: $.trim($("textarea[name=description]:visible", form.row).val()),
        mediator: $("input[name=mediator]", form.row).is(":checked") ? 1 : 0,
        enumeration: $("input[name=enumeration]", form.row).is(":checked") ? 1 : 0,
        lang: $("select[name=lang]", form.submit_row).val()
      };

      $.ajax({
        url: form.ajax.url,
        type: "POST",
        dataType: "json",
        data: $.extend(data, form.ajax.data),
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, form.row);
          }
          var new_row = $(data.result.html).addClass("new-row");
          form.row.before(new_row);
          new_row.hide();
          new_row.showRow(function() {
            // init row menu
            fb.schema.init_row_menu(new_row);
            // show edit controls in tooltip
            $(".edit", new_row).show();
          }, null, "slow");
          form.row.trigger(form.event_prefix + "success");
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, form.row);
        }
      });
    },

    /**
     * validate row
     */
    validate_type_form: function(form) {
      var name = $.trim($("input[name=name]:visible", form.row).val());
      if (name === "") {
        form.row.trigger(form.event_prefix + "error", "Name is required");
      }
      var key = $("input[name=key]", form.row);
      se.validate_mqlkey(form, key);
    },


    /**
     * delete type
     */
    delete_type_begin: function(trigger, type_id) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: fb.h.ajax_url("delete_type_submit.ajax"),
        data: {id: type_id, user: fb.user.id, lang:fb.lang},
        type: "POST",
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, row);
          }
          var new_row = $(data.result.html).addClass("new-row");
          row.before(new_row);
          new_row.hide();
          row.remove();
          new_row.showRow();
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, row);
        }
      });
    },

    /**
     * undo delete type
     */
    undo_delete_type_begin: function(trigger, type_info) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: fb.h.ajax_url("undo_delete_type_submit.ajax"),
        data: {type_info: JSON.stringify(type_info), lang:fb.lang},
        type: "POST",
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, row);
          }
          var new_row = $(data.result.html).addClass("new-row");
          row.before(new_row);
          new_row.hide();
          row.remove();
          new_row.showRow(function() {
            fb.schema.init_row_menu(new_row);
            // show edit controls in tooltip
            $(".edit", new_row).show();
          }, null, "slow");
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, row);
        }
      });
    }

  };

})(jQuery, window.freebase);
