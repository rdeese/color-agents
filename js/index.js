function main () {
	var GLOBAL = {
		WORLD_OFFSET_Y: 0, // pixels
		COMPONENT_MARGIN: 8, // pixels
		NUM_AGENTS: 40,
		INIT_AGENTS_VARIATIONS: [20, 0],
		NUM_PLANTS: 500,
		DEATH_THRESHHOLD: 800,
		DEATH_DURATION: 4000, // milliseconds
		EATEN_DURATION: 4000, // milliseconds
		COLLISION_PENALTY: 8,

		WORLD_SPEED: 10, // virtual milliseconds per real millisecond
		OBSERVE_MODE_SPEED: 10,
		PRED_MODE_SPEED: 1,
		AUTOPRED_MODE_SPEED: 10,
		TIME: 0, // starts at 0
		DELTA: 0, // just in case

		MATING_PROB: 0.25,
		MUTATION_RATES: [100, 0],
		MOTHER_MUTATION_PROBS: [0.1, 0],
		FATHER_MUTATION_PROBS: [0.1, 0],
		GESTATION_PD: 20000, // milliseconds
		YOUTH_DURATION: 40000, // milliseconds
		MAX_ACC: 4/100000, // pixels per millisecond
		ACC_DAMPING: 0.999,
		VEL_DAMPING: 0.9999,
		MOVEMENT_PROB: 1/10000, // chance per millisecond
		BLINK_PROB: 1/15000, // chance per millisecond

		AUTOPRED_INTERVAL: 8000, // milliseconds

		OBSERVER_PERIOD: 240000, // milliseconds
		PREDATOR_PERIOD: 240000, // milliseconds
		MODE_SWITCH_SPEED: 500,
		MISS_TIME_PENALTY: 0, // milliseconds
		HIT_THRESHOLD: 0,

		INITIAL_AGENT_OFFSETS: [60, 0],
		ENV_VARIATIONS: [40, 10],
		RAND_AGENT_VARIATIONS: [0, 5],
		DRAW_ENV_BACKGROUND: true,
		COLOR_FILL: true,

		AGENT_RADIUS: 25,
		MIN_AGENT_RADIUS: 25,
		MAX_AGENT_RADIUS: 25,
		BABY_AGENT_RADIUS: 5,
		PREGNANT_SCALE: 1.2,

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
	GLOBAL.MAX_AGENT_RADIUS = GLOBAL.AGENT_RADIUS + GLOBAL.RAND_AGENT_VARIATIONS[1];

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
	random.normal = function () {
		return (random.number()+random.number()+random.number()+
						random.number()+random.number()+random.number()-3)/3;
	}
	createjs.Ticker.setFPS(120);
	// destroy tween event handling so we can do it ourselves
	createjs.Tween.handleEvent = function () {};

	// INTERACTIVES
	var canvas;
	var interactives = [];
	var world;
	var global;

	// TOP CONFETTI
	canvas = document.querySelector("#confetti-top");
	canvas.width = 1100;
	canvas.height = 200;
	global = globalClone();
	global.NUM_AGENTS = 1; // doesn't matter
	global.WORLD_SPEED = 0;
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.DEATH_THRESHHOLD = Infinity; // doesn't matter
	global.INIT_AGENTS_VARIATIONS[0] = 360;
	global.INITIAL_AGENT_OFFSETS[0] = 0;
	global.MOTHER_MUTATION_PROBS[0] = 0.15;
	global.FATHER_MUTATION_PROBS[0] = 0.15;
	global.MOVEMENT_PROB = 0;
	global.ACC_DAMPING = 0;
	global.VEL_DAMPING = 0;
	global.PREGNANT_SCALE = 1;
	global.PAUSED = true;

	world = new World(global, canvas, [null, GLOBAL.AGENT_RADIUS],
																		[null, GLOBAL.AGENT_RADIUS]);
	world.externalInit = function () {
		this.bg.sunAngle = Math.PI/2;
		this.bg.removeChild(this.bg.bg);
		this.bg.removeChild(this.bg.darkness);
		this.stage.removeChild(this.info); // hide the info bar

		this.bg.agentContainer.removeAllChildren();
		this.agents = [];
		var sample = poissonDiscSampler(canvas.width, canvas.height,
																		2*this.GLOBAL.MAX_AGENT_RADIUS,
																		this.GLOBAL.MAX_AGENT_RADIUS);
		// make children
		for (var i = 0; i < 100; i++) {
			var pos = sample();
			if (!pos) { break; }

			var a = new Agent(this.GLOBAL, this.bg.bounds,
														 pos, vec2.create(),
														 [this.critterGenome[0]+
														  this.GLOBAL.INIT_AGENTS_VARIATIONS[0]*(random.number()-0.5),
															this.critterGenome[1]+
															this.GLOBAL.INIT_AGENTS_VARIATIONS[1]*(random.number()-0.5)]);
			a.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION*Math.sqrt(random.number());
			a.update({WILL_DRAW: true});
			this.bg.agentContainer.addChild(a);
			this.agents.push(a);
		}
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);

	// single critter interactive
	canvas = document.querySelector("#single-critter");
	canvas.width = 600;
	canvas.height = 200;
	global = globalClone();
	global.PAGE_COLOR = canvas.closest("block").style.backgroundColor;
	global.NUM_AGENTS = 1; // just one critter
	global.DEATH_THRESHHOLD = 150; // lower death threshhold so things happen faster
	global.OBSERVER_PERIOD = Infinity; // no predator period
	// global.INITIAL_AGENT_OFFSETS[0] = 0; // same color as controls
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	// autoplay
	global.AUTOPLAY = true;
	world = new World(global, canvas, [null, null], [null, GLOBAL.AGENT_RADIUS]);
	world.externalInit = function () {
		this.stage.alpha = 0;
		this.bg.sunAngle = Math.PI/2;
		this.bg.removeChild(this.bg.bg);
		this.bg.removeChild(this.bg.darkness);
		this.stage.removeChild(this.info); // hide the info bar
		var span = document.querySelector("#single-critter-color");
		var color = this.agents[0].color;
		span.textContent = chromaColorToHueName(color);
		span.style.setProperty('color', color.hex());

		var t = new createjs.Tween.get(this.stage)
															.to({ alpha: 1 }, 5000);
		this.GLOBAL.TIMELINE.push(t);
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);
	world.externalTick = function () {
		if (!this.foobar && this.agents.length == 0) {
			this.foobar = true;
			var t = createjs.Tween.get(this.GLOBAL)
														.to({ WORLD_SPEED: 1 }, 1000)
														.call(function () {
															this.stage.removeAllChildren();
														}, [], this)
														.wait(500)
														.call(function () {
															this.init();
															this.foobar = false;
														}, [], this);
			this.GLOBAL.TIMELINE.push(t);
		}
	}.bind(world);

	// critter family interactive
	canvas = document.querySelector("#critter-family");
	canvas.width = 300;
	canvas.height = 200;
	global = globalClone();
	global.PAGE_COLOR = canvas.closest("block").style.backgroundColor;
	global.NUM_AGENTS = 2; // two critters!
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.DEATH_THRESHHOLD = Infinity; // can't die!
	global.INIT_AGENTS_VARIATIONS[0] = 90;
	global.FATHER_MUTATION_PROBS[0] = 0;
	global.MOTHER_MUTATION_PROBS[0] = 0;
	global.MATING_PROB = 1;
	// autoplay
	global.AUTOPLAY = true;
	world = new World(global, canvas, [null, null], [null, GLOBAL.AGENT_RADIUS]);
	world.externalInit = function () {
		this.stage.alpha = 0;
		this.bg.sunAngle = Math.PI/2;
		this.GLOBAL.MATING_PROB = 1;
		this.bg.removeChild(this.bg.bg);
		this.bg.removeChild(this.bg.darkness);
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

		var t = new createjs.Tween.get(this.stage)
															.to({ alpha: 1 }, 5000);
		this.GLOBAL.TIMELINE.push(t);
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);
	world.externalTick = function () {
		if (this.agents.length > 2) {
			this.GLOBAL.MATING_PROB = 0;
		}
		if (!this.foobar &&
				(this.agents.filter(function (x) { return x.scaleX > 0.7 && x.scaleX < 0.8}).length >= 1 ||
				this.agents.length < 2)) {
			this.foobar = true;
			var t = createjs.Tween.get(this.GLOBAL)
														.to({ WORLD_SPEED: 1 }, 10000)
														.call(function () {
															var t = new createjs.Tween.get(this.stage)
																												.to({ alpha: 0 }, 500)
																												.wait(500)
																												.call(function () {
																													this.init();
																													this.foobar = false;
																												}, [], this);
															this.GLOBAL.TIMELINE.push(t);
														}, [], this);
			this.GLOBAL.TIMELINE.push(t);
		}
	}.bind(world);

	// critter family interactive with MUTATION
	canvas = document.querySelector("#critter-m-family");
	canvas.width = 300;
	canvas.height = 200;
	global = globalClone();
	global.PAGE_COLOR = canvas.closest("block").style.backgroundColor;
	global.NUM_AGENTS = 2; // two critters!
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.DEATH_THRESHHOLD = Infinity; // can't die!
	global.INIT_AGENTS_VARIATIONS[0] = 0;
	global.FATHER_MUTATION_PROBS[0] = 1;
	global.MOTHER_MUTATION_PROBS[0] = 0;
	global.MUTATION_RATES[0] = 100;
	global.MATING_PROB = 1;
	// autoplay
	global.AUTOPLAY = true;
	world = new World(global, canvas, [null, null], [null, GLOBAL.AGENT_RADIUS]);
	world.externalInit = function () {
		this.stage.alpha = 0;
		this.bg.sunAngle = Math.PI/2;
		this.bg.removeChild(this.bg.bg);
		this.bg.removeChild(this.bg.darkness);
		this.stage.removeChild(this.info); // hide the info bar
		this.GLOBAL.MATING_PROB = 1;
		var fatherSpan = document.querySelector("#critter-m-family-father");
		//var motherSpan = document.querySelector("#critter-m-family-mother");
		//var childSpan = document.querySelector("#critter-m-family-child");
		var fatherColor = this.agents[0].color;
		fatherSpan.textContent = chromaColorToHueName(fatherColor);
		fatherSpan.style.setProperty('color', fatherColor.hex());
		var motherColor = this.agents[1].color;
		//motherSpan.textContent = chromaColorToHueName(motherColor);
		//motherSpan.style.setProperty('color', motherColor.hex());
		//var childColor = intermediateChromaColor(motherColor, fatherColor);
		//childSpan.textContent = chromaColorToHueName(childColor);
		//childSpan.style.setProperty('color', childColor.hex());

		var t = new createjs.Tween.get(this.stage)
															.to({ alpha: 1 }, 5000);
		this.GLOBAL.TIMELINE.push(t);
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);
	world.externalTick = function () {
		if (this.agents.length > 2) {
			this.GLOBAL.MATING_PROB = 0;
		}
		if (!this.foobar &&
				(this.agents.filter(function (x) { return x.scaleX > 0.7 && x.scaleX < 0.8}).length >= 1 ||
				this.agents.length < 2)) {
			this.foobar = true;
			var t = createjs.Tween.get(this.GLOBAL)
														.to({ WORLD_SPEED: 1 }, 10000)
														.call(function () {
															var t = new createjs.Tween.get(this.stage)
																												.to({ alpha: 0 }, 500)
																												.wait(500)
																												.call(function () {
																													this.init();
																													this.foobar = false;
																												}, [], this);
															this.GLOBAL.TIMELINE.push(t);
														}, [], this);
			this.GLOBAL.TIMELINE.push(t);
		}
	}.bind(world);

	// PREDATOR
	canvas = document.querySelector("#predator");
	canvas.width = 600;
	canvas.height = 300;
	global = globalClone();
	global.NUM_AGENTS = 20; // doesn't matter
	global.WORLD_SPEED = 0;
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.DEATH_THRESHHOLD = Infinity; // doesn't matter
	global.INIT_AGENTS_VARIATIONS[0] = 360;
	global.INITIAL_AGENT_OFFSETS[0] = 0;
	global.MOTHER_MUTATION_PROBS[0] = 0.15;
	global.FATHER_MUTATION_PROBS[0] = 0.15;
	global.MOVEMENT_PROB = 0;
	global.ACC_DAMPING = 0;
	global.VEL_DAMPING = 0;
	global.PREGNANT_SCALE = 1;
	global.PAUSED = true;

	world = new World(global, canvas, [null, GLOBAL.AGENT_RADIUS],
																		[null, GLOBAL.AGENT_RADIUS]);
	world.externalInit = function () {
		this.bg.sunAngle = Math.PI/2;
		this.bg.removeChild(this.bg.bg);
		this.bg.removeChild(this.bg.darkness);
		this.stage.removeChild(this.info); // hide the info bar
		this.predator.pos[0] = canvas.width/2;
		this.predator.pos[1] = canvas.height/2-80;
		this.predator.heading = 90+(random.number()-0.5)*20;
		// kill and pile up agents
		var a;
		var angle;
		var radius;
		for (var i = 0; i < this.agents.length; i++) {
			a = this.agents[i];
			a.isDying = true;
			angle = random.number()*2*Math.PI;
			radius = Math.sqrt(random.number())*this.predator.radius/2.5;
			a.pos = vec2.fromValues(this.predator.pos[0]+Math.cos(angle)*radius,
															this.predator.pos[1]+2*this.predator.radius+
															Math.sin(angle)*radius);
		}
		// left side
		for (var i = 0; i < 3; i++) {
			var p = new Predator(this.GLOBAL, this.predator.worldBounds,
													 20+(random.number()-0.5)*5);
			angle = Math.PI/180*(220-30*i+10*(random.number()-0.5));
			radius = this.predator.radius*2;
			p.x = this.predator.pos[0]+Math.cos(angle)*radius;
			p.y = this.predator.pos[1]+2*this.predator.radius+Math.sin(angle)*radius;
			p.rotation = angle*180/Math.PI-180+(random.number()-0.5)*15;
			this.bg.predatorContainer.addChild(p);
		}
		for (var i = 0; i < 3; i++) {
			var p = new Predator(this.GLOBAL, this.predator.worldBounds,
													 20+(random.number()-0.5)*5);
			angle = Math.PI/180*(320+30*i+10*(random.number()-0.5));
			radius = this.predator.radius*2;
			p.x = this.predator.pos[0]+Math.cos(angle)*radius;
			p.y = this.predator.pos[1]+2*this.predator.radius+Math.sin(angle)*radius;
			p.rotation = angle*180/Math.PI-180+(random.number()-0.5)*15;
			this.bg.predatorContainer.addChild(p);
		}
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);

	// SELECTION
	canvas = document.querySelector("#selection");
	canvas.width = 1100;
	canvas.height = 600;
	global = globalClone();
	global.PAGE_COLOR = canvas.closest("block").style.backgroundColor;
	global.WORLD_SPEED = 12;
	global.INIT_AGENTS_VARIATIONS[0] = 40;

	world = new World(global, canvas,
										[GLOBAL.BOUNDS[random.integer(GLOBAL.BOUNDS.length)],
										 GLOBAL.AGENT_RADIUS],
										['split', 'relative']);

	world.yearCounter = 1;
	world.externalTick = function () {
		if (this.info.year <= 10 && this.bg.sunAngle > Math.PI/2 &&
				this.info.year == this.yearCounter) {
			var avgColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
			var span = document.querySelector("#critter-decade-"+this.yearCounter);
			span.closest(".ten-across").style.display = "block";
			span.textContent = chromaColorToHueName(avgColor);
			span.style.setProperty('color', avgColor.hex());
			if (this.info.year > 1) {
				var spans = document.querySelectorAll("#last-year");
				for (var i = 0; i < spans.length; i++) {
					var span = spans[i];
          span.textContent = this.yearCounter.toString();
        }
				spans = document.querySelectorAll("#critter-decade-end-critter");
				for (var i = 0; i < spans.length; i++) {
					var span = spans[i];
					var avgColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
					span.textContent = chromaColorToHueName(avgColor);
					span.style.setProperty('color', avgColor.hex());
				}
				this.after = document.querySelector("#selection-after").getContext('2d');
				this.after.canvas.width = this.bg.bounds.width/2.1;
				this.after.canvas.height = this.bg.bounds.height/2.1;
				this.after.drawImage(this.stage.canvas, 0, this.GLOBAL.WORLD_OFFSET_Y,
														 this.bg.bounds.width, this.bg.bounds.height,
														 0, 0, this.bg.bounds.width/2.1,
														 this.bg.bounds.height/2.1);
			}
			this.yearCounter++;
		}
		if (!this.before && this.bg.sunAngle > Math.PI/2) {
			this.before = document.querySelector("#selection-before").getContext('2d');
			this.before.canvas.width = this.bg.bounds.width/2.1;
			this.before.canvas.height = this.bg.bounds.height/2.1;
			this.before.drawImage(this.stage.canvas, 0, this.GLOBAL.WORLD_OFFSET_Y,
													  this.bg.bounds.width, this.bg.bounds.height,
													  0, 0, this.bg.bounds.width/2.1,
														this.bg.bounds.height/2.1);
		}
		var restOfContent = document.querySelector("#hidden-until-selection-game")
		var huntProgressSpan = document.querySelector("#selection-hunt-progress")
		var progressBlocker = document.querySelector("#post-hunt-progress-blocker");
		var requiredHits = 150;
		if (this.info.lifetimeHits >= requiredHits) {
      if (restOfContent.style.display == "none") {
        restOfContent.style.display = "block";
				progressBlocker.style.display = "none";
      }
			huntProgressSpan.innerHTML = "Way to go! You found <b>" +
                                   this.info.lifetimeHits +
                                   "</b> critters.";
		} else {
			huntProgressSpan.innerHTML = "Keep going! Only <b>" +
																	 (requiredHits - this.info.lifetimeHits) +
																	 "</b> critters to go.";
		}
	}.bind(world);
	world.externalInit = function () {
		this.yearCounter = 1;
		for (var i = 1; i <= 10; i++) {
			var span = document.querySelector("#critter-decade-"+i);
			span.textContent = "???";
			span.style.setProperty('color', chroma.hcl(0, 0, this.GLOBAL.LIGHTNESS).hex());
		}
		var avgColor = averageChromaColor(this.agents.map(function (x) { return x.color; }));
		var envColor = this.bg.color;
		var lmColor = chroma.hcl(avgColor.hcl()[0]-0.45*this.GLOBAL.MUTATION_RATES[0],
														 this.GLOBAL.CHROMA,
														 this.GLOBAL.LIGHTNESS);
		var rmColor = chroma.hcl(avgColor.hcl()[0]+0.45*this.GLOBAL.MUTATION_RATES[0],
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
			span.style.setProperty('color', chroma.hcl(0, 0, this.GLOBAL.LIGHTNESS).hex());
		}
		var spans = document.querySelectorAll("#last-year");
		for (var i = 0; i < spans.length; i++) {
			var span = spans[i];
			span.textContent = "???";
		}
		if (this.before) {
			this.before.clearRect(0, 0, this.before.canvas.width,
														this.before.canvas.height);
		}
		this.before = null;
		if (this.after) {
			this.after.clearRect(0, 0, this.after.canvas.width,
													 this.after.canvas.height);
		}
		this.after = null;
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);

	// set background color of page to desaturated color of this env
	var blocks = document.querySelectorAll("block");
	var bgColor = chroma.hcl(world.envGenome[0],
													 GLOBAL.CHROMA/5,
													 GLOBAL.LIGHTNESS).brighten(1).hex();
	for (var i = 0; i < blocks.length; i++) {
		if (i % 2 == 0) {
			blocks[i].style.backgroundColor = bgColor;
		}
	}


	// TRIPTYCH OF MUTATION, SELECTION, INHERITANCE
	// MUTATION
	canvas = document.querySelector("#triptych-mutation");
	canvas.width = 350;
	canvas.height = 600;
	global = globalClone();
	global.NUM_AGENTS = 1; // doesn't matter
	global.WORLD_SPEED = 0;
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.DEATH_THRESHHOLD = Infinity; // doesn't matter
	global.INIT_AGENTS_VARIATIONS[0] = 0;
	global.INITIAL_AGENT_OFFSETS[0] = 0;
	global.MOTHER_MUTATION_PROBS[0] = 0.15;
	global.FATHER_MUTATION_PROBS[0] = 0.15;
	global.PREGNANT_SCALE = 1;
	global.MOVEMENT_PROB = 0;
	global.ACC_DAMPING = 0;
	global.VEL_DAMPING = 0;
	global.PAUSED = true;

	var selectionWorldEnvGenome = world.envGenome;
	var selectionWorldCritterGenome = world.critterGenome;
	world = new World(global, canvas, selectionWorldEnvGenome,
																		selectionWorldCritterGenome);
	world.externalInit = function () {
		this.bg.sunAngle = Math.PI/2;
		// this.stage.removeChild(this.bg); // hide the background
		this.stage.removeChild(this.info); // hide the info bar

		// create agents and replace old ones!
		this.bg.agentContainer.removeAllChildren();
		this.agents = [];
		var sample = poissonDiscSampler(canvas.width, canvas.height,
																		2*this.GLOBAL.MAX_AGENT_RADIUS,
																		this.GLOBAL.MAX_AGENT_RADIUS);
		var father = new Agent(this.GLOBAL, this.bg.bounds,
													 sample(), vec2.create(),
													 [this.critterGenome[0]+
														this.GLOBAL.INIT_AGENTS_VARIATIONS[0]*(random.number()-0.5),
														this.critterGenome[1]+
														this.GLOBAL.INIT_AGENTS_VARIATIONS[1]*(random.number()-0.5)]);
		father.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION;
		father.update({WILL_DRAW: true});
		this.bg.agentContainer.addChild(father);
		this.agents.push(father);
		var mother = new Agent(this.GLOBAL, this.bg.bounds,
													 sample(), vec2.create(),
													 [this.critterGenome[0]+
														this.GLOBAL.INIT_AGENTS_VARIATIONS[0]*(random.number()-0.5),
														this.critterGenome[1]+
														this.GLOBAL.INIT_AGENTS_VARIATIONS[1]*(random.number()-0.5)]);
		mother.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION;
		mother.update({WILL_DRAW: true});
		this.bg.agentContainer.addChild(mother);
		this.agents.push(mother);

		// make children
		for (var i = 0; i < 100; i++) {
			var pos = sample();
			if (!pos) { break; }

			mother.motherChild(null, father.genome);
			var a = new Agent(this.GLOBAL, this.bg.bounds,
														 pos, vec2.create(),
														 [mother.childGenome[0], mother.childGenome[1]]);
			mother.isPregnant = false;
			mother.childGenome = null;
			a.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION/2;
			a.update({WILL_DRAW: true});
			this.bg.agentContainer.addChild(a);
			this.agents.push(a);
		}
		// reset mother size
		createjs.Tween.get(mother, { override: true })
									.to({ scaleX: 1, scaleY: 1 }, 10);
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);

	canvas = document.querySelector("#triptych-selection");
	canvas.width = 350;
	canvas.height = 600;
	global = globalClone();
	global.NUM_AGENTS = 70; // doesn't matter
	global.WORLD_SPEED = 0;
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.DEATH_THRESHHOLD = Infinity; // doesn't matter
	global.INIT_AGENTS_VARIATIONS[0] = 0;
	global.INITIAL_AGENT_OFFSETS[0] = 0;
	global.PREGNANT_SCALE = 1;
	global.MOVEMENT_PROB = 0;
	global.ACC_DAMPING = 0;
	global.VEL_DAMPING = 0;
	global.PAUSED = true;

	var mutationWorldAgentsEncoding = world.encodedAgents;
	var mutationWorldSavedTime = world.savedTime;
	world = new World(global, canvas, selectionWorldEnvGenome,
																		selectionWorldCritterGenome);
	world.externalInit = function () {
		this.bg.sunAngle = Math.PI/2;
		this.stage.removeChild(this.info); // hide the info bar

		// get agents from mutation pane
		this.savedTime = mutationWorldSavedTime;
		this.encodedAgents = mutationWorldAgentsEncoding;
		this.restoreState();

		// autopredator vars
		var a;
		var max = 0;
		var target = null;
		var diff = 0;
		var safe = 20;

		// kill a bunch of them with the autopredator
		for (var i = 0; i < this.agents.length; i++) {
			a = this.agents[i];
			diff = a.genome[0]-this.envGenome[0];
			if (diff > 180) { diff -= 360; }
			if (diff < -180) { diff += 360; }
			diff = Math.abs(diff);
			if (diff > safe && random.number() < diff/70) {
				a.isDying = true;
			}
		}

		this.GLOBAL.TIME += this.GLOBAL.YOUTH_DURATION;
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);

	canvas = document.querySelector("#triptych-inheritance");
	canvas.width = 350;
	canvas.height = 600;
	global = globalClone();
	global.NUM_AGENTS = 70; // doesn't matter
	global.WORLD_SPEED = 0;
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.DEATH_THRESHHOLD = Infinity; // doesn't matter
	global.INIT_AGENTS_VARIATIONS[0] = 0;
	global.INITIAL_AGENT_OFFSETS[0] = 0;
	global.PREGNANT_SCALE = 1;
	global.MOVEMENT_PROB = 0;
	global.ACC_DAMPING = 0;
	global.VEL_DAMPING = 0;
	global.PAUSED = true;

	var mutationWorldAgentsEncoding = world.encodedAgents;
	var mutationWorldSavedTime = world.savedTime;
	world = new World(global, canvas, selectionWorldEnvGenome,
																		selectionWorldCritterGenome);
	world.externalInit = function () {
		this.bg.sunAngle = Math.PI/2;
		this.stage.removeChild(this.info); // hide the info bar

		// get agents from mutation pane
		this.savedTime = mutationWorldSavedTime;
		this.encodedAgents = mutationWorldAgentsEncoding;
		this.restoreState();

		var livingAdults = this.agents.filter(function (a) {
			return (a.isAdult && !a.isDying);
		});

		// variables for making babies
		var j, k, a, father, mother;

		for (var i = 0; i < this.agents.length; i++) {
			if (this.agents[i].isDying) {
				j = random.integer(livingAdults.length);
				k = random.integer(livingAdults.length);
				while (k == j) {
					k = random.integer(livingAdults.length);
				}
				mother = livingAdults[j];
				father = livingAdults[k];
				mother.motherChild(null, father.genome);
				a = new Agent(this.GLOBAL, this.bg.bounds,
															 vec2.clone(this.agents[i].pos), vec2.create(),
															 [mother.childGenome[0], mother.childGenome[1]]);
				mother.isPregnant = false;
				mother.childGenome = null;
				a.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION/2;
				a.update({WILL_DRAW: true});

				this.bg.agentContainer.removeChild(this.agents[i]);
				this.agents[i] = a;
				this.bg.agentContainer.addChild(a);

				// reset mother size
				createjs.Tween.get(mother, { override: true })
											.to({ scaleX: 1, scaleY: 1 }, 10);
			}
		}
	}.bind(world);
	world.init();
	world.start();
	interactives.push(world);

	canvas = document.querySelector("#confetti-bottom");
	canvas.width = 1100;
	canvas.height = 200;
	global = globalClone();
	global.NUM_AGENTS = 1; // doesn't matter
	global.WORLD_SPEED = 0;
	global.OBSERVER_PERIOD = Infinity; // no predator period
	global.WORLD_OFFSET_Y = 0; // no info bar, so take up the whole canvas
	global.DEATH_THRESHHOLD = Infinity; // doesn't matter
	global.INIT_AGENTS_VARIATIONS[0] = 0;
	global.INITIAL_AGENT_OFFSETS[0] = 0;
	global.PREGNANT_SCALE = 1;
	global.MOVEMENT_PROB = 0;
	global.ACC_DAMPING = 0;
	global.VEL_DAMPING = 0;
	global.PAUSED = true;

	world = new World(global, canvas, selectionWorldEnvGenome,
																		['relative', 'relative']);
	world.externalInit = function () {
		this.bg.sunAngle = Math.PI/2;
		this.bg.removeChild(this.bg.bg);
		this.bg.removeChild(this.bg.darkness);
		this.stage.removeChild(this.info); // hide the info bar

		// create agents and replace old ones!
		this.bg.agentContainer.removeAllChildren();
		this.agents = [];
		var sample = poissonDiscSampler(canvas.width, canvas.height,
																		2*this.GLOBAL.MAX_AGENT_RADIUS,
																		this.GLOBAL.MAX_AGENT_RADIUS);
		var father = new Agent(this.GLOBAL, this.bg.bounds,
													 sample(), vec2.create(),
													 [this.critterGenome[0]+
														this.GLOBAL.INIT_AGENTS_VARIATIONS[0]*(random.number()-0.5),
														this.critterGenome[1]+
														this.GLOBAL.INIT_AGENTS_VARIATIONS[1]*(random.number()-0.5)]);
		father.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION;
		father.update({WILL_DRAW: true});
		this.bg.agentContainer.addChild(father);
		this.agents.push(father);
		var mother = new Agent(this.GLOBAL, this.bg.bounds,
													 sample(), vec2.create(),
													 [this.critterGenome[0]+
														this.GLOBAL.INIT_AGENTS_VARIATIONS[0]*(random.number()-0.5),
														this.critterGenome[1]+
														this.GLOBAL.INIT_AGENTS_VARIATIONS[1]*(random.number()-0.5)]);
		mother.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION;
		mother.update({WILL_DRAW: true});
		this.bg.agentContainer.addChild(mother);
		this.agents.push(mother);

		// make children
		for (var i = 0; i < 100; i++) {
			var pos = sample();
			if (!pos) { break; }

			mother.motherChild(null, father.genome);
			var a = new Agent(this.GLOBAL, this.bg.bounds,
														 pos, vec2.create(),
														 [mother.childGenome[0], mother.childGenome[1]]);
			mother.isPregnant = false;
			mother.childGenome = null;
			a.birthTime = this.GLOBAL.TIME - this.GLOBAL.YOUTH_DURATION*Math.sqrt(random.number());
			a.update({WILL_DRAW: true});
			this.bg.agentContainer.addChild(a);
			this.agents.push(a);
		}
		// reset mother size
		createjs.Tween.get(mother, { override: true })
									.to({ scaleX: 1, scaleY: 1 }, 10);
	}.bind(world);
	world.init();
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
			if (isVisible && w.GLOBAL.AUTOPLAY) {
				w.GLOBAL.PAUSED = false;
			} else {
				w.GLOBAL.PAUSED = true;
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
