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

   var it = fb.incompatible_types = {

     overlay_dialog: null,
     inline_dialog: null,

     /**
      * Check the compatibility of the types of topic_id to
      * the specified type_id (i.e., the expected type of a property)
      * and its /freebase/type_hints/included_types.
      * 
      * If the topic_id is safe to be typed with type_id and its included types,
      * callbacks.compatible will be invoked with 2 arguments:
      * 1) topic_id
      * 2) type_id
      * 
      * If any of the existing types of topic_id is incompatible with the type_id
      * or its included types, callbacks.incompatible will be invoked with
      * 3 arguments:
      * 1) topic_id
      * 2) type_id
      * 3) a map of incompatible types keyed by existing types (of topic_id).
      *    The incompatible types are a subset of type_id and its included types
      *    that are mutexes (/dataworld/incompatible_types) of an existing type
      *    (of topic_id).
      * 
      * Usage:
      * 
      *   check("/en/blade_runner", "/film/film", {
      *     compatible: function(id, type) { ... },
      *     incompatible: function(id, type, incompatible_types) { ... }
      *   });
      */
     check: function(topic_id, type_id, callbacks) {
         callbacks = callbacks || {};
         $.ajax({
             url: fb.h.ajax_url("lib/incompatible_types/incompatible_types.ajax"),
             data: {id:topic_id, type:type_id},
             dataType: "json",
             beforeSend: function() {
                 fb.status.doing("Checking compatibility...");
             },
             success: function(data) {
                 var result = data.result;
                 if ($.isEmptyObject(result)) {
                     if (callbacks.compatible) {
                         callbacks.compatible(topic_id, type_id);
                     }
                 }
                 else if (callbacks.incompatible) {
                     // incompatible types
                     callbacks.incompatible(topic_id, type_id, result);
                 }
             },
             error: function(xhr) {
                 fb.status.error(xhr.responseText);
             },
             complete: function() {
                 fb.status.clear();
             }
         });
     },

     /**
      * The default incompatible callback for a suggest input that 
      * overlays a confirm dialog with the list of incompatible types in which the
      * user can then override or cancel.
      * 
      * This will return a callback function that can be used as 
      * incompatible callback for check().
      * 
      * Usage:
      *   
      *   check("/en/blade_runner", "/people/person", {
      *       compatible: ...,
      *       incompatible: overlay_suggest_incompatible_callback(input, {
      *           onLoad: function() {...},   // optional
      *           onClose: function() {...},  // optional
      *           onCancel: function() {...}, // optional
      *           onConfirm: function(topic_id, incompatible_type_id) { ... } // optional
      *       })
      *   })
      * 
      * @param suggest_input:Object - jQuery object referring to the suggest 
      *   input element.
      * @param callbacks:Object - A map of callback options with respect 
      *   to the overlay dialog:
      *     - onLoad:Function - when the dialog is loaded and displayed.
      *     - onClose:Function - when the dialog is closed.
      *     - onCancel:Function - when the user clicks the cancel button.
      *     - onConfirm:Function - when the user confirms (override) the 
      *         incompatibility dialog. This method will invoked with the topic_id
      *         and the incompatible type_id.
      */
     overlay_suggest_incompatible_callback: function(suggest_input, callbacks) {
         if (!it.overlay_dialog) {
             it.overlay_dialog = $(".incompatible-overlay-dialog");
         }
         if (it.overlay_dialog.length) {
             callbacks = callbacks || {};
             return function(topic_id, incompatible_type_id, incompatible_types) {
                 it.overlay_dialog.removeData("overlay");

                 $(".modal-content", it.overlay_dialog)
                     .empty()
                     .append(it.description_html(topic_id, incompatible_type_id, incompatible_types));

                 $(".incompatible-topic", it.overlay_dialog).text(suggest_input.val());

                 it.overlay_dialog.overlay({
                     close: "button",
                     closeOnClick: false,
                     load: true,
                     fixed: false,
                     mask: {
                         color: '#000',
                         loadSpeed: 200,
                         opacity: 0.5
                     },
                     onClose: function() {
                         suggest_input.focus().select();
                         $("button", it.overlay_dialog).unbind();
                         if (callbacks.onClose) {
                             callbacks.onClose();
                         }
                     },
                     onLoad: function() {
                         $(".cancel", it.overlay_dialog)
                             .focus()
                             .click(function() {
                                 suggest_input.focus().select().trigger("textchange");
                                 if (callbacks.onCancel) {
                                     callbacks.onCancel();
                                 }
                             });
                         $(".save", it.overlay_dialog).click(function() {
                             suggest_input.focus().select();
                             if (callbacks.onConfirm) {
                                 callbacks.onConfirm(topic_id, incompatible_type_id);
                             }
                         });                         
                         if (callbacks.onLoad) {
                             callbacks.onLoad();
                         }
                     }
                 });
             };
         }
         else {
             return it.native_confirm_suggest_incompatible_callback(suggest_input, callbacks);
         }
     },

     /**
      * This is like overlay_suggest_incompatible_callback but displayed inline
      * with the suggest_input instead of using an overlay.
      * 
      * @see overlay_suggest_incompatible_callback
      */
     inline_suggest_incompatible_callback: function(suggest_input, callbacks) {
         if (!it.inline_dialog) {
             it.inline_dialog = $(".incompatible-inline-dialog");
         }
         if (it.inline_dialog.length) {
             callbacks = callbacks || {};
             return function(topic_id, incompatible_type_id, incompatible_types) {
                 $(".modal-content", it.inline_dialog)
                     .empty()
                     .append(it.description_html(topic_id, incompatible_type_id, incompatible_types));   

                 $(".incompatible-topic", it.inline_dialog).text(suggest_input.val());

                 $(".save", it.inline_dialog)
                     .unbind()
                     .click(function() {
                         suggest_input.focus().select();
                         if (callbacks.onConfirm) {
                             callbacks.onConfirm(topic_id, incompatible_type_id);
                         }
                         it.inline_dialog.hide(callbacks.onClose);
                     });
                 $(".cancel", it.inline_dialog)
                     .unbind()
                     .click(function() {
                         suggest_input.focus().select().trigger("textchange");
                         if (callbacks.onCancel) {
                             callbacks.onCancel();
                         }
                         it.inline_dialog.hide(callbacks.onClose);
                     });
                 var offset_parent = suggest_input.offsetParent();
                 var offset = suggest_input.position();
                 offset_parent.append(it.inline_dialog);
                 it.inline_dialog.css({top:offset.top+suggest_input.outerHeight(), left:offset.left});
                 it.inline_dialog.show(callbacks.onLoad);
             };
         }
         else {
             return it.native_confirm_suggest_incompatible_callback(suggest_input, callbacks);
         }
     },

     /**
      * This is like overlay_suggest_incompatible_callback but using the native
      * confirm dialog.
      * 
      * @see overlay_suggest_incompatible_callback
      */
     native_confirm_suggest_incompatible_callback: function(suggest_input, callbacks) {
         callbacks = callbacks || {};
         return function(topic_id, incompatible_type_id, incompatible_types) {
           // Since we are using the native confirm dialog, 
           // there is no way to add a hook for callbacks.onLoad.
           if (confirm(it.description_text(topic_id, incompatible_type_id, incompatible_types))) {
               suggest_input.focus().select();
               if (callbacks.onConfirm) {
                   callbacks.onConfirm(topic_id, incompatible_type_id);
               }
           }
           else {
               suggest_input.focus().select().trigger("textchange");
               if (callbacks.onCancel) {
                   callbacks.onCancel();                     
               }
           }
           if (callbacks.onClose) {
               callbacks.onClose();
           }
           suggest_input.focus().select();
         };
     },

     /**
      * Generate the description html for the incompatible dialogs (overlay and inline).
      */
     description_html: function(topic_id, incompatible_type_id, incompatible_types) {
         var html = $("<div>");
         $.each(incompatible_types, function(existing_id, types) {
             html.append(it.reason_html(topic_id, existing_id, types));
         });
         html.append("<p>Are you sure you want to continue?<p>");
         return html;
     },

     reason_html: function(topic_id, existing_id, types) {         
         var li = $('<p><span class="incompatible-topic"></span> is already typed as <b class="incompatible-existing"></b>, it\'s unlikely it should also be typed as <b class="incompatible-type"></b>.</p>');
         $(".incompatible-topic", li).text(topic_id);
         $(".incompatible-existing", li).text(existing_id);
         $(".incompatible-type", li).text(types.join(", "));
         return li;
     },

     /**
      * Generate the description text for the incompatible native confirm dialog.
      */
     description_text: function(topic_id, incompatible_type_id, incompatible_types) {
         return it.description_html(topic_id, incompatible_type_id, incompatible_types).text();
     }

   };

})(jQuery, window.freebase);
