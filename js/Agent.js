// constructor
function Agent(GLOBAL, bounds, radius, position, velocity, genome) {
	// call inherited shape constructor
	this.Container_constructor();

	this.GLOBAL = GLOBAL;

	this.snapToPixel = true;
	this.bounds = bounds;
	this.radius = radius-radius*(random.number()/5);
	this.eyeOffset = this.radius*0.4;
	this.vel = vec2.clone(velocity);
	this.pos = vec2.clone(position);
	this.acc = vec2.fromValues(0,0);
	if (this.vel[0] == 0 && this.vel[1] == 0) {
		this.heading = random.number()*360;
	} else {
		this.heading = 180/Math.PI*Math.atan2(this.vel[1], this.vel[0]);
	}

	// set createjs position & rotation vars based on internals
	this.rotation = this.heading;
	this.x = this.pos[0];
	this.y = this.pos[1];
	
	// copy the genome, don't just get a reference to the array
	// which will be deleted by the parent
	this.genome = [[0], [0]];
	this.genome[0][0] = genome[0][0];
	this.genome[1][0] = genome[1][0];

	this.birthTime = this.GLOBAL.TIME;
	this.isAdult = false;
	this.collisionCount = 0;
	this.height = this.width = this.radius * 2;
	this.cached = false;
	this.wasColliding = false;
	this.isColliding = false;
	this.wasPregnant = false;
	this.isPregnant = false;
	this.isDying = false;
	this.isEaten = false;
	this.isHiding = false;
	this.isTweening = false;
	this.collisionStart = null;
	
	this.expressPhenotype();
	this.grow(this.birthTime);

	this.body = new createjs.Shape();
	this.addChild(this.body);
	this.eyes = new createjs.Shape();
	this.eyes.x = this.eyeOffset;
	this.addChild(this.eyes);
	this.drawAgent();

	// create temp vectors we'll need later
	this.posDiff = vec2.create();
	this.velDiff = vec2.create();
	this.subResult = vec2.create();

	// add listener to process click events
	this.on('mousedown', function (e) {
		var evt = new createjs.Event("worldClick", true);
		evt.mouseEvent = e;
		evt.onAgent = true;
		evt.agent = this;
		this.dispatchEvent(evt);
	});
}

var agentPrototype = createjs.extend(Agent, createjs.Container);

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
	this.color = chroma.hcl(this.genome[0][0], this.GLOBAL.CHROMA, this.GLOBAL.LIGHTNESS);
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
	vec2.scale(this.acc, this.acc, Math.pow(this.GLOBAL.ACC_DAMPING, this.GLOBAL.DELTA));
	// randomly change the acceleration
	if (random.number() < this.GLOBAL.MOVEMENT_PROB*this.GLOBAL.DELTA) {
		vec2.add(this.acc, this.acc, vec2.fromValues(this.GLOBAL.MAX_ACC*(random.number()-0.5),
																 								 this.GLOBAL.MAX_ACC*(random.number()-0.5)));
	}
}

