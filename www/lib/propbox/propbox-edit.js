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
;(function($, propbox) {

  // propbox namespace required @see propbox.js

  var base_url = propbox.options.base_url;
  var topic_id = propbox.options.id;
  var lang_id = propbox.options.lang;
  var suggest_options = propbox.options.suggest;

  var edit = propbox.edit = {

    prop_add_begin: function(prop_section) {
      var submit_data = {
        id: topic_id,
        pid: prop_section.attr("data-id"),
        lang: lang_id
      };
      $.ajax({
        url: base_url + "/prop_add_begin.ajax",
        data: submit_data,
        dataType: "json",
        success: function(data, status, xhr) {
          var html = $(data.result.html);
          var event_prefix = "propbox.edit.prop_add.";
          var form = {
            mode: "add",
            event_prefix: event_prefix,
            ajax: {
              data: submit_data,
              url: base_url + "/prop_add_submit.ajax"
            },
            init: edit.init_prop_add_form,
            validate: edit.validate_prop_add_form,
            submit: edit.submit_prop_add_form,
            form: html.hide(),
            prop_section: prop_section
          };
          edit.init(form);


          form.form
            .bind(event_prefix + "success", function() {
              edit.reset_data_input(form);
              $(":input:visible:first", form.form).focus();
            });

        },
        error: function(xhr) {
          edit.ajax_error(xhr, form);
        }
      });
    },

    init_prop_add_form: function(form) {
      edit.init_data_input(form);
      $(":input:visible:first", form.form).focus();
    },

    validate_prop_add_form: function(form) {
      var valid = true;
      $(".data-input", form.form).each(function(i) {
        var data_input = $(this);
        var data_input_instance = data_input.data("$.data_input");
        data_input_instance.validate(true);
        if (i === 0 && !data_input.is(".valid")) {
          // first data_input is always required
          valid = edit.data_input_required(form, data_input);
        }
        else if (data_input.is(".error")) {
          valid = edit.data_input_invalid(form, data_input);
        }
      });
      return valid;
    },

    submit_prop_add_form: function(form) {
      var submit_data = $.extend({}, form.ajax.data);  // id, pid, lang
      $(".data-input", form.form).each(function() {
        var name_value = $(this).data("name_value");
        if (name_value) {
          submit_data[name_value[0]] = name_value[1];
        }
      });
      console.log("submit_data", submit_data);
      $.ajax({
        url: form.ajax.url,
        type: "POST",
        dataType: "json",
        data: submit_data,
        success: function(data, status, xhr) {
          if (data.code === "/api/status/error") {
            return edit.ajax_error_handler(xhr, form);
          }
          var new_row = $(data.result.html);

          if (new_row.is("tr")) {
            $(".data-table > tbody", form.prop_section).append(new_row);
            $(".data-table > thead", form.prop_section).show();
          }
          else {
            $(".data-list", form.prop_section).append(new_row);
          }
          form.form.trigger(form.event_prefix + "success");
        },
        error: function(xhr) {
          edit.ajax_error_handler(xhr, form);
        }
      });
    },

    init_data_input: function(form) {
      $(".data-input", form.form).each(function() {
        $(this)
          .data_input({
            suggest: suggest_options
          })
          .bind("submit", function() {
            form.form.trigger(form.event_prefix + "submit");
          })
          .bind("cancel", function() {
            form.form.trigger(form.event_prefix + "cancel");
          });
      });
    },

    reset_data_input: function(form) {
      $(".data-input", form.form).each(function() {
        var inst = $(this).data("$.data_input").reset();
      });
    },

    init: function(form) {
      if (form.mode === "add") {
        var ls = $(">.data-section", form.prop_section);
        $(".data-table tr.empty-row, .data-list li.empty-row", ls).hide();
        form.prop_section.append(form.form);
      }

      var event_prefix = form.event_prefix || "propbox.edit.";

      form.form
        .bind(event_prefix + "submit", function() {
          edit.submit(form);
        })
        .bind(event_prefix + "cancel", function() {
          edit.cancel(form);
        })
        .bind(event_prefix + "error", function(e, msg) {
          edit.error(form, msg);
          form.form.removeClass("loading");
        })
        .bind(event_prefix + "success", function() {
          form.form.removeClass("loading");
        });

      // submit handler
      $(".button-submit", form.form).click(function() {
        form.form.trigger(event_prefix + "submit");
      });
      $(".button-cancel", form.form).click(function() {
        form.form.trigger(event_prefix + "cancel");
      });

      form.form.show();
      propbox.kbs.scroll_to(form.prop_section);
      form.init(form);
    },

    cancel: function(form) {
      form.form.hide().remove();
      form.prop_section
        .removeClass("editing");
      var ls = $(">.data-section", form.prop_section);
      if (!$(".data-table tr, .data-list li", ls).filter(":not(.empty-row)").length) {
        $(".data-table tr.empty-row, .data-list li.empty-row", ls).show();
      }
    },

    submit: function(form) {
      // are we already submitting?
      if (form.form.is(".loading")) {
        return;
      }

      // remove focus from activeElement
      if (document.activeElement) {
        $(document.activeElement).blur();
      }

      // clear messages
      edit.clear_form_message(form);

      // validate form
      if (form.validate) {
        if (!form.validate(form)) {
          return;
        }
      }

      // form submitting/loading
      form.form.addClass("loading");

      // submit form
      if (form.submit) {
        form.submit(form);
      }
    },

    data_input_required: function(form, data_input) {
      var label = data_input.prev(".form-label").text();
      edit.form_error(form, "Required: " + label);
    },

    data_input_invalid: function(form, data_input) {
      var label = data_input.prev(".form-label").text();
      edit.form_error(form, "Invalid: " + label);
    },

    form_error: function(form, msg) {
      return edit.form_message(form, msg, "error");
    },

    form_message: function(form, msg, type) {
      var close = $('<a class="close-msg" href="#">x</a>').click(function(e) {
        $(this).parents("tr:first").remove();
        return false;
      });
      var span =  $("<span>").text(msg);
      var td = $('<td>').append(close).append(span);
      var row_msg = $('<tr class="row-msg">').append(td);
      if (type) {
        row_msg.addClass("row-msg-" + type);
      }

      var row = $(".edit-row", form.form);
      // prepend row_msg to row
      row.before(row_msg);

      return row_msg;
    },

    clear_form_message: function(form) {
      $(".row-msg", form.form).remove();
    },

    ajax_error: function(xhr, form) {
      var msg;
      try {
        msg = JSON.parse(xhr.responseText);
        if (msg.messages && msg.messages.length) {
          msg = JSON.stringify(msg.messages[0]); // display the first message
        }
      }
      catch (e) {
        // ignore
      }
      if (!msg) {
        msg = xhr.responseText;
      }
      edit.error(form, msg);
      form.form.removeClass("loading");
    }

  };


})(jQuery, window.propbox);
