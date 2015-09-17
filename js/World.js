var World = function (GLOBAL, canvas) {
	this.init(GLOBAL, canvas);
};

World.prototype = {
	init: function (GLOBAL, canvas) {
		if (this.GLOBAL && this.stage) {
			this.GLOBAL.TIME = 0;
			this.stage.enableDOMEvents(false);
			this.stage = new createjs.Stage(this.stage.canvas);
		} else { 
			this.GLOBAL = GLOBAL;
			this.stage = new createjs.Stage(canvas);
		}


		this.envHue = random.number()*360;
		var bounds = new createjs.Rectangle(0, 0, this.stage.canvas.width,
																							this.stage.canvas.height);
		var infoBounds = new createjs.Rectangle(0, 0, this.stage.canvas.width,
																									this.GLOBAL.WORLD_OFFSET_Y);
		var worldBounds = new createjs.Rectangle(0, 0,
																						 this.stage.canvas.width,
																						 this.stage.canvas.height-this.GLOBAL.WORLD_OFFSET_Y);
		// QuadTree setup
		// give it the world bounds, false means shapes not points, and a depth of 7
		this.tree = new QuadTree(worldBounds, false, 7);

		// create the environment
		this.bg = new Environment(this.GLOBAL, worldBounds, this.envHue);
		this.bg.y = this.GLOBAL.WORLD_OFFSET_Y;
		this.stage.addChild(this.bg);

		// create the agents
		this.agentContainer = new createjs.Container();
		this.agentContainer.y = this.GLOBAL.WORLD_OFFSET_Y;
		this.agentContainer.GLOBAL = this.GLOBAL;
		this.stage.addChild(this.agentContainer);
		this.initAgents(this.envHue, this.GLOBAL.NUM_AGENTS);

		// send world clicks to the info obj
		this.stage.on("worldClick", function (e) {
			this.info.handleWorldClick(e.mouseEvent, e.onAgent, e.agent);
		}, this);

		// create info
		this.info = new Info(this.GLOBAL, infoBounds, this.envHue);
		this.stage.addChild(this.info);

		// handle reset from UI
		this.info.on('reset', function () {
			this.init();
		}, this);
	},

	initAgents: function (hue, num) {
		var agentStartCol = hue;
		if (random.number() < 0.5) {
			agentStartCol += this.GLOBAL.INITIAL_AGENT_OFFSET;
		} else {
			agentStartCol -= this.GLOBAL.INITIAL_AGENT_OFFSET;
		}

		this.agents = [];
		this.newAgents = [];

		var worldBounds = this.bg.bounds;
		var radius;
		var a;
		for (var i = 0; i < num; i++) {
			radius = this.GLOBAL.AGENT_RADIUS;
			a = new Agent(this.GLOBAL, worldBounds, radius,
										vec2.fromValues(random.number() * (worldBounds.width-2*radius) + radius,
																		random.number() * (worldBounds.height-2*radius) + radius),
										vec2.create(),
										[[agentStartCol+this.GLOBAL.INIT_AGENTS_VARIATION*(random.number()-0.5)], [random.number()*180]]);
			a.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION;
			a.update({ WILL_DRAW: true });
			this.agentContainer.addChild(a);
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
		
		// if we're not paused, we have to deal with 
		// collisions
		if (!this.GLOBAL.PAUSED) {
			this.GLOBAL.DELTA = event.delta * this.GLOBAL.WORLD_SPEED;
			this.GLOBAL.TIME += this.GLOBAL.DELTA;

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


			// iterate kinematics
			// (we can't let a tick listener do this because it
			// needs to happen before the quadtree update)
			var result;
			for (var i = 0; i < this.agents.length; i++) {
				result = this.agents[i].update(event);
				if (result.length == 0) {
					this.agentContainer.removeChild(this.agents[i]);
				} else if (result.length == 1) {
					this.newAgents.push(result[0]);
				} else if (result.length == 2) {
					this.agentContainer.addChild(result[0]);
					this.newAgents.push(result[0]);
					this.newAgents.push(result[1]);
				}
			}
			for (var i = 0; i < this.bg.plants.length; i++) {
				this.bg.plants[i].update(event);
			}

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
		} else if (event.WILL_DRAW && this.GLOBAL.DIRTY) {
		// when the world is paused, only update the
		// stage (read: draw everything) when we know
		// that something is dirty. Since the game is
		// paused, DIRTY is just an indication of
		// user interaction
			this.stage.update(event);
			this.GLOBAL.DIRTY = false;
		}

		// add a tick to the update counter
		this.GLOBAL.UPDATE_COUNTER++;

		if (this.externalTick) {
			this.externalTick();
		}
	}
};
