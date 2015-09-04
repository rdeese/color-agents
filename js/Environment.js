function Environment (bounds,envHue) {
	this.Container_constructor();
	this.hue = envHue;
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
	g.beginFill(this.color.hex()).drawRoundRect(0,0,bounds.width, bounds.height,20);
	
	var radius;
	var p;
	var r;
	for (var i = 0; i < NUM_BG_CIRCLES; i++) {
		r = random.number();
		radius = AGENT_RADIUS-(AGENT_RADIUS*r*r);
		p = new Plant(bounds, radius,
									vec2.fromValues(random.number() * (bounds.width-2*radius) + radius,
																	random.number() * (bounds.height-2*radius) + radius),
									vec2.create(),
									envHue);
		this.bg.addChild(p);
	}
	
	/*
	// body like things
	for (var i = 0; i < NUM_BG_CIRCLES; i++) {
		c = new createjs.Shape();
		if (random.number() < 0.5) { // make a body-like thing
			if (random.number() < 0.2) {
				r = random.number()*(AGENT_RADIUS-BABY_AGENT_RADIUS)+BABY_AGENT_RADIUS;
			} else {
				r = AGENT_RADIUS;
			}
			c.x = random.number() * (bounds.width-2*r) + r;
			c.y = random.number() * (bounds.height-2*r) + r;
			col = chroma.hcl(this.hue+30*(random.number()-0.5),
											 GLOBAL_CHROMA,GLOBAL_LIGHTNESS);
			c.graphics.beginFill(col.hex());
			c.graphics.drawCircle(0,0,r);
			this.bg.addChild(c);
		} else { // make an eye-like thing
			r = AGENT_RADIUS;
			g = c.graphics;
			c.x = random.number() * (bounds.width-2*r) + r;
			c.y = random.number() * (bounds.height-2*r) + r;
			col = chroma.hcl(this.hue+30*(random.number()-0.5),
											 GLOBAL_CHROMA,GLOBAL_LIGHTNESS);
			// draw eyes
			// whites
			g.beginFill(col.brighten(0.2).hex());
			g.beginStroke(col.darken(0.2).hex());
			g.drawCircle(r*0.4, -r*0.4, r*0.3);
			g.endStroke();
			g.endFill();
			// pupils
			g.beginFill(col.darken(0.2).hex());
			g.drawCircle(r*0.4, -r*0.4, r*0.12);
			g.endFill();
			this.bg.addChild(c);
    }
	}
	*/

	//this.bg.uncache();
	//this.bg.cache(0,0,bounds.width,bounds.height);
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
	if (info.target) {
		this.targetHalo.alpha = 0.5;
		this.targetHalo.x = info.target.x;
		this.targetHalo.y = info.target.y;
	} else { 
		this.targetHalo.alpha = 0;
	}
}

window.Environment = createjs.promote(Environment, "Container");

