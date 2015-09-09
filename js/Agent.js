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
	this.heading = 180/Math.PI*Math.atan2(this.vel[1], this.vel[0]);

	// set createjs position & rotation vars based on internals
	this.rotation = this.heading;
	this.x = this.pos[0];
	this.y = this.pos[1];
	
	// copy the genome, don't just get a reference to the array
	// which will be deleted by the parent
	this.genome = [[0], [0]];
	this.genome[0][0] = genome[0][0];
	this.genome[1][0] = genome[1][0];

	this.birthTime = GLOBAL.TIME;
	this.isAdult = false;
	this.collisionCount = 0;
	this.height = this.width = this.radius * 2;
	this.cached = false;
	this.wasColliding = false;
	this.isColliding = false;
	this.wasPregnant = false;
	this.isPregnant = false;
	this.isDying = false;
	this.collisionStart = null;
	
	this.expressPhenotype();
	this.grow(this.birthTime);

	this.drawAgent();

	// create temp vectors we'll need later
	this.posDiff = vec2.create();
	this.velDiff = vec2.create();
	this.subResult = vec2.create();

	// add listener to process click events
	this.on('mousedown', function (e) {
		if (mode == 'predator' && !createjs.Ticker.paused) {
			health += Math.min(GLOBAL.KILL_HEALTH_GAIN, 100-health);
			info.drawDetailViewer();
			this.isEaten = true;
		} else if (mode == 'observer') {
			info.setTarget(this);
		}
	});
}

var agentPrototype = createjs.extend(Agent, createjs.Shape);

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
	//this.color = chroma.hcl(this.genome[0][0] + this.genome[1][0], GLOBAL_CHROMA, GLOBAL_LIGHTNESS);
	this.color = chroma.hcl(this.genome[0][0], GLOBAL.CHROMA, GLOBAL.LIGHTNESS);
}

// Two functions to move X & Y to play nice with the QUADTREE library
agentPrototype.shiftXYToCorner = function () {
	this.x = this.pos[0] - this.radius*this.scaleX;
	this.y = this.pos[1] - this.radius*this.scaleY;
}

agentPrototype.shiftXYToCenter = function () {
	this.x = this.pos[0];
	this.y = this.pos[1];
}


agentPrototype.wander = function (e) {
	vec2.scale(this.acc, this.acc, Math.pow(GLOBAL.ACC_DAMPING, GLOBAL.DELTA));
	// randomly change the acceleration
	if (random.number() < GLOBAL.MOVEMENT_PROB*GLOBAL.DELTA) {
		vec2.add(this.acc, this.acc, vec2.fromValues(GLOBAL.MAX_ACC*(random.number()-0.5),
																 								 GLOBAL.MAX_ACC*(random.number()-0.5)));
	}
}

agentPrototype.collide = function (other) {
	var radii = this.radius*this.scaleX + other.radius*other.scaleX;
	var totalMass = this.mass + other.mass;
	var collisionDepth = radii - vec2.distance(this.pos, other.pos);
	if (collisionDepth > 0) {
		//vec2.set(this.acc, 0, 0);
		//vec2.set(other.acc, 0, 0);

		vec2.subtract(this.velDiff, this.vel, other.vel);
		vec2.subtract(this.posDiff, this.pos, other.pos);

		// adjust position
		vec2.normalize(this.subResult, this.posDiff);
		vec2.scale(this.subResult, this.subResult, collisionDepth);
		vec2.add(this.pos, this.pos, this.subResult);

		// update this agent's velocity
		var dotProd = vec2.dot(this.velDiff, this.posDiff);
		var sqrDist = vec2.sqrDist(this.pos, other.pos);
		if (sqrDist == 0) { sqrDist += 1; }
		dotProd /= sqrDist;
		dotProd *= (2*other.mass/totalMass);
		vec2.scale(this.subResult, this.posDiff, dotProd);
		vec2.subtract(this.vel, this.vel, this.subResult);

		vec2.negate(this.velDiff, this.velDiff);
		vec2.negate(this.posDiff, this.posDiff);

		// update other agent's velocity
		var dotProd = vec2.dot(this.velDiff, this.posDiff);
		sqrDist = vec2.sqrDist(this.pos, other.pos);
		if (sqrDist == 0) { sqrDist += 1; }
		dotProd /= sqrDist;
		dotProd *= (2*this.mass/totalMass);
		vec2.scale(this.subResult, this.posDiff, dotProd);
		vec2.subtract(other.vel, other.vel, this.subResult);

		this.isColliding = true;
		other.isColliding = true;

		// determine if this is a normal collision or if mating will occur
		var r = random.number();
		if (this.isAdult && !this.isPregnant &&
				other.isAdult && !other.isPregnant &&
				r < GLOBAL.MATING_PROB) {
			var matingTime = GLOBAL.TIME;
			if (r < GLOBAL.MATING_PROB / 2) {
				this.motherChild(matingTime, other.genome);
			} else {
				other.motherChild(matingTime, this.genome);
			}
		} else if (!this.wasColliding || !other.wasColliding) {
			this.collisionCount += 1;
			other.collisionCount += 1;
		}
	}
}

