function Info (bounds, hue) {
	this.Container_constructor();
	this.target = null;
	this.bounds = bounds;

	this.lightColor = chroma.hcl(hue, GLOBAL_CHROMA, GLOBAL_LIGHTNESS);
	this.darkColor = chroma.hcl(hue, GLOBAL_CHROMA, GLOBAL_LIGHTNESS).darken(-5);

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
	});

	this.addChild(this.togglePause);

	this.toggleMode = new createjs.Container();
	this.toggleMode.x = this.togglePause.width+GLOBAL_COMPONENT_MARGIN;
	this.toggleMode.y = 0;
	this.toggleMode.width = 220;
	this.toggleMode.height = 50;

	this.toggleModeBg = new createjs.Shape();
	this.toggleModeBg.x = 0;
	this.toggleModeBg.y = 0;
	this.toggleMode.addChild(this.toggleModeBg);

	this.toggleModeLabel = new createjs.Text("", "bold 24px Arial", this.darkColor.hex());
	this.toggleModeLabel.textAlign = "center";
	this.toggleModeLabel.x = this.toggleMode.width/2;
	this.toggleModeLabel.y = this.toggleMode.height/2-12;
	this.toggleMode.addChild(this.toggleModeLabel);

	this.toggleMode.on('click', function (e) {
		if (mode == 'observer') {
			mode = 'predator';
			this.setTarget(null);
		} else if (mode == 'predator') {
			mode = 'autopredator';
			this.setTarget(null);
		} else if (mode == 'autopredator') {
			mode = 'observer';
		}
		allAgentsDirty = true;
		this.drawToggleMode();
	}, this); // callback executes in the scope of Info object

	this.addChild(this.toggleMode);

	this.agentViewer = new createjs.Container();
	this.agentViewer.width = 300;
	this.agentViewer.height = 50;
	this.agentViewer.x = this.bounds.width-this.agentViewer.width;
	this.agentViewer.y = 0;
	this.agentViewer.alpha = 0;

	this.bg = new createjs.Shape();
	this.bg.x = 0;
	this.bg.y = 0;
	this.agentViewer.addChild(this.bg);

	this.ageLabel = new createjs.Text("Age: --", "bold 18px Arial", this.darkColor.hex());
	this.ageLabel.x = 16;
	this.ageLabel.y = this.agentViewer.height/2-9;
	this.agentViewer.addChild(this.ageLabel);

	this.genotypeLabel = new createjs.Text("Genotype: -- | --", "bold 18px Arial", this.darkColor.hex());
	this.genotypeLabel.x = 126;
	this.genotypeLabel.y = this.agentViewer.height/2-9;
	this.agentViewer.addChild(this.genotypeLabel);
	
	/*
	this.phenotypeLabel = new createjs.Text("Phenotype:", "bold 18px Arial", this.darkColor.hex());
	this.phenotypeLabel.x = 230;
	this.phenotypeLabel.y = this.agentViewer.height/2-9;
	this.agentViewer.addChild(this.phenotypeLabel);
	
	this.phenotypeCircle = new createjs.Shape();
	this.phenotypeCircle.x = 125;
	this.phenotypeCircle.y = 100;
	this.agentViewer.addChild(this.phenotypeCircle);
	*/

	this.addChild(this.agentViewer);

	this.x = 0;
	this.y = 0;
	this.alpha = 1;

	this.on('tick', function (e) {
		this.update();
	});

	this.drawInfo();
}

var infoPrototype = createjs.extend(Info, createjs.Container);

infoPrototype.setTarget = function (target) {
	this.target = target;
	if (this.target) {
		this.genotypeLabel.text = "Genotype: " + Math.round(this.target.genome[0][0]);
		/*
		this.phenotypeCircle.graphics.beginFill(this.target.color.hex())
																 .drawCircle(0, 0, 10);
																 */
		this.agentViewer.alpha = 1;
	} else {
		this.agentViewer.alpha = 0;
	}
}

infoPrototype.drawTogglePause = function () {
	this.togglePauseBg.graphics.clear();
	this.togglePauseBg.graphics.beginFill(this.lightColor.hex());
	this.togglePauseBg.graphics.drawRoundRect(0,0,this.togglePause.width,
																						this.togglePause.height,20);
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
}

infoPrototype.drawAgentViewer = function () {
	this.bg.graphics.clear();
	this.bg.graphics.beginFill(this.lightColor.hex());
	this.bg.graphics.drawRoundRect(0,0,this.agentViewer.width,this.agentViewer.height,20);
}

infoPrototype.drawInfo = function () {
	this.drawTogglePause();
	this.drawToggleMode();
	this.drawAgentViewer();
}

infoPrototype.update = function () {
	if (this.target && this.target.isDying) {
		this.setTarget(null);
	}

	// update the age
	if (this.target) {
		var age = Math.floor((createjs.Ticker.getTime(true)-this.target.birthTime)/1000);
		var ageStr = ('0' + Math.floor((age%3600)/60)).slice(-1) + ":" +
								 ('00' + Math.floor(age%60)).slice(-2);

		this.ageLabel.text = "Age: " + ageStr;
	}

	// update the play/pause character
	if (createjs.Ticker.paused) {
		this.togglePauseLabel.text = "\u25ba"
	} else {
		this.togglePauseLabel.text = "\u275a\u200a\u275a"
	}
}
	
window.Info = createjs.promote(Info, "Container");
