function Info (bounds, corner) {
	this.Container_constructor();
	this.target = null;

	this.togglePause = new createjs.Container();
	this.togglePause.x = 10;
	this.togglePause.y = 10;
	this.togglePause.width = 95;
	this.togglePause.height = 50;

	this.togglePauseBg = new createjs.Shape();
	this.togglePauseBg.x = 0;
	this.togglePauseBg.y = 0;
	this.togglePause.addChild(this.togglePauseBg);

	this.togglePauseText = new createjs.Text("", "bold 30px Arial", "#000");
	this.togglePauseText.textAlign = "center";
	this.togglePauseText.x = this.togglePause.width/2;
	this.togglePauseText.y = this.togglePause.height/2-15;
	this.togglePause.addChild(this.togglePauseText);

	this.togglePause.on('click', function (e) {
		createjs.Ticker.paused = !createjs.Ticker.paused;
	});

	this.addChild(this.togglePause);

	this.agentViewer = new createjs.Container();
	this.agentViewer.x = 10;
	this.agentViewer.y = 70;
	this.agentViewer.width = 200;
	this.agentViewer.height = 120;
	this.agentViewer.alpha = 0;

	this.bg = new createjs.Shape();
	this.bg.x = 0;
	this.bg.y = 0;
	this.agentViewer.addChild(this.bg);

	this.ageLabel = new createjs.Text("Age: --", "bold 18px Arial", "#000");
	this.ageLabel.x = 10;
	this.ageLabel.y = 10;
	this.agentViewer.addChild(this.ageLabel);

	this.genotypeLabel = new createjs.Text("Genotype: -- | --", "bold 18px Arial", "#000");
	this.genotypeLabel.x = 10;
	this.genotypeLabel.y = 50;
	this.agentViewer.addChild(this.genotypeLabel);
	
	this.phenotypeLabel = new createjs.Text("Phenotype:", "bold 18px Arial", "#000");
	this.phenotypeLabel.x = 10;
	this.phenotypeLabel.y = 90;
	this.agentViewer.addChild(this.phenotypeLabel);
	
	this.phenotypeCircle = new createjs.Shape();
	this.phenotypeCircle.x = 125;
	this.phenotypeCircle.y = 100;
	this.agentViewer.addChild(this.phenotypeCircle);

	this.addChild(this.agentViewer);

	this.x = 10;
	this.y = 10;
	this.alpha = 0.8;

	this.on('tick', function (e) {
		this.update();
	});

	this.drawInfo();
}

var infoPrototype = createjs.extend(Info, createjs.Container);

infoPrototype.setTarget = function (target) {
	this.target = target;
	if (this.target) {
		this.genotypeLabel.text = "Genotype: " + ~~this.target.genome[0][0] +
															" | " + ~~this.target.genome[1][0];
		this.phenotypeCircle.graphics.beginFill(this.target.color.hex())
																 .drawCircle(0, 0, 10);
		this.agentViewer.alpha = 1;
	} else {
		this.agentViewer.alpha = 0;
	}
}

infoPrototype.drawTogglePause = function () {
	this.togglePauseBg.graphics.clear();
	this.togglePauseBg.graphics.beginFill("#FFFFFF").drawRoundRect(0,0,95,50,20);
}

infoPrototype.drawAgentViewer = function () {
	this.bg.graphics.clear();
	this.bg.graphics.beginFill("#FFFFFF").drawRoundRect(0,0,200,120,20);
}

infoPrototype.drawInfo = function () {
	this.drawTogglePause();
	this.drawAgentViewer();
}

infoPrototype.update = function () {
	if (this.target && this.target.isDead) {
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
		this.togglePauseText.text = "\u25ba"
	} else {
		this.togglePauseText.text = "\u275a\u200a\u275a"
	}
}
	
window.Info = createjs.promote(Info, "Container");
