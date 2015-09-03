"use strict";

var AGENT_RADIUS = 20;
var BABY_AGENT_RADIUS = 20; // TODO change this once scaling is introduced
var NUM_AGENTS = 10;
var MATING_PROB = 0.1;
var GESTATION_PD = 1000; // milliseconds
var YOUTH_DURATION = 1000; // milliseconds TODO change this after mating works

var random;
var stage;
var bounds;
var bg;
var info;
var agents;
var newAgents;
var tree;

function configureDefaults () {
	// dunno if static typed arrays will play nice so let's keep
	// it simple for now.
	glMatrix.setMatrixArrayType(Array);

	random = new PcgRandom(Date.now());
};

function handleMouseDown (event) {
	if (!event.primary) { return; }
	// TODO check quadtree and remove agent if click
	// is on an agent
	//createjs.Ticker.paused = !createjs.Ticker.paused;
}

function initAgents(num) {
	agents = [];
	newAgents = [];

	var radius;
	var a;
	for (var i = 0; i < num; i++) {
		radius = AGENT_RADIUS;
		a = new Agent(bounds, radius,
									vec2.fromValues(random.number() * (bounds.width-2*radius) + radius,
																	random.number() * (bounds.height-2*radius) + radius),
									vec2.create(),
									[[random.number()*180], [random.number()*180]]);
		stage.addChild(a);
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
				stage.removeChild(agents[i]);
			} else if (result.length == 1) {
				newAgents.push(result[0]);
			} else if (result.length == 2) {
				stage.addChild(result[0]);
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
	// stage.addEventListener("stagemousedown", handleMouseDown);

	// QuadTree setup
	bounds = new createjs.Rectangle(0, 0, canvas.width, canvas.height);
	// give it the bounds, false means shapes not points, and a depth of 7
	tree = new QuadTree(bounds, false, 7);

	bg = new Environment(bounds);
	stage.addChild(bg);

	initAgents(NUM_AGENTS);

	info = new Info(bounds, 1);
	stage.addChild(info);

	//createjs.Ticker.setFPS(24);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.on("tick", tick);
};

window.onload = main;

