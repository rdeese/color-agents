function Info (bounds, hue) {
	this.Container_constructor();
	this.target = null;
	this.bounds = bounds;

	this.lightColor = chroma.hcl(hue, GLOBAL.CHROMA, GLOBAL.LIGHTNESS);
	this.darkColor = chroma.hcl(hue, GLOBAL.CHROMA, GLOBAL.LIGHTNESS).darken(-5);

	// PAUSE BUTTON
	this.togglePause = new createjs.Container();
	this.togglePause.x = 0;
	this.togglePause.y = 0;
	this.togglePause.width = 95;
	this.togglePause.height = 50;

	this.togglePauseBg = new createjs.Shape();
	this.togglePauseBg.x = 0;
	this.togglePauseBg.y = 0;
	this.togglePause.addChild(this.togglePauseBg);

	this.togglePauseLabel = new createjs.Text("", "bold 30px Arial", this.darkColor.hex());
	this.togglePauseLabel.textAlign = "center";
	this.togglePauseLabel.x = this.togglePause.width/2;
	this.togglePauseLabel.y = this.togglePause.height/2-15;
	this.togglePause.addChild(this.togglePauseLabel);

	this.togglePause.on('click', function (e) {
		createjs.Ticker.paused = !createjs.Ticker.paused;
		GLOBAL.DIRTY = true;
	});

	this.addChild(this.togglePause);
	// END PAUSE BUTTON

	// MODE TOGGLE!
	this.toggleMode = new createjs.Container();
	this.toggleMode.x = this.togglePause.width+GLOBAL.COMPONENT_MARGIN;
	this.toggleMode.y = 0;
	this.toggleMode.width = 250;
	this.toggleMode.height = 50;

	this.toggleModeBg = new createjs.Shape();
	this.toggleModeBg.x = 0;
	this.toggleModeBg.y = 0;
	this.toggleMode.addChild(this.toggleModeBg);

	this.toggleModeArrow = new createjs.Text("\u25be", "bold 24px Arial", this.darkColor.hex());
	this.toggleModeArrow.x = this.toggleMode.width - 30;
	this.toggleModeArrow.y = this.toggleMode.height/2-12;
	this.toggleMode.addChild(this.toggleModeArrow);

	this.toggleModeLabel = new createjs.Text("", "bold 24px Arial", this.darkColor.hex());
	this.toggleModeLabel.textAlign = "center";
	this.toggleModeLabel.x = this.toggleMode.width/2;
	this.toggleModeLabel.y = this.toggleMode.height/2-12;
	this.toggleMode.addChild(this.toggleModeLabel);

	this.toggleMode.on('click', function (e) {
		if (mode == 'observer') {
			this.setPredatorMode();
		} else if (mode == 'predator') {
			this.setAutoPredatorMode();
		} else if (mode == 'autopredator') {
			this.setObserverMode();
		}
		this.instructions.y = this.instructions.height/2-this.instructions.getMeasuredHeight()/2;
		allAgentsDirty = true;
		this.drawToggleMode();
	}, this); // callback executes in the scope of Info object

	this.addChild(this.toggleMode);
	// END MODE TOGGLE


	// AGENT VIEWER
	this.detailViewer = new createjs.Container();
	this.detailViewer.width = 300;
	this.detailViewer.height = 50;
	this.detailViewer.x = this.bounds.width-this.detailViewer.width;
	this.detailViewer.y = 0;

	this.bg = new createjs.Shape();
	this.bg.x = 0;
	this.bg.y = 0;
	this.detailViewer.addChild(this.bg);

	this.detailLabel = new createjs.Text("Last kill:", "bold 24px Arial", this.darkColor.hex());
	this.detailLabel.textAlign = 'center';
	this.detailLabel.x = this.detailViewer.width/2;
	this.detailLabel.y = this.detailViewer.height/2-12;
	this.detailViewer.addChild(this.detailLabel);

	this.phenotypeCircle = new createjs.Shape();
	this.phenotypeCircle.x = this.detailViewer.width/2 +
													 this.detailLabel.getMeasuredWidth()/2 +
													 20;
	this.phenotypeCircle.y = this.detailViewer.height/2;
	this.detailViewer.addChild(this.phenotypeCircle);

	this.addChild(this.detailViewer);
	// END AGENT VIEWER

	// INSTRUCTIONS
	this.instructions = new createjs.Text("Click on a critter to get some info about it.",
																				"bold 20px Arial", this.lightColor.hex());
	this.instructions.width = this.bounds.width -
														this.togglePause.width -
														this.toggleMode.width -
														this.detailViewer.width -
														3*GLOBAL.COMPONENT_MARGIN;
	this.instructions.lineWidth = this.instructions.width;
	this.instructions.height = 50;
	this.instructions.x = this.togglePause.width +
												this.toggleMode.width +
												2*GLOBAL.COMPONENT_MARGIN +
												this.instructions.width/2;
	this.instructions.y = this.instructions.height/2-this.instructions.getMeasuredHeight()/2;
	this.instructions.textAlign = 'center';
	//this.addChild(this.instructions);
	// END INSTRUCTIONS

	// BEGIN SLIDER
	this.worldSpeedSlider = new Slider(1, 30, this.instructions.width, 50,
																		 "World Speed", hue);
	this.worldSpeedSlider.x = this.togglePause.width +
														this.toggleMode.width +
														2*GLOBAL.COMPONENT_MARGIN;
	this.worldSpeedSlider.y = 0;
	this.addChild(this.worldSpeedSlider);
	this.worldSpeedSlider.userVal = 10;
	this.worldSpeedSlider.value = 10;
	this.worldSpeedSlider.on('change', function () {
		GLOBAL.WORLD_SPEED = this.worldSpeedSlider.value;
		GLOBAL.DIRTY = true;
	}, this);

	this.x = 0;
	this.y = 0;
	this.alpha = 1;

	this.on('tick', function (e) {
		this.update();
	});

	this.drawInfo();
}

