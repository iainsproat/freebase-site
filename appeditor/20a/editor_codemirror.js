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

(function(){
    
    /* 
     *   A task for creating a new instance of CodeMirror
     *   NOTE: CodeMirror itself is defined in codemirror/
     */
    var CreateCodeMirror = mjt.define_task(null, [{name: 'parent'},{name: 'editor_config'}]);
    CreateCodeMirror.prototype._task_class = 'CreateCodeMirror';
    CreateCodeMirror.prototype.request = function() {
        var task = this;
        var editor = new CodeMirror(this.parent, this.editor_config);
        this.editor_config.initCallback = function(mirror) {
            task.ready(editor);
        };        
        editor.get_state = function() {
          return { text: this.editor.getCode() };
        };
        
        editor.set_state = function(obj) {
          this.editor.importCode(obj.text);
        };
    };
    

    function determine_parser(file) {
        var parser = 'DummyParser'; // default
        
        var CODEMIRROR_DOCTYPE_MAP = {
            'mqlquery': 'JSParser',
            'acre_script': 'JSParser',
            'mjt': 'HTMLMixedParser',
            'freebase_template': 'HTMLMixedParser',
            'coffee_script': 'JSParser',
            'controller': 'JSParser',
            'ajax': 'JSParser'
            // 'passthrough' : see CODEMIRROR_MEDIATYPE_MAP
        };

        var CODEMIRROR_MEDIATYPE_MAP = {
            'text/html'  : 'HTMLMixedParser',
            'text/css'   : 'CSSParser',
            'text/javascript'  : 'JSParser',
            'application/json' : 'JSParser'
            // otherwise use default 'DummyParser'
        };
        
        var acre_handler = file.get_acre_handler();
        var mime_type = file.get_mime_type();

        if (mime_type !== 'text/plain' ) {
            if (mime_type in CODEMIRROR_MEDIATYPE_MAP) {
                parser = CODEMIRROR_MEDIATYPE_MAP[mime_type];
            }
        } else if (acre_handler in CODEMIRROR_DOCTYPE_MAP) {
            parser = CODEMIRROR_DOCTYPE_MAP[acre_handler];
        }

        return parser;
    }
    
    CodeMirror.t_load = function(file, state) {
        /* CREATE EDITOR CONFIG */
        // make a deep copy of the default config object so that each file can have different settings
        var editor_config = $.extend(true,{},EDITORS.CodeMirror.config);
        
        editor_config.readOnly = !file.is_writable();
        if (editor_config.readOnly) { 
            $(file.get_element()).addClass('readonly').append("<div class='readonly-warning'>READ ONLY</div>");
        }
        
        editor_config.onChange = function() {
          if (!file._loaded_editors["CodeMirror"]) { return; } // we haven't initalized our wrapper yet
          var history = file._loaded_editors["CodeMirror"].historySize();
          file.trigger_editor_event('change', [history.undo, history.redo]);
        };
        
        var top_element = document.createElement('div');
        $(top_element).css({height: '100%', width: '100%'});
        $(file.get_element()).append(top_element);
        
        var loadtask;
        var task = CreateCodeMirror(top_element, editor_config)
            .onready(function(editor) {
                editor.setParser(determine_parser(file));
                if (state) { editor.set_state(state); }
                else if (loadtask) { editor.set_state({text: loadtask.result.text}); }
                editor._file = file;
                editor._top_element = top_element;
                file.trigger_editor_event('newframe', [editor.frame]);
                editor_config.cursorActivity = function() { editor.highlight_line(); };
            });

        if (!state && file.has_been_saved()) {
            loadtask = file.t_get_revision();
            task.require(loadtask);
        }
    
        return task;
    };
    
    CodeMirror.prototype.destroy = function() {
        var editor = this;
        
        if ("_codeAssist" in editor) { 
            editor._codeAssist.dispose();
            editor._codeAssist = null;
        }
        
        $(editor._top_element).remove();
        editor = null;
    };
    
    CodeMirror.prototype.show = function(prefs) {
        var editor = this;
        var file = editor._file;
        editor._prefs = prefs;
        
        setTimeout(function() {
          editor.setLineNumbers(prefs.margin);
          editor.setTextWrapping(prefs.softwrap);
          editor.highlight_line();

          $(editor._top_element).show();
          $('iframe',editor._top_element).focus();
          
          // Firefox BUG: selection not preserved when iframe is hidden
          if (editor._last_selection) {
            var start = editor._last_selection.start;
            var end   = editor._last_selection.end;
            editor.selectLines(start.line, start.character, end.line, end.character);
            delete editor._last_selection;
          }

          // Lazy-load CodeAssist if it's turned on
          if (prefs.dotTrigger && file.is_writable()) {
              fb.get_script(fb.acre.libs["codeassist"], function(){
                  if (!editor._codeAssist) {
                      editor._codeAssist = new CodeAssist(editor.frame, editor, {
                          isMjt: file.get_acre_handler() == 'mjt'
                      });
                  }
                  editor._codeAssist.putSetting("dotTrigger", prefs.dotTrigger);
              });
          }

          },1);
      };
    
    CodeMirror.prototype.hide = function() {
        var editor = this;

        // Firefox BUG: selection not preserved when iframe is hidden
        var start = editor.cursorPosition();
        var end   = editor.cursorPosition(false);
        editor._last_selection = {start:start,end:end};

        $(editor._top_element).hide();
    };
    
    CodeMirror.prototype.highlight_line = function() {
        var editor = this;
        var file =  editor._file;
        
        var linenum = editor.currentLine();
        var $lineNumbers = $(editor.lineNumbers);
        $lineNumbers.find('.Codemirror-current-line').removeClass('Codemirror-current-line');
        $lineNumbers
            .find('div')
            .eq(linenum)
            .addClass('Codemirror-current-line');
        file.trigger_editor_event('linechange',[linenum]); 
    };
    
    CodeMirror.prototype.goto_line = function(linenum) {
        try {
            this.jumpToLine(linenum);            
        } catch(e) {
            // catch out-of-range line number
            this.selectLines(this.prevLine(this.lastLine()), 0);
        }
    };

    var ACRETAG = 'xml-tagname-acre'; //TODO: better name in CSS
    var special_class = { 'acre:doc':ACRETAG, 'acre:block':ACRETAG, 'acre:script':ACRETAG };

    CodeMirror.style_token = function(span,token) {
        var t = token.content.toLowerCase();
        if (token.style == "xml-tagname") {
            if (special_class[t]) {
                span.className += " " + special_class[t];
            }
        }
    };

})();

EDITORS.CodeMirror = {
    name                : "CodeMirror",
    editor_class        : CodeMirror,
    supports            : {
        hotswap             : true,
        mimetype_change     : true,
        margin              : true,
        linenumbers         : true,
        softwrap            : true,
        undo                : true,
        indent              : true,
        codeassist          : true
    },
    config              : {
        parserConfig        : { triggers:{"acre:script":"JSParser", "script":"JSParser", "style":"CSSParser"} },
        activeTokens        : CodeMirror.style_token,
        height              : '100%',
        marginWidth         : 45,      // is actually used by CodeMirror?
        autoMatchParens     : true,
        passDelay           : 100,     // gap between highlighting runs (each run lasts 50ms - see passTime in codemirror.js)
        undoDelay           : 250,     // min time between onChange notifications (and undo history commit)
        basefiles           : [],
        parserfile          : [fb.acre.libs.codemirror],     // see index.sjs
        stylesheet          : [fb.acre.libs.codemirror_css], // see index.sjs
        lineNumbers         : true,
        highlightActiveLine : true,
        tabMode             : "shift",
        dotTrigger          : false
    }
};
