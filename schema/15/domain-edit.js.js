(function($, fb) {

  var se = fb.schema.edit;   // required;

  var de = fb.schema.domain.edit = {

    /**
     * domain settings form
     */
    domain_settings_begin: function(trigger, domain_id) {
      $.ajax({
        url: acre.request.app_url + "/schema/domain/domain_settings_begin",
        data: {id:domain_id},
        dataType: "json",
        success: function(data, status, xhr) {
          var html = $(data.result.html);
          var form = {
            event_prefix: "fb.schema.domain.settings.",
            ajax: {
              url: acre.request.app_url + "/schema/domain/domain_settings_submit",
              data: {id: domain_id}
            },

            init_form: de.init_domain_settings_form,
            validate_form: de.validate_domain_settings_form,
            submit_form: de.submit_domain_settings_form,

            form: html
          };

          se.init_settings_form(form);

          form.form
            .bind(form.event_prefix + "success", function(e, data) {
              window.location = data.location;
            });
        }
      });
    },

    init_domain_settings_form: function(form) {
      // enter key
      $(":input:not(textarea)", form.form)
        .keypress(function(e) {
          if (e.keyCode === 13 && !e.isDefaultPrevented()) { // enter
            form.form.trigger(form.event_prefix + "submit");
          }
        });
    },

    validate_domain_settings_form: function(form) {
      var name = $.trim($("input[name=name]", form.form).val());
      var key =  $.trim($("input[name=key]", form.form).val()).toLowerCase();
      if (name === "" || key === "") {
        form.form.trigger(form.event_prefix + "error", "Name and Key are required");
      }
      else if (!(/^[a-z][a-z0-9_\-]{3,}$/.test(key))) {
        form.form.trigger(form.event_prefix + "error", "Key must be four or more alphanumeric characters, no spaces and not begin with a number");
      }
    },

    submit_domain_settings_form: function(form) {
      var name = $.trim($(":input[name=name]", form.row).val());
      var key =  $.trim($("input[name=key]", form.form).val()).toLowerCase();

      var data = {
        name: name,
        key: key,
        namespace: $("input[name=namespace]", form.form).val(),
        description: $("textarea[name=description]", form.form).val()
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
    add_type_begin: function(trigger, domain_id, role) {
      $.ajax({
        url: acre.request.app_url + "/schema/domain/add_type_begin",
        data: {id: domain_id, role: role},
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
              url: acre.request.app_url + "/schema/domain/add_type_submit"
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
            $(".button-cancel", form.submit_row).text("Done");
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
        url: acre.request.app_url + "/schema/domain/edit_type_begin",
        data: {id: type_id},
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
              url: acre.request.app_url + "/schema/domain/edit_type_submit",
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
      var name = $(":input[name=name]", form.row);
      var key =  $(":input[name=key]", form.row);
      var role = $(":input[name=role]", form.row);
      var description = $(":input[name=description]", form.row);

      if (form.mode === "add") {
        name.val("");
        key.val("").data("changed", false);
        if (!role.is(":disabled")) {
          role.removeAttr("checked");
        }
        description.val("");
      }
      else {
        key.data("changed", true);
      }

      if (!form.row.data("initialized")) {
        key.change(function() {
          $(this).data("changed", true);
        });
        // autofill key
        name.change(function() {
          if (!key.data("changed")) {
            var val = $.trim(name.val()).toLowerCase().replace(/\s+/g, '-');
            key.val(val);
          }
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

      // TODO We need to show a loading div here, but we have a problem with position:relative on <td> elements

      //var loading_height = form.row.find("td:first").height();
      //form.row.find(".edit-row-loader").css({height: loading_height}).show();

      var name = $.trim($(":input[name=name]", form.row).val());
      var key = $.trim($(":input[name=key]", form.row).val()).toLowerCase();
      var role = $(":input[name=role]", form.row);
      role = role.is(":checked") ? role.val() : "";

      var data = {
        domain:  $(":input[name=domain]", form.row).val(),
        name: name,
        key: key,
        role: role,
        description: $(":input[name=description]", form.row).val()
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
      var name = $.trim($(":input[name=name]", form.row).val());
      var key =  $.trim($(":input[name=key]", form.row).val());
      if (name === "" || key === "") {
        form.row.trigger(form.event_prefix + "error", [form.row, "Name and Key are required"]);
      }
      // TODO: simple duplicate key check
    },


    /**
     * delete type
     */
    delete_type_begin: function(trigger, type_id) {
      var row = trigger.parents("tr:first");
      var table = row.parents("table:first");
      $.ajax({
        url: acre.request.app_url + "/schema/domain/delete_type_submit",
        data: {id: type_id, user: fb.user.id},
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
        url: acre.request.app_url + "/schema/domain/undo_delete_type_submit",
        data: {type_info: JSON.stringify(type_info)},
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
