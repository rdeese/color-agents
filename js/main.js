function main () {
	var GLOBAL = {
		WORLD_OFFSET_Y: 58, // pixels
		COMPONENT_MARGIN: 8, // pixels
		NUM_AGENTS: 40,
		INIT_AGENTS_VARIATION: 30,
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
		DELTA: 0, // just in case

		MATING_PROB: 0.2,
		MUTATION_RATE: 60,
		MUTATION_PROB: 0.2,
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
		MODE: "observer",
		PAUSED: true
	}

	var globalClone = function () {
		return JSON.parse(JSON.stringify(GLOBAL));
	}

	// define derivative globals
	GLOBAL.BABY_SCALE = GLOBAL.BABY_AGENT_RADIUS/GLOBAL.AGENT_RADIUS;
	GLOBAL.YOUTH_SCALE_STEP = (1-GLOBAL.BABY_SCALE)/GLOBAL.YOUTH_DURATION;

	// CONFIGURE DEFAULTS
	// dunno if static typed arrays will play nice so let's keep
	// it simple for now.
	glMatrix.setMatrixArrayType(Array);
	random = new PcgRandom(Date.now());
	createjs.Ticker.setFPS(120);

	// INTERACTIVES
	var canvas;
	var interactives = [];
	var world;
	var global;

	// single critter interactive
	canvas = document.querySelector("#single-critter");
	canvas.width = Math.min(1400, Math.max(window.innerWidth - 20, 1000));
	canvas.height = Math.min(200, Math.max(window.innerHeight - 20, 100));
	global = globalClone();
	global.NUM_AGENTS = 1; // just one critter
	global.DEATH_THRESHHOLD = 200; // lower death threshhold so things happen faster
	global.OBSERVER_PERIOD = Infinity; // no predator period
	// global.INITIAL_AGENT_OFFSET = 0; // same color as controls
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	// autoplay
	global.AUTOPLAY = true;
	global.PAUSED = false;
	world = new World(global, canvas);
	world.stage.removeChild(world.bg); // hide the background
	world.stage.removeChild(world.info); // hide the info bar
	world.start();
	interactives.push(world);
	world.externalTick = function () {
		if (this.agents.length == 0) {
			this.init();
			this.stage.removeChild(this.bg); // hide the background
			this.stage.removeChild(this.info); // hide the info bar
		}
	}.bind(world);

	// critter family interactive
	canvas = document.querySelector("#critter-family");
	canvas.width = Math.min(300, Math.max(window.innerWidth - 20, 200));
	canvas.height = Math.min(200, Math.max(window.innerHeight - 20, 100));
	global = globalClone();
	global.NUM_AGENTS = 2; // two critters!
	// global.DEATH_THRESHHOLD = 200;
	global.OBSERVER_PERIOD = Infinity; // no predator period
	// global.INITIAL_AGENT_OFFSET = 0; // same color as controls
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.INIT_AGENTS_VARIATION = 360;
	// autoplay
	global.AUTOPLAY = true;
	global.PAUSED = false;
	world = new World(global, canvas);
	world.stage.removeChild(world.bg); // hide the background
	world.stage.removeChild(world.info); // hide the info bar
	world.start();
	interactives.push(world);
	world.externalTick = function () {
		if (this.agents.filter(function (x) { return x.isAdult }).length >= 3 ||
				this.agents.length < 2) {
			this.init();
			this.stage.removeChild(this.bg); // hide the background
			this.stage.removeChild(this.info); // hide the info bar
		}
	}.bind(world);

	// sandbox
	canvas = document.querySelector("#world");
	canvas.width = Math.min(1400, Math.max(window.innerWidth - 20, 1000));
	canvas.height = Math.min(900, Math.max(window.innerHeight - 20, 600));
	world = new World(globalClone(), canvas);
	world.start();
	interactives.push(world);

	// add listener to pause when not visible
	window.onscroll = function () {
		var scrollY = window.pageYOffset;
		var innerHeight = window.innerHeight;
		for (var i = 0; i < interactives.length; i++) {
			var w = interactives[i];
			var isVisible = w.stage.canvas.offsetTop<scrollY+innerHeight &&
											w.stage.canvas.offsetTop+w.stage.canvas.height>scrollY;
			if (isVisible && w.GLOBAL.PAUSED && w.GLOBAL.AUTOPLAY && document.hasFocus()) {
				w.GLOBAL.PAUSED = false;
			} else if (!isVisible && !w.GLOBAL.PAUSED) {
				w.GLOBAL.PAUSED = true;
			}
		}
	};

	window.onblur = function () {
		for (var i = 0; i < interactives.length; i++) {
			var w = interactives[i];
			w.GLOBAL.PAUSED = true;
		}
	};

	window.onfocus = function () {
		var scrollY = window.pageYOffset;
		var innerHeight = window.innerHeight;
		for (var i = 0; i < interactives.length; i++) {
			var w = interactives[i];
			var isVisible = w.stage.canvas.offsetTop<scrollY+innerHeight &&
											w.stage.canvas.offsetTop+w.stage.canvas.height>scrollY;
			if (isVisible && w.GLOBAL.PAUSED && w.GLOBAL.AUTOPLAY) {
				w.GLOBAL.PAUSED = false;
			} 
		}
	};

	// start in the right state
	if (document.hasFocus()) {
		window.onfocus();
	} else {
		window.onblur();
	}
	window.scroll(window.scrollX, window.scrollY);
}

window.onload = main;
