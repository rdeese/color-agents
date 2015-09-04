"use strict";

var WORLD_OFFSET_Y = 58; // pixels
var GLOBAL_COMPONENT_MARGIN = 8; // pixels

var NUM_AGENTS = 100;
var NUM_PLANTS = 300;
var DEATH_THRESHHOLD = 300;
var DEATH_DURATION = 2000; // milliseconds

var MATING_PROB = 0.05;
var MUTATION_RATE = 20;
var GESTATION_PD = 5000; // milliseconds
var YOUTH_DURATION = 10000; // milliseconds
var MAX_ACC = 50;
var MOVEMENT_PROB = 0.02;

var AGENT_RADIUS = 30;
var BABY_AGENT_RADIUS = 1; // TODO change this once scaling is introduced
var BABY_SCALE = BABY_AGENT_RADIUS/AGENT_RADIUS;
var YOUTH_SCALE_STEP = (1-BABY_SCALE)/YOUTH_DURATION;

var GLOBAL_CHROMA = 55;
var GLOBAL_LIGHTNESS = 70;
var NUM_BG_CIRCLES = 500;

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
		radius = AGENT_RADIUS;
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
	canvas.width = window.innerWidth - 20;
	canvas.height = window.innerHeight - 20;
	stage = new createjs.Stage(canvas);

	envHue = random.number()*360;
	
	bounds = new createjs.Rectangle(0, 0, canvas.width, canvas.height);
	infoBounds = new createjs.Rectangle(0, 0, canvas.width, WORLD_OFFSET_Y);
	worldBounds = new createjs.Rectangle(0, 0, canvas.width, canvas.height-WORLD_OFFSET_Y);

	// QuadTree setup
	// give it the world bounds, false means shapes not points, and a depth of 7
	tree = new QuadTree(worldBounds, false, 7);

	bg = new Environment(worldBounds, envHue);
	bg.y = WORLD_OFFSET_Y;
	stage.addChild(bg);

	agentContainer = new createjs.Container();
	agentContainer.y = WORLD_OFFSET_Y;
	stage.addChild(agentContainer);
	initAgents(NUM_AGENTS);

	mode = 'observer';
	info = new Info(infoBounds, envHue);

	stage.addChild(info);

	//createjs.Ticker.setFPS(24);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.on("tick", tick);
};

window.onload = main;