agentPrototype.motherChild = function (matingTime, otherGenome) {
	this.isPregnant = true;
	this.matingTime = matingTime;
	var diff = this.genome[0][0]-otherGenome[0][0];
	if (diff > 180) { diff -= 360; }
	if (diff < -180) { diff += 360; }
	this.childGenome = [[0],[0]];
	this.childGenome[0][0] = (otherGenome[0][0] + diff/2)%360;
	this.childGenome[0][0] += (random.number()-0.5)*GLOBAL.MUTATION_RATE;
}

agentPrototype.selectCacheIfExists = function () {
	if (this.isPregnant &&
			mode != 'predator' && this.peCacheCanvas) {
		this.cacheCanvas = this.peCacheCanvas;
		return true;
	}
	if (!this.isPregnant &&
			mode != 'predator' && this.neCacheCanvas) {
		this.cacheCanvas = this.neCacheCanvas;
		return true;
	}
	if (this.isPregnant &&
			mode == 'predator' && this.pnCacheCanvas) {
		this.cacheCanvas = this.pnCacheCanvas;
		return true;
	}
	if (!this.isPregnant &&
			mode == 'predator' && this.nnCacheCanvas) {
		this.cacheCanvas = this.nnCacheCanvas;
		return true;
	}
	return false;
}
	
// draw the graphical representation of the agent
agentPrototype.drawAgent = function () {
	if (this.selectCacheIfExists()) {
		return;
	}
	var g = this.graphics;
	g.clear();
	var strokeWidth = 1;
	g.setStrokeStyle(strokeWidth);

	g.beginFill(this.color.hex());

	// draw body
	g.drawCircle(0, 0, this.radius);
	
	// draw eyes
	var eyeContrast;
	if (mode == 'predator') {
		eyeContrast = 0.03; //0.2;
	} else {
		eyeContrast = 0.4;
	}
	// whites
	g.beginFill(this.color.brighten(eyeContrast).hex());
	g.beginStroke(this.color.darken(eyeContrast).hex());
	g.drawCircle(this.radius*0.4, -this.radius*0.4, this.radius*0.3);
	g.endStroke();
	g.beginStroke(this.color.darken(eyeContrast).hex());
	g.drawCircle(this.radius*0.4, this.radius*0.4, this.radius*0.3);
	g.endStroke();
	// pupils
	g.beginFill(this.color.darken(eyeContrast).hex());
	g.drawCircle(this.radius*0.4, -this.radius*0.4, this.radius*0.12);
	g.drawCircle(this.radius*0.4, this.radius*0.4, this.radius*0.12);
	g.endFill();

	//draw baby
	if (this.isPregnant) {
		g.setStrokeStyle(3);
		g.beginStroke(this.color.brighten(eyeContrast).hex());
		g.drawCircle(0,0,this.radius);
	}
	
	this.uncache();
	this.cache(-this.radius-1, -this.radius-1, 2*this.radius+2, 2*this.radius+2);

	if (this.isPregnant && mode != 'predator') {
		this.peCacheCanvas = this.cacheCanvas;
	} else if (this.isPregnant && mode != 'predator') {
		this.neCacheCanvas = this.cacheCanvas;
	} else if (!this.isPregnant && mode == 'predator') {
		this.pnCacheCanvas = this.cacheCanvas;
	} else if (!this.isPregnant && mode == 'predator') {
		this.nnCacheCanvas = this.cacheCanvas;
	}
}

