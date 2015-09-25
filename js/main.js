function main () {
	var GLOBAL = {
		WORLD_OFFSET_Y: 58, // pixels
		COMPONENT_MARGIN: 8, // pixels
		NUM_AGENTS: 40,
		INIT_AGENTS_VARIATION: 20,
		NUM_PLANTS: 500,
		DEATH_THRESHHOLD: 800,
		DEATH_DURATION: 4000, // milliseconds
		EATEN_DURATION: 4000, // milliseconds
		COLLISION_PENALTY: 8,

		WORLD_SPEED: 10, // virtual milliseconds per real millisecond
		OBSERVE_MODE_SPEED: 10,
		PRED_MODE_SPEED: 0,
		AUTOPRED_MODE_SPEED: 10,
		TIME: 0, // starts at 0
		DELTA: 0, // just in case

		MATING_PROB: 0.2,
		MUTATION_RATE: 100,
		MOTHER_MUTATION_PROB: 0.1,
		FATHER_MUTATION_PROB: 0.1,
		GESTATION_PD: 20000, // milliseconds
		YOUTH_DURATION: 40000, // milliseconds
		MAX_ACC: 4/100000, // pixels per millisecond
		ACC_DAMPING: 0.999,
		VEL_DAMPING: 0.9999,
		MOVEMENT_PROB: 1/10000, // chance per millisecond
		BLINK_PROB: 1/15000, // chance per millisecond

		AUTOPRED_INTERVAL: 8000, // milliseconds
		
		OBSERVER_PERIOD: 240000, // milliseconds
		PREDATOR_PERIOD: 20000, // milliseconds
		MODE_SWITCH_SPEED: 500,
		MISS_TIME_PENALTY: 20000, // milliseconds
		HIT_THRESHOLD: 30,

		INITIAL_AGENT_OFFSET: 60,
		ENV_VARIATION: 30,

		AGENT_RADIUS: 30,
		BABY_AGENT_RADIUS: 1, // change this once scaling is introduced

		CHROMA: 55,
		LIGHTNESS: 70,
		HUES: ['pink', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'],
		BOUNDS: [0, 10, 35, 85, 100, 190, 280, 325, 361],

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

	var chromaColorToHueName = function (color) {
		var colorName;
		var angle = color.hcl()[0];
		for (var i = 0; i < 8; i++) {
			if (angle >= GLOBAL.BOUNDS[i] && angle < GLOBAL.BOUNDS[i+1]) {
				colorName = GLOBAL.HUES[i];
			}
		}
		return colorName;
	};
	
	var intermediateChromaColor = function (c1, c2) {
		var h1 = c1.hcl()[0];
		var h2 = c2.hcl()[0];
		var diff = h1-h2;
		if (diff > 180) { diff -= 360; }
		if (diff < -180) { diff += 360; }
		return chroma.hcl((h2 + diff/2)%360, GLOBAL.CHROMA, GLOBAL.LIGHTNESS);
	};

	var chromaColorDist = function (c1, c2) {
		var h1 = c1.hcl()[0];
		var h2 = c2.hcl()[0];
		var diff = h1-h2;
		if (diff > 180) { diff -= 360; }
		if (diff < -180) { diff += 360; }
		return diff;
	};

	var averageChromaColor = function (arr) {
		var x = 0;
		var y = 0;
		for (var i = 0; i < arr.length; i++) {
			x += Math.cos(arr[i].hcl()[0]*Math.PI/180);
			y += Math.sin(arr[i].hcl()[0]*Math.PI/180);
		}
		return chroma.hcl((180/Math.PI)*Math.atan2(y,x), GLOBAL.CHROMA, GLOBAL.LIGHTNESS);
	}


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
	canvas.width = Math.min(600, Math.max(window.innerWidth - 20, 200));
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
	world.externalInit = function () {
		this.stage.removeChild(this.bg); // hide the background
		this.stage.removeChild(this.info); // hide the info bar
		var span = document.querySelector("#single-critter-color");
		var color = this.agents[0].color;
		span.textContent = chromaColorToHueName(color);
		span.style.setProperty('color', color.hex());
		this.tickOnce();
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);
	world.externalTick = function () {
		if (!createjs.Tween.hasActiveTweens(this.GLOBAL) && this.agents.length == 0) {
			createjs.Tween.get(this.GLOBAL)
										.to({ WORLD_SPEED: 0 }, 1000)
										.call(function () {
											this.stage.removeAllChildren();
										}, [], this)
										.wait(1000)
										.call(function () {
											this.init();
											this.stage.removeChild(this.bg); // hide the background
											this.stage.removeChild(this.info); // hide the info bar
										}, [], this);
		}
	}.bind(world);

	// critter family interactive
	canvas = document.querySelector("#critter-family");
	canvas.width = Math.min(300, Math.max(window.innerWidth - 20, 200));
	canvas.height = Math.min(200, Math.max(window.innerHeight - 20, 100));
	global = globalClone();
	global.NUM_AGENTS = 2; // two critters!
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.INIT_AGENTS_VARIATION = 120;
	global.FATHER_MUTATION_PROB = 0;
	global.MOTHER_MUTATION_PROB = 0;
	// autoplay
	global.AUTOPLAY = true;
	global.PAUSED = false;
	world = new World(global, canvas);
	world.externalInit = function () {
		this.stage.removeChild(this.bg); // hide the background
		this.stage.removeChild(this.info); // hide the info bar
		var fatherSpan = document.querySelector("#critter-family-father");
		var motherSpan = document.querySelector("#critter-family-mother");
		var childSpan = document.querySelector("#critter-family-child");
		var fatherColor = this.agents[0].color;
		fatherSpan.textContent = chromaColorToHueName(fatherColor);
		fatherSpan.style.setProperty('color', fatherColor.hex());
		var motherColor = this.agents[1].color;
		motherSpan.textContent = chromaColorToHueName(motherColor);
		motherSpan.style.setProperty('color', motherColor.hex());
		var childColor = intermediateChromaColor(motherColor, fatherColor);
		childSpan.textContent = chromaColorToHueName(childColor);
		childSpan.style.setProperty('color', childColor.hex());
		this.tickOnce();
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);
	world.externalTick = function () {
		if (!createjs.Tween.hasActiveTweens(this.GLOBAL) &&
				(this.agents.filter(function (x) { return x.scaleX > 0.7 && x.scaleX < 0.8}).length >= 1 ||
				this.agents.length < 2)) {
			createjs.Tween.get(this.GLOBAL)
										.to({ WORLD_SPEED: 0 }, 1000)
										.wait(1000)
										.call(function () {
											this.stage.removeAllChildren();
										}, [], this)
										.wait(1000)
										.call(function () {
											this.init();
										}, [], this);
		}
	}.bind(world);

	// critter family interactive with MUTATION
	canvas = document.querySelector("#critter-m-family");
	canvas.width = Math.min(300, Math.max(window.innerWidth - 20, 200));
	canvas.height = Math.min(200, Math.max(window.innerHeight - 20, 100));
	global = globalClone();
	global.NUM_AGENTS = 2; // two critters!
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.INIT_AGENTS_VARIATION = 0;
	global.FATHER_MUTATION_PROB = 1;
	global.MOTHER_MUTATION_PROB = 0;
	global.MUTATION_RATE = 100;
	// autoplay
	global.AUTOPLAY = true;
	global.PAUSED = false;
	world = new World(global, canvas);
	world.externalInit = function () {
		this.stage.removeChild(this.bg); // hide the background
		this.stage.removeChild(this.info); // hide the info bar
		var fatherSpan = document.querySelector("#critter-m-family-father");
		//var motherSpan = document.querySelector("#critter-m-family-mother");
		var childSpan = document.querySelector("#critter-m-family-child");
		var fatherColor = this.agents[0].color;
		fatherSpan.textContent = chromaColorToHueName(fatherColor);
		fatherSpan.style.setProperty('color', fatherColor.hex());
		var motherColor = this.agents[1].color;
		//motherSpan.textContent = chromaColorToHueName(motherColor);
		//motherSpan.style.setProperty('color', motherColor.hex());
		var childColor = intermediateChromaColor(motherColor, fatherColor);
		childSpan.textContent = chromaColorToHueName(childColor);
		childSpan.style.setProperty('color', childColor.hex());
		this.tickOnce();
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);
	world.externalTick = function () {
		if (!createjs.Tween.hasActiveTweens(this.GLOBAL) &&
				(this.agents.filter(function (x) { return x.scaleX > 0.7 && x.scaleX < 0.8}).length >= 1 ||
				this.agents.length < 2)) {
			createjs.Tween.get(this.GLOBAL)
										.to({ WORLD_SPEED: 0 }, 1000)
										.wait(1000)
										.call(function () {
											this.stage.removeAllChildren();
										}, [], this)
										.wait(2000)
										.call(function () {
											this.init();
										}, [], this);
		}
	}.bind(world);

	// critter observation interactive
	canvas = document.querySelector("#critter-observe");
	canvas.width = 800;
	canvas.height = 400;
	//canvas.width = Math.min(1400, Math.max(window.innerWidth - 20, 1000));
	//canvas.height = Math.min(900, Math.max(window.innerHeight - 20, 600));
	global = globalClone();
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.NUM_AGENTS = 4;
	global.INITIAL_AGENT_OFFSET = 100; // same color as controls
	world = new World(global, canvas);
	world.externalInit = function () {
		//this.stage.removeChild(this.bg); // hide the background
		this.info.removeChild(this.info.toggleMode);
		this.info.removeChild(this.info.detailViewer);
		var startSpan = document.querySelector("#critter-observe-start");
		var startColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
		startSpan.textContent = chromaColorToHueName(startColor);
		startSpan.style.setProperty('color', startColor.hex());
		this.tickOnce();
	}.bind(world);
	world.externalTick = function (e) {
		if (e.WILL_DRAW) {
			var endSpan = document.querySelector("#critter-observe-end");
			var endColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
			endSpan.textContent = chromaColorToHueName(endColor);
			endSpan.style.setProperty('color', endColor.hex());
		}
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);

	// critter observation interactive
	var hue = random.number()*360;
	// LEFT ONE
	canvas = document.querySelector("#critter-hunt-left");
	canvas.width = 480;
	canvas.height = 600;
	global = globalClone();
	global.OBSERVER_PERIOD = Infinity; // no time-based change
	global.PREDATOR_PERIOD = Infinity; // no time-based change
	global.NUM_AGENTS = 20;
	global.WORLD_OFFSET_Y = 0; // no info bar
	global.INITIAL_AGENT_OFFSET = 180; // v. obvious critters
	global.MODE_SWITCH_SPEED = 200; // fast mode switch
	// autoplay
	global.AUTOPLAY = true;
	global.PAUSED = false;
	world = new World(global, canvas, hue);
	world.externalInit = function () {
		//this.stage.removeChild(this.bg); // hide the background
		this.stage.removeChild(this.info);
		var envSpan = document.querySelector("#critter-hunt-left-env");
		var envColor = this.bg.color;
		envSpan.textContent = chromaColorToHueName(envColor);
		envSpan.style.setProperty('color', envColor.hex());
		var critterSpan = document.querySelector("#critter-hunt-left-critter");
		var critterColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
		critterSpan.textContent = chromaColorToHueName(critterColor);
		critterSpan.style.setProperty('color', critterColor.hex());
		this.tickOnce();
	}.bind(world);
	world.externalTick = function (e) {
		if (e.WILL_DRAW) {
			var hitSpan = document.querySelector("#critter-hunt-left-hits");
			var missSpan = document.querySelector("#critter-hunt-left-misses");
			hitSpan.textContent = this.info.lifetimeHits;
			missSpan.textContent = this.info.lifetimeMisses;
		}
	}.bind(world);
	world.init();
	world.stage.enableMouseOver();
	world.stage.on("rollover", function (e) {
		console.log("mouseover");
		this.info.setPredatorMode();
	}, world);
	world.stage.on("rollout", function (e) {
		console.log("mouseout");
		this.info.setObserverMode();
	}, world);
	world.start();
	interactives.push(world);
	// RIGHT ONE
	canvas = document.querySelector("#critter-hunt-right");
	canvas.width = 480;
	canvas.height = 600;
	global = globalClone();
	global.OBSERVER_PERIOD = Infinity; // no time-based change
	global.PREDATOR_PERIOD = Infinity; // no time-based change
	global.NUM_AGENTS = 20;
	global.WORLD_OFFSET_Y = 0; // no info bar
	global.INITIAL_AGENT_OFFSET = 0; // v. hidden critters
	global.MODE_SWITCH_SPEED = 100; // fast mode switch
	// autoplay
	global.AUTOPLAY = true;
	global.PAUSED = false;
	world = new World(global, canvas, hue);
	world.externalInit = function () {
		this.stage.removeChild(this.info);
		//var envSpan = document.querySelector("#critter-hunt-right-env");
		//var envColor = this.bg.color;
		//envSpan.textContent = chromaColorToHueName(envColor);
		//envSpan.style.setProperty('color', envColor.hex());
		var critterSpan = document.querySelector("#critter-hunt-right-critter");
		var critterColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
		critterSpan.textContent = chromaColorToHueName(critterColor);
		critterSpan.style.setProperty('color', critterColor.hex());
		this.tickOnce();
	}.bind(world);
	world.externalTick = function (e) {
		if (e.WILL_DRAW) {
			var hitSpan = document.querySelector("#critter-hunt-right-hits");
			var missSpan = document.querySelector("#critter-hunt-right-misses");
			hitSpan.textContent = this.info.lifetimeHits;
			missSpan.textContent = this.info.lifetimeMisses;
		}
	}.bind(world);
	world.init();
	world.stage.enableMouseOver();
	world.stage.on("rollover", function (e) {
		console.log("mouseover");
		this.info.setPredatorMode();
	}, world);
	world.stage.on("rollout", function (e) {
		console.log("mouseout");
		this.info.setObserverMode();
	}, world);
	world.start();
	interactives.push(world);

	// sandbox
	canvas = document.querySelector("#selection");
	canvas.width = 1000;
	canvas.height = 800;
	global = globalClone();
	global.INIT_AGENTS_VARIATION = 50;
	
	world = new World(global, canvas,
										GLOBAL.BOUNDS[random.integer(GLOBAL.BOUNDS.length)], true)
									
	world.decadeCounter = 1;
	world.externalTick = function () {
		if (this.info.round <= 10 && this.info.round == this.decadeCounter) {
			var avgColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
			var span = document.querySelector("#critter-decade-"+this.decadeCounter);
			span.textContent = chromaColorToHueName(avgColor);
			span.style.setProperty('color', avgColor.hex());
			if (this.info.round > 1) {
				span = document.querySelector("#last-year");
				span.textContent = this.decadeCounter.toString();
				var spans = document.querySelectorAll("#critter-decade-end-critter");
				for (var i = 0; i < spans.length; i++) {
					var span = spans[i];
					var avgColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
					span.textContent = chromaColorToHueName(avgColor);
					span.style.setProperty('color', avgColor.hex());
				}
				setTimeout(function () {
					this.after = document.querySelector("#selection-after").getContext('2d');
					this.after.canvas.width = this.bg.bounds.width/2.105;
					this.after.canvas.height = this.bg.bounds.height/2.105;
					this.after.drawImage(this.stage.canvas, 0, this.GLOBAL.WORLD_OFFSET_Y,
															 this.bg.bounds.width, this.bg.bounds.height,
															 0, 0, this.bg.bounds.width/2.105,
															 this.bg.bounds.height/2.105);
				}.bind(this), 1000);
			}
			this.decadeCounter++;
		}
		if (!this.before) {
			this.before = document.querySelector("#selection-before").getContext('2d');
			this.before.canvas.width = this.bg.bounds.width/2.105;
			this.before.canvas.height = this.bg.bounds.height/2.105;
			this.before.drawImage(this.stage.canvas, 0, this.GLOBAL.WORLD_OFFSET_Y,
													  this.bg.bounds.width, this.bg.bounds.height,
													  0, 0, this.bg.bounds.width/2.105,
														this.bg.bounds.height/2.105);
		}
	}.bind(world);
	world.externalInit = function () {
		this.decadeCounter = 1;
		for (var i = 1; i <= 10; i++) {
			var span = document.querySelector("#critter-decade-"+i);
			span.textContent = "???";
			span.style.setProperty('color', "#000000");
		}
		var avgColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
		var envColor = this.bg.color;
		var lmColor = chroma.hcl(avgColor.hcl()[0]-0.75*this.GLOBAL.MUTATION_RATE,
														 this.GLOBAL.CHROMA,
														 this.GLOBAL.LIGHTNESS);
		var rmColor = chroma.hcl(avgColor.hcl()[0]+0.75*this.GLOBAL.MUTATION_RATE,
														 this.GLOBAL.CHROMA,
														 this.GLOBAL.LIGHTNESS);
		var closerMColor, furtherMColor;
		if (Math.abs(chromaColorDist(lmColor, envColor)) >
				Math.abs(chromaColorDist(rmColor, envColor))) {
			closerMColor = rmColor;
			furtherMColor = lmColor;
		} else {
			closerMColor = lmColor;
			furtherMColor = rmColor;
		}
		spans = document.querySelectorAll("#critter-decade-env");
		for (var i = 0; i < spans.length; i++) {
			var span = spans[i];
			span.textContent = chromaColorToHueName(envColor);
			span.style.setProperty('color', envColor.hex());
		}
		var spans = document.querySelectorAll("#critter-decade-start-critter");
		for (var i = 0; i < spans.length; i++) {
			var span = spans[i];
			span.textContent = chromaColorToHueName(avgColor);
			span.style.setProperty('color', avgColor.hex());
		}
		var spans = document.querySelectorAll("#critter-decade-closer-m-critter");
		for (var i = 0; i < spans.length; i++) {
			var span = spans[i];
			span.textContent = chromaColorToHueName(closerMColor);
			span.style.setProperty('color', closerMColor.hex());
		}
		var spans = document.querySelectorAll("#critter-decade-further-m-critter");
		for (var i = 0; i < spans.length; i++) {
			var span = spans[i];
			span.textContent = chromaColorToHueName(furtherMColor);
			span.style.setProperty('color', furtherMColor.hex());
		}
		var spans = document.querySelectorAll("#critter-decade-end-critter");
		for (var i = 0; i < spans.length; i++) {
			var span = spans[i];
			span.textContent = "???";
			span.style.setProperty('color', "#000000");
		}
		var spans = document.querySelectorAll("#last-year");
		for (var i = 0; i < spans.length; i++) {
			var span = spans[i];
			span.textContent = "???";
		}
		if (this.before) {
			this.before.clearRect(0, 0, this.before.canvas.width,
														this.before.canvas.height);
			console.log("clearing rect");
		}
		this.before = null;
		if (this.after) {
			this.after.clearRect(0, 0, this.after.canvas.width,
													 this.after.canvas.height);
			console.log("clearing after rect");
		}
		this.after = null;
	}.bind(world);
	world.init();
	world.tickOnce();
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
