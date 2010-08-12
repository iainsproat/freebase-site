jQuery.cookie=function(a,b,c){if(typeof b!="undefined"){c=c||{};if(b===null){b="";c=$.extend({},c);c.expires=-1}var d="";if(c.expires&&(typeof c.expires=="number"||c.expires.toUTCString)){if(typeof c.expires=="number"){d=new Date;d.setTime(d.getTime()+c.expires*24*60*60*1E3)}else d=c.expires;d="; expires="+d.toUTCString()}var f=c.path?"; path="+c.path:"",e=c.domain?"; domain="+c.domain:"";c=c.secure?"; secure":"";document.cookie=[a,"=",encodeURIComponent(b),d,f,e,c].join("")}else{b=null;if(document.cookie&&
document.cookie!=""){c=document.cookie.split(";");for(d=0;d<c.length;d++){f=jQuery.trim(c[d]);if(f.substring(0,a.length+1)==a+"="){b=decodeURIComponent(f.substring(a.length+1));break}}}return b}};
jQuery.fn.textPlaceholder=function(a){a=a||"#AAA";return this.each(function(){var b=this;if(!(b.placeholder&&"placeholder"in document.createElement(b.tagName))){var c=b.style.color,d=b.getAttribute("placeholder"),f=$(b);if(b.value===""||b.value==d){b.value=d;b.style.color=a;f.data("placeholder-visible",true)}f.focus(function(){this.style.color=c;if(f.data("placeholder-visible")){f.data("placeholder-visible",false);this.value=""}});f.blur(function(){if(this.value===""){f.data("placeholder-visible",
true);this.value=d;this.style.color=a}else{this.style.color=c;f.data("placeholder-visible",false)}});b.form&&$(b.form).submit(function(){if(f.data("placeholder-visible"))b.value=""})}})};
(function(a){a.extend({metadata:{defaults:{type:"class",name:"metadata",cre:/({.*})/,single:"metadata"},setType:function(b,c){this.defaults.type=b;this.defaults.name=c},get:function(b,c){var d=a.extend({},this.defaults,c);if(!d.single.length)d.single="metadata";var f=a.data(b,d.single);if(f)return f;f="{}";var e=function(h){if(typeof h!="string")return h;return h=eval("("+h+")")};if(d.type=="html5"){var g={};a(b.attributes).each(function(){var h=this.nodeName;if(h.match(/^data-/))h=h.replace(/^data-/,
"");else return true;g[h]=e(this.nodeValue)})}else{if(d.type=="class"){var i=d.cre.exec(b.className);if(i)f=i[1]}else if(d.type=="elem"){if(!b.getElementsByTagName)return;i=b.getElementsByTagName(d.name);if(i.length)f=a.trim(i[0].innerHTML)}else if(b.getAttribute!=undefined)if(i=b.getAttribute(d.name))f=i;g=e(f.indexOf("{")<0?"{"+f+"}":f)}a.data(b,d.single,g);return g}}});a.fn.metadata=function(b){return a.metadata.get(this[0],b)}})(jQuery);
(function(a){a.ui=a.ui||{};if(!a.ui.version){a.extend(a.ui,{version:"1.8.2",plugin:{add:function(b,c,d){b=a.ui[b].prototype;for(var f in d){b.plugins[f]=b.plugins[f]||[];b.plugins[f].push([c,d[f]])}},call:function(b,c,d){if((c=b.plugins[c])&&b.element[0].parentNode)for(var f=0;f<c.length;f++)b.options[c[f][0]]&&c[f][1].apply(b.element,d)}},contains:function(b,c){return document.compareDocumentPosition?b.compareDocumentPosition(c)&16:b!==c&&b.contains(c)},hasScroll:function(b,c){if(a(b).css("overflow")==
"hidden")return false;var d=c&&c=="left"?"scrollLeft":"scrollTop",f=false;if(b[d]>0)return true;b[d]=1;f=b[d]>0;b[d]=0;return f},isOverAxis:function(b,c,d){return b>c&&b<c+d},isOver:function(b,c,d,f,e,g){return a.ui.isOverAxis(b,d,e)&&a.ui.isOverAxis(c,f,g)},keyCode:{ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,
NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91}});a.fn.extend({_focus:a.fn.focus,focus:function(b,c){return typeof b==="number"?this.each(function(){var d=this;setTimeout(function(){a(d).focus();c&&c.call(d)},b)}):this._focus.apply(this,arguments)},enableSelection:function(){return this.attr("unselectable","off").css("MozUserSelect","")},disableSelection:function(){return this.attr("unselectable","on").css("MozUserSelect",
"none")},scrollParent:function(){var b;b=a.browser.msie&&/(static|relative)/.test(this.css("position"))||/absolute/.test(this.css("position"))?this.parents().filter(function(){return/(relative|absolute|fixed)/.test(a.curCSS(this,"position",1))&&/(auto|scroll)/.test(a.curCSS(this,"overflow",1)+a.curCSS(this,"overflow-y",1)+a.curCSS(this,"overflow-x",1))}).eq(0):this.parents().filter(function(){return/(auto|scroll)/.test(a.curCSS(this,"overflow",1)+a.curCSS(this,"overflow-y",1)+a.curCSS(this,"overflow-x",
1))}).eq(0);return/fixed/.test(this.css("position"))||!b.length?a(document):b},zIndex:function(b){if(b!==undefined)return this.css("zIndex",b);if(this.length){b=a(this[0]);for(var c;b.length&&b[0]!==document;){c=b.css("position");if(c=="absolute"||c=="relative"||c=="fixed"){c=parseInt(b.css("zIndex"));if(!isNaN(c)&&c!=0)return c}b=b.parent()}}return 0}});a.extend(a.expr[":"],{data:function(b,c,d){return!!a.data(b,d[3])},focusable:function(b){var c=b.nodeName.toLowerCase(),d=a.attr(b,"tabindex");return(/input|select|textarea|button|object/.test(c)?
!b.disabled:"a"==c||"area"==c?b.href||!isNaN(d):!isNaN(d))&&!a(b)["area"==c?"parents":"closest"](":hidden").length},tabbable:function(b){var c=a.attr(b,"tabindex");return(isNaN(c)||c>=0)&&a(b).is(":focusable")}})}})(jQuery);
(function(a){var b=a.fn.remove;a.fn.remove=function(c,d){return this.each(function(){if(!d)if(!c||a.filter(c,[this]).length)a("*",this).add(this).each(function(){a(this).triggerHandler("remove")});return b.call(a(this),c,d)})};a.widget=function(c,d,f){var e=c.split(".")[0],g;c=c.split(".")[1];g=e+"-"+c;if(!f){f=d;d=a.Widget}a.expr[":"][g]=function(i){return!!a.data(i,c)};a[e]=a[e]||{};a[e][c]=function(i,h){arguments.length&&this._createWidget(i,h)};d=new d;d.options=a.extend({},d.options);a[e][c].prototype=
a.extend(true,d,{namespace:e,widgetName:c,widgetEventPrefix:a[e][c].prototype.widgetEventPrefix||c,widgetBaseClass:g},f);a.widget.bridge(c,a[e][c])};a.widget.bridge=function(c,d){a.fn[c]=function(f){var e=typeof f==="string",g=Array.prototype.slice.call(arguments,1),i=this;f=!e&&g.length?a.extend.apply(null,[true,f].concat(g)):f;if(e&&f.substring(0,1)==="_")return i;e?this.each(function(){var h=a.data(this,c),j=h&&a.isFunction(h[f])?h[f].apply(h,g):h;if(j!==h&&j!==undefined){i=j;return false}}):this.each(function(){var h=
a.data(this,c);if(h){f&&h.option(f);h._init()}else a.data(this,c,new d(f,this))});return i}};a.Widget=function(c,d){arguments.length&&this._createWidget(c,d)};a.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",options:{disabled:false},_createWidget:function(c,d){this.element=a(d).data(this.widgetName,this);this.options=a.extend(true,{},this.options,a.metadata&&a.metadata.get(d)[this.widgetName],c);var f=this;this.element.bind("remove."+this.widgetName,function(){f.destroy()});this._create();
this._init()},_create:function(){},_init:function(){},destroy:function(){this.element.unbind("."+this.widgetName).removeData(this.widgetName);this.widget().unbind("."+this.widgetName).removeAttr("aria-disabled").removeClass(this.widgetBaseClass+"-disabled ui-state-disabled")},widget:function(){return this.element},option:function(c,d){var f=c,e=this;if(arguments.length===0)return a.extend({},e.options);if(typeof c==="string"){if(d===undefined)return this.options[c];f={};f[c]=d}a.each(f,function(g,
i){e._setOption(g,i)});return e},_setOption:function(c,d){this.options[c]=d;if(c==="disabled")this.widget()[d?"addClass":"removeClass"](this.widgetBaseClass+"-disabled ui-state-disabled").attr("aria-disabled",d);return this},enable:function(){return this._setOption("disabled",false)},disable:function(){return this._setOption("disabled",true)},_trigger:function(c,d,f){var e=this.options[c];d=a.Event(d);d.type=(c===this.widgetEventPrefix?c:this.widgetEventPrefix+c).toLowerCase();f=f||{};if(d.originalEvent){c=
a.event.props.length;for(var g;c;){g=a.event.props[--c];d[g]=d.originalEvent[g]}}this.element.trigger(d,f);return!(a.isFunction(e)&&e.call(this.element[0],d,f)===false||d.isDefaultPrevented())}}})(jQuery);
(function(a){a.widget("ui.mouse",{options:{cancel:":input,option",distance:1,delay:0},_mouseInit:function(){var b=this;this.element.bind("mousedown."+this.widgetName,function(c){return b._mouseDown(c)}).bind("click."+this.widgetName,function(c){if(b._preventClickEvent){b._preventClickEvent=false;c.stopImmediatePropagation();return false}});this.started=false},_mouseDestroy:function(){this.element.unbind("."+this.widgetName)},_mouseDown:function(b){b.originalEvent=b.originalEvent||{};if(!b.originalEvent.mouseHandled){this._mouseStarted&&
this._mouseUp(b);this._mouseDownEvent=b;var c=this,d=b.which==1,f=typeof this.options.cancel=="string"?a(b.target).parents().add(b.target).filter(this.options.cancel).length:false;if(!d||f||!this._mouseCapture(b))return true;this.mouseDelayMet=!this.options.delay;if(!this.mouseDelayMet)this._mouseDelayTimer=setTimeout(function(){c.mouseDelayMet=true},this.options.delay);if(this._mouseDistanceMet(b)&&this._mouseDelayMet(b)){this._mouseStarted=this._mouseStart(b)!==false;if(!this._mouseStarted){b.preventDefault();
return true}}this._mouseMoveDelegate=function(e){return c._mouseMove(e)};this._mouseUpDelegate=function(e){return c._mouseUp(e)};a(document).bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate);a.browser.safari||b.preventDefault();return b.originalEvent.mouseHandled=true}},_mouseMove:function(b){if(a.browser.msie&&!b.button)return this._mouseUp(b);if(this._mouseStarted){this._mouseDrag(b);return b.preventDefault()}if(this._mouseDistanceMet(b)&&
this._mouseDelayMet(b))(this._mouseStarted=this._mouseStart(this._mouseDownEvent,b)!==false)?this._mouseDrag(b):this._mouseUp(b);return!this._mouseStarted},_mouseUp:function(b){a(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate);if(this._mouseStarted){this._mouseStarted=false;this._preventClickEvent=b.target==this._mouseDownEvent.target;this._mouseStop(b)}return false},_mouseDistanceMet:function(b){return Math.max(Math.abs(this._mouseDownEvent.pageX-
b.pageX),Math.abs(this._mouseDownEvent.pageY-b.pageY))>=this.options.distance},_mouseDelayMet:function(){return this.mouseDelayMet},_mouseStart:function(){},_mouseDrag:function(){},_mouseStop:function(){},_mouseCapture:function(){return true}})})(jQuery);
(function(a){a.ui=a.ui||{};var b=/left|center|right/,c=/top|center|bottom/,d=a.fn.position,f=a.fn.offset;a.fn.position=function(e){if(!e||!e.of)return d.apply(this,arguments);e=a.extend({},e);var g=a(e.of),i=(e.collision||"flip").split(" "),h=e.offset?e.offset.split(" "):[0,0],j,l,m;if(e.of.nodeType===9){j=g.width();l=g.height();m={top:0,left:0}}else if(e.of.scrollTo&&e.of.document){j=g.width();l=g.height();m={top:g.scrollTop(),left:g.scrollLeft()}}else if(e.of.preventDefault){e.at="left top";j=l=
0;m={top:e.of.pageY,left:e.of.pageX}}else{j=g.outerWidth();l=g.outerHeight();m=g.offset()}a.each(["my","at"],function(){var k=(e[this]||"").split(" ");if(k.length===1)k=b.test(k[0])?k.concat(["center"]):c.test(k[0])?["center"].concat(k):["center","center"];k[0]=b.test(k[0])?k[0]:"center";k[1]=c.test(k[1])?k[1]:"center";e[this]=k});if(i.length===1)i[1]=i[0];h[0]=parseInt(h[0],10)||0;if(h.length===1)h[1]=h[0];h[1]=parseInt(h[1],10)||0;if(e.at[0]==="right")m.left+=j;else if(e.at[0]==="center")m.left+=
j/2;if(e.at[1]==="bottom")m.top+=l;else if(e.at[1]==="center")m.top+=l/2;m.left+=h[0];m.top+=h[1];return this.each(function(){var k=a(this),o=k.outerWidth(),p=k.outerHeight(),n=a.extend({},m);if(e.my[0]==="right")n.left-=o;else if(e.my[0]==="center")n.left-=o/2;if(e.my[1]==="bottom")n.top-=p;else if(e.my[1]==="center")n.top-=p/2;n.left=parseInt(n.left);n.top=parseInt(n.top);a.each(["left","top"],function(q,r){a.ui.position[i[q]]&&a.ui.position[i[q]][r](n,{targetWidth:j,targetHeight:l,elemWidth:o,
elemHeight:p,offset:h,my:e.my,at:e.at})});a.fn.bgiframe&&k.bgiframe();k.offset(a.extend(n,{using:e.using}))})};a.ui.position={fit:{left:function(e,g){var i=a(window);i=e.left+g.elemWidth-i.width()-i.scrollLeft();e.left=i>0?e.left-i:Math.max(0,e.left)},top:function(e,g){var i=a(window);i=e.top+g.elemHeight-i.height()-i.scrollTop();e.top=i>0?e.top-i:Math.max(0,e.top)}},flip:{left:function(e,g){if(g.at[0]!=="center"){var i=a(window);i=e.left+g.elemWidth-i.width()-i.scrollLeft();var h=g.my[0]==="left"?
-g.elemWidth:g.my[0]==="right"?g.elemWidth:0,j=-2*g.offset[0];e.left+=e.left<0?h+g.targetWidth+j:i>0?h-g.targetWidth+j:0}},top:function(e,g){if(g.at[1]!=="center"){var i=a(window);i=e.top+g.elemHeight-i.height()-i.scrollTop();var h=g.my[1]==="top"?-g.elemHeight:g.my[1]==="bottom"?g.elemHeight:0,j=g.at[1]==="top"?g.targetHeight:-g.targetHeight,l=-2*g.offset[1];e.top+=e.top<0?h+g.targetHeight+l:i>0?h+j+l:0}}}};if(!a.offset.setOffset){a.offset.setOffset=function(e,g){if(/static/.test(a.curCSS(e,"position")))e.style.position=
"relative";var i=a(e),h=i.offset(),j=parseInt(a.curCSS(e,"top",true),10)||0,l=parseInt(a.curCSS(e,"left",true),10)||0;h={top:g.top-h.top+j,left:g.left-h.left+l};"using"in g?g.using.call(e,h):i.css(h)};a.fn.offset=function(e){var g=this[0];if(!g||!g.ownerDocument)return null;if(e)return this.each(function(){a.offset.setOffset(this,e)});return f.call(this)}}})(jQuery);window.freebase=window.fb={};
(function(a){if(!window.console)window.console={log:a.noop,info:a.noop,debug:a.noop,warn:a.noop,error:a.noop}})(jQuery,window.freebase);(function(a,b){b.dispatch=function(c,d,f,e){if(typeof d!=="function")return false;c=a.event.fix(c||window.event);f||(f=[]);e||(e=this);return d.apply(e,[c].concat(f))}})(jQuery,window.freebase);
(function(a,b){var c={};b.get_script=function(d,f){var e=c[d];if(e)if(e.state===1)e.callbacks.push(f);else e.state===4&&f();else{e=c[d]={state:0,callbacks:[f]};a.ajax({url:d,dataType:"script",beforeSend:function(){e.state=1},success:function(){e.state=4;a.each(e.callbacks,function(g,i){i()})},error:function(){e.state=-1}})}}})(jQuery,window.freebase);
(function(a,b){a(window).bind("fb.user.signedin",function(g,i){console.log("fb.user.signnedin");b.user=i;var h=a("#nav-username a:first");if(h.length){h[0].href+=b.user.id;h.text(b.user.name)}a("#signedin").show()}).bind("fb.user.signedout",function(){console.log("fb.user.signedout");a("#signedout").show()});if(/^https?\:\/\/((.+)\.)?(freebase|sandbox\-freebase|branch\.qa\.metaweb|trunk\.qa\.metaweb)\.com(\:\d+)?/.test(acre.request.app_url)){var c=function(g,i){var h=g.indexOf("|"+i+"_");if(h!=-1){h=
h+2+i.length;var j=g.indexOf("|",h);if(j!=-1)return decodeURIComponent(g.substr(h,j-h))}return null},d=a.cookie("metaweb-user-info");if(d){var f=c(d,"g"),e=c(d,"u");(c=c(d,"p"))||(c="/user/"+this.name);a(window).trigger("fb.user.signedin",{guid:f,name:e,id:c})}else a(window).trigger("fb.user.signedout")}else a.ajax({url:"/acre/account/user_info",dataType:"json",success:function(g){g&&g.code==="/api/status/ok"?a(window).trigger("fb.user.signedin",{id:g.id,guid:g.guid,name:g.username}):a(window).trigger("fb.user.signedout")},
error:function(){a(window).trigger("fb.user.signedout")}})})(jQuery,window.freebase);
(function(a){a(function(){var b=a("#SearchBox .SearchBox-input,#global-search-input"),c=acre.freebase.site_host;b.suggest({service_url:c,soft:true,category:"object",parent:"#site-search-box",align:"right",status:null});var d=a("#site-search-label"),f=a("#site-search-box .fbs-pane");b.bind("fb-select",function(e,g){window.location=c+"/view"+g.id;return false}).bind("fb-pane-show",function(){d.html("<span>Select an item from the list</span>").removeClass("loading")}).bind("fb-textchange",function(){a.trim(b.val())===
""?d.html("<span>Start typing to get some suggestions</span>").removeClass("loading"):d.html("<span>Searching...</span>").addClass("loading")}).bind("fb-error",function(){d.html("<span>Sorry, something went wrong. Please try again later</span>").removeClass("loading")}).focus(function(){d.is(":visible")||a("#site-search-label").slideDown("fast")}).blur(function(){!f.is(":visible")&&d.is(":visible")&&a("#site-search-label").slideUp("fast")});a(".SearchBox-form").submit(function(){return a.trim(a("#global-search-input").val()).length==
0?false:true});a("input, textarea").textPlaceholder()})})(jQuery,window.freebase);var foo=5;
