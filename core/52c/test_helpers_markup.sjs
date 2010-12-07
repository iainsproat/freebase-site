acre.require('/test/lib').enable(this);

var h = acre.require("helpers_markup");

test("tag", function() {
  equal(h.tag("div", "foo", "id", "mydiv"), '<div id="mydiv">foo</div>');
  equal(h.tag("a", "bar", "href", "http://freebase.com/view/en/foo", "class", "link foo-link"),
        '<a href="http://freebase.com/view/en/foo" class="link foo-link">bar</a>');
  equal(h.tag("a", h.tag("span", "hello"), "name", "world"),
        '<a name="world"><span>hello</span></a>');
});

acre.test.report();


