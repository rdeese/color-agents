function Environment (bounds) {
	this.Shape_constructor();
	this.color = chroma.hcl(60,20,100);
	this.colorHasChanged = true;

	this.on('mousedown', function (e) {
		info.setTarget(null);
	});
}

var envPrototype = createjs.extend(Environment, createjs.Shape);

envPrototype.drawEnv = function () {
	var g = this.graphics;
	g.clear();
	g.beginFill(this.color.hex()).drawRoundRect(0,0,bounds.width, bounds.height,20);
	this.uncache();
	this.cache(0,0,bounds.width,bounds.height);
	this.colorHasChanged = false;
}

envPrototype.update = function () {
	if (this.colorHasChanged) {
		this.drawEnv();
	}
}

window.Environment = createjs.promote(Environment, "Shape");