agentPrototype.grow = function () {
	if (this.isAdult) {
		this.scaleX = this.scaleY = 1;
		this.height = this.width = 2*this.radius;
	} else {
		var newScale = GLOBAL.BABY_SCALE + (GLOBAL.TIME-this.birthTime)*GLOBAL.YOUTH_SCALE_STEP;
		this.scaleX = this.scaleY = newScale;
		this.height = this.width = 2*this.radius*newScale;
	}
	this.mass = Math.PI*this.height*this.height/4; // comes out to pi*r^2
}

agentPrototype.isDead = function () {
	// check if I got eaten
	if (this.isEaten) {
		this.isDying = true;
		this.uncache();
		this.graphics.clear();
		return true;
	}
	// calculate probability of death
	if (!this.deathTime) {
		var score = (GLOBAL.TIME-this.birthTime)/1000 +
								GLOBAL.COLLISION_PENALTY*this.collisionCount;
		if (score > GLOBAL.DEATH_THRESHHOLD) {
			this.isDying = true;
			this.deathTime = GLOBAL.TIME;
		}
		return false;
	} else {
		this.alpha = 1-(GLOBAL.TIME-this.deathTime)/GLOBAL.DEATH_DURATION;
		if (this.alpha <= 0) {
			this.uncache();
			this.graphics.clear();
			return true;
		} else {
			return false;
		}
	}
}


// update the kinematics of the agent
agentPrototype.update = function (e) {
	var result = [];

	if (!this.isAdult) {
		if (GLOBAL.TIME-this.birthTime > GLOBAL.YOUTH_DURATION) {
			this.isAdult = true;
		}
		this.grow();
	}

	// exercise free will (acceleration)
	this.wander(e);

	// birth if necessary
	if (this.isPregnant &&
			GLOBAL.TIME-this.matingTime > GLOBAL.GESTATION_PD) {
		// put the baby behind the mama, touching. 
		var newPos = vec2.clone(this.pos);
		vec2.normalize(this.subResult, this.vel);
		vec2.scale(this.subResult, this.subResult, -(this.radius*this.scaleX+GLOBAL.BABY_AGENT_RADIUS));
		vec2.add(newPos, this.pos, this.subResult);
		// with the same speed
		var newVel = vec2.clone(this.vel);

		result.push(new Agent(this.bounds, this.radius, newPos, newVel, this.childGenome));
		this.isPregnant = false;
		this.childGenome = null;
		this.matingTime = null;
		this.cpCacheCanvas = null;
		this.npCacheCanvas = null;
	}

	// Iterate internal kinematics
	vec2.scale(this.vel, this.vel, Math.pow(GLOBAL.VEL_DAMPING, GLOBAL.DELTA));
	vec2.scale(this.subResult, this.acc, GLOBAL.DELTA);
	vec2.add(this.vel, this.vel, this.subResult);
	vec2.scale(this.subResult, this.vel, GLOBAL.DELTA);
	vec2.add(this.pos, this.pos, this.subResult);
	
	// update the heading properly
	// bounded by -180 to 180 
	var velDir = 180/Math.PI*Math.atan2(this.vel[1], this.vel[0]);
	velDir = velDir - this.heading;
	if (velDir < -180) { velDir += 360; }
	else if (velDir > 180) { velDir -= 360; }
	this.heading = this.heading + velDir/100*GLOBAL.WORLD_SPEED;
	
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

	// only write to the position vars used by createjs
	// if we are on a draw update
	if (e.WILL_DRAW) {
		this.x = this.pos[0];
		this.y = this.pos[1];
		this.rotation = this.heading;
	}

	// redraw if we are on a draw update and other conditions
	// require it
	if (e.WILL_DRAW && 
			((this.wasPregnant != this.isPregnant) ||
			allAgentsDirty)) {
		this.drawAgent();
	}

	this.wasPregnant = this.isPregnant;
	this.wasColliding = this.isColliding;
	this.isColliding = false;

	if (!this.isDead()) {
		result.push(this);
	}

	return result;
}

window.Agent = createjs.promote(Agent, "Shape");
