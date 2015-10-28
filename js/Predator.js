// constructor
function Predator(GLOBAL, worldBounds, radius) {
	// call inherited shape constructor
	this.Container_constructor();
	this.GLOBAL = GLOBAL;
	this.worldBounds = worldBounds;
	this.radius = radius;

	this.init();
}

var predatorPrototype = createjs.extend(Predator, createjs.Container);

predatorPrototype.init = function () {
	this.worldDiagonal = vec2.dist(vec2.fromValues(0,0),
																 vec2.fromValues(this.worldBounds.width,
																	 							 this.worldBounds.height));
	this.pos = vec2.create();
	this.x = this.pos[0];
	this.y = this.pos[1];

	this.color = chroma.hcl(0, 0, this.GLOBAL.LIGHTNESS/2);

	this.eyeOffset = this.radius*0.4;
	this.height = this.width = this.radius * 2;
	this.shadowGen = new createjs.Shape();
	this.shadowGen.shadow = new createjs.Shadow("rgba(0, 0, 0, 0.5)", 0, 50, 10);
	this.addChild(this.shadowGen);
  this.victimContainer = new createjs.Container();
	this.victimContainer.x = this.radius;
  this.addChild(this.victimContainer);
	this.victim = new createjs.Shape();
	this.victimContainer.addChild(this.victim);
	this.body = new createjs.Shape();
	this.addChild(this.body);
	this.eyes = new createjs.Shape();
	this.eyes.x = this.eyeOffset;
	this.addChild(this.eyes);
	this.drawPredator();
}

predatorPrototype.isOutsideBounds = function () {
	if (this.pos[0] < -2*this.radius ||
			this.pos[0] > 2*this.radius + this.worldBounds.width ||
			this.pos[1] < -2*this.radius ||
			this.pos[1] > 2*this.radius + this.worldBounds.height) {
		return true;
	} else {
		return false;
	}
}

predatorPrototype.randomEdgePos = function () {
	var pos = vec2.create();
	var side = random.integer(4);
	if (side === 0) { // top
		pos[0] = random.number()*this.worldBounds.width;
		pos[1] = -2*this.radius;
	} else if (side === 1) { // left
		pos[0] = -2*this.radius;
		pos[1] = random.number()*this.worldBounds.height;
	} else if (side === 2) { // bottom
		pos[0] = random.number()*this.worldBounds.width;
		pos[1] = this.worldBounds.height+2*this.radius;
	} else if (side === 3) { // right
		pos[0] = this.worldBounds.width+2*this.radius;
		pos[1] = random.number()*this.worldBounds.height;
	}
	return pos;
}

predatorPrototype.getInPosition = function () {
	this.pos[0] = this.worldBounds.width/2;
	this.pos[1] = -2*this.radius;
	this.finalDest = vec2.create();
	this.finalDest[0] = this.worldBounds.width/2+this.radius*(random.number()-0.5);
	this.finalDest[1] = 0;
	this.tempX = this.pos[0];
	this.tempY = this.pos[1];
	this.isTweening = true;
	console.log("dest", this.pos[0], this.pos[1]);
	createjs.Tween.get(this, { onChange: function () {
									this.heading = 180/Math.PI*Math.atan2(this.tempY-this.pos[1],
																												this.tempX-this.pos[0]);
									this.pos[0] = this.tempX;
									this.pos[1] = this.tempY;
								}.bind(this)})
								.to({ tempX: this.finalDest[0],
											tempY: this.finalDest[1],
										}, 6000)
								.call(function () {
									this.isTweening = false;
								});
}

predatorPrototype.blink = function (e) {
	if (this.isHiding || this.isTweening) { return; }
	this.isTweening = true;
	createjs.Tween.get(this.eyes)
								.to({ scaleX: 0 }, 100)
								.wait(100)
								.to({ scaleX: 1}, 100)
								.call(function () {
									this.isTweening = false;
								}, [], this);
}

