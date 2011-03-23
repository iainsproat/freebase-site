
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
 *
 * Additional Licenses for Third Party components can be found here:
 * http://wiki.freebase.com/wiki/Freebase_Site_License
 *
 */
(function(c){c.factory=function(i,d){if(c.fn[i])throw"$.fn."+i+" plugin already exists";else if(c[i])throw"$."+i+" class already exists";c.fn[i]=function(e){return this.each(function(){var g=c(this),j=g.data("$."+i);j&&j._destroy();j=new c[i](g,e);g.data("$."+i,j)})};c[i]=function(e,g){this.options=c.extend(true,{},c[i].defaults,g);this.element=e;this.init()};c.extend(c[i].prototype,{init:function(){},_destroy:function(){}},d);return c[i]}})(jQuery);
(function(c){function i(d){(d||c(".submenu:visible")).fadeOut(function(){c(this).prev(".headmenu").removeClass("expanded")})}c.factory("nicemenu",{init:function(){var d=this.element.height();c(".headmenu .default-action",this.element).click(function(e){console.log("default-action");e.stopPropagation();i();c(this).parents(".headmenu").next(".submenu").find("a:first").click()});c(".headmenu",this.element).click(function(e){e.stopPropagation();var g=c(this);e=g.next(".submenu").css("top",d);if(e.is(":visible"))i(e);
else{i();e.fadeIn(function(){g.addClass("expanded")})}});c(".submenu",this.element).click(function(e){e.stopPropagation();i(c(this));c(this).fadeOut(function(){c(this).prev(".headmenu").removeClass("expanded")})})}});c(document).click(function(){i()})})(jQuery);
(function(c){var i=function(){return typeof window.innerWidth!="undefined"?function(){return{w:window.innerWidth,h:window.innerHeight}}:typeof document.documentElement!="undefined"&&typeof document.documentElement.clientWidth!="undefined"&&document.documentElement.clientWidth!=0?function(){return{w:document.documentElement.clientWidth,h:document.documentElement.clientHeight}}:function(){return{w:document.getElementsByTagName("body")[0].clientWidth,h:document.getElementsByTagName("body")[0].clientHeight}}}();
window.kbs=function(d){c(".kbs.current",d).removeClass("current");var e=c(".domain-section:first",d),g=c(".domain-section:last",d),j=this.scroll_to=function(a){var b=c(document).scrollTop();c(document).height();var f=i().h;f=b+f;var h=a.offset().top;a=h+a.height();if(h<b)c(document).scrollTop(h);else a>f&&c(document).scrollTop(b+(a-f))},k=this.get_current=function(){return c(".kbs.current:first",d)},l=this.set_next=function(a,b,f){if(b.length){a.removeClass("current");b.addClass("current");f||j(b)}},
q=this.next_domain=function(a){var b=k(),f=p(b);if(f){f=f.find(".kbs:first");l(b,f,a)}},p=this._next_domain=function(a){if(!(a&&a.length))return c(".domain-section:first",d);a=a.closest(".domain-section");return!a.length||a[0]===g[0]?e:a.next(".domain-section")},u=this.prev_domain=function(){var a=k(),b=r(a);if(b){b=b.find(".kbs:first");l(a,b)}},r=this._prev_domain=function(a){if(!(a&&a.length))return c(".domain-section:last",d);var b=a.closest(".domain-section");if(a.closest(".property-section").length||
a.closest(".type-section").length)return b;return!b.length||b[0]===e[0]?g:b.prev(".domain-section")},v=this.next_type=function(){var a=k(),b=s(a);if(b){b=b.find(".kbs:first");l(a,b)}},s=this._next_type=function(a){if(!(a&&a.length))return c(".type-section:first",d);var b=a.closest(".domain-section");a=a.closest(".type-section");a=a.length?a.next(".type-section"):b.find(".type-section:first");if(!(a&&a.length)){var f=p(b);if(f)for(;f.get(0)!==b.get(0);){a=f.find(".type-section:first");if(a.length)break;
f=p(f)}}return a},m=this.prev_type=function(){var a=k(),b=o(a);if(b){b=b.find(".kbs:first");l(a,b)}},o=this._prev_type=function(a){if(!(a&&a.length))return c(".type-section:last",d);var b=a.closest(".domain-section"),f=a.closest(".type-section");if(a.closest(".property-section").length)return f;var h;if(f.length)h=f.prev(".type-section");if(!(h&&h.length))if(a=r(b))for(;a.get(0)!==b.get(0);){h=a.find(".type-section:last");if(h.length)break;a=r(a)}return h},x=this.next_prop=function(){var a=k(),b=
w(a);if(b){b=b.find(".kbs:first");l(a,b)}},w=this._next_prop=function(a){if(!(a&&a.length))return c(".property-section:first",d);var b=a.closest(".domain-section"),f=a.closest(".type-section"),h=a.closest(".property-section");b=h.length?h.next(".property-section"):f.length?f.find(".property-section:first"):b.find(".property-section:first");if(!(b&&b.length))if(a=s(a))for(;a.get(0)!==f.get(0);){b=a.find(".property-section:first");if(b.length)break;if(f.get(0)==null)f=a;a=s(a)}return b},z=this.prev_prop=
function(){var a=k(),b=y(a);if(b){b=b.find(".kbs:first");l(a,b)}},y=this._prev_prop=function(a){if(!(a&&a.length))return c(".property-section:last",d);var b=a.closest(".domain-section"),f=a.closest(".type-section"),h=a.closest(".property-section");if(a.closest(".data-section").length)return h;var n;if(h.length)n=h.prev(".property-section");if(!(n&&n.length))if(m=f.length?o(f):o(b))for(;m.get(0)!==f.get(0);){n=m.find(".property-section:last");if(n.length)break;if(f.get(0)==null)f=m;m=o(m)}return n};
this.next=function(){var a=k(),b=this._next(a);b&&l(a,b)};this._next=function(a){if(!(a&&a.length))return c(".domain-section:first .kbs:first",d);var b=a.closest(".domain-section"),f=a.closest(".type-section"),h=a.closest(".property-section");if(a.closest(".data-section").length){a=a.next(".kbs");if(a.length)return a;a=h.next(".property-section").find(".kbs:first");if(a.length)return a;a=f.next(".type-section").find(".kbs:first")}else if(h.length){a=h.find(".data-section:first .kbs:first");if(a.length)return a;
a=h.next(".property-section").find(".kbs:first");if(a.length)return a;a=f.next(".type-section").find(".kbs:first")}else if(f.length){a=f.find(".property-section:first .kbs:first");if(a.length)return a;a=f.next(".type-section").find(".kbs:first")}else a=b.find(".type-section:first .kbs:first");if(a.length)return a;return b.get(0)===g.get(0)?e.find(".kbs:first"):b.next(".domain-section").find(".kbs:first")};this.prev=function(){var a=k(),b=this._prev(a);b&&l(a,b)};this._prev=function(a){if(!(a&&a.length)){a=
c(".data-section:last .kbs:last",d);a.length||(a=c(".property-section:last .kbs:first",d));a.length||(a=c(".type-section:last .kbs:first",d));a.length||(a=c(".domain-section:last .kbs:first",d));return a}var b=a.closest(".domain-section"),f=a.closest(".type-section"),h=a.closest(".property-section");if(a.closest(".data-section").length){a=a.prev(".kbs");if(a.length)return a;return h.find(".kbs:first")}else if(h.length){a=h.prev(".property-section").find(".kbs:last");if(a.length)return a;return f.find(".kbs:first")}else if(f.length){a=
f.prev(".type-section").find(".kbs:last");if(a.length)return a;return b.find(".kbs:first")}else return b.get(0)===e.get(0)?g.find(".kbs:last"):b.prev(".domain-section").find(".kbs:last")};this.edit=function(){this.get_current().trigger("edit")};var t=this;c(document).unbind(".kbs").bind("keydown.kbs",function(a){var b=a.target;if(b==document.body||b==document||b==window||b==c("html")[0]){b=a.keyCode;if(b===68)a.shiftKey?u():q();else if(b===84)a.shiftKey?m():v();else if(b===80)a.shiftKey?z():x();else if(b===
74)t.next();else if(b===75)t.prev();else b===69&&t.edit()}})}})(jQuery);
(function(c,i){var d=window.propbox={init:function(e,g){g=c.extend({lang:"/lang/en"},g);if(!g.base_url)throw new Error("base_url required in propbox options");if(!g.id)throw new Error("topic id required in propbox options");if(!g.lang)throw new Error("lang required in propbox options");d.options=g;d.kbs=new i(e);d.kbs.next();c(".kbs",e).live("click",function(){var j=d.kbs.get_current();d.kbs.set_next(j,c(this),true)}).live("edit",function(){c(this).find(".submenu:first a").click()}).hover(d.row_menu_hoverover,
d.row_menu_hoverout);c(".nicemenu",e).nicemenu()},row_menu_hoverover:function(){var e=c(this);d.row_menu_hoverover.timeout=setTimeout(function(){e.addClass("row-hover")},300)},row_menu_hoverout:function(){clearTimeout(d.row_menu_hoverover.timeout);c(this).removeClass("row-hover")},get_script:function(e,g){var j=d.get_script.cache;if(!j)j=d.get_script.cache={};var k=j[e];if(k)if(k.state===1)k.callbacks.push(g);else k.state===4&&g();else{k=j[e]={state:0,callbacks:[g]};c.ajax({url:d.options.base_url+
e,dataType:"script",beforeSend:function(){k.state=1},success:function(){k.state=4;c.each(k.callbacks,function(l,q){q()})},error:function(){k.state=-1}})}},_dojo_loaded:false,_dojo_version:"1.6.0",get_dojo:function(e,g){if(d._dojo_loaded===e){console.log("propbox._dojo_loaded",d._dojo_loaded);setTimeout(g,0)}else{var j=e.split("/").pop().toLowerCase(),k=window.djConfig={afterOnLoad:true,locale:j};if(j!=="en")k.extraLocale=["en"];c.ajax({url:"https://ajax.googleapis.com/ajax/libs/dojo/"+d._dojo_version+
"/dojo/dojo.xd.js",dataType:"script",success:function(){d._dojo_loaded=e;g()}})}},prop_edit:function(e){c(e).parents(".property-section").find(".data-section .data-row:first .nicemenu:first .headmenu:first a").click();return false},prop_add:function(e){var g=c(e).parents(".property-section");if(g.is(".editing"))return false;g.addClass("editing");d.get_dojo(d.options.lang,function(){d.get_script("/propbox-edit.mf.js",function(){d.edit.prop_add_begin(g)})});return false},value_edit:function(e){var g=
c(e).parents(".data-row:first"),j=g.parents(".property-section");if(j.is(".editing"))return false;j.addClass("editing");d.get_dojo(d.options.lang,function(){d.get_script("/propbox-edit.mf.js",function(){d.edit.value_edit_begin(j,g)})});return false},value_delete:function(e){e=c(e).parents(".combo-menu:first").prev(".property-value");var g=e.parents(".data-row:first");g.is("tr")?console.log("value_edit CVT",g.attr("data-id")):console.log("value_edit",e.attr("data-id")||e.attr("data-value"));if(g.parents(".property-section").is(".editing"))return false;
return false}}})(jQuery,window.kbs);
