// constructor
function Agent(bounds, radius, position, velocity, genome) {
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
	
	// copy the genome, don't just get a reference to the array
	// which will be deleted by the parent
	this.genome = [[0], [0]];
	this.genome[0][0] = genome[0][0];
	this.genome[1][0] = genome[1][0];

	this.birthTime = createjs.Ticker.getTime(true);
	this.isAdult = false;
	this.expressPhenotype();
	this.height = this.width = this.radius * 2;
	this.cached = false;
	this.wasColliding = false;
	this.isColliding = false;
	this.collisionStart = null;
	this.drawAgent();

	// create temp vectors we'll need later
	this.posDiff = vec2.create();
	this.velDiff = vec2.create();
	this.subResult = vec2.create();

	// add listener to process click events
	this.on('mousedown', function (e) {
		info.setTarget(this);
	});
}

var agentPrototype = createjs.extend(Agent, createjs.Shape);

agentPrototype.maxAcc = 50;

// turns genotype into phenotype
agentPrototype.expressPhenotype = function () {
	// Assumes a diploid organism with one gene, and calculates the phenotypic
	// hue as the sum of the genes from each parent.
	// color spectrum tuned using the HCL gradient selector here:
	// https://vis4.net/blog/posts/avoid-equidistant-hsv-colors/
	// because there is NO INTUITIVE way to understand what the 'percentage'
	// HCL scale is for chroma and lightness. the goal of these settings
	// is to stay within a safe range, where the spectrum of hues is continuous
	// and has consistent lightness
	//this.color = chroma.hcl(this.genome[0][0] + this.genome[1][0], 55, 70);
	this.color = chroma.hcl(2*this.genome[0][0], 55, 70);
}

agentPrototype.wander = function () {
	vec2.scale(this.acc, this.acc, 0.8);
	// randomly change the acceleration
	if (random.number() < 0.05) {
		vec2.add(this.acc, this.acc, vec2.fromValues(this.maxAcc*(random.number()-0.5),
																 								 this.maxAcc*(random.number()-0.5)));
	}
}

agentPrototype.collide = function (other) {
	var radii = this.radius + other.radius;
	var collisionDepth = radii - vec2.distance(this.pos, other.pos);
	if (collisionDepth > 0) {
		vec2.subtract(this.velDiff, this.vel, other.vel);
		vec2.subtract(this.posDiff, this.pos, other.pos);

		// adjust position
		vec2.normalize(this.subResult, this.posDiff);
		vec2.scale(this.subResult, this.subResult, collisionDepth);
		vec2.add(this.pos, this.pos, this.subResult);

		// update this agent's velocity
		var dotProd = vec2.dot(this.velDiff, this.posDiff);
		dotProd /= vec2.sqrDist(this.pos, other.pos);
		vec2.scale(this.subResult, this.posDiff, dotProd);
		vec2.subtract(this.vel, this.vel, this.subResult);

		vec2.negate(this.velDiff, this.velDiff);
		vec2.negate(this.posDiff, this.posDiff);

		// update other agent's velocity
		var dotProd = vec2.dot(this.velDiff, this.posDiff);
		dotProd /= vec2.sqrDist(this.pos, other.pos);
		vec2.scale(this.subResult, this.posDiff, dotProd);
		vec2.subtract(other.vel, other.vel, this.subResult);

		this.isColliding = true;
		other.isColliding = true;

		// determine if this is a normal collision or if mating will occur
		var r = random.number();
		if (this.isAdult && !this.isPregnant && r < MATING_PROB) {
			var matingTime = createjs.Ticker.getTime(true);
			console.log("child happening");
			if (r < MATING_PROB / 2) {
				this.isPregnant = true;
				this.matingTime = matingTime;
				this.childGenome = [[(this.genome[0][0]+other.genome[0][0])/2], [0]];
			} else {
				other.isPregnant = true;
				other.matingTime = matingTime;
				other.childGenome = [[(this.genome[0][0]+other.genome[0][0])/2], [0]];
			}
		}
	}
}
	
