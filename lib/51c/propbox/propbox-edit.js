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
;(function($, propbox, formlib, editparams, i18n) {

  // requires:
  // propbox.js @see lib/propbox/propbox.js
  // form.js @see lib/propbox/form.js
  // editparams.js @see lib/propbox/editparams.js
  // i18n.js @see lib/i18n/i18n.js
  // jquery.metadata.js


  /**
   * TODO: use lib/propbox/form.js for form bindings
   */

  var edit = propbox.edit = {

    /**
     * prop_add
     *
     * Add a new value to a property (topic, literal, cvt)
     */
    prop_add_begin: function(prop_section) {
      $.ajax($.extend(formlib.default_begin_ajax_options(), {
        url: propbox.options.base_ajax_url + "/prop_add_begin.ajax",
        data: {
          s: propbox.options.id,
          p: prop_section.attr("data-id"),
          lang: propbox.options.lang
        },
        onsuccess: function(data) {
          var html = $(data.result.html);
          var structure = html.metadata();
          var ect = structure.expected_type.id;
          if (ect === "/common/document") {
              // modal document editing
              return edit.prop_add_document(prop_section, html, structure);
          }
          else if (ect === "/common/image") {
              // modal image editing
              return edit.prop_add_image(prop_section, html, structure);
          }
          else {
              // default inline editing
              return edit.prop_add(prop_section, html, structure);
          }
        }
      }));
    },

    prop_add: function(prop_section, html, structure) {
      var ls = $(">.data-section", prop_section);
      //$("> .data-table > tbody > .empty-row, > .data-list > .empty-row", ls).hide();
      var body = $("> .data-table > tbody, > .data-list", ls);

      var head_row = $(".edit-row-head", html);
      var edit_row = $(".edit-row", html);
      var submit_row = $(".edit-row-submit", html);
      var event_prefix = "propbox.edit.prop_add.";
      var options = {
        event_prefix: event_prefix,
        // callbacks
        init: edit.init_prop_add_form,
        validate: edit.validate_prop_add_form,
        submit:  edit.submit_prop_add_form,
        reset: edit.reset_prop_add_form,
        // submit ajax options
        ajax: {
          url: propbox.options.base_ajax_url + "/prop_edit_submit.ajax"
        },
        // jQuery objects
        body: body,
        head_row: head_row,
        edit_row: edit_row,
        submit_row: submit_row,

        structure: structure
      };
      edit_row
        .bind(event_prefix + "cancel", function(e) {
          prop_section.removeClass("editing");
        })
        .bind(event_prefix + "success", function() {
          if (structure.unique) {
            edit_row.trigger(form.event_prefix + "cancel");
          }
        });
      formlib.init_inline_add_form(options);
    },

    init_prop_add_form: function(options) {
      edit.init_data_inputs(options);
      $(":input:visible:first", options.edit_row).focus();
    },

    validate_prop_add_form: function(options) {
      // data_inputs do our validation
      // editparams.parse will do our validation on submit
      return true;
    },

    reset_prop_add_form: function(options) {
      /**
       * 1. reset data_inputs
       * 2. disable submit button
       * 3. change "Cancel" button to "Done"
       * 4. focus to the first input
       */
      edit.reset_data_inputs(options);
      formlib.disable_submit(options);
      $(".cancel", options.submit_row).text("Done");
      $(":input:visible:first", options.edit_row).focus();
    },

    submit_prop_add_form: function(options, ajax_options) {
      try {
        var o = editparams.parse(options.structure, options.edit_row);
        ajax_options.data.o = JSON.stringify(o);
      }
      catch (ex) {
        var errors = $(".data-input.error", options.edit_row);
        if (errors.length) {
          options.edit_row.trigger(options.event_prefix + "error", "Please specify a valid value");
          errors.eq(0).find(":input").focus().select();
        }
        else {
          options.edit_row.trigger(options.event_prefix + "error", ex.toString());
        }
        return;
      }
      $.ajax($.extend(ajax_options, {
        onsuccess: function(data) {
          var new_row = $(data.result.html);
          formlib.success_inline_add_form(options, new_row);
          propbox.init_menus(new_row, true);
          $(".nicemenu-item.edit").show();
          propbox.kbs.set_next(null, new_row, true);
        },
        onerror: function(errmsg) {
          options.edit_row.trigger(options.event_prefix + "error", errmsg);
        }
      }));
    },

    /**
     * value_edit
     *
     * Edit an existing value (topic, literal, cvt).
     */
    value_edit_begin: function(prop_section, prop_row) {
      var value;
      if (prop_row.is("tr")) {
        value = prop_row.attr("data-id");
      }
      else {
        var prop_value = $(".property-value:first", prop_row);
        value = prop_value.attr("data-id") || prop_value.attr("data-value") || prop_value.attr("datetime");
      }
      $.ajax($.extend(formlib.default_begin_ajax_options(), {
        url: propbox.options.base_ajax_url +  "/value_edit_begin.ajax",
        data: {
          s: propbox.options.id,
          p: prop_section.attr("data-id"),
          replace: value,
          lang: propbox.options.lang
        },
        onsuccess: function(data) {
          var html = $(data.result.html);
          var structure = html.metadata();
          var ect = structure.expected_type.id;
          if (ect === "/common/document") {
             // modal document editing
              return edit.value_edit_document(prop_section, prop_row, html, structure);
          }
          else if (ect === "/common/image") {
              // modal image editing
              return edit.value_edit_image(prop_section, prop_row, html, structure);
          }
          else {
              // default inline editing
              return edit.value_edit(prop_section, prop_row, html, structure);
          }
        }
      }));
    },
      
    value_edit: function(prop_section, prop_row, html, structure) {
      var head_row = $(".edit-row-head", html);
      var edit_row = $(".edit-row", html);
      var submit_row = $(".edit-row-submit", html);
      var event_prefix = "propbox.edit.value_edit.";
      var options = {
        event_prefix: event_prefix,
        // callbacks
        init: edit.init_value_edit_form,
        validate: edit.validate_value_edit_form,
        submit: edit.submit_value_edit_form,
        // submit ajax_options
        ajax: {
          url:  propbox.options.base_ajax_url + "/prop_edit_submit.ajax"
        },
        // jQuery objects
        row: prop_row,
        head_row: head_row,
        edit_row: edit_row,
        submit_row: submit_row,

        structure: structure
      };
      edit_row
        .bind(event_prefix + "success", function(e) {
          prop_section.removeClass("editing");
        })
        .bind(event_prefix + "cancel", function(e) {
          prop_section.removeClass("editing");
        })
        .bind(event_prefix + "delete", function() {
          edit_row.trigger(event_prefix + "cancel");
          propbox.edit.value_delete_begin(prop_section, prop_row);
        });
      formlib.init_inline_edit_form(options);
    },

    init_value_edit_form: function(options) {
      edit.init_data_inputs(options);
      $(".delete", options.submit_row).click(function() {
        options.edit_row.trigger(options.event_prefix + "delete");
      });
      $(":input:visible:first", options.edit_row).focus();
    },

    validate_value_edit_form: function(options) {
      // data_inputs do our validation
      // editparams.parse will do our validation on submit
      return true;
    },

    submit_value_edit_form: function(options, ajax_options) {
      try {
        var o = editparams.parse(options.structure, options.edit_row);
        ajax_options.data.o = JSON.stringify(o);
      }
      catch(ex) {
        var errors = $(".data-input.error", options.edit_row);
        if (errors.length) {
          options.edit_row.trigger(options.event_prefix + "error", "Please specify a valid value");
          errors.eq(0).find(":input").focus().select();
        }
        else {
          options.edit_row.trigger(options.event_prefix + "error", ex.toString());
        }
        return;
      }
      $.ajax($.extend(ajax_options, {
        onsuccess: function(data) {
          var new_row = $(data.result.html);
          formlib.success_inline_edit_form(options, new_row);
          propbox.init_menus(new_row, true);
          $(".nicemenu-item.edit").show();
          propbox.kbs.set_next(null, new_row, true);
        },
        onerror: function(errmsg) {
          options.edit_row.trigger(options.event_prefix + "error", errmsg);
        }
      }));
    },

    /**
     * value_delete_begin
     *
     * Delete an exiting value (topic, literal, cvt).
     */
    value_delete_begin: function(prop_section, prop_row) {
      var value;
      if (prop_row.is("tr")) {
        value = prop_row.attr("data-id");
      }
      else {
        var prop_value = $(".property-value:first", prop_row);
        value = prop_value.attr("data-id") || prop_value.attr("data-value") || prop_value.attr("datetime");
      }
      var submit_data = {
        s: propbox.options.id,
        p: prop_section.attr("data-id"),
        o: value,
        lang: propbox.options.lang
      };

      $.ajax($.extend(formlib.default_submit_ajax_options(), {
        url: propbox.options.base_ajax_url + "/value_delete_submit.ajax",
        data: submit_data,
        onsuccess: function(data) {
          var msg_row = $(data.result.html);
          formlib.success_inline_delete(prop_row, msg_row, function() {
            $.ajax($.extend(formlib.default_submit_ajax_options(),  {
              url: propbox.options.base_ajax_url + "/value_delete_undo.ajax",
              data: submit_data,
              onsuccess: function(data) {
                formlib.success_inline_delete_undo(msg_row);
              }
            }));
          });
          prop_section.removeClass("editing");
        }
      }));
    },


    /**
     * add a /common/document
     */
    prop_add_document: function(prop_section, html, structure) {  
      var event_prefix = "propbox.edit.prop_add_document.";
      var options = {
        event_prefix: event_prefix,
        // callbacks
        init: edit.init_prop_add_document_form,
        validate: edit.validate_prop_add_document_form,
        submit: edit.submit_prop_add_document_form,
        // submit ajax options
        ajax: {
          url: propbox.options.base_ajax_url + 
            "/prop_add_document_submit.ajax"
        },
        // jQuery object
        prop_section: prop_section,
        form: html,
        structure: structure
      };
      html
        .bind(event_prefix + "cancel", function(e) {
          prop_section.removeClass("editing");
        });
      formlib.init_modal_form(options);
    },

    init_prop_add_document_form: function(options) {
        var lang_select = $("select[name=lang]", options.form);
        /**
         * If selecting a language other than the primary language
         * (propox.options.lang), display a message that they
         * may see the article until the page is refreshed with the 
         * selected language.
         */
        lang_select
            .change(function() {
                var lang_notice = $(".lang-notice", options.form);
                if (this.value === propbox.options.lang) {
                    lang_notice.hide();
                }
                else {
                    $("strong", lang_notice).text($("option:selected", lang_select).text());
                    lang_notice.show();
                }
            });
        $("textarea", options.form)
            .bind("keypress", function() {
                options.form.trigger(options.event_prefix + "valid");
            })
            .bind("paste", function() {
                options.form.trigger(options.event_prefix + "valid");
            })
            .focus();
    },

    validate_prop_add_document_form: function(options) {
        var textarea = $("textarea", options.form);
        var val = $.trim(textarea.val());
        if (val === "") {
            options.form.trigger(options.event_prefix + "invalid");
            textarea.focus();
            return false;
        }
        return true;
    },

    submit_prop_add_document_form: function(options, ajax_options) {
        var textarea = $("textarea", options.form);
        ajax_options.data[textarea.attr("name")] = $.trim(textarea.val());
        ajax_options.data.lang = $("select[name=lang]", options.form).val();
        $.ajax($.extend(ajax_options, {
            onsuccess: function(data) {
                var new_row = $(data.result.html);
                if (options.prop_row) {
                    // replace exisiting row
                    options.prop_row.replaceWith(new_row);                    
                }
                else {
                    // add new row to prop_section
                    var ls = $(">.data-section", options.prop_section);
                    var body = $("> .data-table > tbody, > .data-list", ls);
                    body.append(new_row);                    
                }
                i18n.ize(new_row);
                propbox.init_menus(new_row, true);
                $(".nicemenu-item.edit").show();
                propbox.kbs.set_next(null, new_row, true); 
                options.form.trigger(options.event_prefix + "cancel"); 
            },
            onerror: function(errmsg) {
                options.form.trigger(options.event_prefix + "error", errmsg);
            }
        }));
    },

    /**
     * edit a /common/document
     */
    value_edit_document: function(prop_section, prop_row, html, structure) {
      var event_prefix = "propbox.edit.value_edit_document.";
      var options = {
        event_prefix: event_prefix,
        // callbacks
        init: edit.init_value_edit_document_form,
        validate: edit.validate_value_edit_document_form,
        submit: edit.submit_value_edit_document_form,
        // submit ajax options
        ajax: {
          url: propbox.options.base_ajax_url + 
            "/prop_add_document_submit.ajax"
        },
        // jQuery object
        prop_section: prop_section,
        prop_row: prop_row,
        form: html,
        structure: structure,

        // can't edit document modal dialog?
        cant_edit: html.is(".cant-edit-document-form")
      };
      html
        .bind(event_prefix + "cancel", function(e) {
          prop_section.removeClass("editing");
        });
      if (options.cant_edit) {
          /**
           * You can't edit articles with /common/document/source_uri.
           * If so, the form returned is a modal dialog specifying you
           * can't edit generated (wikipedia) articles, would you
           * like to create new?
           */
          html.bind(event_prefix + "submit", function(e) {
              html.trigger(event_prefix + "cancel");
              edit.prop_add_begin(prop_section);
          });
      }
      formlib.init_modal_form(options);
    },

    init_value_edit_document_form: function(options) {
        if (options.cant_edit) {
            /**
             * Enable the "Create new" button in the can't edit modal dialog
             */
            formlib.enable_submit(options);
        }
        else {
            /**
             * Otherwise, the same exact form as adding a document
             */
            edit.init_prop_add_document_form(options);
        }
    },

    validate_value_edit_document_form: function(options) {
        if (options.cant_edit) {
            return true;
        }
        else {
            return edit.validate_prop_add_document_form(options);
        }
    },

    submit_value_edit_document_form: function(options, ajax_options) {
        if (!options.cant_edit) {
            edit.submit_prop_add_document_form(options, ajax_options);
        }
    },


    /**
     * add a /common/image
     */
    prop_add_image: function(prop_section) {
        alert("Add image not yet implemented");
        prop_section.removeClass("editing");
    },

    /**
     * edit a /common/image
     */
    value_edit_image: function(prop_section) {
        alert("Edit image not yet implemented");
        prop_section.removeClass("editing");
    },



    /**
     * Generic propbox utiltiies
     */

    init_data_inputs: function(options) {
      $(".data-input", options.edit_row).each(function() {
        edit.init_data_input($(this), options);
      });
    },

    init_data_input: function(data_input, options) {
      data_input
        .data_input({
          lang: propbox.options.lang,
          suggest_impl: propbox.options.suggest_impl,
          incompatible_types: propbox.options.incompatible_types
        })
        .bind("valid", function() {
          options.edit_row.trigger(options.event_prefix + "valid");
          var form_field = data_input.parent(".form-field");
          var magicbox_template = form_field.next(".magicbox-template");
          if (magicbox_template.length) {
            var div = $("<div>").html(magicbox_template.html());
            var new_form_field = $(".form-field", div);
            form_field.after(new_form_field);
            edit.init_data_input($(".data-input", new_form_field), options);
          }
        })
        .bind("empty", function() {
          options.edit_row.trigger(options.event_prefix + "valid");
        })
        .bind("invalid", function() {
          options.edit_row.trigger(options.event_prefix + "invalid");
        })
        .bind("submit", function() {
          options.edit_row.trigger(options.event_prefix + "submit");
        })
        .bind("cancel", function() {
          options.edit_row.trigger(options.event_prefix + "cancel");
        })
        .bind("loading", function() {
          $(this).addClass("loading");
        })
        .bind("loading_complete", function() {
          $(this).removeClass("loading");
        });

      if (data_input.is(".datetime")) {
        i18n.ize_datetime_input($(":text", data_input));
      }
      else if (data_input.is(".int") || data_input.is(".float")) {
        i18n.ize_number_input($(":text", data_input));
      }
    },

    reset_data_inputs: function(form) {
      $(".data-input", form.edit_row).each(function() {
        var inst = $(this).data("$.data_input").reset();
      });
    }

  };


})(jQuery, window.propbox, window.formlib, window.editparams, window.i18n);
