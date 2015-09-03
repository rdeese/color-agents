function Environment (bounds) {
	this.Container_constructor();
	this.color = chroma.hcl(random.number()*360,55,70);
	this.colorHasChanged = false;
	
	this.bg = new createjs.Shape();
	this.targetHalo = new createjs.Shape();
	this.targetHalo.alpha = 0;
	this.addChild(this.bg);
	this.addChild(this.targetHalo);

	var width = 40;
	this.targetHaloRadius = AGENT_RADIUS + width;
	this.targetToHaloDiff = this.targetHaloRadius - AGENT_RADIUS;

	this.drawBg();
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
	var g = this.bg.graphics;
	g.clear();
	g.beginFill(this.color.hex()).drawRoundRect(0,0,bounds.width, bounds.height,20);
	
	//this.uncache();
	//this.cache(0,0,bounds.width,bounds.height);
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

