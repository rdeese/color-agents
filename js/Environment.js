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

	this.agentContainer = new createjs.Container();
	this.addChild(this.agentContainer);

	this.predatorContainer = new createjs.Container();
	this.addChild(this.predatorContainer);

	this.nighttime = new createjs.Shape();
	this.nighttime.mouseEnabled = false;
	this.addChild(this.nighttime);
	this.drawNighttime();

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

envPrototype.drawNighttime = function () {
	var g = this.nighttime.graphics;
	g.beginFill(this.color.darken(2).hex())
	 .drawRoundRect(0,0,this.bounds.width, this.bounds.height,20);
	this.nighttime.alpha = 0;
}

envPrototype.startNighttime = function () {
	createjs.Tween.get(this.nighttime, { override: true })
								.to({ alpha: 0.3 }, 1000);
}

envPrototype.startDaytime = function () {
	createjs.Tween.get(this.nighttime, { override: true })
								.to({ alpha: 0 }, 1000);
}

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
	var numPlants = this.bounds.width*this.bounds.height/
									this.envGenome[1]/this.envGenome[1]/4/4;

	var c;
	var r;
	var radius;
	for (var i = 0; i < numPlants; i++) {
		r = random.number();
		radius = this.envGenome[1]+(random.number()-0.5)*this.GLOBAL.ENV_VARIATIONS[1];
		c = new createjs.Shape();
		c.x = random.number() * (this.bounds.width-2*radius) + radius;
		c.y = random.number() * (this.bounds.height-2*radius) + radius;
		col = chroma.hcl(this.envGenome[0]+this.GLOBAL.ENV_VARIATIONS[0]*(random.number()-0.5),
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

