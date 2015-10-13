function Environment (GLOBAL,bounds,envGenome) {
	this.Container_constructor();
	this.GLOBAL = GLOBAL;
	this.bounds = bounds;
	this.envGenome = envGenome;
	this.color = chroma.hcl(this.envGenome[0],this.GLOBAL.CHROMA,this.GLOBAL.LIGHTNESS);
	this.colorHasChanged = false;

	this.plants = [];
	
	this.bg = new createjs.Container();
	this.addChild(this.bg);
	this.drawBg();

	this.targetHalo = new createjs.Shape();
	this.targetHalo.alpha = 0;
	var width = 40;
	this.targetHaloRadius = this.GLOBAL.AGENT_RADIUS + width;
	this.targetToHaloDiff = this.targetHaloRadius - this.GLOBAL.AGENT_RADIUS;
	this.addChild(this.targetHalo);
	this.drawTargetHalo();

	this.on('mousedown', function (e) {
		var evt = new createjs.Event("worldClick", true);
		evt.mouseEvent = e;
		evt.onAgent = false;
		evt.agent = this;
		this.dispatchEvent(evt);
	});

	this.on('tick', function (e) {
		//if (!e.paused) {
			this.update(e);
		//}
	});
}

var envPrototype = createjs.extend(Environment, createjs.Container);

envPrototype.drawBg = function () {
		var colorFill = new createjs.Shape();
		this.bg.addChild(colorFill);
		var g = colorFill.graphics;
		g.clear();
	if (this.GLOBAL.DRAW_ENV_BACKGROUND) {
		g.beginFill(this.color.hex()).drawRoundRect(0,0,this.bounds.width, this.bounds.height,20);
	} else {
		g.beginFill("#FFFFFF").drawRoundRect(0,0,this.bounds.width, this.bounds.height,20);
	}
	
	// body like things
	var c;
	var r;
	var radius;
	for (var i = 0; i < this.GLOBAL.NUM_PLANTS; i++) {
		r = random.number();
		radius = this.envGenome[1]+(random.number()-0.5)*this.GLOBAL.ENV_VARIATIONS[1];
		c = new createjs.Shape();
		c.x = random.number() * (this.bounds.width-2*radius) + radius;
		c.y = random.number() * (this.bounds.height-2*radius) + radius;
		col = chroma.hcl(this.envGenome[0]+this.GLOBAL.ENV_VARIATIONS[0]*(random.number()-0.5),
										 this.GLOBAL.CHROMA,this.GLOBAL.LIGHTNESS);
		c.graphics.beginFill(col.hex());
		c.graphics.drawCircle(0,0,radius);
		this.bg.addChild(c);
	}

	this.bg.uncache();
	this.bg.cache(0,0,this.bounds.width,this.bounds.height);
	this.colorHasChanged = false;
}

envPrototype.drawTargetHalo = function () {
	var g = this.targetHalo.graphics;
	g.clear();
	g.beginFill("#FFFFFF").drawCircle(0,
																		0,
																		this.targetHaloRadius);
}

envPrototype.update = function (e) {
	if (this.colorHasChanged) {
		this.drawBg();
	}
	/*
	if (info.target) {
		this.targetHalo.alpha = 0.5;
		this.targetHalo.x = info.target.x;
		this.targetHalo.y = info.target.y;
	} else { 
		this.targetHalo.alpha = 0;
	}
	*/
}

window.Environment = createjs.promote(Environment, "Container");