var infoPrototype = createjs.extend(Info, createjs.Container);

infoPrototype.setObserverMode = function () {
	mode = 'observer';
	this.instructions.text = "Click on a critter to get some info about it."; 
	createjs.Tween.get(this.worldSpeedSlider, {
																							ignoreGlobalPause: true,
																							override: true
																						}) 
								.to({ value: this.worldSpeedSlider.userVal }, 1000)
	this.worldSpeedSlider.setEnabled(true);
	this.setTarget(null); 
}

infoPrototype.setPredatorMode = function () {
	mode = 'predator';
	this.instructions.text = "Eat critters by clicking on them " +
													 "to increase your health.";
	health = 40;
	createjs.Tween.get(this.worldSpeedSlider, {
																							ignoreGlobalPause: true,
																							override: true
																						}) 
								.to({ value: GLOBAL.PRED_MODE_SPEED}, 1000)
	this.worldSpeedSlider.setEnabled(false);
	this.setTarget(null);
	this.detailViewer.alpha = 1;
}

infoPrototype.setAutoPredatorMode = function () {
	mode = 'autopredator';
	this.instructions.text = "There's a predator at work! She eats any critters " +
													 "she can find.";
	lastAutoKill = null;
	createjs.Tween.get(this.worldSpeedSlider, {
																							ignoreGlobalPause: true,
																							override: true
																						}) 
								.to({ value: this.worldSpeedSlider.userVal }, 1000)
	this.worldSpeedSlider.setEnabled(true);
	this.setTarget(null); 
}

infoPrototype.setTarget = function (target) {
	this.target = target;
	this.drawDetailViewer();
}

infoPrototype.drawTogglePause = function () {
	this.togglePauseBg.graphics.clear();
	this.togglePauseBg.graphics.beginFill(this.lightColor.hex());
	this.togglePauseBg.graphics.drawRoundRect(0,0,this.togglePause.width,
																						this.togglePause.height,20);
	GLOBAL.DIRTY = true;
}

infoPrototype.drawToggleMode = function () {
	this.toggleModeBg.graphics.clear();
	this.toggleModeBg.graphics.beginFill(this.lightColor.hex());
	this.toggleModeBg.graphics.drawRoundRect(0,0,this.toggleMode.width,
																						this.togglePause.height,20);
	if (mode == 'observer') {
		this.toggleModeLabel.text = "Observer";
	} else if (mode == 'predator') {
		this.toggleModeLabel.text = "Predator";
	} else if (mode == 'autopredator') {
		this.toggleModeLabel.text = "AUTO Predator";
	}
	GLOBAL.DIRTY = true;
}

infoPrototype.drawDetailViewer = function () {
	this.bg.graphics.clear();
	this.bg.graphics.beginFill(this.lightColor.hex());
	this.bg.graphics.drawRoundRect(0,0,this.detailViewer.width,this.detailViewer.height,20);
	if (mode == 'observer') {
		if (this.target == null) {
			this.detailLabel.text = "No critter.";
		}
		this.phenotypeCircle.alpha = 0;
	} else if (mode == 'predator') {
		this.detailLabel.text = "Health: " + health + "%";
		this.phenotypeCircle.alpha = 0;
	} else if (mode == 'autopredator') {
		if (lastAutoKill != null) {
			this.detailLabel.text = "Last kill: ";
			this.phenotypeCircle.alpha = 1;
			var g = this.phenotypeCircle.graphics;
			g.beginStroke(lastAutoKill.color.darken(0.5).hex());
			g.beginFill(lastAutoKill.color.hex());
			g.drawCircle(0,0,15);
		} else {
			this.detailLabel.text = "Waiting for a kill...";
		}
	}
	GLOBAL.DIRTY = true;
}

infoPrototype.drawInfo = function () {
	this.drawTogglePause();
	this.drawToggleMode();
	this.drawDetailViewer();
}

infoPrototype.update = function () {
	if (this.target && this.target.isDying) {
		this.setTarget(null);
	}

	if (mode == 'observer') {
		// update the age
		if (this.target) {
			var age = Math.floor((GLOBAL.TIME-this.target.birthTime)/1000);
			var ageStr = ('0' + Math.floor((age%3600)/60)).slice(-1) + ":" +
									 ('00' + Math.floor(age%60)).slice(-2);

			this.detailLabel.text = "Age: " + ageStr;
		} else {
			this.detailLabel.text = "No critter selected."
		}
	}

	// update the play/pause character
	if (createjs.Ticker.paused) {
		this.togglePauseLabel.text = "\u25ba"
	} else {
		this.togglePauseLabel.text = "\u275a\u200a\u275a"
	}
}
	
window.Info = createjs.promote(Info, "Container");
