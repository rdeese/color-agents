function Info (bounds, hue) {
	this.Container_constructor();
	this.target = null;
	this.bounds = bounds;

	this.lightColor = chroma.hcl(hue, GLOBAL.CHROMA, GLOBAL.LIGHTNESS);
	this.darkColor = chroma.hcl(hue, GLOBAL.CHROMA, GLOBAL.LIGHTNESS).darken(-5);
	this.overlayHitColorHex = "#FFFFFF"; //chroma.hcl(145, 55, 90).hex();
	this.overlayMissColorHex = "#FFFFFF"; //chroma.hcl(25, 55, 90).hex();

	var tempText = new createjs.Text("M", "bold 30px "+GLOBAL.FONT, "#FFFFFF");
	this.textLineHeight = tempText.getMeasuredLineHeight();

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

	this.togglePauseLabel = new createjs.Text("", "bold 30px "+GLOBAL.FONT, this.darkColor.hex());
	this.togglePauseLabel.textAlign = "center";
	this.togglePauseLabel.x = this.togglePause.width/2;
	this.togglePauseLabel.y = this.togglePause.height/2-20;
	this.togglePause.addChild(this.togglePauseLabel);

	this.addChild(this.togglePause);
	// END PAUSE BUTTON

	// MODE TOGGLE!
	this.toggleMode = new createjs.Container();
	this.toggleMode.x = this.togglePause.width+GLOBAL.COMPONENT_MARGIN;
	this.toggleMode.y = 0;
	this.toggleMode.width = 300;
	this.toggleMode.height = 50;

	this.toggleModeBg = new createjs.Shape();
	this.toggleModeBg.x = 0;
	this.toggleModeBg.y = 0;
	this.toggleMode.addChild(this.toggleModeBg);

	/*
	this.toggleModeArrow = new createjs.Text("\u25be", "bold 24px "+GLOBAL.FONT, this.darkColor.hex());
	this.toggleModeArrow.x = this.toggleMode.width - 30;
	this.toggleModeArrow.y = this.toggleMode.height/2-this.textLineHeight/2;
	this.toggleMode.addChild(this.toggleModeArrow);
	*/

	this.toggleModeLabel = new createjs.Text("", "bold 24px "+GLOBAL.FONT, this.darkColor.hex());
	this.toggleModeLabel.x = 20;
	this.toggleModeLabel.y = this.toggleMode.height/2-this.textLineHeight/2;
	this.toggleMode.addChild(this.toggleModeLabel);
	
	this.toggleModeTime = new createjs.Text("", "bold 24px "+GLOBAL.FONT, this.lightColor.brighten(1).hex());
	this.toggleModeTime.textAlign = "right";
	this.toggleModeTime.x = this.toggleMode.width-20;
	this.toggleModeTime.y = this.toggleMode.height/2-this.textLineHeight/2;
	this.toggleMode.addChild(this.toggleModeTime);

	this.toggleMode.on('click', function (e) {
		this.drawToggleMode();
	}, this); // callback executes in the scope of Info object

	this.addChild(this.toggleMode);
	// END MODE TOGGLE


	// AGENT VIEWER
	this.detailViewer = new createjs.Container();
	this.detailViewer.width = 300;
	this.detailViewer.height = 50;
	this.detailViewer.x = this.toggleMode.x + this.toggleMode.width + GLOBAL.COMPONENT_MARGIN;
	this.detailViewer.y = 0;

	this.bg = new createjs.Shape();
	this.bg.x = 0;
	this.bg.y = 0;
	this.detailViewer.addChild(this.bg);

	this.detailLabel = new createjs.Text("Last kill:", "bold 24px "+GLOBAL.FONT, this.darkColor.hex());
	this.detailLabel.textAlign = 'center';
	this.detailLabel.x = this.detailViewer.width/2;
	this.detailLabel.y = this.detailViewer.height/2-this.textLineHeight/2;
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
																				"bold 20px "+GLOBAL.FONT, this.lightColor.hex());
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
														this.detailViewer.width +
														3*GLOBAL.COMPONENT_MARGIN;
	this.worldSpeedSlider.y = 0;
	this.addChild(this.worldSpeedSlider);
	this.worldSpeedSlider.userVal = 10;
	this.worldSpeedSlider.value = 10;
	this.worldSpeedSlider.on('change', function () {
		GLOBAL.WORLD_SPEED = this.worldSpeedSlider.value;
		GLOBAL.DIRTY = true;
	}, this);
	// END SLIDER


	this.togglePause.on('click', function (e) {
		createjs.Ticker.paused = !createjs.Ticker.paused;
		this.worldSpeedSlider.setEnabled(!createjs.Ticker.paused && mode == 'observer');
		GLOBAL.DIRTY = true;
	}, this);
	
	this.x = 0;
	this.y = 0;
	this.alpha = 1;

	this.numHits = 0;
	this.lifetimeScore = 0;
	this.round = 1;

	this.drawInfo();

	this.setObserverMode();
	this.modeEnd = GLOBAL.TIME + GLOBAL.OBSERVER_PERIOD;

	this.on('tick', function (e) {
		this.update();
	});
}

