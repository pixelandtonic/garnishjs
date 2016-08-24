describe("Garnish.Menu tests", function() {

	it("Should instantiate the Menu.", function() {

		var $menu = $('<div class="menu tagmenu"/>').appendTo(Garnish.$bod),
			$ul = $('<ul/>').appendTo($menu);

		var menu = new Garnish.Menu($menu);

		expect(menu.menuId).toEqual('menu' + menu._namespace);
	});

});