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

;(function($) {
  /**
   * Initialize tablesorter defaults and parsers, if tablesorter.js is included.
   */

    $(function() {
      if ($.tablesorter) {console.log("$.tablesorter");
        var div = $("<div>");

        $.tablesorter.defaults.cssAsc = "column-header-asc";
        $.tablesorter.defaults.cssDesc = "column-header-desc";
        $.tablesorter.defaults.cssHeader =  "column-header";

        $.tablesorter.addParser({
          // set a unique id
          id: "datetime",
          is: function(s) { return false; },
          format: function(s) {
            div.html(s);
            return div.find("time:first").attr("datetime");
          },
          type: "text"
        });

        $.tablesorter.addParser({
          // set a unique id
          id: "ignoreCase",
          is: function(s) { return false; },
          format: function(s) {
            div.html(s);
            return div.text().toLowerCase();
          },
          type: "text"
        });

        $.tablesorter.addParser({
          // set a unique id
          id: "string",
          is: function(s) { return false; },
          format: function(s) {
            div.html(s);
            return div.text();
          },
          type: "text"
        });

        $.tablesorter.addParser({
          // set a unique id
          id: "number",
          is: function(s) { return false; },
          format: function(s) {
            div.html(s);
            var n = div.find(".number:first").attr("data-value");
            if (n == null) {
              return Number.MAX_VALUE;
            }
            return n;
          },
          type: "numeric"
        });

        $(".table-sortable").each(function() {
          $(this).tablesorter();
        });
      };
    });


})(jQuery);
