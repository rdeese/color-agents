function Environment (GLOBAL,bounds,envGenome) {
	this.Container_constructor();
	this.GLOBAL = GLOBAL;
	this.bounds = bounds;
	this.envGenome = envGenome;
	this.color = chroma.hcl(this.envGenome[0],this.GLOBAL.CHROMA,this.GLOBAL.LIGHTNESS);
	this.colorHasChanged = false;

	this.sunAngle = 0;
	this.isDaytime = true;
	this.shadowColor = this.color.darken(4).rgb();

	this.plants = [];
	
	this.bg = new createjs.Container();
	this.addChild(this.bg);
	this.drawBg();

	this.agentContainer = new createjs.Container();
	this.agentContainer.shadow = new createjs.Shadow("rgba("+this.shadowColor.join(",")+
																									 ", 0.2)", 0, 0, 10);
	this.addChild(this.agentContainer);

	this.predatorContainer = new createjs.Container();
	this.addChild(this.predatorContainer);

	this.darkness = new createjs.Shape();
	this.darkness.mouseEnabled = false;
	this.addChild(this.darkness);
	this.drawNighttime();

	this.border = new createjs.Shape();
	this.border.y = -this.GLOBAL.WORLD_OFFSET_Y;
	this.addChild(this.border);
	this.drawBorder();

	this.on('mousedown', function (e) {
		var evt = new createjs.Event("worldClick", true);
		evt.mouseEvent = e;
		evt.onAgent = false;
		evt.agent = this;
		this.dispatchEvent(evt);
	});
}

var envPrototype = createjs.extend(Environment, createjs.Container);

envPrototype.drawBorder = function () {
	this.border.graphics.beginFill(this.GLOBAL.PAGE_COLOR)
											.drawRect(0, 0,
																this.bounds.width,
																this.bounds.height+this.GLOBAL.WORLD_OFFSET_Y)
											.endFill();
	this.borderFilterShape = new createjs.Shape();
	this.borderFilterShape.graphics.beginFill("#000000")
																 .drawRoundRect(0,this.GLOBAL.WORLD_OFFSET_Y,this.bounds.width, this.bounds.height,20);
	this.borderFilterShape.filters = [
		new createjs.ColorFilter(0,0,0,-1,0,0,0,255)
	];
	this.borderFilterShape.cache(0, 0,
															 this.bounds.width,
															 this.bounds.height+this.GLOBAL.WORLD_OFFSET_Y);
	this.border.filters = [
		new createjs.AlphaMaskFilter(this.borderFilterShape.cacheCanvas)
	];
	this.border.cache(0, 0,
									  this.bounds.width,
									  this.bounds.height+this.GLOBAL.WORLD_OFFSET_Y);
}

envPrototype.drawNighttime = function () {
	var g = this.darkness.graphics;
	g.beginFill("rgb("+this.shadowColor.join(",")+")")
	 .drawRoundRect(0,0,this.bounds.width, this.bounds.height,20);
	this.darkness.alpha = 0;
}

envPrototype.drawBg = function () {
		var colorFill = new createjs.Shape();
		this.bg.addChild(colorFill);
		var g = colorFill.graphics;
		g.clear();
	if (this.GLOBAL.DRAW_ENV_BACKGROUND) {
		g.beginFill(this.color.brighten(0.2).hex()).drawRoundRect(0,0,this.bounds.width, this.bounds.height,20);
	} else {
		g.beginFill("#FFFFFF").drawRoundRect(0,0,this.bounds.width, this.bounds.height,20);
	}
	
	// body like things
	var numPlants = this.bounds.width*this.bounds.height/
									this.envGenome[1]/this.envGenome[1]/4/4;

	var c;
	var r;
	var radius;
	var pos;
	var sample = poissonDiscSampler(this.bounds.width, this.bounds.height,
																	2*this.GLOBAL.MAX_AGENT_RADIUS,
																	this.GLOBAL.MAX_AGENT_RADIUS);
	for (var i = 0; i < Infinity; i++) {
		r = random.number();
		radius = this.envGenome[1]+(random.number()-0.5)*this.GLOBAL.ENV_VARIATIONS[1];
		pos = sample();
		if (!pos) { break; }
		c = new createjs.Shape();
		c.x = pos[0];
		c.y = pos[1];
		col = chroma.hcl(this.envGenome[0]+this.GLOBAL.ENV_VARIATIONS[0]*
										(random.integer(2)*2-1)*random.normal(),
										 this.GLOBAL.CHROMA,this.GLOBAL.LIGHTNESS);
		if (this.GLOBAL.COLOR_FILL) {
			c.graphics.beginFill(col.hex());
		} else {
			c.graphics.beginFill("#FFFFFF");
			c.graphics.beginStroke(col.hex());
		}
		c.graphics.drawCircle(0,0,radius);
		this.bg.addChild(c);
	}

	this.bg.uncache();
	this.bg.cache(0,0,this.bounds.width,this.bounds.height);
	this.colorHasChanged = false;
}

envPrototype.update = function (e) {
	// baseRate
	var baseRate = Math.PI/this.GLOBAL.OBSERVER_PERIOD; // radians/ms
	var maxCritters = 50;
	var minCritters = 60;
	var rateScale = 10;
	// update day vs night
	if (this.isDaytime && Math.sin(this.sunAngle) < 0) {
		this.isDaytime = false;
		this.agentContainer.shadow.color = "rgba("+this.shadowColor.join(",")+", 0)";
		var evt = new createjs.Event('nighttime', true);
		this.dispatchEvent(evt);
	}
	if (!this.isDaytime && Math.sin(this.sunAngle) >= 0) {
		this.isDaytime = true;
		this.sunAngle = this.sunAngle % (2*Math.PI);
		var evt = new createjs.Event('daytime', true);
		this.dispatchEvent(evt);
	}

	this.agentContainer.shadow.offsetX = -Math.cos(this.sunAngle)*15;
	this.agentContainer.shadow.offsetY = Math.sin(this.sunAngle)*2;

	var currentCritters = this.agentContainer.children.length;
	if (this.isDaytime) { 
		var rateDilation = (currentCritters-minCritters)/rateScale;
		if (rateDilation < 0) { rateDilation = 0; }
		rateDilation = Math.sin(this.sunAngle)*rateDilation+(1-Math.sin(this.sunAngle))*1;

		this.agentContainer.shadow.color = "rgba("+this.shadowColor.join(",")+","+
																			 0.2*Math.sin(this.sunAngle)+
																			 ")";
		this.darkness.alpha = 0.3*(1-Math.pow(Math.sin(this.sunAngle), 1/2));

		this.sunAngle += rateDilation*baseRate*this.GLOBAL.DELTA;
	} else {
		var rateDilation = (maxCritters-currentCritters)/rateScale;
		if (rateDilation < 0) { rateDilation = 0; }
		rateDilation = -Math.sin(this.sunAngle)*rateDilation+(1+Math.sin(this.sunAngle))*1;
		this.darkness.alpha = 0.3+0.5*Math.pow(-Math.sin(this.sunAngle), 1/2);

		this.sunAngle += 4*rateDilation*baseRate*this.GLOBAL.DELTA;
	}

	if (this.colorHasChanged) {
		this.drawBg();
	}
}

window.Environment = createjs.promote(Environment, "Container");

