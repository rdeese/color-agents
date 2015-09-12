function main () {
	// CONFIGURE DEFAULTS
	// dunno if static typed arrays will play nice so let's keep
	// it simple for now.
	glMatrix.setMatrixArrayType(Array);
	random = new PcgRandom(Date.now());
	createjs.Ticker.setFPS(120);

	var canvas = document.querySelector("#world");
	canvas.width = Math.min(1400, Math.max(window.innerWidth - 20, 1000));
	canvas.height = Math.min(900, Math.max(window.innerHeight - 20, 600));
	var world = new World(canvas);
	world.start();
}

window.onload = main;
