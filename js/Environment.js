function Environment (bounds) {
	this.Container_constructor();
	this.hue = random.number()*360;
	this.color = chroma.hcl(this.hue,GLOBAL_CHROMA,GLOBAL_LIGHTNESS);
	this.colorHasChanged = false;
	
	this.bg = new createjs.Container();
	this.addChild(this.bg);
	this.drawBg();

	this.targetHalo = new createjs.Shape();
	this.targetHalo.alpha = 0;
	var width = 40;
	this.targetHaloRadius = AGENT_RADIUS + width;
	this.targetToHaloDiff = this.targetHaloRadius - AGENT_RADIUS;
	this.addChild(this.targetHalo);
	this.drawTargetHalo();

	this.on('mousedown', function (e) {
		info.setTarget(null);
	});

	this.on('tick', function (e) {
		//if (!e.paused) {
			this.update();
		//}
	});
}

var envPrototype = createjs.extend(Environment, createjs.Container);

envPrototype.drawBg = function () {
	var colorFill = new createjs.Shape();
	this.bg.addChild(colorFill);
	var g = colorFill.graphics;
	g.clear();
	g.beginFill(this.color.hex()).drawRoundRect(0,0,bounds.width, bounds.height,20);
	var c;
	var col;
	var r;
	for (var i = 0; i < NUM_BG_CIRCLES; i++) {
		c = new createjs.Shape();
		r = AGENT_RADIUS;
		c.x = random.number() * (bounds.width-2*r) + r;
		c.y = random.number() * (bounds.height-2*r) + r;
		col = chroma.hcl(this.hue+30*(random.number()-0.5),
										 GLOBAL_CHROMA,GLOBAL_LIGHTNESS);
		c.graphics.beginFill(col.hex());
		//c.graphics.beginStroke(col.brighten((random.number()-0.5)).hex());
		c.graphics.drawCircle(0,0,r);
		this.bg.addChild(c);
	}
	
	this.bg.uncache();
	this.bg.cache(0,0,bounds.width,bounds.height);
	this.colorHasChanged = false;
}

envPrototype.drawTargetHalo = function () {
	var g = this.targetHalo.graphics;
	g.clear();
	g.beginFill("#FFFFFF").drawCircle(0,
																		0,
																		this.targetHaloRadius);
}

envPrototype.update = function () {
	if (this.colorHasChanged) {
		this.drawBg();
	}
	if (info.target) {
		this.targetHalo.alpha = 0.5;
		this.targetHalo.x = info.target.x;
		this.targetHalo.y = info.target.y;
	} else { 
		this.targetHalo.alpha = 0;
	}
}

window.Environment = createjs.promote(Environment, "Container");

