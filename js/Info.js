function Info (GLOBAL, bounds, hue) {
	this.Container_constructor();
	this.GLOBAL = GLOBAL;
	this.target = null;
	this.bounds = bounds;

	this.lightColor = chroma.hcl(hue, this.GLOBAL.CHROMA, this.GLOBAL.LIGHTNESS);
	this.darkColor = chroma.hcl(hue, this.GLOBAL.CHROMA, this.GLOBAL.LIGHTNESS).darken(-5);
	this.overlayHitColorHex = "#FFFFFF"; //chroma.hcl(145, 55, 90).hex();
	this.overlayMissColorHex = "#FFFFFF"; //chroma.hcl(25, 55, 90).hex();

	var tempText = new createjs.Text("M", "bold 30px "+this.GLOBAL.FONT, "#FFFFFF");
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

	this.togglePauseLabel = new createjs.Text("", "bold 30px "+this.GLOBAL.FONT, this.darkColor.hex());
	this.togglePauseLabel.textAlign = "center";
	this.togglePauseLabel.x = this.togglePause.width/2;
	this.togglePauseLabel.y = this.togglePause.height/2-20;
	this.togglePause.addChild(this.togglePauseLabel);

	this.addChild(this.togglePause);
	// END PAUSE BUTTON

	// RESET BUTTON
	this.resetButton = new createjs.Container();
	this.resetButton.x = this.togglePause.width+this.GLOBAL.COMPONENT_MARGIN;
	this.resetButton.y = 0;
	this.resetButton.width = 95;
	this.resetButton.height = 50;

	this.resetButtonBg = new createjs.Shape();
	this.resetButtonBg.x = 0;
	this.resetButtonBg.y = 0;
	this.resetButton.addChild(this.resetButtonBg);

	this.resetButtonLabel = new createjs.Text("", "bold 30px "+this.GLOBAL.FONT, this.darkColor.hex());
	this.resetButtonLabel.textAlign = "center";
	this.resetButtonLabel.x = this.resetButton.width/2;
	this.resetButtonLabel.y = this.resetButton.height/2-20;
	this.resetButton.addChild(this.resetButtonLabel);

	this.addChild(this.resetButton);
	// END RESET BUTTON

	// MODE TOGGLE!
	this.toggleMode = new createjs.Container();
	this.toggleMode.x = this.resetButton.x+this.resetButton.width+this.GLOBAL.COMPONENT_MARGIN;
	this.toggleMode.y = 0;
	this.toggleMode.width = 300;
	this.toggleMode.height = 50;

	this.toggleModeBg = new createjs.Shape();
	this.toggleModeBg.x = 0;
	this.toggleModeBg.y = 0;
	this.toggleMode.addChild(this.toggleModeBg);

	/*
	this.toggleModeArrow = new createjs.Text("\u25be", "bold 24px "+this.GLOBAL.FONT, this.darkColor.hex());
	this.toggleModeArrow.x = this.toggleMode.width - 30;
	this.toggleModeArrow.y = this.toggleMode.height/2-this.textLineHeight/2;
	this.toggleMode.addChild(this.toggleModeArrow);
	*/

	this.toggleModeLabel = new createjs.Text("", "bold 24px "+this.GLOBAL.FONT, this.darkColor.hex());
	this.toggleModeLabel.x = 20;
	this.toggleModeLabel.y = this.toggleMode.height/2-this.textLineHeight/2;
	this.toggleMode.addChild(this.toggleModeLabel);
	
	this.toggleModeTime = new createjs.Text("", "bold 24px "+this.GLOBAL.FONT, this.lightColor.brighten(1).hex());
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
	this.detailViewer.x = this.toggleMode.x + this.toggleMode.width + this.GLOBAL.COMPONENT_MARGIN;
	this.detailViewer.y = 0;

	this.bg = new createjs.Shape();
	this.bg.x = 0;
	this.bg.y = 0;
	this.detailViewer.addChild(this.bg);

	this.detailLabel = new createjs.Text("Last kill:", "bold 24px "+this.GLOBAL.FONT, this.darkColor.hex());
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
																				"bold 20px "+this.GLOBAL.FONT, this.lightColor.hex());
	this.instructions.width = this.bounds.width -
														this.togglePause.width -
														this.resetButton.width -
														this.toggleMode.width -
														this.detailViewer.width -
														4*this.GLOBAL.COMPONENT_MARGIN;
	this.instructions.lineWidth = this.instructions.width;
	this.instructions.height = 50;
	this.instructions.x = this.togglePause.width +
												this.toggleMode.width +
												2*this.GLOBAL.COMPONENT_MARGIN +
												this.instructions.width/2;
	this.instructions.y = this.instructions.height/2-this.instructions.getMeasuredHeight()/2;
	this.instructions.textAlign = 'center';
	//this.addChild(this.instructions);
	// END INSTRUCTIONS

	// BEGIN SLIDER
	this.worldSpeedSlider = new Slider(this.GLOBAL, 1, 30, this.instructions.width, 50,
																		 "World Speed", hue);
	this.worldSpeedSlider.x = this.detailViewer.x +
														this.detailViewer.width +
														this.GLOBAL.COMPONENT_MARGIN;
	this.worldSpeedSlider.y = 0;
	this.addChild(this.worldSpeedSlider);
	this.worldSpeedSlider.userVal = 10;
	this.worldSpeedSlider.value = 10;
	this.worldSpeedSlider.on('change', function () {
		this.GLOBAL.WORLD_SPEED = this.worldSpeedSlider.value;
		this.GLOBAL.DIRTY = true;
	}, this);
	// END SLIDER

	// BEGIN OVERLAY LAYER
	this.overlayContainer = new createjs.Container();
	this.addChild(this.overlayContainer);
	// END OVERLAY LAYER


	this.togglePause.on('click', function (e) {
		this.GLOBAL.PAUSED = !this.GLOBAL.PAUSED;
		this.worldSpeedSlider.setEnabled(!this.GLOBAL.PAUSED && this.GLOBAL.MODE == 'observer');
		this.GLOBAL.DIRTY = true;
	}, this);

	this.resetButton.on('click', function (e) {
		var evt = new createjs.Event('reset', true);
		this.dispatchEvent(evt);
	}, this);
	
	this.x = 0;
	this.y = 0;
	this.alpha = 1;

	this.numHits = 0;
	this.lifetimeScore = 0;
	this.round = 1;

	this.drawInfo();

	this.setObserverMode();
	this.modeEnd = this.GLOBAL.TIME + this.GLOBAL.OBSERVER_PERIOD;

	this.on('tick', function (e) {
		this.update();
	});
}

