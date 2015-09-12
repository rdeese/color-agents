function main () {
	var GLOBAL = {
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
	var world;

	// single critter interactive
	canvas = document.querySelector("#single-critter");
	canvas.width = Math.min(1400, Math.max(window.innerWidth - 20, 1000));
	canvas.height = Math.min(900, Math.max(window.innerHeight - 20, 600));
	var world = new World(globalClone(), canvas);
	world.start();

	// sandbox
	canvas = document.querySelector("#world");
	canvas.width = Math.min(1400, Math.max(window.innerWidth - 20, 1000));
	canvas.height = Math.min(900, Math.max(window.innerHeight - 20, 600));
	var world = new World(globalClone(), canvas);
	world.start();
}

window.onload = main;
