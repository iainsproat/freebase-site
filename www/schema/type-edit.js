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

  var te = fb.schema.type.edit = {

    /**
     * type settings form
     */
    type_settings_begin: function(trigger, type_id) {
      $.ajax({
        url: fb.ajax.app + "/type_settings_begin.ajax",
        data: {id:type_id},
        dataType: "json",
        success: function(data, status, xhr) {
          var html = $(data.result.html);
          var form = {
            event_prefix: "fb.schema.type.settings.",
            ajax: {
              url: fb.ajax.app + "/type_settings_submit.ajax",
              data: {id: type_id}
            },

            init_form: te.init_type_settings_form,
            validate_form: te.validate_type_settings_form,
            submit_form: te.submit_type_settings_form,

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

    init_type_settings_form: function(form) {
      var name = $("input[name=name]:visible", form.form);
      var key = $("input[name=key]", form.form);
      se.auto_key(name, key);

      // enter key
      $(":input:not(textarea)", form.form)
        .keypress(function(e) {
          if (e.keyCode === 13 && !e.isDefaultPrevented()) { // enter
            form.form.trigger(form.event_prefix + "submit");
          }
        });

      //Confirm dialog for deleting a type
      $(".button-delete", form.form).click(function() {
        var container = $(this).parent().siblings().find(".modal-content");
        var button_row = $(".modal-buttons", form.form).animate({opacity:0}, 500);
        var confirm_dialog = $(".modal-help", container).height(container.height()).slideDown();
        var cancel_button = $(".button-cancel", container).click(function(e) {
          button_row.animate({opacity:1}, 500);
          confirm_dialog.slideUp();
        });
        var delete_button = $(".button-submit", container).click(function(e) {
          if (form.form.is(".loading")) {
            return;
          }
          form.form.addClass("loading");
          var data = {
            id : form.ajax.data.id,
            user: fb.user.id,
            redirect: true
          };
          $.ajax({
            url: fb.ajax.app + "/delete_type_submit.ajax",
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

    validate_type_settings_form: function(form) {
      var name = $.trim($("input[name=name]:visible", form.form).val());
      var key =  $("input[name=key]", form.form);
      var keyval = key.val();
      if (name === "" || keyval === "") {
        form.form.trigger(form.event_prefix + "error", "Name and Key are required");
      }
      else if (key.data("original") !== keyval) {
        try {
          se.check_key_type(keyval);
        }
        catch (e) {
          form.form.trigger(form.event_prefix + "error", e);
        }
      }
    },

    submit_type_settings_form: function(form) {
      var key =  $("input[name=key]", form.form);
      var data = {
        name: $.trim($("input[name=name]:visible", form.form).val()),
        key: key.val(),
        domain: $("input[name=namespace]", form.form).val(),
        description: $.trim($("textarea[name=description]:visible", form.form).val()),
        lang: $("select[name=lang]", form.form).val()
      };

      var kind = $("input[name=kind]:checked", form.form).val();
      if (kind === "regular") {
        data.enumeration = data.mediator = 0;
      }
      else if (kind === "enumeration") {
        data.enumeration = 1;
        data.mediator = 0;
      }
      else if (kind === "mediator") {
        data.enumeration = 0;
        data.mediator = 1;
      }

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

    init_delegate_property: function(form) {
      $(".nav-toggle", form.row).click(function(e) {
        te.toggle_delegate_property($(this), form);
        return false;
      });
    },

    toggle_delegate_property: function(trigger, form) {
      if (trigger.is(".current")) {
        return false;
      }
      var nav = trigger.parents(".nav:first");
      $(".nav-toggle", nav).removeClass("current");
      trigger.addClass("current");

      // clear all input values under expected type field
      var ect_field = $(".fb-property-expected-type", form.row);
      $("input", ect_field).val("");
      // reset unique checkbox
      var unique = $("input[name=unique]", form.row).removeAttr("checked");
      // remove any form messages
      $(".form-msg", form.row).remove();

      if (trigger.is(".nav-delegate")) {
        // show delegate message
        $(".nav-delegate-msg", nav).show();
        // hide ect input and update label
        $("input[name=expected_type_input]", form.row).hide()
          .prev(".form-label").text("Property to use");
        // show property input
        var delegated = $("input[name=delegated]", form.row).show();
        // update Master checkbox and disable unique
        $("label[for=master]", form.row).find("span").text("Delegated");
        unique.attr("disabled", "disabled");
        var inst = delegated.data("suggest_property");
        if (!inst) {
          // init suggest
          delegated
            .unbind()
            .suggest_property({
              service_url: fb.h.legacy_fb_url()
            })
            .bind("fb-select", function(e, data) {
              $(this).val(data.id);
              setTimeout(function() {
                te.delegate_property_begin(form, data.id);
              }, 0);
            })
            .keypress(function(e) {
              if (e.keyCode === 13 && !e.isDefaultPrevented()) { // enter
                form.row.trigger(form.event_prefix + "submit");
              }
            })
            .keyup(function(e) {
              if (e.keyCode === 27) { // escape
                form.row.trigger(form.event_prefix + "cancel");
              }
            });
        }
      }
      else {
        // hide delegate message
        $(".nav-delegate-msg", nav).hide();
        // hide property input
        $("input[name=delegated]", form.row).hide();
        // show ect input
        $("input[name=expected_type_input]", form.row).show()
          .prev(".form-label").text("Expected Type");
        // update Master checkbox and re-enable unique
        $("label[for=master]", form.row).find("span").text("Master");
        unique.removeAttr("disabled");
      }
      $("input[name=name]", form.row).focus();
    },

    delegate_property_begin: function(form, prop_id) {
      form.row.addClass("loading");
      $.ajax({
        url: fb.ajax.app + "/delegate_property_begin.ajax",
        data: {id: prop_id},
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, form.row);
          }
          var result = data.result;

          // set and disable expected_type and unique
          var ect_data = {
            id : result.expected_type,
            unit: result.unit
          };
          $("input[name=expected_type_input]", form.row).trigger("fb-select", ect_data);
          if (result.unique) {
            $("input[name=unique]", form.row).attr("checked", "checked");
          }
          // show delegated message
          $(".form-msg", form.row).remove();
          var field = $(".form-field:first", form.row);
          var message = $(result.message);
          field.before(message);
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, form.row);
        },
        complete: function() {
          form.row.removeClass("loading");
        }
      });
    },

    /**
     * retrieve add_property form (ajax).
     */
    add_property_begin: function(trigger, type_id) {
      var trigger_row = trigger.parents("tr:first");
      $.ajax({
        url: fb.ajax.app + "/add_property_begin.ajax",
        data: {id: type_id},
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, trigger_row);
          }
          // add edit-form after the edit button
          var html = $(data.result.html);

          var form = {
            mode: "add",
            event_prefix: "fb.schema.type.add.property.",
            ajax: {
              url: fb.ajax.app + "/add_property_submit.ajax"
            },

            init_form: te.init_property_form,
            validate_form: te.validate_property_form,
            submit_form: te.submit_property_form,

            table: trigger.parents("table:first"),
            trigger: trigger,
            trigger_row: trigger_row,
            row: $(".edit-row", html).hide(),
            submit_row: $(".edit-row-submit", html).hide()
          };
          se.init_edit_form(form);

          // delegate property dialog
          te.init_delegate_property(form);

          /**
           * after submit success, re-init form for additional adds
           */
          form.row.bind("fb.schema.type.add.property.success", function() {
            // show headers if showing the empty message
            var empty_msg = $("tbody:first .table-empty-column", form.table);
            if (empty_msg.length) {
              empty_msg.parents("tr:first").hide().prev("tr").show();
            }
            // show reorder link if props > 1
            te.toggle_reorder_link(form.table);
            // change submit text to 'Done'
            $(".button-cancel", form.submit_row).text("Done");
            te.init_property_form(form);
          });
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, trigger_row);
        }
      });
    },


    edit_property_begin: function(trigger, prop_id) {
      var trigger_row = trigger.parents("tr:first");
      $.ajax({
        url: fb.ajax.app + "/edit_property_begin.ajax",
        data: {id: prop_id},
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, trigger_row);
          }
          // add edit-form after the edit button
          var html = $(data.result.html);
          var form = {
            mode: "edit",
            event_prefix: "fb.schema.type.edit.property.",
            ajax: {
              url: fb.ajax.app + "/edit_property_submit.ajax",
              data: {id: prop_id}
            },

            init_form: te.init_property_form,
            validate_form: te.validate_property_form,
            submit_form: te.submit_property_form,

            table: trigger.parents("table:first"),
            trigger: trigger,
            trigger_row: trigger_row,
            row: $(".edit-row", html).hide(),
            submit_row: $(".edit-row-submit", html).hide()
          };

          se.init_edit_form(form);

         /**
           * after submit success, we're done editing, remove form and old row
           */
          form.row.bind("fb.schema.type.edit.property.success", function() {
            form.trigger_row.remove(); // old row
            form.row.remove();
            form.submit_row.remove();
          });
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, trigger_row);
        }
      });
    },

    /**
     * init property form
     */
    init_property_form: function(form) {
      var name = $("input[name=name]", form.row);
      var key =  $("input[name=key]", form.row);
      var expected_type_input = $("input[name=expected_type_input]", form.row);
      var expected_type = $("input[name=expected_type]", form.row);
      var expected_type_new = $("input[name=expected_type_new]", form.row);
      var unit = $("input[name=unit]", form.row);
      // this is /type/property/enumeration (namespace)
      var enumeration = $("input[name=enumeration]", form.row);
      var description = $("textarea[name=description]", form.row);
      var disambiguator = $("input[name=disambiguator]", form.row);
      var unique = $("input[name=unique]", form.row);
      var hidden = $("input[name=hidden]", form.row);
      var type = $("input[name=type]", form.row);

      if (form.mode === "add") {
        $(".nav-toggle:first", form.row).click(); // reset delegate property form
        name.val("");
        key.val("");
        expected_type_input.val("");
        expected_type.val("");
        expected_type_new.val("");
        unit.val("");
        description.val("");
        $.each([disambiguator, unique, hidden], function(i, checkbox) {
          if (!checkbox.is(":disabled")) {
            checkbox.removeAttr("checked");
          }
        });
      }

      if (!form.row.data("initialized")) {
        se.auto_key(name, key, "/type/property");
        //
        // suggest expected_type
        //
        // this is a hacky way to get the domain id of the current context of the property form
        var domain = type.val().split("/");
        domain.pop();
        domain = domain.join("/");
        expected_type_input.suggest_expected_type({
          service_url: fb.h.legacy_fb_url(),
          suggest_new: "Create new type",
          domain: domain
        })
        .bind("fb-select", function(e, data) {
          if (data.unit) {
            expected_type_input.val(data.id + " (" + data.unit.name + ")");
            expected_type.val(data.id);
            expected_type_new.val("");
            unit.val(data.unit.id);
          }
          else if (data.enumeration) { // /type/property/enumeration (namespace)
            expected_type_input.val(data.id + " (" + data.enumeration + ")");
            expected_type.val(data.id);
            expected_type_new.val("");
            enumeration.val(data.enumeration);
          }
          else {
            expected_type_input.val(data.id);
            expected_type.val(data.id);
            expected_type_new.val("");
            unit.val("");
            if (data.id === "/type/boolean") {
              // auto-check unique on /type/boolean
              $("input[name=unique]", form.row).attr("checked", "checked");
            }
          }
        })
        .bind("fb-textchange", function() {
          expected_type.val("");
          expected_type_new.val("");
          unit.val("");
        })
        .bind("fb-select-new", function(e, val) {
          expected_type_new.val($.trim(val));
          expected_type.val("");
          unit.val("");
        });

        // enter/escape key handler
        $(":input:not(textarea)", form.row)
          .keypress(function(e) {
            if (e.keyCode === 13 && !e.isDefaultPrevented()) { // enter
              form.row.trigger(form.event_prefix + "submit");
            }
          })
          .keyup(function(e) {
            if (e.keyCode === 27) { // escape
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
    submit_property_form: function(form) {
      var key =  $(":input[name=key]", form.row);
      var data = {
        type:  $(":input[name=type]", form.row).val(),
        name: $.trim($("input[name=name]:visible", form.row).val()),
        key: key.val(),
        expected_type: $(":input[name=expected_type]", form.row).val(),
        expected_type_new: $(":input[name=expected_type_new]", form.row).val(),
        unit: $(":input[name=unit]", form.row).val(),
        // this is /type/prperty/enumeration (namespace)
        enumeration: $("input[name=enumeration]", form.row).val(),
        description: $.trim($("textarea[name=description]:visible", form.row).val()),
        disambiguator: $(":input[name=disambiguator]", form.row).is(":checked") ? 1 : 0,
        unique: $(":input[name=unique]", form.row).is(":checked") ? 1 : 0,
        hidden: $(":input[name=hidden]", form.row).is(":checked") ? 1 : 0,
        lang: $("select[name=lang]", form.submit_row).val()
      };

      // special delgate property logic
      // we want to be careful submitting the "delegated" paramter
      if (form.mode === "add") {
        if ($(".nav-delegate", form.row).is(".current")) {
          // sanity check we are actually in the delegate tab
          data.delegated = $(":input[name=delegated]", form.row).val();
        }
      }

      var ajax_options = {
        url: form.ajax.url,
        type: "POST",
        dataType: "json",
        data: $.extend(data, form.ajax.data)
      };

      ajax_options.success = form.ajax.success || function(data, status, xhr) {
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
      };

      ajax_options.error = form.ajax.error || function(xhr) {
        se.ajax_error_handler(xhr, form.row);
      };

      $.ajax(ajax_options);
    },

    /**
     * validate row
     */
    validate_property_form: function(form) {
      var name = $.trim($("input[name=name]:visible", form.row).val());
      var key =  $("input[name=key]", form.row);
      var keyval = key.val();
      var ect = $(":input[name=expected_type]", form.row).val();
      var ect_new = $(":input[name=expected_type_new]", form.row).val();
      if (name === "" || keyval === "" || (ect === "" && ect_new === "")) {
        form.row.trigger(form.event_prefix + "error", [form.row, "Name, Key and Expected Type are required"]);
      }
      else if (key.data("original") !== keyval) {
        try {
          se.check_key_property(keyval);
        }
        catch (e) {
          form.row.trigger(form.event_prefix + "error", [form.row, e]);
        }
      }
    },


    /**
     * delete property
     */
    delete_property_begin: function(trigger, prop_id) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: fb.ajax.app + "/delete_property_submit.ajax",
        data: {id: prop_id, user: fb.user.id},
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
          te.toggle_reorder_link(table);
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, row);
        }
      });
    },

    /**
     * undo delete type
     */
    undo_delete_property_begin: function(trigger, prop_info) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: fb.ajax.app + "/undo_delete_property_submit.ajax",
        data: {prop_info: JSON.stringify(prop_info)},
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
            te.toggle_reorder_link(table);
          }, null, "slow");
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, row);
        }
      });
    },

    /**
     * add included_type
     */
    add_included_type_begin: function(trigger, type_id) {
      var trigger_row = trigger.parents("tr:first");
      $.ajax({
        url: fb.ajax.app + "/add_included_type_begin.ajax",
        data: {id: type_id},
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, trigger_row);
          }

          // add edit-form after the edit button
          var html = $(data.result.html);
          var form = {
            mode: "edit",
            event_prefix: "fb.schema.type.add.included_type.",
            ajax: {
              url: fb.ajax.app + "/add_included_type_submit.ajax"
            },

            init_form: te.init_included_type_form,
            validate_form: te.validate_included_type_form,
            submit_form: te.submit_included_type_form,

            table: trigger.parents("table:first"),
            trigger: trigger,
            trigger_row: trigger_row,
            row: $(".edit-row", html).hide(),
            submit_row: $(".edit-row-submit", html).hide()
          };

          se.init_edit_form(form);

          /**
           * after submit success, we're done editing, remove form and old row
           */
          form.row.bind("fb.schema.type.add.included_type.success", function() {
            $(".button-cancel", form.submit_row).text("Done");
            te.init_included_type_form(form);
          });
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, trigger_row);
        }
      });
    },

    init_included_type_form: function(form) {
      var included_type_input = $("input[name=included_type_input]", form.row).val("");
      var included_type = $("input[name=included_type]", form.row).val("");
      var included_type_new = $("input[name=included_type_new]", form.row).val("");

      if (!form.row.data("initialized")) {
        included_type_input.suggest({
          service_url: fb.h.legacy_fb_url(),
          category: "cotype",
          suggest_new: "Create new type"
        })
        .bind("fb-select", function(e, data) {
          included_type_input.val(data.id);
          included_type.val(data.id);
        })
        .bind("fb-textchange", function() {
          included_type.val("");
        })
        .bind("fb-select-new", function(e, val) {
          included_type_new.val($.trim(val));
          included_type.val("");
        });

        // enter/escape key handler
        $(":input:not(textarea)", form.row)
          .keypress(function(e) {
            if (e.keyCode === 13 && !e.isDefaultPrevented()) { // enter
              form.row.trigger(form.event_prefix + "submit");
            }
          })
          .keyup(function(e) {
            if (e.keyCode === 27) { // escape
              form.row.trigger(form.event_prefix + "cancel");
            }
          });
        form.row.data("initialized", true);
      }
      included_type_input.focus();
    },

    validate_included_type_form: function(form) {
      var included_type = $.trim($(":input[name=included_type]", form.row).val());
      var included_type_new = $(":input[name=included_type_new]", form.row).val();
      if (included_type === "" && included_type_new === "") {
        form.row.trigger(form.event_prefix + "error", [form.row, "Please choose a type to include"]);
      }
    },

    submit_included_type_form: function(form) {
      var data = {
        id: $(":input[name=id]", form.row).val(),
        included_type: $.trim($(":input[name=included_type]", form.row).val()),
        included_type_new: $(":input[name=included_type_new]", form.row).val()
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

          var container = $("<table>");
          container.html(data.result.html);
          var theads = $(">thead", container);
          form.table.append(theads);
          var rows = $("tr:first", theads).hide();
          rows.showRow(function() {
            // init expand/collapse
            $(".tbody-header", theads).each(function() {
              $(this).data("ajax", true).click(fb.schema.type.toggle);
              $(".edit", this).show();
            });
            form.row.trigger(form.event_prefix + "success");
          }, null, "slow");
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, form.row);
        }
      });
    },

    delete_included_type_begin: function(trigger, type_id, included_type_id) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: fb.ajax.app + "/delete_included_type_submit.ajax",
        data: {id: type_id, included_type: included_type_id},
        type: "POST",
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, row);
          }
          var new_row = $(data.result.html).addClass("new-row");
          row.before(new_row);
          new_row.hide();
          row.parent("thead").next("tbody:first").remove();
          row.remove();
          new_row.showRow();
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, row);
        }
      });
    },

    undo_delete_included_type_begin: function(trigger, type_id, included_type_id) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: fb.ajax.app + "/undo_delete_included_type_submit.ajax",
        data: {id: type_id, included_type: included_type_id},
        type: "POST",
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, row);
          }
          var new_thead = $(data.result.html);
          var new_row = $(">tr", new_thead).addClass("new-row");
          var old_thead = row.parents("thead:first");

          old_thead.before(new_thead);
          new_row.hide();
          old_thead.remove();
          new_row.showRow(function() {
            $(".tbody-header", new_row).each(function() {
              $(this).data("ajax", true).click(fb.schema.type.toggle);
              $(".edit", this).show();
            });
          }, null, "slow");
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, row);
        }
      });
    },

    reverse_property_begin: function(trigger, type_id, master_id) {
      var trigger_row = trigger.parents("tr:first");
      $.ajax({
        url: fb.ajax.app + "/reverse_property_begin.ajax",
        data: {id: type_id, master: master_id},
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, trigger_row);
          }
          var html = $(data.result.html);
          var form = {
            mode: "edit",
            event_prefix: "fb.schema.type.reverse.property.",
            ajax: {
              url: fb.ajax.app + "/add_property_submit.ajax",
              data: {master_property: master_id},
              success: function(data, status, xhr) {
                if (data.code === "/api/status/error") {
                  return se.ajax_error_handler(xhr, form.row);
                }
                te.reverse_property_success(form, data);
              }
            },

            init_form: te.init_property_form,
            validate_form: te.validate_property_form,
            submit_form: te.submit_property_form,

            table: trigger.parents("table:first"),
            trigger: trigger,
            trigger_row: trigger_row,
            row: $(".edit-row", html).hide(),
            submit_row: $(".edit-row-submit", html).hide()
          };

          se.init_edit_form(form);
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, trigger_row);
        }
      });
    },

    reverse_property_success: function(form, data) {
      var new_row = $(data.result.html).addClass("new-row");
      var prop_table = $("#type-table table:first");
      var prop_body = $("> tbody", prop_table);
      prop_body.append(new_row);
      new_row.hide();
      new_row.showRow(function() {
        // init row menu
        fb.schema.init_row_menu(new_row);
        fb.schema.type.init_tooltips(new_row);
        // show edit controls in tooltip
        $(".edit", new_row).show();
      }, null, "slow");

      // show headers if showing the empty message
      var empty_msg = $(".table-empty-column", prop_body);
      if (empty_msg.length) {
        empty_msg.parents("tr:first").hide().prev("tr").show();
      }

      form.trigger_row.remove(); // old row
      form.row.remove();
      form.submit_row.remove();

      te.toggle_reorder_link(prop_table);
    },

    /**
     * Add a topic to an enumerated type.
     */
    add_instance_begin: function(trigger, type_id) {
      var trigger_row = trigger.parents("tr:first");
      $.ajax({
        url: fb.ajax.app + "/add_instance_begin.ajax",
        data: {id: type_id},
        dataType: "json",
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return se.ajax_error_handler(xhr, trigger_row);
          }
          var html = $(data.result.html);

          var form = {
            mode: "add",
            event_prefix: "fb.schema.type.add.instance.",
            ajax: {
              url: fb.ajax.app + "/add_instance_submit.ajax",
              data: {type:type_id}
            },

            init_form: te.init_instance_form,
            validate_form: te.validate_instance_form,
            submit_form: te.submit_instance_form,

            table: trigger.parents("table:first"),
            trigger: trigger,
            trigger_row: trigger_row,
            row: $(".edit-row", html).hide(),
            submit_row: $(".edit-row-submit", html).hide()
          };

          se.init_edit_form(form);

          /**
           * after submit success, re-init form for additional adds
           */
          form.row.bind(form.event_prefix +"success", function() {
            // show headers if showing the empty message
            var empty_msg = $("tbody:first .table-empty-column", form.table);
            if (empty_msg.length) {
              empty_msg.parents("tr:first").hide().prev("tr").show();
            }
            $(".button-cancel", form.submit_row).text("Done");
            te.init_instance_form(form);
          });
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, trigger_row);
        }
      });
    },

    init_instance_form: function(form) {
      var name = $("input[name=name]", form.row);
      var id =  $("input[name=id]", form.row);
      name.val("");
      id.val("");

      var suggest = name.data("suggest");
      if (!suggest) {
        name.suggest({
          service_url: fb.h.legacy_fb_url(),
          suggest_new: "Create new",
          category: "instance"
        })
        .bind("fb-select", function(e, data) {
          id.val(data.id);
        })
        .bind("fb-select-new", function() {
          id.val("");
        })
        .bind("fb-textchange", function() {
          id.val("");
        });

        // enter/escape key handler
        name
          .keypress(function(e) {
            if (e.keyCode === 13 && !e.isDefaultPrevented()) { // enter
              form.row.trigger(form.event_prefix + "submit");
            }
          })
          .keyup(function(e) {
            if (e.keyCode === 27) { // escape
              form.row.trigger(form.event_prefix + "cancel");
            }
          });
      }
      name.focus();
    },

    validate_instance_form: function(form) {
      var name = $.trim($(":input[name=name]", form.row).val());
      var id = $(":input[name=id]", form.row).val();
      if (name === "" && id === "") {
        form.row.trigger(form.event_prefix + "error", [form.row, "Please select or create a new topic"]);
      }
    },

    submit_instance_form: function(form) {
      var name = $(":input[name=name]", form.row);

      var data = {
        name: $.trim(name.val()),
        id: $(":input[name=id]", form.row).val()
      };

      var ajax_options = {
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
            name.focus();
          }, null, "slow");
          form.row.trigger(form.event_prefix + "success");
        },
        error: function(xhr) {
          se.ajax_error_handler(xhr, form.row);
        }
      };

      $.ajax(ajax_options);
    },

    /**
     * Remove a topic from an enumerated type.
     */
    delete_instance_begin: function(trigger, topic_id, type_id) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: fb.ajax.app + "/delete_instance_submit.ajax",
        data: {id: topic_id, type: type_id},
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
     * undo delete_instance
     */
    undo_delete_instance_begin: function(trigger, topic_id, type_id) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: fb.ajax.app + "/undo_delete_instance_submit.ajax",
        data: {id: topic_id, type: type_id},
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
    },


    reorder_property_begin: function(trigger, type_id) {
      $.ajax({
        url: fb.ajax.app + "/reorder_property_begin.ajax",
        data: {id:type_id},
        dataType: "json",
        success: function(data, status, xhr) {
          var html = $(data.result.html);
          var form = {
            event_prefix: "fb.schema.type.reorder.property",
            ajax: {
              url: fb.ajax.app + "/reorder_property_submit.ajax",
              data: {id: type_id}
            },

            init_form: te.init_reorder_property_form,
            submit_form: te.submit_reorder_property_form,

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

    init_reorder_property_form: function(form) {
      var list = $(".reorderable", form.form).sortable();
      $(".btn-mv-top", form.form).click(function(e) {
        var row = $(this).parent(".reorderable-item");
        list.prepend(row);
      });
    },

    submit_reorder_property_form: function(form) {
      var properties = [];
      $("input[name=properties]", form.form).each(function() {
        properties.push($(this).val());
      });
      var data = {
        id: $("input[name=type]", form.form).val(),
        properties: properties
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

    toggle_reorder_link: function(table) {
      var reorder_link = $(".reorder-link", table);
      if ($("> tbody > tr.hoverable", table).length > 1) {
        reorder_link.show();
      }
      else {
        reorder_link.hide();
      }
    }

  };


})(jQuery, window.freebase);
