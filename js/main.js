"use strict";

function configureDefaults () {
	// dunno if static typed arrays will play nice so let's keep
	// it simple for now.
	glMatrix.setMatrixArrayType(Array);
};

function handleMouseDown (event) {
	if (!event.primary) { return; }
	// TODO check quadtree and remove agent if click
	// is on an agent
}

function initAgents(num) {
	for (var i = 0; i < num; i++) {
		var shape = new Shape();


// our update function, which gets called by Ticker and then
// calls the stage's update in turn, which draws things
function tick (event) {
	// TODO iterate kinematics
	// TODO update quadtree
	// TODO check for collisions
	stage.update(event);
}

function main () {
	configureDefaults();
	var canvas = document.querySelector("#world");
	canvas.width = 500;
	canvas.height = 500;
	var stage = new Stage(canvas);
	Ticker.setFPS(24);
	stage.addEventListener("stagemousedown", handleMouseDown);

	// QuadTree setup
	var bounds = new Rectangle(0, 0, canvas.width, canvas.height);
	// give it the bounds, false means shapes not points, and a depth of 7
	var tree = new QuadTree(bounds, false, 7);

	initAgents(20);
	
	canvas.addEventListener("mousedown", function (e) {
		console.log(e);
	});
};

window.onload = main;