var infoPrototype = createjs.extend(Info, createjs.Container);

infoPrototype.handleWorldClick = function (event, didHit, agent) {
	if (this.GLOBAL.MODE == 'predator' && !this.GLOBAL.PAUSED) {
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
			this.modeEnd -= this.GLOBAL.MISS_TIME_PENALTY;
		}

		var text;
		var color;
		if (didHit) {
			text = this.numHits.toString();
			if (this.numHits == this.GLOBAL.HIT_THRESHOLD) {
				text += "!";
			}
			color = this.overlayHitColorHex;
		} else {
			text = "MISS!";
			color = this.overlayMissColorHex;
		}
		var overlay = new createjs.Text(text, "bold 50px "+this.GLOBAL.FONT, color);
		overlay.alpha = 0.7;
		overlay.textAlign = "center";
		overlay.x = event.stageX;
		overlay.y = event.stageY-60;
		this.overlayContainer.addChild(overlay);
		createjs.Tween.get(overlay)
									.wait(1000)
									.to({ alpha: 0 }, 3000)
									.call(function () {
										this.removeChild(overlay)
									}, [], this);
	} else if (this.GLOBAL.MODE == 'observer') {
		return;
		if (didHit) {
			this.setTarget(agent);
		} else {
			this.setTarget(null);
		}
		this.GLOBAL.DIRTY = true;
	}
}

infoPrototype.nextMode = function () {
	if (this.GLOBAL.MODE == 'observer') {
		this.modeEnd = this.GLOBAL.TIME + this.GLOBAL.PREDATOR_PERIOD;
		this.setPredatorMode();
	} else if (this.GLOBAL.MODE == 'predator') {
		this.modeEnd = this.GLOBAL.TIME + this.GLOBAL.OBSERVER_PERIOD;
		// reset lifetime score if hits from last Pred round are below threshold
		if (this.numHits < this.GLOBAL.HIT_THRESHOLD) {
			this.lifetimeScore = 0;
		} else {
			this.round += 1;
		}
		this.numHits = 0;
		this.setObserverMode();
	}
	this.instructions.y = this.instructions.height/2-this.instructions.getMeasuredHeight()/2;
	this.GLOBAL.AGENTS_DIRTY = true;
	this.drawToggleMode();
}

infoPrototype.setObserverMode = function () {
	this.GLOBAL.MODE = 'observer';
	this.instructions.text = "Click on a critter to get some info about it."; 
	createjs.Tween.get(this.worldSpeedSlider, {
																							ignoreGlobalPause: true,
																							override: true
																						}) 
								.to({ value: this.worldSpeedSlider.userVal }, 1000);
	createjs.Tween.get(this.overlayContainer, {
																							ignoreGlobalPause: true,
																							override: true
																						})
								.to({ alpha: 0 }, 500)
								.call(function () {
									this.overlayContainer.removeAllChildren();
								}, [], this);
	this.toggleModeTime.alpha = 1;
	this.worldSpeedSlider.setEnabled(true && !this.GLOBAL.PAUSED);
	this.toggleMode.mouseEnabled = false;
	this.setTarget(null); 
	this.drawInfo();
}

