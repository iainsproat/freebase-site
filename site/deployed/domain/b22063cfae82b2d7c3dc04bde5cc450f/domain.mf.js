jQuery.cookie=function(a,c,b){if(typeof c!="undefined"){b=b||{};if(c===null){c="";b=$.extend({},b);b.expires=-1}var d="";if(b.expires&&(typeof b.expires=="number"||b.expires.toUTCString)){if(typeof b.expires=="number"){d=new Date;d.setTime(d.getTime()+b.expires*24*60*60*1E3)}else d=b.expires;d="; expires="+d.toUTCString()}var e=b.path?"; path="+b.path:"",f=b.domain?"; domain="+b.domain:"";b=b.secure?"; secure":"";document.cookie=[a,"=",encodeURIComponent(c),d,e,f,b].join("")}else{c=null;if(document.cookie&&
document.cookie!=""){b=document.cookie.split(";");for(d=0;d<b.length;d++){e=jQuery.trim(b[d]);if(e.substring(0,a.length+1)==a+"="){c=decodeURIComponent(e.substring(a.length+1));break}}}return c}};
jQuery.fn.textPlaceholder=function(a){a=a||"#AAA";return this.each(function(){var c=this;if(!(c.placeholder&&"placeholder"in document.createElement(c.tagName))){var b=c.style.color,d=c.getAttribute("placeholder"),e=$(c);if(c.value===""||c.value==d){c.value=d;c.style.color=a;e.data("placeholder-visible",true)}e.focus(function(){this.style.color=b;if(e.data("placeholder-visible")){e.data("placeholder-visible",false);this.value=""}});e.blur(function(){if(this.value===""){e.data("placeholder-visible",
true);this.value=d;this.style.color=a}else{this.style.color=b;e.data("placeholder-visible",false)}});c.form&&$(c.form).submit(function(){if(e.data("placeholder-visible"))c.value=""})}})};
(function(a){a.ui=a.ui||{};if(!a.ui.version){a.extend(a.ui,{version:"1.8.2",plugin:{add:function(c,b,d){c=a.ui[c].prototype;for(var e in d){c.plugins[e]=c.plugins[e]||[];c.plugins[e].push([b,d[e]])}},call:function(c,b,d){if((b=c.plugins[b])&&c.element[0].parentNode)for(var e=0;e<b.length;e++)c.options[b[e][0]]&&b[e][1].apply(c.element,d)}},contains:function(c,b){return document.compareDocumentPosition?c.compareDocumentPosition(b)&16:c!==b&&c.contains(b)},hasScroll:function(c,b){if(a(c).css("overflow")==
"hidden")return false;var d=b&&b=="left"?"scrollLeft":"scrollTop",e=false;if(c[d]>0)return true;c[d]=1;e=c[d]>0;c[d]=0;return e},isOverAxis:function(c,b,d){return c>b&&c<b+d},isOver:function(c,b,d,e,f,g){return a.ui.isOverAxis(c,d,f)&&a.ui.isOverAxis(b,e,g)},keyCode:{ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,
NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91}});a.fn.extend({_focus:a.fn.focus,focus:function(c,b){return typeof c==="number"?this.each(function(){var d=this;setTimeout(function(){a(d).focus();b&&b.call(d)},c)}):this._focus.apply(this,arguments)},enableSelection:function(){return this.attr("unselectable","off").css("MozUserSelect","")},disableSelection:function(){return this.attr("unselectable","on").css("MozUserSelect",
"none")},scrollParent:function(){var c;c=a.browser.msie&&/(static|relative)/.test(this.css("position"))||/absolute/.test(this.css("position"))?this.parents().filter(function(){return/(relative|absolute|fixed)/.test(a.curCSS(this,"position",1))&&/(auto|scroll)/.test(a.curCSS(this,"overflow",1)+a.curCSS(this,"overflow-y",1)+a.curCSS(this,"overflow-x",1))}).eq(0):this.parents().filter(function(){return/(auto|scroll)/.test(a.curCSS(this,"overflow",1)+a.curCSS(this,"overflow-y",1)+a.curCSS(this,"overflow-x",
1))}).eq(0);return/fixed/.test(this.css("position"))||!c.length?a(document):c},zIndex:function(c){if(c!==undefined)return this.css("zIndex",c);if(this.length){c=a(this[0]);for(var b;c.length&&c[0]!==document;){b=c.css("position");if(b=="absolute"||b=="relative"||b=="fixed"){b=parseInt(c.css("zIndex"));if(!isNaN(b)&&b!=0)return b}c=c.parent()}}return 0}});a.extend(a.expr[":"],{data:function(c,b,d){return!!a.data(c,d[3])},focusable:function(c){var b=c.nodeName.toLowerCase(),d=a.attr(c,"tabindex");return(/input|select|textarea|button|object/.test(b)?
!c.disabled:"a"==b||"area"==b?c.href||!isNaN(d):!isNaN(d))&&!a(c)["area"==b?"parents":"closest"](":hidden").length},tabbable:function(c){var b=a.attr(c,"tabindex");return(isNaN(b)||b>=0)&&a(c).is(":focusable")}})}})(jQuery);
(function(a){var c=a.fn.remove;a.fn.remove=function(b,d){return this.each(function(){if(!d)if(!b||a.filter(b,[this]).length)a("*",this).add(this).each(function(){a(this).triggerHandler("remove")});return c.call(a(this),b,d)})};a.widget=function(b,d,e){var f=b.split(".")[0],g;b=b.split(".")[1];g=f+"-"+b;if(!e){e=d;d=a.Widget}a.expr[":"][g]=function(m){return!!a.data(m,b)};a[f]=a[f]||{};a[f][b]=function(m,h){arguments.length&&this._createWidget(m,h)};d=new d;d.options=a.extend({},d.options);a[f][b].prototype=
a.extend(true,d,{namespace:f,widgetName:b,widgetEventPrefix:a[f][b].prototype.widgetEventPrefix||b,widgetBaseClass:g},e);a.widget.bridge(b,a[f][b])};a.widget.bridge=function(b,d){a.fn[b]=function(e){var f=typeof e==="string",g=Array.prototype.slice.call(arguments,1),m=this;e=!f&&g.length?a.extend.apply(null,[true,e].concat(g)):e;if(f&&e.substring(0,1)==="_")return m;f?this.each(function(){var h=a.data(this,b),l=h&&a.isFunction(h[e])?h[e].apply(h,g):h;if(l!==h&&l!==undefined){m=l;return false}}):this.each(function(){var h=
a.data(this,b);if(h){e&&h.option(e);h._init()}else a.data(this,b,new d(e,this))});return m}};a.Widget=function(b,d){arguments.length&&this._createWidget(b,d)};a.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",options:{disabled:false},_createWidget:function(b,d){this.element=a(d).data(this.widgetName,this);this.options=a.extend(true,{},this.options,a.metadata&&a.metadata.get(d)[this.widgetName],b);var e=this;this.element.bind("remove."+this.widgetName,function(){e.destroy()});this._create();
this._init()},_create:function(){},_init:function(){},destroy:function(){this.element.unbind("."+this.widgetName).removeData(this.widgetName);this.widget().unbind("."+this.widgetName).removeAttr("aria-disabled").removeClass(this.widgetBaseClass+"-disabled ui-state-disabled")},widget:function(){return this.element},option:function(b,d){var e=b,f=this;if(arguments.length===0)return a.extend({},f.options);if(typeof b==="string"){if(d===undefined)return this.options[b];e={};e[b]=d}a.each(e,function(g,
m){f._setOption(g,m)});return f},_setOption:function(b,d){this.options[b]=d;if(b==="disabled")this.widget()[d?"addClass":"removeClass"](this.widgetBaseClass+"-disabled ui-state-disabled").attr("aria-disabled",d);return this},enable:function(){return this._setOption("disabled",false)},disable:function(){return this._setOption("disabled",true)},_trigger:function(b,d,e){var f=this.options[b];d=a.Event(d);d.type=(b===this.widgetEventPrefix?b:this.widgetEventPrefix+b).toLowerCase();e=e||{};if(d.originalEvent){b=
a.event.props.length;for(var g;b;){g=a.event.props[--b];d[g]=d.originalEvent[g]}}this.element.trigger(d,e);return!(a.isFunction(f)&&f.call(this.element[0],d,e)===false||d.isDefaultPrevented())}}})(jQuery);
(function(a){a.widget("ui.mouse",{options:{cancel:":input,option",distance:1,delay:0},_mouseInit:function(){var c=this;this.element.bind("mousedown."+this.widgetName,function(b){return c._mouseDown(b)}).bind("click."+this.widgetName,function(b){if(c._preventClickEvent){c._preventClickEvent=false;b.stopImmediatePropagation();return false}});this.started=false},_mouseDestroy:function(){this.element.unbind("."+this.widgetName)},_mouseDown:function(c){c.originalEvent=c.originalEvent||{};if(!c.originalEvent.mouseHandled){this._mouseStarted&&
this._mouseUp(c);this._mouseDownEvent=c;var b=this,d=c.which==1,e=typeof this.options.cancel=="string"?a(c.target).parents().add(c.target).filter(this.options.cancel).length:false;if(!d||e||!this._mouseCapture(c))return true;this.mouseDelayMet=!this.options.delay;if(!this.mouseDelayMet)this._mouseDelayTimer=setTimeout(function(){b.mouseDelayMet=true},this.options.delay);if(this._mouseDistanceMet(c)&&this._mouseDelayMet(c)){this._mouseStarted=this._mouseStart(c)!==false;if(!this._mouseStarted){c.preventDefault();
return true}}this._mouseMoveDelegate=function(f){return b._mouseMove(f)};this._mouseUpDelegate=function(f){return b._mouseUp(f)};a(document).bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate);a.browser.safari||c.preventDefault();return c.originalEvent.mouseHandled=true}},_mouseMove:function(c){if(a.browser.msie&&!c.button)return this._mouseUp(c);if(this._mouseStarted){this._mouseDrag(c);return c.preventDefault()}if(this._mouseDistanceMet(c)&&
this._mouseDelayMet(c))(this._mouseStarted=this._mouseStart(this._mouseDownEvent,c)!==false)?this._mouseDrag(c):this._mouseUp(c);return!this._mouseStarted},_mouseUp:function(c){a(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate);if(this._mouseStarted){this._mouseStarted=false;this._preventClickEvent=c.target==this._mouseDownEvent.target;this._mouseStop(c)}return false},_mouseDistanceMet:function(c){return Math.max(Math.abs(this._mouseDownEvent.pageX-
c.pageX),Math.abs(this._mouseDownEvent.pageY-c.pageY))>=this.options.distance},_mouseDelayMet:function(){return this.mouseDelayMet},_mouseStart:function(){},_mouseDrag:function(){},_mouseStop:function(){},_mouseCapture:function(){return true}})})(jQuery);
(function(a){a.ui=a.ui||{};var c=/left|center|right/,b=/top|center|bottom/,d=a.fn.position,e=a.fn.offset;a.fn.position=function(f){if(!f||!f.of)return d.apply(this,arguments);f=a.extend({},f);var g=a(f.of),m=(f.collision||"flip").split(" "),h=f.offset?f.offset.split(" "):[0,0],l,k,n;if(f.of.nodeType===9){l=g.width();k=g.height();n={top:0,left:0}}else if(f.of.scrollTo&&f.of.document){l=g.width();k=g.height();n={top:g.scrollTop(),left:g.scrollLeft()}}else if(f.of.preventDefault){f.at="left top";l=k=
0;n={top:f.of.pageY,left:f.of.pageX}}else{l=g.outerWidth();k=g.outerHeight();n=g.offset()}a.each(["my","at"],function(){var o=(f[this]||"").split(" ");if(o.length===1)o=c.test(o[0])?o.concat(["center"]):b.test(o[0])?["center"].concat(o):["center","center"];o[0]=c.test(o[0])?o[0]:"center";o[1]=b.test(o[1])?o[1]:"center";f[this]=o});if(m.length===1)m[1]=m[0];h[0]=parseInt(h[0],10)||0;if(h.length===1)h[1]=h[0];h[1]=parseInt(h[1],10)||0;if(f.at[0]==="right")n.left+=l;else if(f.at[0]==="center")n.left+=
l/2;if(f.at[1]==="bottom")n.top+=k;else if(f.at[1]==="center")n.top+=k/2;n.left+=h[0];n.top+=h[1];return this.each(function(){var o=a(this),q=o.outerWidth(),r=o.outerHeight(),p=a.extend({},n);if(f.my[0]==="right")p.left-=q;else if(f.my[0]==="center")p.left-=q/2;if(f.my[1]==="bottom")p.top-=r;else if(f.my[1]==="center")p.top-=r/2;p.left=parseInt(p.left);p.top=parseInt(p.top);a.each(["left","top"],function(s,t){a.ui.position[m[s]]&&a.ui.position[m[s]][t](p,{targetWidth:l,targetHeight:k,elemWidth:q,
elemHeight:r,offset:h,my:f.my,at:f.at})});a.fn.bgiframe&&o.bgiframe();o.offset(a.extend(p,{using:f.using}))})};a.ui.position={fit:{left:function(f,g){var m=a(window);m=f.left+g.elemWidth-m.width()-m.scrollLeft();f.left=m>0?f.left-m:Math.max(0,f.left)},top:function(f,g){var m=a(window);m=f.top+g.elemHeight-m.height()-m.scrollTop();f.top=m>0?f.top-m:Math.max(0,f.top)}},flip:{left:function(f,g){if(g.at[0]!=="center"){var m=a(window);m=f.left+g.elemWidth-m.width()-m.scrollLeft();var h=g.my[0]==="left"?
-g.elemWidth:g.my[0]==="right"?g.elemWidth:0,l=-2*g.offset[0];f.left+=f.left<0?h+g.targetWidth+l:m>0?h-g.targetWidth+l:0}},top:function(f,g){if(g.at[1]!=="center"){var m=a(window);m=f.top+g.elemHeight-m.height()-m.scrollTop();var h=g.my[1]==="top"?-g.elemHeight:g.my[1]==="bottom"?g.elemHeight:0,l=g.at[1]==="top"?g.targetHeight:-g.targetHeight,k=-2*g.offset[1];f.top+=f.top<0?h+g.targetHeight+k:m>0?h+l+k:0}}}};if(!a.offset.setOffset){a.offset.setOffset=function(f,g){if(/static/.test(a.curCSS(f,"position")))f.style.position=
"relative";var m=a(f),h=m.offset(),l=parseInt(a.curCSS(f,"top",true),10)||0,k=parseInt(a.curCSS(f,"left",true),10)||0;h={top:g.top-h.top+l,left:g.left-h.left+k};"using"in g?g.using.call(f,h):m.css(h)};a.fn.offset=function(f){var g=this[0];if(!g||!g.ownerDocument)return null;if(f)return this.each(function(){a.offset.setOffset(this,f)});return e.call(this)}}})(jQuery);window.freebase=window.fb={};
(function(a,c){c.dispatch=function(b,d,e,f){if(typeof d!=="function")return false;b=a.event.fix(b||window.event);e||(e=[]);f||(f=this);return d.apply(f,[b].concat(e))}})(jQuery,window.freebase);
(function(a,c){function b(g,m){var h=g.indexOf("|"+m+"_");if(h!=-1){h=h+2+m.length;var l=g.indexOf("|",h);if(l!=-1)return decodeURIComponent(g.substr(h,l-h))}return null}var d=a.cookie("metaweb-user-info");if(d){var e=b(d,"g"),f=b(d,"u");(d=b(d,"p"))||(d="/user/"+this.name);c.user={guid:e,name:f,id:d}}if(c.user){e=a("#nav-username a:first");if(e.length){e[0].href+=c.user.id;e.text(c.user.name)}a("#signedin").show()}else a("#signedout").show()})(jQuery,window.freebase);
(function(a){a(function(){var c=a("#SearchBox .SearchBox-input,#global-search-input"),b=acre.freebase.site_host;c.suggest({service_url:b,soft:true,category:"object",parent:"#site-search-box",align:"right",status:null});var d=a("#site-search-label"),e=a("#site-search-box .fbs-pane");c.bind("fb-select",function(f,g){window.location=b+"/view"+g.id;return false}).bind("fb-pane-show",function(){d.html("<span>Select an item from the list</span>").removeClass("loading")}).bind("fb-textchange",function(){a.trim(c.val())===
""?d.html("<span>Start typing to get some suggestions</span>").removeClass("loading"):d.html("<span>Searching...</span>").addClass("loading")}).bind("fb-error",function(){d.html("<span>Sorry, something went wrong. Please try again later</span>").removeClass("loading")}).focus(function(){d.is(":visible")||a("#site-search-label").slideDown("fast")}).blur(function(){!e.is(":visible")&&d.is(":visible")&&a("#site-search-label").slideUp("fast")});a(".SearchBox-form").submit(function(){return a.trim(a("#global-search-input").val()).length==
0?false:true});a("input, textarea").textPlaceholder()})})(jQuery,window.freebase);
(function(a){a.fn.lazyload=function(c){var b={threshold:0,failurelimit:0,event:"scroll",effect:"show",container:window};c&&a.extend(b,c);var d=this;"scroll"==b.event&&a(b.container).bind("scroll",function(){var e=0;d.each(function(){if(!(a.abovethetop(this,b)||a.leftofbegin(this,b)))if(!a.belowthefold(this,b)&&!a.rightoffold(this,b))a(this).trigger("appear");else if(e++>b.failurelimit)return false});var f=a.grep(d,function(g){return!g.loaded});d=a(f)});this.each(function(){var e=this;undefined==a(e).attr("original")&&
a(e).attr("original",a(e).attr("src"));if("scroll"!=b.event||undefined==a(e).attr("src")||b.placeholder==a(e).attr("src")||a.abovethetop(e,b)||a.leftofbegin(e,b)||a.belowthefold(e,b)||a.rightoffold(e,b)){b.placeholder?a(e).attr("src",b.placeholder):a(e).removeAttr("src");e.loaded=false}else e.loaded=true;a(e).one("appear",function(){this.loaded||a("<img />").bind("load",function(){a(e).hide().attr("src",a(e).attr("original"))[b.effect](b.effectspeed);e.loaded=true}).attr("src",a(e).attr("original"))});
"scroll"!=b.event&&a(e).bind(b.event,function(){e.loaded||a(e).trigger("appear")})});a(b.container).trigger(b.event);return this};a.belowthefold=function(c,b){return(b.container===undefined||b.container===window?a(window).height()+a(window).scrollTop():a(b.container).offset().top+a(b.container).height())<=a(c).offset().top-b.threshold};a.rightoffold=function(c,b){return(b.container===undefined||b.container===window?a(window).width()+a(window).scrollLeft():a(b.container).offset().left+a(b.container).width())<=
a(c).offset().left-b.threshold};a.abovethetop=function(c,b){return(b.container===undefined||b.container===window?a(window).scrollTop():a(b.container).offset().top)>=a(c).offset().top+b.threshold+a(c).height()};a.leftofbegin=function(c,b){return(b.container===undefined||b.container===window?a(window).scrollLeft():a(b.container).offset().left)>=a(c).offset().left+b.threshold+a(c).width()};a.extend(a.expr[":"],{"below-the-fold":"$.belowthefold(a, {threshold : 0, container: window})","above-the-fold":"!$.belowthefold(a, {threshold : 0, container: window})",
"right-of-fold":"$.rightoffold(a, {threshold : 0, container: window})","left-of-fold":"!$.rightoffold(a, {threshold : 0, container: window})"})})(jQuery);
(function(a){var c=a.event,b;c.special.smartresize={setup:function(){a(this).bind("resize",c.special.smartresize.handler)},teardown:function(){a(this).unbind("resize",c.special.smartresize.handler)},handler:function(d,e){var f=this,g=arguments;d.type="smartresize";b&&clearTimeout(b);b=setTimeout(function(){jQuery.event.handle.apply(f,g)},e==="execAsap"?0:100)}};a.fn.smartresize=function(d){return d?this.bind("smartresize",d):this.trigger("smartresize",["execAsap"])};a.fn.masonry=function(d,e){function f(h,
l,k,n,o,q){var r=0;for(i=0;i<l;i++)if(k[i]<k[r])r=i;l={left:o.colW*r+o.posLeft,top:k[r]};o.masoned&&q.animate?h.animate(l,q.duration,q.easing):h.css(l);for(i=0;i<n;i++)o.colY[r+i]=k[r]+h.outerHeight(true)}function g(h,l,k){k.colW=l.columnWidth==undefined?k.masoned?h.data("masonry").colW:k.$bricks.outerWidth(true):l.columnWidth;k.colCount=Math.floor(h.width()/k.colW);k.colCount=Math.max(k.colCount,1)}function m(h,l,k){k.masoned||h.css("position","relative");if(!k.masoned||l.appendedContent!=undefined)k.$bricks.css("position",
"absolute");var n=a("<div />");h.prepend(n);k.posTop=Math.round(n.position().top);k.posLeft=Math.round(n.position().left);n.remove();if(k.masoned&&l.appendedContent!=undefined){k.colY=h.data("masonry").colY;i=h.data("masonry").colCount}else{k.colY=[];i=0}for(;i<k.colCount;i++)k.colY[i]=k.posTop;l.singleMode?k.$bricks.each(function(){var o=a(this);f(o,k.colCount,k.colY,1,k,l)}):k.$bricks.each(function(){var o=a(this),q=Math.ceil(o.outerWidth(true)/k.colW);q=Math.min(q,k.colCount);if(q==1)f(o,k.colCount,
k.colY,1,k,l);else{var r=k.colCount+1-q,p=[0];for(i=0;i<r;i++)for(j=p[i]=0;j<q;j++)p[i]=Math.max(p[i],k.colY[i+j]);f(o,r,p,q,k,l)}});for(i=k.wallH=0;i<k.colCount;i++)k.wallH=Math.max(k.wallH,k.colY[i]);n={height:k.wallH-k.posTop};k.masoned&&l.animate?h.animate(n,l.duration,l.easing):h.css(n);e.call(k.$bricks);h.data("masonry",k)}return this.each(function(){var h=a(this),l=a.extend({},a.masonry);l.masoned=h.data("masonry")!=undefined;var k=l.masoned?h.data("masonry").options:{},n=a.extend({},l.defaults,
k,d);l.options=n.saveOptions?n:k;e=e||function(){};n.$brickParent=l.masoned&&n.appendedContent!=undefined?n.appendedContent:h;l.$bricks=n.itemSelector==undefined?n.$brickParent.children():n.$brickParent.find(n.itemSelector);if(l.$bricks.length){g(h,n,l);m(h,n,l);k=k.resizeable;!k&&n.resizeable&&a(window).bind("smartresize.masonry",function(){l.masoned=h.data("masonry")!=undefined;var o=h.data("masonry").colCount;g(h,n,l);l.colCount!=o&&m(h,n,l)});k&&!n.resizeable&&a(window).unbind("smartresize.masonry")}else return this})};
a.masonry={defaults:{singleMode:false,columnWidth:undefined,itemSelector:undefined,appendedContent:undefined,saveOptions:true,resizeable:true,animate:false,duration:"normal",easing:"swing"},colW:undefined,colCount:undefined,colY:undefined,wallH:undefined,masoned:undefined,posTop:0,posLeft:0,options:undefined,$bricks:undefined,$brickParent:undefined}})(jQuery);
$(document).ready(function(){var a={};$("img").lazyload({effect:"fadeIn",threshold:200});$("#gallery").is(":visible")&&$(this).masonry({animate:true});$(".view-mode-option").click(function(){var b=$($(this).attr("href"));if(b.is(":hidden")){$(".view-mode").fadeOut("fast");b.fadeIn("fast")}$(".view-mode-option").removeClass("selected");$(this).addClass("selected");return false});var c=$(".summary-expanded").hide();$(".summary > h2 > .more").click(function(){c.toggle("fast");$(this).text($(this).text()==
"details"?"hide":"details")});$(".collection-img > a").hover(function(){$(this).find("img").animate({left:"0"},{duration:1E3}).animate({left:"-604px"},{duration:4500,easing:"linear"})},function(){$(this).find("img").stop(true,false);$(this).find("img").animate({left:"0px"},{duration:500,easing:"swing"})});$(".collection-show-topics").click(function(){var b=$(this),d=$(this).attr("title"),e=$(this).closest(".collection"),f=e.find(".collection-topics"),g=$(this).attr("data-fb-query");if(f.is(":hidden")){$(this).addClass("expanded");
a.show_topic_panel(b,e,f,d,g)}else{$(this).removeClass("expanded");a.hide_topic_panel(e)}});$("table#collection-table").tablesorter();$("table#collection-table tbody tr:odd").addClass("odd");$(".collection").hover(function(){$(this).addClass("collection-active")},function(){$(this).removeClass("collection-active");$(this).find(".collection-show-topics").removeClass("expanded");a.hide_topic_panel($(this))});a.show_topic_panel=function(b,d,e,f,g){d.find(".collection-info").animate({top:"50px"},300);
e.slideDown(300).fadeIn(200);if(g=="false"){e.addClass("loading");$.ajax({url:"/collection-topics?id="+f,success:function(m){e.removeClass("loading").prepend(m);$more=e.find(".collection-view-all").show();b.attr("data-fb-query","true")}})}};a.hide_topic_panel=function(b){var d=$(b).find(".collection-info");b=$(b).find(".collection-topics");if(b.is(":visible")){d.animate({top:"162px"},300);b.slideUp(300).fadeOut(200)}}});
