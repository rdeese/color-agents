"use strict";

var random;
var stage;
var bounds;
var bg;
var info;
var agents;
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
	createjs.Ticker.paused = !createjs.Ticker.paused;
}

function initAgents(num) {
	agents = [];

	var radius;
	var a;
	for (var i = 0; i < num; i++) {
		radius = 20;
		a = new Agent(bounds, radius,
									vec2.fromValues(random.number() * (bounds.width-2*radius) + radius,
																	random.number() * (bounds.height-2*radius) + radius),
									vec2.fromValues(random.number(), random.number()),
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
	// do nothing if we're paused
	if (event.paused) { return; }

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
	for (var i = 0; i < agents.length; i++) {
		agents[i].update();
	}

	// update quadtree
	updateTree();

	// update background
	bg.update();
	
	// update info
	info.update();

	// update the stage
	stage.update(event);
}

function main () {
	configureDefaults();
	var canvas = document.querySelector("#world");
	canvas.width = window.innerWidth - 16;
	canvas.height = window.innerHeight - 16;
	stage = new createjs.Stage(canvas);
	stage.addEventListener("stagemousedown", handleMouseDown);

	// QuadTree setup
	bounds = new createjs.Rectangle(0, 0, canvas.width, canvas.height);
	// give it the bounds, false means shapes not points, and a depth of 7
	tree = new QuadTree(bounds, false, 7);

	bg = new Environment(bounds);
	stage.addChild(bg);

	initAgents(100);

	info = new Info(bounds, 1);
	stage.addChild(info);

	//createjs.Ticker.setFPS(24);
	createjs.Ticker.timingMode = createjs.Ticker.RAF;
	createjs.Ticker.on("tick", tick);
};

window.onload = main;

