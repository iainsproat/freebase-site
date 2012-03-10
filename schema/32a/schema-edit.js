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


(function($, fb) {
  $(window).ajaxSend(function(event, xhr, options) {
    if (options.type === "POST") {
      xhr.setRequestHeader("x-acre-cache-control", "max-age: 3600");
    }
  });

  /**
   * TODO: use lib/propbox/form.js for form bindings
   */

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
      $("button.save", form.submit_row).click(function() {
        form.row.trigger(event_prefix + "submit");
      });
      // cancel handler
      $(".button.cancel", form.submit_row).click(function() {
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

      $(window).bind("fb.edit.lang.select", function(e, lang) {
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
        if (msg.messages && msg.messages.length) {
          msg = JSON.stringify(msg.messages[0]); // display the first message
        }
      }
      catch(e) {
        // ignore
      }
      if (!msg) {
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
      $(".modal-buttons .button.save", form.form).click(function() {
        form.form.trigger(event_prefix + "submit");
      });

      form.form.overlay({
          close: ".modal-buttons .button.cancel",
          closeOnClick: false,
          load: true,
          fixed: false,
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

      fb.schema.init_modal_help(form.form);

      $(window).bind("fb.edit.lang.select", function(e, lang) {
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
    }

  };
})(jQuery, window.freebase);
