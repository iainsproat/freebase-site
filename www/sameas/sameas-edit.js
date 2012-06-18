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


(function($, fb, formlib, propbox) {

  var edit = fb.sameas.edit = {

    /**
     * ADD KEY
     */

    add_key_begin: function(trigger, body) {
      $.ajax($.extend(formlib.default_begin_ajax_options(), {
        url: fb.h.ajax_url("add_key_begin.ajax"),
        data: {id:fb.c.id, lang:fb.lang},
        onsuccess: function(data) {
          var form = $(data.result.html);
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
            body: body,
            form: form
          };
          form
            .bind(event_prefix + "cancel", function(e) {
                trigger.removeClass("editing");
            });
          formlib.init_modal_form(options);
        }
      }));
    },

    add_key_init: function(options) {
        edit.init_modal_help(options.form);
        var select = $("select[name=p]", options.form)
            .change(function(e) {
                edit.edit_key_reset(options);
            });
        edit.edit_key_reset(options);
    },

    add_key_validate: function(options) {
        var namespace = $(":input[name=namespace]", options.form);
        if (!namespace.data("data.suggest")) {
            formlib.disable_submit(options);
            return false;     
        }
        var key = $(":input[name=value]", options.form);
        if (formlib.validate_mqlkey(options, key)) {
            formlib.enable_submit(options);
            return true;
        }
        else {
            formlib.disable_submit(options);
            return false;
        }
    },

    add_key_submit: function(options, ajax_options) {
        var select = $("select[name=p]", options.form);
        var namespace = $(":input[name=namespace]", options.form);
        var key = $(":input[name=value]", options.form);
        $.extend(ajax_options.data, {
            s: fb.c.id,
            p: select.val(),
            namespace: namespace.data("data.suggest").id,
            value: key.val()
        });
        $.ajax($.extend(ajax_options, {
            onsuccess: function(data) {
                var new_row = $(">tr", $(data.result.html));
                options.body.prepend(new_row);
                propbox.init_menus(new_row, true);  
                edit.edit_key_reset(options);
                options.body.parent("table").trigger("update");
                options.form.trigger(options.event_prefix + "success");
                setTimeout(function() {
                    fb.status.info("Key successfully added");
                });
            },
            onerror: function(errmsg) {
                options.form.trigger(options.event_prefix + "error", errmsg);
            }
        }));
    },

    edit_key_reset: function(options) {
        var select = $("select[name=p]", options.form);
        var namespace = $(":input[name=namespace]", options.form);
        var key = $(":input[name=value]", options.form);
        if (select.is(":disabled")) { 
            /**
             * Edit existing key
             */            
            // disable changing namespace
            fb.disable(namespace);
            
            // validate key values
            formlib.init_mqlkey(key, {
                mqlread: fb.mqlread,
                namespace: select.val() === "/type/namespace/keys" ? fb.c.id : namespace.attr("data-id"),
                check_key: true
            });
            key
                .bind("valid", function(e) {
                    e.stopPropagation();
                    formlib.enable_submit(options);
                })
                .bind("invalid textchange", function(e) {
                    e.stopPropagation();
                    formlib.disable_submit(options);
                })
                .focus();
        }
        else {
            /**
             * Add a new key
             */

            // changing incoming/outgoing resets the form
            select
                .unbind()
                .change(function(e) {
                    edit.edit_key_reset(options);
                });

            // clear out input values
            namespace.val("");

            // disable key input until they choose the namespace
            fb.disable(key.val(""));

            // reset key check status
            key.next(".key-status").removeClass("valid invalid loading");

            // hook up suggest to namespace input
            var suggest_options = null;
            if (select.val() === "/type/namespace/keys") {
                // namespace input can be any object
                suggest_options = $.extend({}, fb.suggest_options.service_defaults);

                // change the label of the namespace input
                $(".form-label-object", options.form).show();
                $(".form-label-namespace", options.form).hide();
            }
            else {
                // namespace input needs to be a namespace
                suggest_options = fb.suggest_options.instance("/type/namespace");

                // change the label of the namespace input
                $(".form-label-object", options.form).hide();
                $(".form-label-namespace", options.form).show();
            }
            namespace
                .suggest(suggest_options)
                .bind("fb-select", function(e, data) {
                    // enable key input
                    fb.enable(key.val(""));

                    // validate key values
                    formlib.init_mqlkey(key, {
                        mqlread: fb.mqlread,
                        namespace: select.val() === "/type/namespace/keys" ? fb.c.id : data.id,
                        check_key: true
                    });
                    key
                        .bind("valid", function(e) {
                            e.stopPropagation();
                            formlib.enable_submit(options);
                        })
                        .bind("invalid textchange", function(e) {
                            e.stopPropagation();
                            formlib.disable_submit(options);
                        })
                        .focus();
                })
                .focus();
        }
        formlib.disable_submit(options);
    },


    /**
     * EDIT KEY
     */

    edit_key_begin: function(key_row) {
        var key_property = $(".key-property", key_row).attr("data-id");
        var key_namespace = $(".key-namespace", key_row).attr("data-id");
        var key_value = $(".key-value", key_row).attr("data-value");

        $.ajax($.extend(formlib.default_begin_ajax_options(), {
            url: fb.h.ajax_url("edit_key_begin.ajax"),
            data: {
                s: fb.c.id,
                p: key_property,
                namespace: key_namespace,
                value: key_value,
                lang: fb.lang
            },
            onsuccess: function(data) {
                var form = $(data.result.html);
                var options = null;
                var event_prefix = "fb.sameas.edit_key.";
                if (form.is(".not-permitted")) {
                    options = {
                        event_prefix: event_prefix,
                        // callbacks
                        init: $.noop,
                        validate: $.noop,
                        submit: $.noop,
                        // jQuery objects
                        form: form
                    };
                }
                else {
                    options = {
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
                        form: form,
                        row: key_row
                    };
                }
                form
                    .bind(event_prefix + "cancel", function(e) {
                        key_row.removeClass("editing");
                    });
                formlib.init_modal_form(options);
            }
        }));
    },

    edit_key_init: function(options) {
        edit.init_modal_help(options.form);
        edit.edit_key_reset(options);
    },

    edit_key_validate: function(options) {
        var key = $(":input[name=value]", options.form);
        if (formlib.validate_mqlkey(options, key)) {
            formlib.enable_submit(options);
            return true;
        }
        else {
            formlib.disable_submit(options);
            return false;
        }
    },

    edit_key_submit: function(options, ajax_options) {
        var select = $("select[name=p]", options.form);
        var namespace = $(":input[name=namespace]", options.form);
        var key = $(":input[name=value]", options.form);
        $.extend(ajax_options.data, {
            s: fb.c.id,
            p: select.val(),
            namespace: namespace.val(),
            // This is the new key value
            value: key.val()
            // The old key value (hidden input) is automatically 
            // submitted by formlib (in ajax_options.data)
        });
        $.ajax($.extend(ajax_options, {
            onsuccess: function(data) {
                var new_row = $(">tr", $(data.result.html));
                options.row.hide()
                    .before(new_row)
                    .remove();
                propbox.init_menus(new_row, true);
                new_row.parents("table:first").trigger("update");
                options.form.trigger(options.event_prefix + "cancel");
                setTimeout(function() {
                    fb.status.info("Key successfully edited");
                });
            },
            onerror: function(errmsg) {
                options.form.trigger(options.event_prefix + "error", errmsg);
            }
        }));
    },


    /**
     * DELETE KEY
     */
    delete_key_begin: function(key_row) {
        var key_property = $(".key-property", key_row).attr("data-id");
        var key_namespace = $(".key-namespace", key_row).attr("data-id");
        var key_value = $(".key-value", key_row).attr("data-value");

        $.ajax($.extend(formlib.default_begin_ajax_options(), {
            url: fb.h.ajax_url("delete_key_begin.ajax"),
            data: {
                s: fb.c.id,
                p: key_property,
                namespace: key_namespace,
                value: key_value,
                lang: fb.lang
            },
            onsuccess: function(data) {
                var form = $(data.result.html);
                var options = null;
                var event_prefix = "fb.sameas.delete_key.";
                if (form.is(".not-permitted")) {
                    options = {
                        event_prefix: event_prefix,
                        // callbacks
                        init: $.noop,
                        validate: $.noop,
                        submit: $.noop,
                        // jQuery objects
                        form: form
                    };
                }
                else {
                    options = {
                        event_prefix: event_prefix,
                        // callbacks
                        init: edit.delete_key_init,
                        validate: edit.delete_key_validate,
                        submit: edit.delete_key_submit,
                        // submit ajax options
                        ajax: {
                            url: fb.h.ajax_url("delete_key_submit.ajax")
                        },
                        // jQuery objects
                        form: form,
                        row: key_row
                    };
                }
                form
                    .bind(event_prefix + "cancel", function(e) {
                        key_row.removeClass("editing");
                    });
                formlib.init_modal_form(options);
            }
        }));
    },

    delete_key_init: function(options) {
        formlib.enable_submit(options);
    },

    delete_key_validate: function(options) {
        return true;
    },

    delete_key_submit: function(options, ajax_options) {
        $.ajax($.extend(ajax_options, {
            onsuccess: function(data) {
                var table = options.row.parents("table:first").trigger("update");
                options.row.remove();
                table.trigger("update");
                options.form.trigger(options.event_prefix + "cancel");
                setTimeout(function() {
                    fb.status.info("Key successfully deleted");
                });                
            },
            onerror: function(errmsg) {
                options.form.trigger(options.event_prefix + "error", errmsg);
            }
        }));
    },


    /**
     * modal help dialog initialization
     */
    init_modal_help: function(context) {
        // Show/Hide help menu in domain creation dialog
        $(".modal-help-toggle", context).click(function() {
            var $link = $(this);
            var $help_pane = $link.parents().find(".modal-help");
            var $container = $link.parents().find(".modal-content");
            if ($help_pane.is(":hidden")) {
                $help_pane.height(($container.height() - 5)).slideDown();
                $link.html("[ - ] Hide Help");
            } else {
                $help_pane.slideUp();
                $link.html("[ + ] Show Help");
            };
        });
    }

  };

})(jQuery, window.freebase, window.formlib, window.propbox);
