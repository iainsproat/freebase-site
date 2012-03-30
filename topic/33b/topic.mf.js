
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
 *
 * Additional Licenses for Third Party components can be found here:
 * http://wiki.freebase.com/wiki/Freebase_Site_License
 *
 */
/*
 
 jQuery Tools @VERSION / Expose - Dim the lights

 NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.

 http://flowplayer.org/tools/toolbox/expose.html

 Since: Mar 2010
 Date: @DATE 
 
 jQuery Tools @VERSION Overlay - Overlay base. Extend it.

 NO COPYRIGHTS OR LICENSES. DO WHAT YOU LIKE.

 http://flowplayer.org/tools/overlay/

 Since: March 2008
 Date: @DATE 
*/
(function(a){function g(){if(a.browser.msie){var j=a(document).height(),m=a(window).height();return[window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth,j-m<20?m:j]}return[a(document).width(),a(document).height()]}function d(j){if(j)return j.call(a.mask)}a.tools=a.tools||{version:"@VERSION"};var b;b=a.tools.expose={conf:{maskId:"exposeMask",loadSpeed:"slow",closeSpeed:"fast",closeOnClick:true,closeOnEsc:true,zIndex:9998,opacity:0.8,startOpacity:0,color:"#fff",onLoad:null,
onClose:null}};var c,f,h,k,n;a.mask={load:function(j,m){if(h)return this;if(typeof j=="string")j={color:j};j=j||k;k=j=a.extend(a.extend({},b.conf),j);c=a("#"+j.maskId);if(!c.length){c=a("<div/>").attr("id",j.maskId);a("body").append(c)}var r=g();c.css({position:"absolute",top:0,left:0,width:r[0],height:r[1],display:"none",opacity:j.startOpacity,zIndex:j.zIndex});j.color&&c.css("backgroundColor",j.color);if(d(j.onBeforeLoad)===false)return this;j.closeOnEsc&&a(document).bind("keydown.mask",function(o){o.keyCode==
27&&a.mask.close(o)});j.closeOnClick&&c.bind("click.mask",function(o){a.mask.close(o)});a(window).bind("resize.mask",function(){a.mask.fit()});if(m&&m.length){n=m.eq(0).css("zIndex");a.each(m,function(){var o=a(this);/relative|absolute|fixed/i.test(o.css("position"))||o.css("position","relative")});f=m.css({zIndex:Math.max(j.zIndex+1,n=="auto"?0:n)})}c.css({display:"block"}).fadeTo(j.loadSpeed,j.opacity,function(){a.mask.fit();d(j.onLoad)});h=true;return this},close:function(){if(h){if(d(k.onBeforeClose)===
false)return this;c.fadeOut(k.closeSpeed,function(){d(k.onClose);f&&f.css({zIndex:n})});a(document).unbind("keydown.mask");c.unbind("click.mask");a(window).unbind("resize.mask");h=false}return this},fit:function(){if(h){var j=g();c.css({width:j[0],height:j[1]})}},getMask:function(){return c},isLoaded:function(){return h},getConf:function(){return k},getExposed:function(){return f}};a.fn.mask=function(j){a.mask.load(j);return this};a.fn.expose=function(j){a.mask.load(j,this);return this}})(jQuery);
(function(a){function g(c,f){var h=this,k=c.add(h),n=a(window),j,m,r,o=a.tools.expose&&(f.mask||f.expose),v=Math.random().toString().slice(10);if(o){if(typeof o=="string")o={color:o};o.closeOnClick=o.closeOnEsc=false}var s=f.target||c.attr("rel");m=s?a(s):c;if(!m.length)throw"Could not find Overlay: "+s;c&&c.index(m)==-1&&c.click(function(p){h.load(p);return p.preventDefault()});a.extend(h,{load:function(p){if(h.isOpened())return h;var t=b[f.effect];if(!t)throw'Overlay: cannot find effect : "'+f.effect+
'"';f.oneInstance&&a.each(d,function(){this.close(p)});p=p||a.Event();p.type="onBeforeLoad";k.trigger(p);if(p.isDefaultPrevented())return h;r=true;o&&a(m).expose(o);var u=f.top,x=f.left,z=m.outerWidth({margin:true}),y=m.outerHeight({margin:true});if(typeof u=="string")u=u=="center"?Math.max((n.height()-y)/2,0):parseInt(u,10)/100*n.height();if(x=="center")x=Math.max((n.width()-z)/2,0);t[0].call(h,{top:u,left:x},function(){if(r){p.type="onLoad";k.trigger(p)}});o&&f.closeOnClick&&a.mask.getMask().one("click",
h.close);f.closeOnClick&&a(document).bind("click."+v,function(e){a(e.target).parents(m).length||h.close(e)});f.closeOnEsc&&a(document).bind("keydown."+v,function(e){e.keyCode==27&&h.close(e)});return h},close:function(p){if(!h.isOpened())return h;p=p||a.Event();p.type="onBeforeClose";k.trigger(p);if(!p.isDefaultPrevented()){r=false;b[f.effect][1].call(h,function(){p.type="onClose";k.trigger(p)});a(document).unbind("click."+v).unbind("keydown."+v);o&&a.mask.close();return h}},getOverlay:function(){return m},
getTrigger:function(){return c},getClosers:function(){return j},isOpened:function(){return r},getConf:function(){return f}});a.each("onBeforeLoad,onStart,onLoad,onBeforeClose,onClose".split(","),function(p,t){a.isFunction(f[t])&&a(h).bind(t,f[t]);h[t]=function(u){a(h).bind(t,u);return h}});j=m.find(f.close||".close");if(!j.length&&!f.close){j=a('<a class="close"></a>');m.prepend(j)}j.click(function(p){h.close(p)});f.load&&h.load()}a.tools=a.tools||{version:"@VERSION"};a.tools.overlay={addEffect:function(c,
f,h){b[c]=[f,h]},conf:{close:null,closeOnClick:true,closeOnEsc:true,closeSpeed:"fast",effect:"default",fixed:!a.browser.msie||a.browser.version>6,left:"center",load:false,mask:null,oneInstance:true,speed:"normal",target:null,top:"10%"}};var d=[],b={};a.tools.overlay.addEffect("default",function(c,f){var h=this.getConf(),k=a(window);if(!h.fixed){c.top+=k.scrollTop();c.left+=k.scrollLeft()}c.position=h.fixed?"fixed":"absolute";this.getOverlay().css(c).fadeIn(h.speed,f)},function(c){this.getOverlay().fadeOut(this.getConf().closeSpeed,
c)});a.fn.overlay=function(c){var f=this.data("overlay");if(f)return f;if(a.isFunction(c))c={onBeforeLoad:c};c=a.extend(true,{},a.tools.overlay.conf,c);this.each(function(){f=new g(a(this),c);d.push(f);a(this).data("overlay",f)});return c.api?f:this}})(jQuery);
(function(a){a.factory("collapse_module",{init:function(){var d=this;this.$column=a(this.options.column);this.modules=a(this.options.modules,this.element);this.first_module=this.modules.get(0);this.trigger=a(".trigger:first",this.first_module);this.first_section=a(".module-section",this.first_module);this.other_modules=this.modules.slice(1);this.column_offset=this.$column.css("margin-left");this.set_collapsed(this.options.collapsed);this.trigger.click(function(b){return d.toggle(b)})},set_collapsed:function(d){if(this.toggle_state=
d){this.trigger.addClass("collapsed");this.$column.css("margin-left",0);this.first_section.hide();this.other_modules.hide()}else{this.trigger.removeClass("collapsed");this.$column.css("margin-left",this.column_offset);this.first_section.show();this.other_modules.show()}},toggle:function(){var d=this;if(this.toggle_state){a.localstore("filters_collapsed",0,false);this.trigger.removeClass("collapsed");this.$column.animate({marginLeft:this.column_offset},function(){d.first_section.slideDown(function(){d.modules.removeClass("collapsed")});
d.other_modules.fadeIn()})}else{a.localstore("filters_collapsed",1,false);this.trigger.addClass("collapsed");this.other_modules.fadeOut();this.first_section.slideUp(function(){d.$column.animate({marginLeft:0});d.modules.addClass("collapsed")})}this.toggle_state=!this.toggle_state;this.options.toggle_callback&&this.options.toggle_callback.call(this.trigger,this.toggle_state);return false}});var g=a.localstore("filters_collapsed");a.extend(true,a.collapse_module,{defaults:{collapsed:g===null?true:!!g,
modules:".module",column:"#main-column"}})})(jQuery);
(function(a,g){function d(b){return!a(b).parents().andSelf().filter(function(){return a.curCSS(this,"visibility")==="hidden"||a.expr.filters.hidden(this)}).length}a.ui=a.ui||{};if(!a.ui.version){a.extend(a.ui,{version:"1.8.10",keyCode:{ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,
PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91}});a.fn.extend({_focus:a.fn.focus,focus:function(b,c){return typeof b==="number"?this.each(function(){var f=this;setTimeout(function(){a(f).focus();c&&c.call(f)},b)}):this._focus.apply(this,arguments)},scrollParent:function(){var b;b=a.browser.msie&&/(static|relative)/.test(this.css("position"))||/absolute/.test(this.css("position"))?this.parents().filter(function(){return/(relative|absolute|fixed)/.test(a.curCSS(this,
"position",1))&&/(auto|scroll)/.test(a.curCSS(this,"overflow",1)+a.curCSS(this,"overflow-y",1)+a.curCSS(this,"overflow-x",1))}).eq(0):this.parents().filter(function(){return/(auto|scroll)/.test(a.curCSS(this,"overflow",1)+a.curCSS(this,"overflow-y",1)+a.curCSS(this,"overflow-x",1))}).eq(0);return/fixed/.test(this.css("position"))||!b.length?a(document):b},zIndex:function(b){if(b!==g)return this.css("zIndex",b);if(this.length){b=a(this[0]);for(var c;b.length&&b[0]!==document;){c=b.css("position");
if(c==="absolute"||c==="relative"||c==="fixed"){c=parseInt(b.css("zIndex"),10);if(!isNaN(c)&&c!==0)return c}b=b.parent()}}return 0},disableSelection:function(){return this.bind((a.support.selectstart?"selectstart":"mousedown")+".ui-disableSelection",function(b){b.preventDefault()})},enableSelection:function(){return this.unbind(".ui-disableSelection")}});a.each(["Width","Height"],function(b,c){function f(j,m,r,o){a.each(h,function(){m-=parseFloat(a.curCSS(j,"padding"+this,true))||0;if(r)m-=parseFloat(a.curCSS(j,
"border"+this+"Width",true))||0;if(o)m-=parseFloat(a.curCSS(j,"margin"+this,true))||0});return m}var h=c==="Width"?["Left","Right"]:["Top","Bottom"],k=c.toLowerCase(),n={innerWidth:a.fn.innerWidth,innerHeight:a.fn.innerHeight,outerWidth:a.fn.outerWidth,outerHeight:a.fn.outerHeight};a.fn["inner"+c]=function(j){if(j===g)return n["inner"+c].call(this);return this.each(function(){a(this).css(k,f(this,j)+"px")})};a.fn["outer"+c]=function(j,m){if(typeof j!=="number")return n["outer"+c].call(this,j);return this.each(function(){a(this).css(k,
f(this,j,true,m)+"px")})}});a.extend(a.expr[":"],{data:function(b,c,f){return!!a.data(b,f[3])},focusable:function(b){var c=b.nodeName.toLowerCase(),f=a.attr(b,"tabindex");if("area"===c){c=b.parentNode;f=c.name;if(!b.href||!f||c.nodeName.toLowerCase()!=="map")return false;b=a("img[usemap=#"+f+"]")[0];return!!b&&d(b)}return(/input|select|textarea|button|object/.test(c)?!b.disabled:"a"==c?b.href||!isNaN(f):!isNaN(f))&&d(b)},tabbable:function(b){var c=a.attr(b,"tabindex");return(isNaN(c)||c>=0)&&a(b).is(":focusable")}});
a(function(){var b=document.body,c=b.appendChild(c=document.createElement("div"));a.extend(c.style,{minHeight:"100px",height:"auto",padding:0,borderWidth:0});a.support.minHeight=c.offsetHeight===100;a.support.selectstart="onselectstart"in c;b.removeChild(c).style.display="none"});a.extend(a.ui,{plugin:{add:function(b,c,f){b=a.ui[b].prototype;for(var h in f){b.plugins[h]=b.plugins[h]||[];b.plugins[h].push([c,f[h]])}},call:function(b,c,f){if((c=b.plugins[c])&&b.element[0].parentNode)for(var h=0;h<c.length;h++)b.options[c[h][0]]&&
c[h][1].apply(b.element,f)}},contains:function(b,c){return document.compareDocumentPosition?b.compareDocumentPosition(c)&16:b!==c&&b.contains(c)},hasScroll:function(b,c){if(a(b).css("overflow")==="hidden")return false;var f=c&&c==="left"?"scrollLeft":"scrollTop",h=false;if(b[f]>0)return true;b[f]=1;h=b[f]>0;b[f]=0;return h},isOverAxis:function(b,c,f){return b>c&&b<c+f},isOver:function(b,c,f,h,k,n){return a.ui.isOverAxis(b,f,k)&&a.ui.isOverAxis(c,h,n)}})}})(jQuery);
(function(a){a.widget("ui.slider",a.ui.mouse,{widgetEventPrefix:"slide",options:{animate:false,distance:0,max:100,min:0,orientation:"horizontal",range:false,step:1,value:0,values:null},_create:function(){var g=this,d=this.options;this._mouseSliding=this._keySliding=false;this._animateOff=true;this._handleIndex=null;this._detectOrientation();this._mouseInit();this.element.addClass("ui-slider ui-slider-"+this.orientation+" ui-widget ui-widget-content ui-corner-all");d.disabled&&this.element.addClass("ui-slider-disabled ui-disabled");
this.range=a([]);if(d.range){if(d.range===true){this.range=a("<div></div>");if(!d.values)d.values=[this._valueMin(),this._valueMin()];if(d.values.length&&d.values.length!==2)d.values=[d.values[0],d.values[0]]}else this.range=a("<div></div>");this.range.appendTo(this.element).addClass("ui-slider-range");if(d.range==="min"||d.range==="max")this.range.addClass("ui-slider-range-"+d.range);this.range.addClass("ui-widget-header")}a(".ui-slider-handle",this.element).length===0&&a("<a href='#'></a>").appendTo(this.element).addClass("ui-slider-handle");
if(d.values&&d.values.length)for(;a(".ui-slider-handle",this.element).length<d.values.length;)a("<a href='#'></a>").appendTo(this.element).addClass("ui-slider-handle");this.handles=a(".ui-slider-handle",this.element).addClass("ui-state-default ui-corner-all");this.handle=this.handles.eq(0);this.handles.add(this.range).filter("a").click(function(b){b.preventDefault()}).hover(function(){d.disabled||a(this).addClass("ui-state-hover")},function(){a(this).removeClass("ui-state-hover")}).focus(function(){if(d.disabled)a(this).blur();
else{a(".ui-slider .ui-state-focus").removeClass("ui-state-focus");a(this).addClass("ui-state-focus")}}).blur(function(){a(this).removeClass("ui-state-focus")});this.handles.each(function(b){a(this).data("index.ui-slider-handle",b)});this.handles.keydown(function(b){var c=true,f=a(this).data("index.ui-slider-handle"),h,k,n;if(!g.options.disabled){switch(b.keyCode){case a.ui.keyCode.HOME:case a.ui.keyCode.END:case a.ui.keyCode.PAGE_UP:case a.ui.keyCode.PAGE_DOWN:case a.ui.keyCode.UP:case a.ui.keyCode.RIGHT:case a.ui.keyCode.DOWN:case a.ui.keyCode.LEFT:c=
false;if(!g._keySliding){g._keySliding=true;a(this).addClass("ui-state-active");h=g._start(b,f);if(h===false)return}break}n=g.options.step;h=g.options.values&&g.options.values.length?(k=g.values(f)):(k=g.value());switch(b.keyCode){case a.ui.keyCode.HOME:k=g._valueMin();break;case a.ui.keyCode.END:k=g._valueMax();break;case a.ui.keyCode.PAGE_UP:k=g._trimAlignValue(h+(g._valueMax()-g._valueMin())/5);break;case a.ui.keyCode.PAGE_DOWN:k=g._trimAlignValue(h-(g._valueMax()-g._valueMin())/5);break;case a.ui.keyCode.UP:case a.ui.keyCode.RIGHT:if(h===
g._valueMax())return;k=g._trimAlignValue(h+n);break;case a.ui.keyCode.DOWN:case a.ui.keyCode.LEFT:if(h===g._valueMin())return;k=g._trimAlignValue(h-n);break}g._slide(b,f,k);return c}}).keyup(function(b){var c=a(this).data("index.ui-slider-handle");if(g._keySliding){g._keySliding=false;g._stop(b,c);g._change(b,c);a(this).removeClass("ui-state-active")}});this._refreshValue();this._animateOff=false},destroy:function(){this.handles.remove();this.range.remove();this.element.removeClass("ui-slider ui-slider-horizontal ui-slider-vertical ui-slider-disabled ui-widget ui-widget-content ui-corner-all").removeData("slider").unbind(".slider");
this._mouseDestroy();return this},_mouseCapture:function(g){var d=this.options,b,c,f,h,k;if(d.disabled)return false;this.elementSize={width:this.element.outerWidth(),height:this.element.outerHeight()};this.elementOffset=this.element.offset();b=this._normValueFromMouse({x:g.pageX,y:g.pageY});c=this._valueMax()-this._valueMin()+1;h=this;this.handles.each(function(n){var j=Math.abs(b-h.values(n));if(c>j){c=j;f=a(this);k=n}});if(d.range===true&&this.values(1)===d.min){k+=1;f=a(this.handles[k])}if(this._start(g,
k)===false)return false;this._mouseSliding=true;h._handleIndex=k;f.addClass("ui-state-active").focus();d=f.offset();this._clickOffset=!a(g.target).parents().andSelf().is(".ui-slider-handle")?{left:0,top:0}:{left:g.pageX-d.left-f.width()/2,top:g.pageY-d.top-f.height()/2-(parseInt(f.css("borderTopWidth"),10)||0)-(parseInt(f.css("borderBottomWidth"),10)||0)+(parseInt(f.css("marginTop"),10)||0)};this.handles.hasClass("ui-state-hover")||this._slide(g,k,b);return this._animateOff=true},_mouseStart:function(){return true},
_mouseDrag:function(g){var d=this._normValueFromMouse({x:g.pageX,y:g.pageY});this._slide(g,this._handleIndex,d);return false},_mouseStop:function(g){this.handles.removeClass("ui-state-active");this._mouseSliding=false;this._stop(g,this._handleIndex);this._change(g,this._handleIndex);this._clickOffset=this._handleIndex=null;return this._animateOff=false},_detectOrientation:function(){this.orientation=this.options.orientation==="vertical"?"vertical":"horizontal"},_normValueFromMouse:function(g){var d;
if(this.orientation==="horizontal"){d=this.elementSize.width;g=g.x-this.elementOffset.left-(this._clickOffset?this._clickOffset.left:0)}else{d=this.elementSize.height;g=g.y-this.elementOffset.top-(this._clickOffset?this._clickOffset.top:0)}d=g/d;if(d>1)d=1;if(d<0)d=0;if(this.orientation==="vertical")d=1-d;g=this._valueMax()-this._valueMin();return this._trimAlignValue(this._valueMin()+d*g)},_start:function(g,d){var b={handle:this.handles[d],value:this.value()};if(this.options.values&&this.options.values.length){b.value=
this.values(d);b.values=this.values()}return this._trigger("start",g,b)},_slide:function(g,d,b){var c;if(this.options.values&&this.options.values.length){c=this.values(d?0:1);if(this.options.values.length===2&&this.options.range===true&&(d===0&&b>c||d===1&&b<c))b=c;if(b!==this.values(d)){c=this.values();c[d]=b;g=this._trigger("slide",g,{handle:this.handles[d],value:b,values:c});this.values(d?0:1);g!==false&&this.values(d,b,true)}}else if(b!==this.value()){g=this._trigger("slide",g,{handle:this.handles[d],
value:b});g!==false&&this.value(b)}},_stop:function(g,d){var b={handle:this.handles[d],value:this.value()};if(this.options.values&&this.options.values.length){b.value=this.values(d);b.values=this.values()}this._trigger("stop",g,b)},_change:function(g,d){if(!this._keySliding&&!this._mouseSliding){var b={handle:this.handles[d],value:this.value()};if(this.options.values&&this.options.values.length){b.value=this.values(d);b.values=this.values()}this._trigger("change",g,b)}},value:function(g){if(arguments.length){this.options.value=
this._trimAlignValue(g);this._refreshValue();this._change(null,0)}return this._value()},values:function(g,d){var b,c,f;if(arguments.length>1){this.options.values[g]=this._trimAlignValue(d);this._refreshValue();this._change(null,g)}if(arguments.length)if(a.isArray(arguments[0])){b=this.options.values;c=arguments[0];for(f=0;f<b.length;f+=1){b[f]=this._trimAlignValue(c[f]);this._change(null,f)}this._refreshValue()}else return this.options.values&&this.options.values.length?this._values(g):this.value();
else return this._values()},_setOption:function(g,d){var b,c=0;if(a.isArray(this.options.values))c=this.options.values.length;a.Widget.prototype._setOption.apply(this,arguments);switch(g){case "disabled":if(d){this.handles.filter(".ui-state-focus").blur();this.handles.removeClass("ui-state-hover");this.handles.attr("disabled","disabled");this.element.addClass("ui-disabled")}else{this.handles.removeAttr("disabled");this.element.removeClass("ui-disabled")}break;case "orientation":this._detectOrientation();
this.element.removeClass("ui-slider-horizontal ui-slider-vertical").addClass("ui-slider-"+this.orientation);this._refreshValue();break;case "value":this._animateOff=true;this._refreshValue();this._change(null,0);this._animateOff=false;break;case "values":this._animateOff=true;this._refreshValue();for(b=0;b<c;b+=1)this._change(null,b);this._animateOff=false;break}},_value:function(){var g=this.options.value;return g=this._trimAlignValue(g)},_values:function(g){var d,b;if(arguments.length){d=this.options.values[g];
return d=this._trimAlignValue(d)}else{d=this.options.values.slice();for(b=0;b<d.length;b+=1)d[b]=this._trimAlignValue(d[b]);return d}},_trimAlignValue:function(g){if(g<=this._valueMin())return this._valueMin();if(g>=this._valueMax())return this._valueMax();var d=this.options.step>0?this.options.step:1,b=(g-this._valueMin())%d;alignValue=g-b;if(Math.abs(b)*2>=d)alignValue+=b>0?d:-d;return parseFloat(alignValue.toFixed(5))},_valueMin:function(){return this.options.min},_valueMax:function(){return this.options.max},
_refreshValue:function(){var g=this.options.range,d=this.options,b=this,c=!this._animateOff?d.animate:false,f,h={},k,n,j,m;if(this.options.values&&this.options.values.length)this.handles.each(function(r){f=(b.values(r)-b._valueMin())/(b._valueMax()-b._valueMin())*100;h[b.orientation==="horizontal"?"left":"bottom"]=f+"%";a(this).stop(1,1)[c?"animate":"css"](h,d.animate);if(b.options.range===true)if(b.orientation==="horizontal"){if(r===0)b.range.stop(1,1)[c?"animate":"css"]({left:f+"%"},d.animate);
if(r===1)b.range[c?"animate":"css"]({width:f-k+"%"},{queue:false,duration:d.animate})}else{if(r===0)b.range.stop(1,1)[c?"animate":"css"]({bottom:f+"%"},d.animate);if(r===1)b.range[c?"animate":"css"]({height:f-k+"%"},{queue:false,duration:d.animate})}k=f});else{n=this.value();j=this._valueMin();m=this._valueMax();f=m!==j?(n-j)/(m-j)*100:0;h[b.orientation==="horizontal"?"left":"bottom"]=f+"%";this.handle.stop(1,1)[c?"animate":"css"](h,d.animate);if(g==="min"&&this.orientation==="horizontal")this.range.stop(1,
1)[c?"animate":"css"]({width:f+"%"},d.animate);if(g==="max"&&this.orientation==="horizontal")this.range[c?"animate":"css"]({width:100-f+"%"},{queue:false,duration:d.animate});if(g==="min"&&this.orientation==="vertical")this.range.stop(1,1)[c?"animate":"css"]({height:f+"%"},d.animate);if(g==="max"&&this.orientation==="vertical")this.range[c?"animate":"css"]({height:100-f+"%"},{queue:false,duration:d.animate})}}});a.extend(a.ui.slider,{version:"1.8.10"})})(jQuery);
(function(a,g){g.filters={init_domain_type_property_filter:function(d){a(":text[name=domain], :text[name=type], :text[name=property]",d).suggest(g.suggest_options.any("type:/type/domain","type:/type/type","type:/type/property")).bind("fb-select",function(b,c){var f=a(this);f.val(c.id);var h=c["n:type"].id;if(h==="/type/domain")f.attr("name","domain");else if(h==="/type/type")f.attr("name","type");else h==="/type/property"&&f.attr("name","property");this.form.submit()})},init_limit_slider_filter:function(d,
b,c,f,h){var k=a(".limit-slider",d),n=a(".current-limit",d),j=a("input[name=limit]",d),m=parseInt(j.val()||b,10);k.slider({value:m,min:c||1,max:f||100,step:h||10,slide:function(r,o){n.css({color:"#f71"});n.text(o.value)},stop:function(r,o){n.css({color:"#333"});j.val(o.value);o.value!=m&&j[0].form.submit()}})}};a(function(){a(".filter-form-trigger").click(function(){var d=a(this).siblings(".filter-form");d.is(":hidden")?d.slideDown(function(){a(":text:first",d).focus()}):d.slideUp()})})})(jQuery,
window.freebase);
(function(a){var g=function(){return typeof window.innerWidth!="undefined"?function(){return{w:window.innerWidth,h:window.innerHeight}}:typeof document.documentElement!="undefined"&&typeof document.documentElement.clientWidth!="undefined"&&document.documentElement.clientWidth!=0?function(){return{w:document.documentElement.clientWidth,h:document.documentElement.clientHeight}}:function(){return{w:document.getElementsByTagName("body")[0].clientWidth,h:document.getElementsByTagName("body")[0].clientHeight}}}();window.kbs=
function(d){a(".kbs.current",d).removeClass("current");var b=a(".domain-section:first",d),c=a(".domain-section:last",d),f=this.scroll_to=function(e){var i=a(document).scrollTop();a(document).height();var l=g().h;l=i+l;var q=e.offset().top;e=q+e.height();if(q<i)a(document).scrollTop(q);else e>l&&a(document).scrollTop(i+(e-l))},h=this.get_current=function(){return a(".kbs.current:first",d)},k=this.set_next=function(e,i,l){e=e||h();if(i.length){e.removeClass("current");i.addClass("current");l||f(i)}},
n=this.next_domain=function(e){var i=h(),l=j(i);if(l){l=l.find(".kbs:first");k(i,l,e)}},j=this._next_domain=function(e){if(!(e&&e.length))return a(".domain-section:first",d);e=e.closest(".domain-section");return!e.length||e[0]===c[0]?b:e.next(".domain-section")},m=this.prev_domain=function(){var e=h(),i=r(e);if(i){i=i.find(".kbs:first");k(e,i)}},r=this._prev_domain=function(e){if(!(e&&e.length))return a(".domain-section:last",d);var i=e.closest(".domain-section");if(e.closest(".property-section").length||
e.closest(".type-section").length)return i;return!i.length||i[0]===b[0]?c:i.prev(".domain-section")},o=this.next_type=function(){var e=h(),i=v(e);if(i){i=i.find(".kbs:first");k(e,i)}},v=this._next_type=function(e){if(!(e&&e.length))return a(".type-section:first",d);var i=e.closest(".domain-section");e=e.closest(".type-section");e=e.length?e.next(".type-section"):i.find(".type-section:first");if(!(e&&e.length)){var l=j(i);if(l)for(;l.get(0)!==i.get(0);){e=l.find(".type-section:first");if(e.length)break;
l=j(l)}}return e},s=this.prev_type=function(){var e=h(),i=p(e);if(i){i=i.find(".kbs:first");k(e,i)}},p=this._prev_type=function(e){if(!(e&&e.length))return a(".type-section:last",d);var i=e.closest(".domain-section"),l=e.closest(".type-section");if(e.closest(".property-section").length)return l;var q;if(l.length)q=l.prev(".type-section");if(!(q&&q.length))if(e=r(i))for(;e.get(0)!==i.get(0);){q=e.find(".type-section:last");if(q.length)break;e=r(e)}return q},t=this.next_prop=function(){var e=h(),i=
u(e);if(i){i=i.find(".kbs:first");k(e,i)}},u=this._next_prop=function(e){if(!(e&&e.length))return a(".property-section:first",d);var i=e.closest(".domain-section"),l=e.closest(".type-section"),q=e.closest(".property-section");i=q.length?q.next(".property-section"):l.length?l.find(".property-section:first"):i.find(".property-section:first");if(!(i&&i.length))if(e=v(e))for(;e.get(0)!==l.get(0);){i=e.find(".property-section:first");if(i.length)break;if(l.get(0)==null)l=e;e=v(e)}return i},x=this.prev_prop=
function(){var e=h(),i=z(e);if(i){i=i.find(".kbs:first");k(e,i)}},z=this._prev_prop=function(e){if(!(e&&e.length))return a(".property-section:last",d);var i=e.closest(".domain-section"),l=e.closest(".type-section"),q=e.closest(".property-section");if(e.closest(".data-section").length)return q;var w;if(q.length)w=q.prev(".property-section");if(!(w&&w.length))if(s=l.length?p(l):p(i))for(;s.get(0)!==l.get(0);){w=s.find(".property-section:last");if(w.length)break;if(l.get(0)==null)l=s;s=p(s)}return w};
this.next=function(){var e=h(),i=this._next(e);i&&k(e,i)};this._next=function(e){if(!(e&&e.length))return a(".domain-section:first .kbs:first",d);var i=e.closest(".domain-section"),l=e.closest(".type-section"),q=e.closest(".property-section");if(e.closest(".data-section").length){e=e.next(".kbs");if(e.length)return e;e=q.next(".property-section").find(".kbs:first");if(e.length)return e;e=l.next(".type-section").find(".kbs:first")}else if(q.length){e=q.find(".data-section:first .kbs:first");if(e.length)return e;
e=q.next(".property-section").find(".kbs:first");if(e.length)return e;e=l.next(".type-section").find(".kbs:first")}else if(l.length){e=l.find(".property-section:first .kbs:first");if(e.length)return e;e=l.next(".type-section").find(".kbs:first")}else e=i.find(".type-section:first .kbs:first");if(e.length)return e;return i.get(0)===c.get(0)?b.find(".kbs:first"):i.next(".domain-section").find(".kbs:first")};this.prev=function(){var e=h(),i=this._prev(e);i&&k(e,i)};this._prev=function(e){if(!(e&&e.length)){e=
a(".data-section:last .kbs:last",d);e.length||(e=a(".property-section:last .kbs:first",d));e.length||(e=a(".type-section:last .kbs:first",d));e.length||(e=a(".domain-section:last .kbs:first",d));return e}var i=e.closest(".domain-section"),l=e.closest(".type-section"),q=e.closest(".property-section");if(e.closest(".data-section").length){e=e.prev(".kbs");if(e.length)return e;return q.find(".kbs:first")}else if(q.length){e=q.prev(".property-section").find(".kbs:last");if(e.length)return e;return l.find(".kbs:first")}else if(l.length){e=
l.prev(".type-section").find(".kbs:last");if(e.length)return e;return i.find(".kbs:first")}else return i.get(0)===b.get(0)?c.find(".kbs:last"):i.prev(".domain-section").find(".kbs:last")};this.edit=function(){this.get_current().trigger("edit")};var y=this;a(document).unbind(".kbs").bind("keydown.kbs",function(e){var i=e.target;if(i==document.body||i==document||i==window||i==a("html")[0]){i=e.keyCode;if(i===68)e.shiftKey?m():n();else if(i===84)e.shiftKey?s():o();else if(i===80)e.shiftKey?x():t();else if(i===
74)y.next();else if(i===75)y.prev();else i===69&&y.edit()}})}})(jQuery);
(function(a,g){var d=window.propbox={init:function(b,c){c=a.extend({lang:"/lang/en"},c);if(!c.base_ajax_url)throw new Error("base_ajax_url required in propbox options");if(!c.base_static_url)throw new Error("base_static_url required in propbox options");if(!c.id)throw new Error("topic id required in propbox options");if(!c.lang)throw new Error("lang required in propbox options");d.options=c;d.kbs=new g(b);d.kbs.set_next(d.kbs.get_current(),a(".kbs:visible:first",b,true));a(".kbs",b).live("click",
function(){var f=d.kbs.get_current();d.kbs.set_next(f,a(this),true)}).live("edit",function(){var f=a(this).find(".headmenu:first").data("submenu");f&&a("li:first a:first",f).click()});d.init_menus(b)},init_menus:function(b,c){b=a(b||document);c&&a(".nicemenu",b).nicemenu();(b&&b.is(".data-row")?b:a(".data-row",b)).hover(d.row_menu_hoverover,d.row_menu_hoverout);a(".nicemenu .headmenu",b).add(a(".nicemenu .default-action",b)).click("click",function(){if(d.kbs){var f=d.kbs.get_current();f&&d.kbs.set_next(f,
a(this).parents(".kbs:first"),true)}return false})},row_menu_hoverover:function(){var b=a(this);d.row_menu_hoverover.timeout=setTimeout(function(){b.addClass("row-hover")},300)},row_menu_hoverout:function(){clearTimeout(d.row_menu_hoverover.timeout);a(this).removeClass("row-hover")},get_script:function(b,c){var f=d.get_script.cache;if(!f)f=d.get_script.cache={};var h=f[b];if(h)if(h.state===1)h.callbacks.push(c);else h.state===4&&c();else{h=f[b]={state:0,callbacks:[c]};a.ajax({url:d.options.base_static_url+
b,dataType:"script",beforeSend:function(){h.state=1},success:function(){h.state=4;a.each(h.callbacks,function(k,n){n()})},error:function(){h.state=-1}})}},prop_edit:function(b,c){var f=a(b).parents(".submenu").data("headmenu").parents(".property-section").find(".data-section .data-row:first:visible .nicemenu:first .headmenu:first a");f.length?f.click():d.prop_add(b,c);return false},prop_add:function(b,c){var f=a(b).parents(".submenu").data("headmenu").parents(".property-section");if(f.is(".editing"))return false;
f.addClass("editing");d.get_script("/propbox-edit.mf.js",function(){d.edit.prop_add_begin(f,c)});return false},value_edit:function(b){var c=a(b).parents(".submenu").data("headmenu").parents(".data-row:first"),f=c.parents(".property-section");if(f.is(".editing"))return false;f.addClass("editing");d.get_script("/propbox-edit.mf.js",function(){d.edit.value_edit_begin(f,c)});return false},value_delete:function(b){var c=a(b).parents(".submenu").data("headmenu").parents(".data-row:first"),f=c.parents(".property-section");
if(f.is(".editing"))return false;f.addClass("editing");d.get_script("/propbox-edit.mf.js",function(){d.edit.value_delete_begin(f,c)});return false},close_message:function(b){a(b).parents(".row-msg:first").remove();return false}}})(jQuery,window.kbs);
(function(a,g,d){var b=g.topic={init:function(){d.init("#topic-data",{id:g.c.id,base_ajax_url:g.h.ajax_url("lib/propbox"),base_static_url:g.h.static_url("lib/propbox"),lang:g.lang||"/lang/en",suggest_impl:g.suggest_options,incompatible_types:g.incompatible_types});a(".column.nav").collapse_module({modules:".module",column:".section"});g.filters.init_domain_type_property_filter(".column.nav");g.filters.init_limit_slider_filter("#limit-slider",10,1,100,1);a(".toolbar-trigger").click(function(){var c=
a(this),f=a(this).closest(".toolbar"),h=a(".manage-types").first().css("overflow","hidden"),k=h.outerHeight(),n=a(".topic-types",h).first(),j=a(".topic-type-list",h).first(),m=a("ul",j).children("li").length;if(h.is(":visible")){f.removeClass("active");c.removeClass("active");h.slideUp()}else{c.addClass("active");f.addClass("active");h.slideDown(function(){if(!c.data("initialized")){b.init_manage_types();c.data("initialized",1)}});Modernizr.csscolumns&&m>7&&j.addClass("multicolumn");f=j.position().top;
j.height(k-f+"px");n.animate({opacity:1})}return false});a(".keyboard-shortcuts > a").overlay({close:".modal-buttons .button.cancel",closeOnClick:false,fixed:false,mask:{color:"#000",loadSpeed:200,opacity:0.5}})},init_manage_types:function(){a("#add-type-input").suggest(g.suggest_options.cotype()).bind("fb-select",function(c,f){b.add_type(this,f.id)}).focus()},add_type:function(c,f){function h(){g.get_script(g.h.static_url("manage-type.mf.js"),function(){b.manage_type.add_type_begin(c,f)})}c=a(c);
if(c.is(".editing"))return false;c.addClass("editing");g.incompatible_types.check(g.c.id,f,h,g.incompatible_types.overlay_suggest_incompatible_callback(c,h));return false},remove_type:function(c,f){c=a(c);if(c.is(".editing"))return false;c.addClass("editing");g.get_script(g.h.static_url("manage-type.mf.js"),function(){b.manage_type.remove_type_begin(c,f)});return false}};a(b.init)})(jQuery,window.freebase,window.propbox);
