// constructor
function Plant(bounds, radius, position, velocity, hue) {
	// call inherited shape constructor
	this.Shape_constructor();

	this.snapToPixel = true;
	this.bounds = bounds;
	this.radius = radius;
	this.vel = vec2.clone(velocity);
	this.pos = vec2.clone(position);
	this.acc = vec2.fromValues(0,0);
	this.x = this.pos[0];
	this.y = this.pos[1];
	
	this.height = this.width = this.radius * 2;
	this.cached = false;
	
	this.color = chroma.hcl(hue, GLOBAL.CHROMA, GLOBAL.LIGHTNESS);

	this.drawPlant();
	
	// create temp vector we'll need later
	this.subResult = vec2.create();
	this.on("click", function () {
		createjs.Tween.get(this, { override: true })
									.to({ alpha: 0 }, 500)
									.to({ alpha: 1 }, 500);
	}, this);
}

var plantPrototype = createjs.extend(Plant, createjs.Shape);

plantPrototype.wander = function (e) {
	vec2.scale(this.acc, this.acc, Math.pow(GLOBAL.ACC_DAMPING, GLOBAL.DELTA));
	// randomly change the acceleration
	if (random.number() < GLOBAL.MOVEMENT_PROB*GLOBAL.DELTA) {
		vec2.add(this.acc, this.acc, vec2.fromValues(GLOBAL.MAX_ACC*(random.number()-0.5),
																 								 GLOBAL.MAX_ACC*(random.number()-0.5)));
	}
}

// draw the graphical representation of the plant
plantPrototype.drawPlant = function () {
	var g = this.graphics;
	g.clear();
	g.beginFill(this.color.hex());

	// draw body
	g.drawCircle(0, 0, this.radius);
	
	this.uncache();
	this.cache(-this.radius-1, -this.radius-1, 2*this.radius+2, 2*this.radius+2);
}

// update the kinematics of the plant
plantPrototype.update = function (e) {
	var result = [];

	// exercise free will (acceleration)
	this.wander(e);

	// Iterate internal kinematics
	vec2.scale(this.vel, this.vel, Math.pow(GLOBAL.VEL_DAMPING, GLOBAL.DELTA));
	vec2.scale(this.subResult, this.acc, GLOBAL.DELTA);
	vec2.add(this.vel, this.vel, this.subResult);
	vec2.scale(this.subResult, this.vel, GLOBAL.DELTA);
	vec2.add(this.pos, this.pos, this.subResult);
	
	// elastically collide with walls
	if (this.pos[0] + this.scaleX*this.radius > this.bounds.width) {
		this.pos[0] = this.pos[0] = this.bounds.width - this.scaleX*this.radius - 1;
		this.vel[0] *= -1;
	} else if (this.pos[0] - this.scaleX*this.radius < this.bounds.x) {
		this.pos[0] = this.pos[0] = this.bounds.x + this.scaleX*this.radius + 1;
		this.vel[0] *= -1;
	} else if (this.pos[1] + this.scaleX*this.radius > this.bounds.height) {
		this.pos[1] = this.pos[1] = this.bounds.height - this.scaleX*this.radius - 1;
		this.vel[1] *= -1;
	} else if (this.pos[1] - this.scaleX*this.radius < this.bounds.y) {
		this.pos[1] = this.pos[1] = this.bounds.y + this.scaleX*this.radius + 1;
		this.vel[1] *= -1;
	}
	
	if (e.WILL_DRAW) {
		this.x = this.pos[0];
		this.y = this.pos[1];
	}

	return result;
}

window.Plant = createjs.promote(Plant, "Shape");
