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

CueCard.createComposition = function(options) {
    var qe = new CueCard.QueryEditor(options.queryEditorElement, options["queryEditorOptions"]);
    
    var op = null;
    var cp = null;
    if ("outputPaneElement" in options) {
        var opo = options["outputPaneOptions"] || {};
        opo.queryEditor = qe;
        
        op = new CueCard.OutputPane(options.outputPaneElement, opo);
        qe.setOutputPane(op);
    }
    if ("controlPaneElement" in options) {
        var cpo = options["controlPaneOptions"] || {};
        cpo.queryEditor = qe;
        if (op != null) {
            cpo.outputPane = op;
        }

        cp = new CueCard.ControlPane(options.controlPaneElement, cpo);
        qe.setControlPane(cp);
    }
    
    return {
        queryEditor: qe,
        outputPane: op,
        controlPane: cp
    };
};

CueCard.showDialog = function(dialogname /*, arg1, arg2, etc. */) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    var dialog = $("<div id='dialog-" + dialogname + "' class='modal'></div>")
                .acre(fb.acre.current_script.app.path + "/cuecard/mjt/dialogs.mjt", dialogname, args);   
    $(document.body).append(dialog.hide());

    dialog.overlay({
        load: true,
        mask: {
            color: '#000',
            loadSpeed: 200,
            opacity: 0.5
        },
        close: ".modal-buttons .button",
        closeOnClick: false,
        onClose: function() {
            dialog.remove();
        }
    });
};
