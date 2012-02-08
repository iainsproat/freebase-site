;(function($, fb) {

  var collection = fb.collection = {

    init_infinitescroll: function() {
      var table = $("#infinitescroll");
      var next = table.attr("data-next");
      if (!next || next === "false") {
        // nothing to scroll
        return;
      }
      var a_next = $("#infinitescroll-next");
      table.infinitescroll({
        nextSelector: "#infinitescroll-next",
        navSelector: "#infinitescroll-next",
        dataType: "json",
        pathParse: function() {
          return [
            a_next[0].href + "&" + $.param({cursor:table.attr("data-next")}) + "&page=",
            ""
          ];
        },
        appendCallback: false
      }, function(data) {
        data = JSON.parse(data);
        var next = data.result.cursor;
        var html = $(data.result.html);
        i18n.ize(html);
        table.append(html);
        if (next) {
          table.attr("data-next", next);
        }
        else {
          $(window).unbind('.infscr');
        }
      });
      setTimeout(function() {
        $(window).trigger("scroll");
      });
    },

    init_menus: function(context, nicemenu) {
      context = $(context || document);
      if (nicemenu) {
        $(".nicemenu", context).nicemenu();
      }
      var row;
      if (context && context.is(".data-row")) {
        row = context;
      }
      else {
        row = $(".data-row", context);
      }
      row.hover(collection.row_menu_hoverover, collection.row_menu_hoverout);
      $(".nicemenu .headmenu", context)
        .add($(".nicemenu .default-action", context));
    },

    init_table_mouseover: function(context) {
      $(".data-table a")
        .mouseover(function(e) {
          var id = $(this).attr("data-id");
          if (!id) return;

          var offset = $(this).offset();
          var pos = $(this).position();
          var top = offset.top + pos.top + $(this).height() + 10;
          var left = offset.left + pos.left;

          var div = $("<div id='data-table-popup'></div>")
            .css({top:top, left:left})
            .appendTo("body");

          $.get(fb.h.legacy_fb_url("/private/flyout" + id), function(r) {
            div.html(r.html);
          }, "jsonp");
        })
        .mouseout(function() {
          $("#data-table-popup").remove();
        });
    },

    // show row menu button on hover
    row_menu_hoverover: function(e) {
      var row = $(this);
      collection.row_menu_hoverover.timeout = setTimeout(function() {
        row.addClass("row-hover");
      }, 300);
    },

    // hide row menu button on mouseout
    row_menu_hoverout: function(e) {
      clearTimeout(collection.row_menu_hoverover.timeout);
      var row = $(this);
      row.removeClass("row-hover");
    },

    row_edit: function(context) {
      var prop_row = $(context).parents(".submenu").data("headmenu").parents(".data-row:first");
      if (prop_row.is(".editing")) {
        return false;
      }
      prop_row.addClass("editing");
      fb.get_script(fb.h.ajax_url("lib/collection/collection-edit.mf.js"), function() {
        collection.edit.row_edit_begin(prop_row);
      });
      return false;
    },

    init: function() {
      collection.init_infinitescroll();
      collection.init_menus();
      collection.init_table_mouseover();
      return collection;
    }

  };

  collection.init();

})(jQuery, window.freebase);
