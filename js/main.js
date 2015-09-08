"use strict";

var GLOBAL = {
	WORLD_OFFSET_Y: 58, // pixels
	COMPONENT_MARGIN: 8, // pixels
	WORLD_SPEED: 1/1000, // pixels per millisecond
	NUM_AGENTS: 40,
	NUM_PLANTS: 150,
	DEATH_THRESHHOLD: 150,
	DEATH_DURATION: 500, // milliseconds

	MATING_PROB: 0.2,
	MUTATION_RATE: 100,
	GESTATION_PD: 4000, // milliseconds
	YOUTH_DURATION: 10000, // milliseconds
	MAX_ACC: 40,
	MOVEMENT_PROB: 1/1000, // chance per millisecond;

	AUTOPRED_INTERVAL: 1000, // milliseconds
	KILL_HEALTH_GAIN: 3,
	MISS_HEALTH_LOSS: 3,

	AGENT_RADIUS: 30,
	BABY_AGENT_RADIUS: 1, // change this once scaling is introduced

	CHROMA: 55,
	LIGHTNESS: 70
}

GLOBAL.BABY_SCALE = GLOBAL.BABY_AGENT_RADIUS/GLOBAL.AGENT_RADIUS;
GLOBAL.YOUTH_SCALE_STEP = (1-GLOBAL.BABY_SCALE)/GLOBAL.YOUTH_DURATION;


var random;
var stage;
var bounds;
var infoBounds;
var worldBounds;
var bg;
var info;
var agents;
var agentContainer;
var newAgents;
var tree;
var envHue;
var mode;
var allAgentsDirty;
var lastAutopredTime;
var lastAutoKill;
var lastPredationTime;
var health;
var worldSpeed = 1/1000; // pixels per millisecond

function configureDefaults () {
	// dunno if static typed arrays will play nice so let's keep
	// it simple for now.
	glMatrix.setMatrixArrayType(Array);

	random = new PcgRandom(Date.now());
};

function initAgents(num) {
	agents = [];
	newAgents = [];

	var radius;
	var a;
	for (var i = 0; i < num; i++) {
		radius = GLOBAL.AGENT_RADIUS;
		a = new Agent(worldBounds, radius,
									vec2.fromValues(random.number() * (bounds.width-2*radius) + radius,
																	random.number() * (bounds.height-2*radius) + radius),
									vec2.create(),
									[[random.number()*360], [random.number()*180]]);
		agentContainer.addChild(a);
		agents.push(a);
		tree.insert(a);
	}
}

function updateTree() {
	tree.clear();
	tree.insert(agents);
}

// our update function, which gets called by Ticker and then
// calls the stage's update in turn, which draws things
function tick (event) {
	// if we're not paused, we have to deal with 
	// collisions
	if (!event.paused) {
		var currentTime = createjs.Ticker.getTime(true);

		// autopredator vars
		var max = 0;
		var target = null;
		var diff = 0;

		// check for collisions
		var items;
		var a;
		var len;
		var item;
		for (var i = 0; i < agents.length; i++) {
			a = agents[i];
			items = tree.retrieve(a);
			len = items.length;
			for (var j = 0; j < len; j++) {
				item = items[j];
				if (a == item) { continue; }
				a.collide(item);
			}

			// autopredator
			if (mode == 'autopredator' &&
					(currentTime-lastAutopredTime)>GLOBAL.AUTOPRED_INTERVAL) {
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
			}
		}

		if (target) {
			if (max < 20 || agents.length < 10) {
				// do nothing
			} else {
				target.isEaten = true;
				lastAutoKill = target;
				info.drawDetailViewer();
			}
			lastAutopredTime = currentTime;
		}

		// iterate kinematics
		// (we can't let a tick listener do this because it
		// needs to happen before the quadtree update)
		var result;
		for (var i = 0; i < agents.length; i++) {
			result = agents[i].update(event);
			if (result.length == 0) {
				agentContainer.removeChild(agents[i]);
			} else if (result.length == 1) {
				newAgents.push(result[0]);
			} else if (result.length == 2) {
				agentContainer.addChild(result[0]);
				newAgents.push(result[0]);
				newAgents.push(result[1]);
			}
		}
		allAgentsDirty = false;

		// swap agents and newAgents;
		var temp = agents;
		agents = newAgents;
		newAgents = temp;
		newAgents.length = 0;

		// update quadtree
		updateTree();
	}

	// update the stage
	stage.update(event);
}

function main () {
	configureDefaults();
	var canvas = document.querySelector("#world");
	canvas.width = Math.max(window.innerWidth - 20, 1000);
	canvas.height = Math.max(window.innerHeight - 20, 600);
	stage = new createjs.Stage(canvas);

	envHue = random.number()*360;
	
	bounds = new createjs.Rectangle(0, 0, canvas.width, canvas.height);
	infoBounds = new createjs.Rectangle(0, 0, canvas.width, GLOBAL.WORLD_OFFSET_Y);
	worldBounds = new createjs.Rectangle(0, 0, canvas.width, canvas.height-GLOBAL.WORLD_OFFSET_Y);

	// QuadTree setup
	// give it the world bounds, false means shapes not points, and a depth of 7
	tree = new QuadTree(worldBounds, false, 7);

	bg = new Environment(worldBounds, envHue);
	bg.y = GLOBAL.WORLD_OFFSET_Y;
	stage.addChild(bg);

	agentContainer = new createjs.Container();
	agentContainer.y = GLOBAL.WORLD_OFFSET_Y;
	stage.addChild(agentContainer);
	initAgents(GLOBAL.NUM_AGENTS);

	mode = 'observer';
	lastPredationTime = lastAutopredTime = createjs.Ticker.getTime(true);
	info = new Info(infoBounds, envHue);

	stage.addChild(info);

	//createjs.Ticker.setFPS(24);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.on("tick", tick);
};

window.onload = main;