predatorPrototype.selectCacheIfExists = function () {
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

// draw the graphical representation of the predator
// TODO confirm that adding the "!this.isHiding" conditional fixes
// the weird eyes still showing, teleporting, and MISS-ing issue.
predatorPrototype.drawPredator = function () {
	var g = this.shadowGen.graphics;
	g.clear();
	g.beginFill(this.color.hex());
	g.drawPolyStar(0, 0, this.radius, 30, 0.05, 0);
	if (this.hasTarget) {
		g.drawCircle(this.radius, 0, this.target.radius*this.target.scaleX);
	}
	g.endFill();

	// draw victim
	if (this.hasTarget) {
    if (!this.victimContainer.cacheCanvas) {
      this.victim.cache(-this.target.radius-1,
                        -this.target.radius-1,
                        2*this.target.radius+2,
                        2*this.target.radius+2);
      this.victim.cacheCanvas = this.target.cacheCanvas;
      this.victimContainer.cache(-this.target.radius-1,
                                 -this.target.radius-1,
                                 2*this.target.radius+2,
                                 2*this.target.radius+2);
      this.victimContainer.scaleX = this.target.scaleX;
      this.victimContainer.scaleY = this.target.scaleY;
    }
	} else {
    this.victim.uncache();
		this.victimContainer.uncache();
		this.victim.graphics.clear();
	}

	// draw body
	var g = this.body.graphics;
	g.clear();
	if (this.GLOBAL.COLOR_FILL) {
		g.beginFill(this.color.hex());
	} else {
		g.beginFill("#FFFFFF");
		g.beginStroke(this.color.hex());
	}

	g.drawPolyStar(0, 0, this.radius, 30, 0.05, 0);
	//g.drawCircle(0, 0, this.radius);
	g.endStroke();
	g.endFill();

	// draw eyes
	g = this.eyes.graphics;
	g.clear();
	var eyeContrast = 2;
	if (this.isEaten) {
		this.eyes.scaleX = 1;
	}
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
		if (this.GLOBAL.COLOR_FILL) {
			g.beginFill(this.color.brighten(eyeContrast).hex());
		}
		g.beginStroke(this.color.darken(eyeContrast).hex());
		g.drawCircle(0, -this.radius*0.4, this.radius*0.3);
		g.endStroke();
		g.beginStroke(this.color.darken(eyeContrast).hex());
		g.drawCircle(0, this.radius*0.4, this.radius*0.3);
		g.endStroke();
		g.endFill();
		// pupils
		g.beginFill(this.color.darken(eyeContrast).hex());
		g.drawCircle(0.1*this.radius, -this.radius*0.35, this.radius*0.12);
		g.drawCircle(0.1*this.radius, this.radius*0.35, this.radius*0.12);
		g.endFill();
	}
}

predatorPrototype.huntNothing = function (e) {
	var startPos = vec2.clone(this.pos);
	var dir = 180/Math.PI*Math.atan2(e.stageY-this.pos[1], e.stageX-this.pos[0]);
	this.heading = dir;
	this.tempX = this.pos[0];
	this.tempY = this.pos[1];
	this.isTweening = true;
	createjs.Tween.get(this, { onChange: function () {
									if (this.pos[0] != this.tempX || this.pos[1] != this.tempY) {
										this.heading = 180/Math.PI*Math.atan2(this.tempY-this.pos[1],
																													this.tempX-this.pos[0]);
									}
									this.pos[0] = this.tempX;
									this.pos[1] = this.tempY;
								}.bind(this) })
								.to({ tempX: e.stageX,
											tempY: e.stageY-this.GLOBAL.WORLD_OFFSET_Y },
											2000, createjs.Ease.sineOut)
								.to({ heading: dir+180 }, 1000, createjs.Ease.sineOut)
								.to({ tempX: startPos[0],
											tempY: startPos[1] },
											2000, createjs.Ease.sineIn)
								.call(function () {
									this.isTweening = false;
								});
}

predatorPrototype.huntTarget = function (target) {
	this.target = target;

	// what direction are we going?
	this.heading = 180/Math.PI*Math.atan2(this.target.pos[1]-this.pos[1],
																				this.target.pos[0]-this.pos[0]);
	this.finalDest = vec2.fromValues(Math.cos(Math.PI/180*this.heading)*
																	 (2*this.worldDiagonal)+
																	 this.pos[0],
																	 Math.sin(Math.PI/180*this.heading)*
																	 (2*this.worldDiagonal)+
																	 this.pos[1]);

	// temp variables for tweening
	this.tempX = this.pos[0];
	this.tempY = this.pos[1];
	this.isTweening = true;

	createjs.Tween.get(this, { onChange: function () {
									this.heading = 180/Math.PI*Math.atan2(this.tempY-this.pos[1],
																												this.tempX-this.pos[0]);
									this.pos[0] = this.tempX;
									this.pos[1] = this.tempY;
									if (vec2.distance(this.target.pos, this.pos) < 1.2*this.radius) {
										this.hasTarget = true;
										this.target.getEaten();
									}
									if (this.hasTarget && this.isOutsideBounds()) {
										createjs.Tween.removeTweens(this);
										this.isTweening = false;
										this.hasTarget = false;
									}
								}.bind(this)})
								.to({ tempX: this.finalDest[0],
											tempY: this.finalDest[1],
										}, 6000)
								.call(function () {
									this.isTweening = false;
									this.hasTarget = false;
								});
}


// update the kinematics of the predator
predatorPrototype.update = function (e) {
	// redraw if we are on a draw update and other conditions
	// require it
	this.x = this.pos[0];
	this.y = this.pos[1];
	this.rotation = this.heading;
	if (e.WILL_DRAW) {
		this.drawPredator();
	}
}

window.Predator = createjs.promote(Predator, "Container");