var infoPrototype = createjs.extend(Info, createjs.Container);

infoPrototype.handleWorldClick = function (event, didHit, agent) {
	if (mode == 'predator' && !createjs.Ticker.paused) {
		if (agent && agent.isEaten) {
			return;
		}
		// BEGIN OVERLAY
		if (didHit) {
			agent.isEaten = true;
			this.numHits++;
			this.lifetimeScore++;
			this.drawDetailViewer();
		} else {
			this.modeEnd -= GLOBAL.MISS_TIME_PENALTY;
		}

		var text;
		var color;
		if (didHit) {
			text = this.numHits.toString();
			if (this.numHits == GLOBAL.HIT_THRESHOLD) {
				text += "!";
			}
			color = this.overlayHitColorHex;
		} else {
			text = "MISS!";
			color = this.overlayMissColorHex;
		}
		var overlay = new createjs.Text(text, "bold 50px "+GLOBAL.FONT, color);
		overlay.alpha = 0.7;
		overlay.textAlign = "center";
		overlay.x = event.stageX;
		overlay.y = event.stageY-60;
		this.addChild(overlay);
		createjs.Tween.get(overlay)
									.wait(1000)
									.to({ alpha: 0 }, 1000)
									.call(function () {
										console.log(this);
										this.removeChild(overlay)
									}, [], this);
	} else if (mode == 'observer') {
		return;
		if (didHit) {
			this.setTarget(agent);
		} else {
			this.setTarget(null);
		}
		GLOBAL.DIRTY = true;
	}
}

infoPrototype.nextMode = function () {
	if (mode == 'observer') {
		this.modeEnd = GLOBAL.TIME + GLOBAL.PREDATOR_PERIOD;
		this.setPredatorMode();
	} else if (mode == 'predator') {
		this.modeEnd = GLOBAL.TIME + GLOBAL.OBSERVER_PERIOD;
		// reset lifetime score if hits from last Pred round are below threshold
		if (this.numHits < GLOBAL.HIT_THRESHOLD) {
			this.lifetimeScore = 0;
		} else {
			this.round += 1;
		}
		this.numHits = 0;
		this.setObserverMode();
	}
	this.instructions.y = this.instructions.height/2-this.instructions.getMeasuredHeight()/2;
	allAgentsDirty = true;
	this.drawToggleMode();
}

infoPrototype.setObserverMode = function () {
	mode = 'observer';
	this.instructions.text = "Click on a critter to get some info about it."; 
	createjs.Tween.get(this.worldSpeedSlider, {
																							ignoreGlobalPause: true,
																							override: true
																						}) 
								.to({ value: this.worldSpeedSlider.userVal }, 1000);
	this.worldSpeedSlider.setEnabled(true && !createjs.Ticker.paused);
	this.toggleMode.mouseEnabled = false;
	this.setTarget(null); 
}

infoPrototype.setPredatorMode = function () {
	mode = 'predator';
	this.instructions.text = "Eat critters by clicking on them " +
													 "to increase your health.";
	createjs.Tween.get(this.worldSpeedSlider, {
																							ignoreGlobalPause: true,
																							override: true
																						}) 
								.to({ value: GLOBAL.PRED_MODE_SPEED}, 0)
	this.worldSpeedSlider.setEnabled(false && !createjs.Ticker.paused);
	this.toggleMode.mouseEnabled = false;
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
	this.worldSpeedSlider.setEnabled(true && !createjs.Ticker.paused);
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
	if (false) { //mode == 'observer') {
		if (this.target == null) {
			this.detailLabel.text = "No critter.";
		}
		this.phenotypeCircle.alpha = 0;
	} else if (true) { //mode == 'predator') {
		this.detailLabel.text = "Round " + this.round;
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
}

infoPrototype.update = function () {
	if (this.modeEnd < GLOBAL.TIME || this.numHits >= GLOBAL.HIT_THRESHOLD) {
		this.nextMode();
	}

	if (this.target && this.target.isDying) {
		this.setTarget(null);
	}

	if (false) { //mode == 'observer') {
		// update the age
		if (this.target) {
			var age = Math.ceil((GLOBAL.TIME-this.target.birthTime)/1000);
			var ageStr = ('0' + Math.floor((age%3600)/60)).slice(-1) + ":" +
									 ('00' + Math.ceil(age%60)).slice(-2);

			this.detailLabel.text = "Age: " + ageStr;
		} else {
			this.detailLabel.text = "No critter selected."
		}
	}

	var time = Math.ceil((this.modeEnd-GLOBAL.TIME)/1000);
	var timeStr = ('0' + Math.floor((time%3600)/60)).slice(-1) + ":" +
							 ('0' + Math.ceil(time%60)).slice(-2);
	this.toggleModeTime.text = timeStr;

	// update the play/pause character
	if (createjs.Ticker.paused) {
		this.togglePauseLabel.text = "\u25ba"
	} else {
		this.togglePauseLabel.text = "\u275a\u200a\u275a"
	}
}
	
window.Info = createjs.promote(Info, "Container");
