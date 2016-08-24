describe("Garnish.Menu tests", function() {

	var $menu = $('<div class="menu tagmenu"/>').appendTo(Garnish.$bod),
		$ul = $('<ul/>').appendTo($menu);

	var menu = new Garnish.Menu($menu);

	it("Should instantiate the Menu.", function() {
		expect(menu.menuId).toEqual('menu' + menu._namespace);
	});

	it("Should show the Menu.", function() {
		menu.show();

		expect(menu.$container.css('opacity')).toEqual('1');
		expect(menu.$container.css('display')).toEqual('block');
	});

});