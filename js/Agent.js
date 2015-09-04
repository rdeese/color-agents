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
		if (predatorMode) {
			this.isEaten = true;
		} else {
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
	this.color = chroma.hcl(2*this.genome[0][0], GLOBAL_CHROMA, GLOBAL_LIGHTNESS);
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


agentPrototype.wander = function () {
	vec2.scale(this.acc, this.acc, 0.9);
	// randomly change the acceleration
	if (random.number() < MOVEMENT_PROB) {
		vec2.add(this.acc, this.acc, vec2.fromValues(MAX_ACC*(random.number()-0.5),
																 								 MAX_ACC*(random.number()-0.5)));
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
				r < MATING_PROB) {
			var matingTime = createjs.Ticker.getTime(true);
			if (r < MATING_PROB / 2) {
				this.isPregnant = true;
				this.matingTime = matingTime;
				this.childGenome = [[(this.genome[0][0]+other.genome[0][0])/2], [0]];
				this.childGenome[0][0] += (random.number()-0.5)*MUTATION_RATE;
			} else {
				other.isPregnant = true;
				other.matingTime = matingTime;
				other.childGenome = [[(this.genome[0][0]+other.genome[0][0])/2], [0]];
				other.childGenome[0][0] += (random.number()-0.5)*50;
			}
		} else if (!this.wasColliding || !other.wasColliding) {
			this.collisionCount += 1;
			other.collisionCount += 1;
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
	var strokeWidth = 1;
	g.setStrokeStyle(strokeWidth);

	if (false) { //this.isColliding) {
		g.beginFill(this.color.brighten(0.1).hex());
	} else {
		g.beginFill(this.color.hex());
	}

	// draw body
	g.drawCircle(0, 0, this.radius);
	
	// draw eyes
	// whites
	g.beginFill(this.color.brighten(0.2).hex());
	g.beginStroke(this.color.darken(0.2).hex());
	g.drawCircle(this.radius*0.4, -this.radius*0.4, this.radius*0.3);
	g.endStroke();
	g.beginStroke(this.color.darken(0.2).hex());
	g.drawCircle(this.radius*0.4, this.radius*0.4, this.radius*0.3);
	g.endStroke();
	// pupils
	g.beginFill(this.color.darken(0.2).hex());
	g.drawCircle(this.radius*0.4, -this.radius*0.4, this.radius*0.12);
	g.drawCircle(this.radius*0.4, this.radius*0.4, this.radius*0.12);
	g.endFill();

	//draw baby
	if (this.isPregnant) {
		g.setStrokeStyle(3);
		g.beginStroke(this.color.brighten(0.1).hex());
		g.drawCircle(0,0,this.radius);
	}
	

	
	this.uncache();
	this.cache(-this.radius-1, -this.radius-1, 2*this.radius+2, 2*this.radius+2);

	if (this.isColliding && this.isPregnant) {
		this.cpCacheCanvas = this.cacheCanvas;
	} else if (!this.isColliding && this.isPregnant) {
		this.npCacheCanvas = this.cacheCanvas;
	} else if (this.isColliding && !this.isPregnant) {
		this.cnCacheCanvas = this.cacheCanvas;
	} else if (!this.isColliding && !this.isPregnant) {
		this.nnCacheCanvas = this.cacheCanvas;
	}
}

agentPrototype.grow = function (currentTime) {
	if (this.isAdult) {
		this.scaleX = this.scaleY = 1;
		this.height = this.width = 2*this.radius;
	} else {
		var newScale = BABY_SCALE + (currentTime-this.birthTime)*YOUTH_SCALE_STEP;
		this.scaleX = this.scaleY = newScale;
		this.height = this.width = 2*this.radius*newScale;
	}
	this.mass = Math.PI*this.height*this.height/4; // comes out to pi*r^2
}

agentPrototype.isDead = function (currentTime) {
	// check if I got eaten
	if (this.isEaten) {
		this.isDying = true;
		this.graphics.clear();
		return true;
	}
	// calculate probability of death
	if (!this.deathTime) {
		var score = (currentTime-this.birthTime)/1000 +
								1*this.collisionCount;
		if (score > DEATH_THRESHHOLD) {
			this.isDying = true;
			this.deathTime = currentTime;
		}
		return false;
	} else {
		this.alpha = 1-(currentTime-this.deathTime)/DEATH_DURATION;
		if (this.alpha <= 0) {
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
	var currentTime = createjs.Ticker.getTime(true);

	if (!this.isAdult) {
		if (currentTime-this.birthTime > YOUTH_DURATION) {
			this.isAdult = true;
		}
		this.grow(currentTime);
	}

	// exercise free will (acceleration)
	this.wander();

	// birth if necessary
	if (this.isPregnant &&
			currentTime-this.matingTime > GESTATION_PD) {
		// put the baby behind the mama, touching. 
		var newPos = vec2.clone(this.pos);
		vec2.normalize(this.subResult, this.vel);
		vec2.scale(this.subResult, this.subResult, -(this.radius*this.scaleX+BABY_AGENT_RADIUS));
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
	vec2.scale(this.vel, this.vel, 0.98);
	vec2.add(this.vel, this.vel, this.acc);
	vec2.scale(this.subResult, this.vel, e.delta/1000);
	vec2.add(this.pos, this.pos, this.subResult);
	this.x = this.pos[0];
	this.y = this.pos[1];
	this.rotation = 180/Math.PI*Math.atan2(this.vel[1], this.vel[0]);
	
	// elastically collide with walls
	if (this.x + this.scaleX*this.radius > this.bounds.width) {
		this.x = this.pos[0] = this.bounds.width - this.scaleX*this.radius - 1;
		this.vel[0] *= -1;
	} else if (this.x - this.scaleX*this.radius < this.bounds.x) {
		this.x = this.pos[0] = this.bounds.x + this.scaleX*this.radius + 1;
		this.vel[0] *= -1;
	} else if (this.y + this.scaleX*this.radius > this.bounds.height) {
		this.y = this.pos[1] = this.bounds.height - this.scaleX*this.radius - 1;
		this.vel[1] *= -1;
	} else if (this.y - this.scaleX*this.radius < this.bounds.y) {
		this.y = this.pos[1] = this.bounds.y + this.scaleX*this.radius + 1;
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

	if (!this.isDead(currentTime)) {
		result.push(this);
	}

	return result;
}

window.Agent = createjs.promote(Agent, "Shape");
