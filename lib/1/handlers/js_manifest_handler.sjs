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
 
function compile_mjt(source, pkgid) {
  var code = [];
  code.push("if (jQuery) {\n");
  code.push("jQuery(window).trigger('acre.template.register', {pkgid: '" + pkgid + "', source: ");
  code.push(acre.template.string_to_js(source, pkgid));
  code.push("});\n");
  code.push("}\n");
  return code.join("");
};

var mjt_to_js_handler = {
  'to_js': function(script) {
    var res = script.get_content();
    var pkgid = "//" + script.app.host + "/" + script.name;
    res.body = compile_mjt(res.body, pkgid);
    var str = "var module = ("+ JSON.stringify(res) +");";
    return str;
  },
  'to_module': function(compiled_js, script) {
    return compiled_js.module;
  },
  'to_http_response': function(module, script) {
    module.headers['content-type'] = 'application/x-javascript';
    return module;
  }
};

var handler = function() {
  return {
    'to_js': function(script) {
      return "var res = ("+JSON.stringify(script.get_content())+");";
    },
    'to_module' : function(compiled_js, script) {
      var res = compiled_js.res;

      try {
        var mf = JSON.parse(res.body);
      } catch(e) {
        throw new Error(".mf files must be valid JSON.  " + e);
      }

      if (!(mf instanceof Array)) {
        throw new Error("Manifest file must be an array."); 
      }
      
      // have required mjt files be client-side JS
      acre.handlers.mjt = mjt_to_js_handler;

      // acquire all the files
      var buf = [];
      for (var i=0; i < mf.length; i++) {
        var path = mf[i];
        buf.push("\n/** " + path + "**/\n");
        var req = script.scope.acre.require(path);
        buf.push(req.body);
      }
      res.body = buf.join("");

      return res;
    },
    'to_http_response': function(module, script) {
      module.headers['content-type'] = 'application/x-javascript';
      return module;
    }
  };
};