agentPrototype.blink = function (e) {
	if (this.isHiding || this.isTweening) { return; }
	if (random.number() < this.GLOBAL.BLINK_PROB*this.GLOBAL.DELTA) {
		this.isTweening = true;
		createjs.Tween.get(this.eyes)
									.to({ scaleX: 0 }, 100)
									.wait(100)
									.to({ scaleX: 1}, 100)
									.call(function () {
										this.isTweening = false; 
									}, [], this);
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
				r < this.GLOBAL.MATING_PROB) {
			var matingTime = this.GLOBAL.TIME;
			if (r < this.GLOBAL.MATING_PROB / 2) {
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
	var thisGene = this.genome[0][0];
	var otherGene = otherGenome[0][0];
	// infrequent, significant mutations
	if (random.number()<this.GLOBAL.MOTHER_MUTATION_PROB) {
		thisGene += (0.8+0.2*random.number())*
								this.GLOBAL.MUTATION_RATE*
								(Math.round(random.number())*2-1);
		thisGene %= 360;
	}
	if (random.number()<this.GLOBAL.FATHER_MUTATION_PROB) {
		otherGene += (0.8+0.2*random.number())*
								 this.GLOBAL.MUTATION_RATE*
								 (Math.round(random.number())*2-1);
		otherGene %= 360;
	}
	var diff = thisGene-otherGene;
	if (diff > 180) { diff -= 360; }
	if (diff < -180) { diff += 360; }
	this.childGenome = [[0],[0]];
	this.childGenome[0][0] = (otherGene + diff/2)%360;
	// small, frequent mutations (unrealistic)
	// this.childGenome[0][0] += (random.number()-0.5)*this.GLOBAL.MUTATION_RATE;
}

agentPrototype.selectCacheIfExists = function () {
	if (this.isEaten) {
		if (this.eatenCacheCanvas) {
			this.cacheCanvas = this.eatenCacheCanvas;
			return true;
		} else {
			return false;
		}
	}
	if (this.isPregnant &&
			this.GLOBAL.MODE != 'predator' && this.peCacheCanvas) {
		this.cacheCanvas = this.peCacheCanvas;
		return true;
	}
	if (!this.isPregnant &&
			this.GLOBAL.MODE != 'predator' && this.neCacheCanvas) {
		this.cacheCanvas = this.neCacheCanvas;
		return true;
	}
	if (this.isPregnant &&
			this.GLOBAL.MODE == 'predator' && this.pnCacheCanvas) {
		this.cacheCanvas = this.pnCacheCanvas;
		return true;
	}
	if (!this.isPregnant &&
			this.GLOBAL.MODE == 'predator' && this.nnCacheCanvas) {
		this.cacheCanvas = this.nnCacheCanvas;
		return true;
	}
	return false;
}

agentPrototype.updateHiding = function () {
	if (this.GLOBAL.MODE == 'predator' && !this.isHiding) {
		this.isHiding = true;
		this.isTweening = true;
		createjs.Tween.get(this.eyes, { override: true })
									.to({ scaleX: 1 }, 100)
									.wait(random.number()*500)
									.to({ scaleX: 0 }, 100)
									.call(function () {
										this.isTweening = false; 
									}, [], this);
	} else if (this.GLOBAL.MODE != 'predator' && this.isHiding) {
		this.isHiding = false;
		this.isTweening = true;
		createjs.Tween.get(this.eyes, { override: true })
									.wait(random.number()*500)
									.to({ scaleX: 1 }, 100)
									.call(function () {
										this.isTweening = false; 
									}, [], this);
	}
}
	
// draw the graphical representation of the agent
// TODO confirm that adding the "!this.isHiding" conditional fixes
// the weird eyes still showing, teleporting, and MISS-ing issue.
agentPrototype.drawAgent = function () {
	if (!this.isTweening && !this.isHiding && this.selectCacheIfExists()) {
		return;
	}

	// draw body
	var g = this.body.graphics;
	g.clear();
	g.beginFill(this.color.hex());
	g.drawCircle(0, 0, this.radius);
	
	// draw eyes
	g = this.eyes.graphics;
	g.clear();
	var eyeContrast = 0.4;
	if (this.isEaten) {
		this.eyes.scaleX = 1;
	}
	/*
	if (this.isEaten) {
		eyeContrast = 0.4;
	} else if (this.GLOBAL.MODE == 'predator') {
		eyeContrast = 0; //0.03;
	} else {
		eyeContrast = 0.4;
	}
	*/
	if (this.isEaten) {
		var lineWidth = this.radius*0.15;
		g.setStrokeStyle(lineWidth, 'round');
		g.beginStroke(this.color.brighten(eyeContrast).hex());
		// left eye
		g.moveTo(-Math.sqrt(Math.pow(this.radius*0.22, 2)/2),
						 this.eyeOffset-Math.sqrt(Math.pow(this.radius*0.22, 2)/2));
		g.lineTo(Math.sqrt(Math.pow(this.radius*0.22, 2)/2),
						 this.eyeOffset+Math.sqrt(Math.pow(this.radius*0.22, 2)/2));
		g.moveTo(-Math.sqrt(Math.pow(this.radius*0.22, 2)/2),
						 this.eyeOffset+Math.sqrt(Math.pow(this.radius*0.22, 2)/2));
		g.lineTo(Math.sqrt(Math.pow(this.radius*0.22, 2)/2),
						 this.eyeOffset-Math.sqrt(Math.pow(this.radius*0.22, 2)/2));
		// right eye
		g.moveTo(-Math.sqrt(Math.pow(this.radius*0.22, 2)/2),
						 -(this.eyeOffset-Math.sqrt(Math.pow(this.radius*0.22, 2)/2)));
		g.lineTo(Math.sqrt(Math.pow(this.radius*0.22, 2)/2),
						 -(this.eyeOffset+Math.sqrt(Math.pow(this.radius*0.22, 2)/2)));
		g.moveTo(-Math.sqrt(Math.pow(this.radius*0.22, 2)/2),
						 -(this.eyeOffset+Math.sqrt(Math.pow(this.radius*0.22, 2)/2)));
		g.lineTo(Math.sqrt(Math.pow(this.radius*0.22, 2)/2),
						 -(this.eyeOffset-Math.sqrt(Math.pow(this.radius*0.22, 2)/2)));
		g.endStroke();
	} else {
		// whites
		g.beginFill(this.color.brighten(eyeContrast).hex());
		g.beginStroke(this.color.darken(eyeContrast).hex());
		g.drawCircle(0, -this.radius*0.4, this.radius*0.3);
		g.endStroke();
		g.beginStroke(this.color.darken(eyeContrast).hex());
		g.drawCircle(0, this.radius*0.4, this.radius*0.3);
		g.endStroke();
		g.endFill();
		// pupils
		g.beginFill(this.color.darken(eyeContrast).hex());
		g.drawCircle(0, -this.radius*0.4, this.radius*0.12);
		g.drawCircle(0, this.radius*0.4, this.radius*0.12);
		g.endFill();
	}

	//draw baby
	/*
	if (this.isPregnant && !this.isEaten) {
		g.setStrokeStyle(3);
		g.beginStroke(this.color.brighten(eyeContrast).hex());
		g.drawCircle(0,0,this.radius);
	}
	*/
	
	this.uncache();
	if (!this.isTweening) {
		this.cache(-this.radius-1, -this.radius-1, 2*this.radius+2, 2*this.radius+2);

		if (this.isEaten) {
			this.eatenCacheCanvas = this.cacheCanvas;
		} else if (this.isPregnant && this.GLOBAL.MODE != 'predator') {
			this.peCacheCanvas = this.cacheCanvas;
		} else if (this.isPregnant && this.GLOBAL.MODE != 'predator') {
			this.neCacheCanvas = this.cacheCanvas;
		} else if (!this.isPregnant && this.GLOBAL.MODE == 'predator') {
			this.pnCacheCanvas = this.cacheCanvas;
		} else if (!this.isPregnant && this.GLOBAL.MODE == 'predator') {
			this.nnCacheCanvas = this.cacheCanvas;
		}
	}
}

agentPrototype.grow = function () {
	if (this.isAdult) {
		this.scaleX = this.scaleY = 1;
		this.height = this.width = 2*this.radius;
	} else {
		var newScale = this.GLOBAL.BABY_SCALE + (this.GLOBAL.TIME-this.birthTime)*this.GLOBAL.YOUTH_SCALE_STEP;
		this.scaleX = this.scaleY = newScale;
		this.height = this.width = 2*this.radius*newScale;
	}
	this.mass = Math.PI*this.height*this.height/4; // comes out to pi*r^2
}

agentPrototype.isDead = function () {
	// check if I got eaten
	if (this.isEaten) {
		if (!this.deathTime) {
			//this.color = this.color.darken(1);
			this.deathTime = this.GLOBAL.TIME;
			return false;
		} else if (this.GLOBAL.TIME-this.deathTime > this.GLOBAL.EATEN_DURATION) {
			this.uncache();
			this.body.graphics.clear();
			this.eyes.graphics.clear();
			return true;
		} else {
			this.alpha = 1-(this.GLOBAL.TIME-this.deathTime)/this.GLOBAL.EATEN_DURATION;
			return false;
		}
	} 
	// calculate probability of death
	if (!this.deathTime) {
		var score = (this.GLOBAL.TIME-this.birthTime)/1000 +
								this.GLOBAL.COLLISION_PENALTY*this.collisionCount;
		if (score > this.GLOBAL.DEATH_THRESHHOLD) {
			this.isDying = true;
			this.isEaten = true;
			this.deathTime = this.GLOBAL.TIME;
		}
		return false;
	} else {
		this.alpha = 1-(this.GLOBAL.TIME-this.deathTime)/this.GLOBAL.DEATH_DURATION;
		if (this.alpha <= 0) {
			this.uncache();
			this.body.graphics.clear();
			this.eyes.graphics.clear();
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
		if (this.GLOBAL.TIME-this.birthTime > this.GLOBAL.YOUTH_DURATION) {
			this.isAdult = true;
		}
		this.grow();
	}

	// exercise free will (acceleration)
	this.wander(e);

	// this.blink();

	// birth if necessary
	if (this.isPregnant &&
			this.GLOBAL.TIME-this.matingTime > this.GLOBAL.GESTATION_PD) {
		// put the baby behind the mama, touching. 
		var newPos = vec2.clone(this.pos);
		vec2.normalize(this.subResult, this.vel);
		vec2.scale(this.subResult, this.subResult,
							 -(this.radius*this.scaleX+this.GLOBAL.BABY_AGENT_RADIUS));
		vec2.add(newPos, this.pos, this.subResult);
		// with the same speed
		var newVel = vec2.clone(this.vel);

		result.push(new Agent(this.GLOBAL, this.bounds,
													this.GLOBAL.AGENT_RADIUS,
													newPos, newVel, this.childGenome));
		this.isPregnant = false;
		this.childGenome = null;
		this.matingTime = null;
		this.cpCacheCanvas = null;
		this.npCacheCanvas = null;
	}

	// Iterate internal kinematics
	vec2.scale(this.vel, this.vel, Math.pow(this.GLOBAL.VEL_DAMPING, this.GLOBAL.DELTA));
	vec2.scale(this.subResult, this.acc, this.GLOBAL.DELTA);
	vec2.add(this.vel, this.vel, this.subResult);
	vec2.scale(this.subResult, this.vel, this.GLOBAL.DELTA);
	vec2.add(this.pos, this.pos, this.subResult);
	
	// update the heading properly
	// bounded by -180 to 180 
	var velDir = 180/Math.PI*Math.atan2(this.vel[1], this.vel[0]);
	velDir = velDir - this.heading;
	if (velDir < -180) { velDir += 360; }
	else if (velDir > 180) { velDir -= 360; }
	this.heading = this.heading + velDir/100*this.GLOBAL.WORLD_SPEED;
	
	// elastically collide with walls
	if (this.pos[0] + this.scaleX*this.radius > this.bounds.width) {
		this.pos[0] = this.pos[0] = this.bounds.width - this.scaleX*this.radius - 1;
		this.vel[0] *= -1;
		this.collisionCount += 1;
	} else if (this.pos[0] - this.scaleX*this.radius < this.bounds.x) {
		this.pos[0] = this.pos[0] = this.bounds.x + this.scaleX*this.radius + 1;
		this.vel[0] *= -1;
		this.collisionCount += 1;
	} else if (this.pos[1] + this.scaleX*this.radius > this.bounds.height) {
		this.pos[1] = this.pos[1] = this.bounds.height - this.scaleX*this.radius - 1;
		this.vel[1] *= -1;
		this.collisionCount += 1;
	} else if (this.pos[1] - this.scaleX*this.radius < this.bounds.y) {
		this.pos[1] = this.pos[1] = this.bounds.y + this.scaleX*this.radius + 1;
		this.vel[1] *= -1;
		this.collisionCount += 1;
	}

	// check for survival of agent
	if (!this.isDead()) {
		result.push(this);
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
			 this.isEaten ||
			 this.isTweening ||
			 this.GLOBAL.AGENTS_DIRTY)) {
		this.updateHiding();
		this.drawAgent();
		this.wasPregnant = this.isPregnant;
	}

	this.wasColliding = this.isColliding;
	this.isColliding = false;

	return result;
}

window.Agent = createjs.promote(Agent, "Container");
