// constructor
function Agent(bounds, radius, position, velocity, genome) {
	Shape.call(this);
	this.snapToPixel = true;
	this.bounds = bounds;
	this.radius = radius;
	this.vel = velocity;
	this.pos = position;
	this.x = this.pos[0];
	this.y = this.pos[1];
	this.genome = genome;
	this.expressPhenotype();
	this.height = this.width = this.radius * 2;
	this.draw();
}

// turns genotype into phenotype
Agent.prototype.expressPhenotype = function () {
	// Assumes a diploid organism with one gene, and calculates the phenotypic
	// hue as the sum of the genes from each parent.
	this.color = chroma.hcl(this.genome[0][0] + this.genome[1][0], 100, 100);
}

Agent.prototype.wander = function () {
	// randomly change the acceleration
	vec2.scale(this.acc, this.acc, 0.8);
	vec2.add(this.acc, this.acc, vec2.fromValues(random.number()-0.5,random.number()-0.5));
}
	
// draw the graphical representation of the agent
Agent.prototype.draw = function () {
	var g = this.graphics;
	g.clear();
	// first param is stroke width
	g.setStrokeStyle(1);
	g.beginStroke(this.color.darken().hex());
	g.beginFill(this.color.hex());
	g.drawCircle(this.radius, this.radius, this.radius);
	this.cached = true;
}

// update the kinematics of the agent
Agent.prototype.update = function () {
	this.wander();

	vec2.add(this.vel, this.vel, this.acc);
	vec2.add(this.pos, this.pos, this.vel);
	this.x = this.pos[0];
	this.y = this.pos[1];
	
	// turn around if we run into the wall
	if (this.x + this.width > this.bound.width) {
		this.x = this.pos[0] = this.bounds.width - this.width - 1;
		this.vel[0] *= -1;
	} else if (this.x < this.bounds.x) {
		this.x = this.pos[0] = this.bounds.x + 1;
		this.vel[0] *= -1;
	} else if (this.y + this.height > this.bound.height) {
		this.y = this.pos[1] = this.bounds.height - this.height - 1;
		this.vel[1] *= -1;
	} else if (this.x < this.bounds.x) {
		this.y = this.pos[1] = this.bounds.y + 1;
		this.vel[1] *= -1;
	}
}

