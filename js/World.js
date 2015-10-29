var World = function (GLOBAL, canvas, envGenome, critterGenome) {
	this.GLOBAL = GLOBAL;
	this.stage = new createjs.Stage(canvas);
	this.initEnvGenome = envGenome;
	this.initCritterGenome = critterGenome;
};

World.prototype = {
	init: function () {
		this.GLOBAL.TIME = 0;
		this.GLOBAL.UPDATE_COUNTER = 0;
		this.GLOBAL.WORLD_SPEED = 10;
		this.stage.enableDOMEvents(false);
		this.stage = new createjs.Stage(this.stage.canvas);

		var bounds = new createjs.Rectangle(0, 0, this.stage.canvas.width,
																							this.stage.canvas.height);
		var infoBounds = new createjs.Rectangle(0, 0, this.stage.canvas.width,
																									this.GLOBAL.WORLD_OFFSET_Y);
		var worldBounds = new createjs.Rectangle(0, 0,
																						 this.stage.canvas.width,
																						 this.stage.canvas.height-this.GLOBAL.WORLD_OFFSET_Y);

		// COLOR SETUP
		this.envGenome = [null, null];
		this.envGenome[0] = this.initEnvGenome[0] != null ?
												this.initEnvGenome[0] :
												random.number()*360;
		this.envGenome[1] = this.initEnvGenome[1] != null ?
												this.initEnvGenome[1] :
												this.GLOBAL.MIN_AGENT_RADIUS+
												this.GLOBAL.MUTATION_RATES[1]/2+
												random.number()*(this.GLOBAL.MAX_AGENT_RADIUS-
																				 this.GLOBAL.MIN_AGENT_RADIUS-
																				 this.GLOBAL.MUTATION_RATES[1]); 

		this.critterGenome = [null, null];
		this.critterGenome[0] = this.initCritterGenome[0] != null ?
														this.initCritterGenome[0] :
														random.number()*360;
		this.critterGenome[1] = this.initCritterGenome[1] != null ?
														this.initCritterGenome[1] :
														this.GLOBAL.MIN_AGENT_RADIUS+
														random.number()*(this.GLOBAL.MAX_AGENT_RADIUS-
																						 this.GLOBAL.MIN_AGENT_RADIUS); 

		if (this.critterGenome[0] == 'relative') {
			this.critterGenome[0] = this.envGenome[0] +
															this.GLOBAL.INITIAL_AGENT_OFFSETS[0]*(random.integer(2)*2-1);
		} else if (this.critterGenome[0] == 'split') {
			this.critterGenome[0] = this.envGenome[0];
			if (random.number() < 0.5) {
				this.critterGenome[0] += this.GLOBAL.INITIAL_AGENT_OFFSETS[0]/3;
				this.envGenome[0] -= 2*this.GLOBAL.INITIAL_AGENT_OFFSETS[0]/3;
			} else {
				this.critterGenome[0] -= this.GLOBAL.INITIAL_AGENT_OFFSETS[0]/3;
				this.envGenome[0] += 2*this.GLOBAL.INITIAL_AGENT_OFFSETS[0]/3;
			}
		}

		if (this.critterGenome[1] == 'relative') {
			this.critterGenome[1] = this.envGenome[1] +
															this.GLOBAL.INITIAL_AGENT_OFFSETS[1]*(random.integer(2)*2-1);
		} else if (this.critterGenome[1] == 'split') {
			this.critterGenome[1] = this.envGenome[1];
			if (random.number() < 0.5) {
				this.critterGenome[1] += this.GLOBAL.INITIAL_AGENT_OFFSETS[1]/3;
				this.envGenome[1] -= 2*this.GLOBAL.INITIAL_AGENT_OFFSETS[1]/3;
			} else {
				this.critterGenome[1] -= this.GLOBAL.INITIAL_AGENT_OFFSETS[1]/3;
				this.envGenome[1] += 2*this.GLOBAL.INITIAL_AGENT_OFFSETS[1]/3;
			}
		}

		// QuadTree setup
		// give it the world bounds, false means shapes not points, and a depth of 7
		this.tree = new QuadTree(worldBounds, false, 7);

		/*
		this.worldMask = new createjs.Shape();
		this.worldMask.graphics.beginFill("#000000")
													 .drawRoundRect(0, 0, worldBounds.width, worldBounds.height, 20);
		this.worldMask.cache(0, 0, worldBounds.width, worldBounds.height);
		*/

		// create the environment
		this.bg = new Environment(this.GLOBAL, worldBounds, this.envGenome);
		this.bg.y = this.GLOBAL.WORLD_OFFSET_Y;
		this.stage.addChild(this.bg);

		// create the agents
		this.initAgents(this.GLOBAL.NUM_AGENTS);

		// create the predator and predator container
		this.predator = new Predator(this.GLOBAL, worldBounds, 60);
		this.predator.pos[0] = -150;
		this.predator.pos[1] = -150;
		this.bg.predatorContainer.addChild(this.predator);

		// send world clicks to the info obj
		this.stage.on("worldClick", function (e) {
			if (this.GLOBAL.MODE == 'predator' && !this.GLOBAL.PAUSED) {
				if (this.predator.isTweening) {
					return;
				}
				if (e.onAgent) {
					this.predator.huntTarget(e.agent);
				} else {
					this.predator.huntNothing(e.mouseEvent);
				}
			}
			this.info.handleWorldClick(e.mouseEvent, e.onAgent, e.agent);
		}, this);

		this.stage.on("nighttime", function () {
			this.info.nextMode();
			this.predator.getInPosition();
		}, this);

		this.stage.on("daytime", function () {
			this.info.nextMode();
		}, this);

		this.stage.on("nextRound", function () {
			this.saveState();
		}, this);

		this.stage.on("resetRound", function () {
			this.restoreState();
		}, this);

		// create info
		this.info = new Info(this.GLOBAL, bounds, infoBounds, this.envGenome[0]);
		this.stage.addChild(this.info);

		// handle reset from UI
		this.info.on('reset', function () {
			this.init();
		}, this);
		
		if (this.externalInit) {
			this.externalInit();
		}

		this.tickOnce();
		this.saveState();
	},

	saveState: function () {
		this.savedTime = this.GLOBAL.TIME;
		this.encodedAgents = [];
		for (var i = 0; i < this.agents.length; i++) {
			this.encodedAgents.push(Agent.prototype.encode(this.agents[i]));
		}
	},

	restoreState: function () {
		this.GLOBAL.TIME = this.savedTime;
		this.bg.agentContainer.removeAllChildren();
		var self = this;
		this.agents = this.encodedAgents.map(function (e) {
			return Agent.prototype.agentFromEncoding(e, self.GLOBAL);
		});
		for (var i = 0; i < this.agents.length; i++) {
			this.bg.agentContainer.addChild(this.agents[i]);
		}
		this.updateTree();
	},

	tickOnce: function () {
		var temp = this.GLOBAL.PAUSED;
		this.GLOBAL.PAUSED = false;
		this.tick({ WILL_DRAW: true, delta: 0});
		this.GLOBAL.PAUSED = temp;
	},

	initAgents: function (num) {
		this.agents = [];
		this.newAgents = [];

		var worldBounds = this.bg.bounds;
		var radius;
		var a;
		var pos;
		var sample = poissonDiscSampler(worldBounds.width, worldBounds.height,
																		2*this.GLOBAL.MAX_AGENT_RADIUS,
																		this.GLOBAL.MAX_AGENT_RADIUS);
		for (var i = 0; i < num; i++) {
			radius = this.critterGenome[1];
			pos = sample();
			if (!pos) { break; }
			a = new Agent(this.GLOBAL, worldBounds,
										pos,
										vec2.create(),
										[this.critterGenome[0]+
										 this.GLOBAL.INIT_AGENTS_VARIATIONS[0]*(random.number()-0.5),
										 this.critterGenome[1]+
										 this.GLOBAL.INIT_AGENTS_VARIATIONS[1]*(random.number()-0.5)]);
			a.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION;
			a.update({ WILL_DRAW: true });
			this.bg.agentContainer.addChild(a);
			this.agents.push(a);
			this.tree.insert(a);
		}
	},

	updateTree: function () {
		this.tree.clear();
		this.tree.insert(this.agents);
	},

	start: function () {
		createjs.Ticker.on("tick", this.tick, this);
	},

	tick: function (event) {
		event.WILL_DRAW = (this.GLOBAL.UPDATE_COUNTER % this.GLOBAL.UPDATES_PER_DRAW == 0);
		
		this.GLOBAL.DELTA = this.GLOBAL.PAUSED ?
												0 :
												event.delta * this.GLOBAL.WORLD_SPEED;
		this.GLOBAL.TIME += this.GLOBAL.DELTA;
		createjs.Tween.tick(this.GLOBAL.DELTA, this.GLOBAL.PAUSED);

		// if we're not paused, we have to deal with 
		// collisions
		if (!this.GLOBAL.PAUSED) {
			// autopredator vars
			var max = 0;
			var target = null;
			var diff = 0;

			// check for collisions
			var items;
			var a;
			var len;
			var item;
			for (var i = 0; i < this.agents.length; i++) {
				a = this.agents[i];
				items = this.tree.retrieve(a);
				len = items.length;
				for (var j = 0; j < len; j++) {
					item = items[j];
					if (a == item) { continue; }
					a.collide(item);
				}

				// autopredator
				/*
				if (this.GLOBAL.MODE == 'autopredator' &&
						(this.GLOBAL.TIME-lastAutopredTime)>this.GLOBAL.AUTOPRED_INTERVAL) {
					if (a.isAdult) {
						diff = a.genome[0][0]-envHue;
						if (diff > 180) { diff -= 360; }
						if (diff < -180) { diff += 360; }
						diff = Math.abs(diff);
						if (diff > max) {
							max = diff;
							target = a;
						}
					}
					if (target) {
						if (agents.length < 20) {
							// do nothing
						} else {
							target.isEaten = true;
							lastAutoKill = target;
							info.drawDetailViewer();
						}
						lastAutopredTime = this.GLOBAL.TIME;
					}
				}
				*/
			}

			this.bg.update(event);

			// iterate kinematics
			// (we can't let a tick listener do this because it
			// needs to happen before the quadtree update)
			var result;
			for (var i = 0; i < this.agents.length; i++) {
				result = this.agents[i].update(event);
				if (result.length == 0) {
					this.bg.agentContainer.removeChild(this.agents[i]);
				} else if (result.length == 1) {
					this.newAgents.push(result[0]);
				} else if (result.length == 2) {
					this.bg.agentContainer.addChild(result[0]);
					this.newAgents.push(result[0]);
					this.newAgents.push(result[1]);
				}
			}
			for (var i = 0; i < this.bg.plants.length; i++) {
				this.bg.plants[i].update(event);
			}
			this.predator.update(event);

			if (event.WILL_DRAW) { this.GLOBAL.AGENTS_DIRTY = false; }

			// swap agents and newAgents;
			var temp = this.agents;
			this.agents = this.newAgents;
			this.newAgents = temp;
			this.newAgents.length = 0;

			// update quadtree
			this.updateTree();

			// update the stage
			if (event.WILL_DRAW) { this.stage.update(event); }
		} else if (event.WILL_DRAW && (this.GLOBAL.DIRTY || this.GLOBAL.AGENTS_DIRTY)) {
		// when the world is paused, only update the
		// stage (read: draw everything) when we know
		// that something is dirty. Since the game is
		// paused, DIRTY is just an indication of
		// user interaction
			this.stage.update(event);
			this.GLOBAL.DIRTY = false;
			this.GLOBAL.AGENTS_DIRTY = false;
		}

		if (event.WILL_DRAW) { this.info.update(event); }

		// add a tick to the update counter
		this.GLOBAL.UPDATE_COUNTER++;

		if (this.externalTick) {
			this.externalTick(event);
		}
	}
};