// draw the graphical representation of the agent
agentPrototype.drawAgent = function () {
	if (this.isColliding && this.isPregnant && this.cpCacheCanvas) {
		this.cacheCanvas = this.cpCacheCanvas;
		return;
	}
	if (!this.isColliding && this.isPregnant && this.npCacheCanvas) {
		this.cacheCanvas = this.npCacheCanvas;
		return;
	}
	if (this.isColliding && !this.isPregnant && this.cnCacheCanvas) {
		this.cacheCanvas = this.cnCacheCanvas;
		return;
	}
	if (!this.isColliding && !this.isPregnant && this.nnCacheCanvas) {
		this.cacheCanvas = this.nnCacheCanvas;
		return;
	}

	var g = this.graphics;
	g.clear();
	g.setStrokeStyle(1); // first param is stroke width
	g.beginStroke(this.color.darken().hex());
	if (this.isColliding) {
		g.beginFill(this.color.brighten(0.1).hex());
	} else {
		g.beginFill(this.color.hex());
	}
	g.drawCircle(this.radius, this.radius, this.radius);
	g.endFill();
	g.endStroke();

	g.beginStroke(this.color.darken().hex());
	if (this.isPregnant) {
		g.drawCircle(this.radius, this.radius, this.radius/2);
	}
	
	this.uncache();
	this.cache(-1, -1, this.width+2, this.height+2);

	if (this.isColliding) {
		this.collidingCacheCanvas = this.cacheCanvas;
	} else {
		this.normalCacheCanvas = this.cacheCanvas;
	}
}

// update the kinematics of the agent
agentPrototype.update = function (e) {
	var result = [];

	if (!this.isAdult &&
			createjs.Ticker.getTime(true)-this.birthTime > YOUTH_DURATION) {
		this.isAdult = true;
	}

	// exercise free will (acceleration)
	this.wander();

	// birth if necessary
	if (this.isPregnant &&
			createjs.Ticker.getTime(true)-this.matingTime > GESTATION_PD) {
		console.log("birthing!");
		// put the baby behind the mama 
		var newPos = vec2.clone(this.pos);
		vec2.normalize(this.subResult, this.vel);
		vec2.scale(this.subResult, this.subResult, -(this.radius+BABY_AGENT_RADIUS));
		vec2.add(newPos, this.pos, this.subResult);
		// with the same speed
		var newVel = vec2.clone(this.vel);

		result.push(new Agent(this.bounds, this.radius, newPos, newVel, this.childGenome));
		console.log("new agent", result[0]);
		this.isPregnant = false;
		this.childGenome = null;
		this.matingTime = null;
		this.cpCacheCanvas = null;
		this.npCacheCanvas = null;
	}

	// Iterate internal kinematics
	vec2.scale(this.vel, this.vel, 0.99);
	vec2.add(this.vel, this.vel, this.acc);
	vec2.scale(this.subResult, this.vel, e.delta/1000);
	vec2.add(this.pos, this.pos, this.subResult);
	this.x = this.pos[0];
	this.y = this.pos[1];
	
	// elastically collide with walls
	if (this.x + this.width > this.bounds.width) {
		this.x = this.pos[0] = this.bounds.width - this.width - 1;
		this.vel[0] *= -1;
	} else if (this.x < this.bounds.x) {
		this.x = this.pos[0] = this.bounds.x + 1;
		this.vel[0] *= -1;
	} else if (this.y + this.height > this.bounds.height) {
		this.y = this.pos[1] = this.bounds.height - this.height - 1;
		this.vel[1] *= -1;
	} else if (this.y < this.bounds.y) {
		this.y = this.pos[1] = this.bounds.y + 1;
		this.vel[1] *= -1;
	}

	// handle redraws and collision logic
	if ((this.wasColliding != this.isColliding) ||
			(this.isPregnant != this.wasPregnant)) {
		this.drawAgent();
	}

	this.wasPregnant = this.isPregnant;
	this.wasColliding = this.isColliding;
	this.isColliding = false;

	// FIXME calculate probability of death
	if (true) {
		result.push(this);
	}

	return result;
}

window.Agent = createjs.promote(Agent, "Shape");