infoPrototype.setPredatorMode = function () {
	this.GLOBAL.MODE = 'predator';
	this.instructions.text = "Eat critters by clicking on them " +
													 "to increase your health.";
	createjs.Tween.get(this.worldSpeedSlider, {
																							ignoreGlobalPause: true,
																							override: true
																						}) 
								.to({ value: this.GLOBAL.PRED_MODE_SPEED}, 0);
	this.toggleModeTime.alpha = 0;
	this.overlayContainer.alpha = 1;
	this.worldSpeedSlider.setEnabled(false && !this.GLOBAL.PAUSED);
	this.toggleMode.mouseEnabled = false;
	this.setTarget(null);
	this.drawInfo();
	this.detailViewer.alpha = 1;
}

infoPrototype.setAutoPredatorMode = function () {
	this.GLOBAL.MODE = 'autopredator';
	this.instructions.text = "There's a predator at work! She eats any critters " +
													 "she can find.";
	lastAutoKill = null;
	createjs.Tween.get(this.worldSpeedSlider, {
																							ignoreGlobalPause: true,
																							override: true
																						}) 
								.to({ value: this.worldSpeedSlider.userVal }, 1000)
	this.worldSpeedSlider.setEnabled(true && !this.GLOBAL.PAUSED);
	this.setTarget(null); 
	this.drawInfo();
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
	this.GLOBAL.DIRTY = true;
}

infoPrototype.drawResetButton = function () {
	this.resetButtonBg.graphics.clear();
	this.resetButtonBg.graphics.beginFill(this.lightColor.hex());
	this.resetButtonBg.graphics.drawRoundRect(0,0,this.resetButton.width,
																						this.resetButton.height,20);
	this.resetButtonLabel.text = "\u21bb";
	this.GLOBAL.DIRTY = true;
}

infoPrototype.drawToggleMode = function () {
	this.toggleModeBg.graphics.clear();
	this.toggleModeBg.graphics.beginFill(this.lightColor.hex());
	this.toggleModeBg.graphics.drawRoundRect(0,0,this.toggleMode.width,
																						this.togglePause.height,20);
	if (this.GLOBAL.MODE == 'observer') {
		this.toggleModeLabel.text = "Observer";
	} else if (this.GLOBAL.MODE == 'predator') {
		this.toggleModeLabel.text = "Predator";
	} else if (this.GLOBAL.MODE == 'autopredator') {
		this.toggleModeLabel.text = "AUTO Predator";
	}
	this.GLOBAL.DIRTY = true;
}

infoPrototype.drawDetailViewer = function () {
	this.bg.graphics.clear();
	this.bg.graphics.beginFill(this.lightColor.hex());
	this.bg.graphics.drawRoundRect(0,0,this.detailViewer.width,this.detailViewer.height,20);
	if (false) { //this.GLOBAL.MODE == 'observer') {
		if (this.target == null) {
			this.detailLabel.text = "No critter.";
		}
		this.phenotypeCircle.alpha = 0;
	} else if (true) { //this.GLOBAL.MODE == 'predator') {
		this.detailLabel.text = "Round " + this.round;
		this.phenotypeCircle.alpha = 0;
	} else if (this.GLOBAL.MODE == 'autopredator') {
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
	this.GLOBAL.DIRTY = true;
}

infoPrototype.drawInfo = function () {
	this.drawTogglePause();
	this.drawResetButton();
	this.drawToggleMode();
}

infoPrototype.update = function () {
	if (this.modeEnd < this.GLOBAL.TIME || this.numHits >= this.GLOBAL.HIT_THRESHOLD) {
		this.nextMode();
	}

	if (this.target && this.target.isDying) {
		this.setTarget(null);
	}

	if (false) { //this.GLOBAL.MODE == 'observer') {
		// update the age
		if (this.target) {
			var age = Math.ceil((this.GLOBAL.TIME-this.target.birthTime)/1000);
			var ageStr = ('0' + Math.floor((age%3600)/60)).slice(-1) + ":" +
									 ('00' + Math.ceil(age%60)).slice(-2);

			this.detailLabel.text = "Age: " + ageStr;
		} else {
			this.detailLabel.text = "No critter selected."
		}
	}

	var time = Math.ceil((this.modeEnd-this.GLOBAL.TIME)/1000);
	var timeStr = ('0' + Math.floor((time%3600)/60)).slice(-1) + ":" +
							 ('0' + Math.ceil(time%60)).slice(-2);
	this.toggleModeTime.text = timeStr;

	// update the play/pause character
	if (this.GLOBAL.PAUSED) {
		this.togglePauseLabel.text = "\u25ba"
	} else {
		this.togglePauseLabel.text = "\u275a\u200a\u275a"
	}
}
	
window.Info = createjs.promote(Info, "Container");
