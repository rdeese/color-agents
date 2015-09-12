var World = function (canvas) {
	this.init(canvas);
};

World.prototype = {
	GLOBAL: {
		WORLD_OFFSET_Y: 58, // pixels
		COMPONENT_MARGIN: 8, // pixels
		NUM_AGENTS: 40,
		NUM_PLANTS: 150,
		DEATH_THRESHHOLD: 800,
		DEATH_DURATION: 2000, // milliseconds
		EATEN_DURATION: 2000, // milliseconds
		COLLISION_PENALTY: 8,

		WORLD_SPEED: 10, // virtual milliseconds per real millisecond
		OBSERVE_MODE_SPEED: 10,
		PRED_MODE_SPEED: 1,
		AUTOPRED_MODE_SPEED: 10,
		TIME: 0, // starts at 0

		MATING_PROB: 0.2,
		MUTATION_RATE: 40,
		GESTATION_PD: 20000, // milliseconds
		YOUTH_DURATION: 40000, // milliseconds
		MAX_ACC: 4/100000, // pixels per millisecond
		ACC_DAMPING: 0.999,
		VEL_DAMPING: 0.9999,
		MOVEMENT_PROB: 1/10000, // chance per millisecond;

		AUTOPRED_INTERVAL: 8000, // milliseconds
		
		OBSERVER_PERIOD: 120000, // milliseconds
		PREDATOR_PERIOD: 20000, // milliseconds
		MISS_TIME_PENALTY: 8000, // milliseconds
		HIT_THRESHOLD: 15,

		INITIAL_AGENT_OFFSET: 40,

		AGENT_RADIUS: 30,
		BABY_AGENT_RADIUS: 1, // change this once scaling is introduced

		CHROMA: 55,
		LIGHTNESS: 70,

		FONT: "Catamaran",

		UPDATES_PER_DRAW: 5,
		UPDATE_COUNTER: 0,

		DIRTY: false,
		AGENTS_DIRTY: false,
		MODE: "observer"
	},

	init: function (canvas) {
		// define derivative globals
		this.GLOBAL.BABY_SCALE = this.GLOBAL.BABY_AGENT_RADIUS/this.GLOBAL.AGENT_RADIUS;
		this.GLOBAL.YOUTH_SCALE_STEP = (1-this.GLOBAL.BABY_SCALE)/this.GLOBAL.YOUTH_DURATION;
	
		this.stage = new createjs.Stage(canvas);
		envHue = random.number()*360;
		var bounds = new createjs.Rectangle(0, 0, canvas.width, canvas.height);
		var infoBounds = new createjs.Rectangle(0, 0, canvas.width, this.GLOBAL.WORLD_OFFSET_Y);
		var worldBounds = new createjs.Rectangle(0, 0,
																						 canvas.width,
																						 canvas.height-this.GLOBAL.WORLD_OFFSET_Y);
		// QuadTree setup
		// give it the world bounds, false means shapes not points, and a depth of 7
		this.tree = new QuadTree(worldBounds, false, 7);

		// create the environment
		this.bg = new Environment(this.GLOBAL, worldBounds, envHue);
		this.bg.y = this.GLOBAL.WORLD_OFFSET_Y;
		this.stage.addChild(this.bg);

		// create the agents
		this.agentContainer = new createjs.Container();
		this.agentContainer.y = this.GLOBAL.WORLD_OFFSET_Y;
		this.agentContainer.GLOBAL = this.GLOBAL;
		this.stage.addChild(this.agentContainer);
		var agentStartCol = envHue;
		if (random.number() < 0.5) {
			agentStartCol += this.GLOBAL.INITIAL_AGENT_OFFSET;
		} else {
			agentStartCol -= this.GLOBAL.INITIAL_AGENT_OFFSET;
		}
		this.initAgents(agentStartCol, this.GLOBAL.NUM_AGENTS);

		// send world clicks to the info obj
		this.stage.on("worldClick", function (e) {
			this.info.handleWorldClick(e.mouseEvent, e.onAgent, e.agent);
		}, this);

		// create info
		this.info = new Info(this.GLOBAL, infoBounds, envHue);
		this.stage.addChild(this.info);
	},

	initAgents: function (hue, num) {
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
										[[hue+30*(random.number()-0.5)], [random.number()*180]]);
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
		if (!event.paused) {
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
	}
};