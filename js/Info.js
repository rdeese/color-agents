function Info (GLOBAL, worldBounds, infoBounds, hue) {
	this.Container_constructor();
	this.GLOBAL = GLOBAL;
	this.bounds = infoBounds;
	this.worldBounds = worldBounds;

	this.color = chroma.hcl(hue, this.GLOBAL.CHROMA, this.GLOBAL.LIGHTNESS);

	if (this.GLOBAL.COLOR_FILL) {
		this.fillColor = chroma.hcl(hue, this.GLOBAL.CHROMA, this.GLOBAL.LIGHTNESS);
		this.textColor = chroma.hcl(hue, this.GLOBAL.CHROMA, this.GLOBAL.LIGHTNESS).darken(-5);
	} else {
		this.fillColor = chroma.hcl(hue, this.GLOBAL.CHROMA, this.GLOBAL.LIGHTNESS).brighten(5);
		this.textColor = chroma.hcl(hue, this.GLOBAL.CHROMA, this.GLOBAL.LIGHTNESS);
	}
	if (this.GLOBAL.COLOR_FILL) {
		this.overlayHitColorHex = "#FFFFFF"; //chroma.hcl(145, 55, 90).hex();
		this.overlayMissColorHex = "#FFFFFF"; //chroma.hcl(25, 55, 90).hex();
	} else {
		this.overlayHitColorHex = chroma.hcl(hue, this.GLOBAL.CHROMA,
																				 this.GLOBAL.LIGHTNESS).hex();
		this.overlayMissColorHex = chroma.hcl(hue, this.GLOBAL.CHROMA,
																				  this.GLOBAL.LIGHTNESS).hex();
	}

	// BEGIN OVERLAY LAYER
	this.overlayContainer = new createjs.Container();
	this.addChild(this.overlayContainer);
	// END OVERLAY LAYER

	// BEGIN PAUSE LAYER
	this.pauseImage = new createjs.Container();
	this.drawPauseImage();
	this.addChild(this.pauseImage);
	this.pauseImage.alpha = this.GLOBAL.PAUSED ? 1 : 0;
	// END PAUSE LAYER

	this.pauseImage.on('click', function (e) {
		this.pauseImage.alpha = 0;
		this.GLOBAL.PAUSED = false;
	}, this);

	this.x = 0;
	this.y = 0;
	this.alpha = 1;

	this.lifetimeHits = 0;
	this.lifetimeMisses = 0;
	this.numHits = 0;
	this.numMisses = 0;
	this.lifetimeScore = 0;
	this.year = 1;

	this.setObserverMode();

	this.on('tick', function (e) {
		this.update(e);
	});
}

var infoPrototype = createjs.extend(Info, createjs.Container);

infoPrototype.drawPauseImage = function () {
  this.pauseImageBg = new createjs.Shape();
  this.pauseImage.addChild(this.pauseImageBg);
	var g = this.pauseImageBg.graphics;
	g.clear();
	g.beginFill("rgba("+this.color.rgb().join(",")+",0.5)");
	g.drawRoundRect(0,0,this.worldBounds.width, this.worldBounds.height,20);
	g.endFill();

  this.pauseImageText = new createjs.Text("Click anywhere to begin", "bold 50px "+this.GLOBAL.FONT, this.overlayHitColorHex);
  this.pauseImageText.textAlign = "center";
  this.pauseImageText.textBaseline = "middle";
  this.pauseImageText.x = this.worldBounds.width/2;
  this.pauseImageText.y = this.worldBounds.height/2;
  this.pauseImage.addChild(this.pauseImageText);
  /*
	g.beginFill(this.color.hex());
	g.drawCircle(this.worldBounds.width/2, this.worldBounds.height/2, this.worldBounds.height/4);
	g.endFill();
	g.beginFill(this.color.brighten(1).hex());
	g.drawPolyStar(this.worldBounds.width/2, this.worldBounds.height/2,
								 this.worldBounds.height/5, 3, 0, 0);
	g.endFill();
  */
}


infoPrototype.handleWorldClick = function (event, didHit, agent) {
	if (this.GLOBAL.MODE == 'predator' && !this.GLOBAL.PAUSED) {
		if (agent && agent.isEaten) {
			return;
		}
		// BEGIN OVERLAY
		if (didHit) {
			//agent.isEaten = true;
			this.numHits++;
			this.lifetimeHits++;
			this.lifetimeScore++;
		} else {
			this.numMisses++;
			this.lifetimeMisses++;
		}

		var text;
		var color;
		if (didHit) {
			text = this.lifetimeHits.toString();
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
		var t = createjs.Tween.get(overlay)
													.wait(1000)
													.to({ alpha: 0 }, 3000)
													.call(function () {
														this.removeChild(overlay)
													}, [], this);
		this.GLOBAL.TIMELINE.push(t);
	} else if (this.GLOBAL.MODE == 'observer') {
		if (didHit && !this.GLOBAL.PAUSED) {
			agent.blink();
		}
	}
}

infoPrototype.nextMode = function () {
	if (this.GLOBAL.MODE == 'observer') {
		this.setPredatorMode();
	} else if (this.GLOBAL.MODE == 'predator') {
		// reset lifetime score if hits from last Pred round are below threshold
		/*
		if (this.numHits < this.GLOBAL.HIT_THRESHOLD) {
			this.lifetimeScore = 0;

			var overlay = new createjs.Text("TRY AGAIN",
																			"bold 150px "+this.GLOBAL.FONT,
																			this.overlayHitColorHex);
			overlay.alpha = 0.7;
			overlay.textAlign = "center";
			overlay.x = this.worldBounds.width/2;
			overlay.y = this.worldBounds.height/2-75;
			this.overlayContainer.addChild(overlay);

			var evt = new createjs.Event('resetRound', true);
			this.dispatchEvent(evt);
		} else {

			var overlay = new createjs.Text("YEAR "+this.year,
																			"bold 150px "+this.GLOBAL.FONT,
																			this.overlayHitColorHex);
			overlay.alpha = 0.7;
			overlay.textAlign = "center";
			overlay.x = this.bounds.width/2;
			overlay.y = this.worldBounds.height/2-75;
			this.overlayContainer.addChild(overlay);

			var evt = new createjs.Event('nextRound', true);
			this.dispatchEvent(evt);
		}
		*/
		this.year += 1;
		this.numHits = 0;
		this.setObserverMode();
	}
}

infoPrototype.setObserverMode = function () {
	this.GLOBAL.MODE = 'observer';
	var t = createjs.Tween.get(this.overlayContainer, {
																											ignoreGlobalPause: true,
																											override: true
																										})
												.to({ alpha: 0 }, 2000)
												.call(function () {
													this.overlayContainer.removeAllChildren();
												}, [], this);
	this.GLOBAL.TIMELINE.push(t);
	this.GLOBAL.AGENTS_DIRTY = true;
}

infoPrototype.setPredatorMode = function () {
	this.GLOBAL.MODE = 'predator';
	this.GLOBAL.AGENTS_DIRTY = true;
	this.overlayContainer.alpha = 1;
}

infoPrototype.update = function (e) {
	if (this.pauseImage.alpha == 0 && this.GLOBAL.PAUSED) {
    this.pauseImageText.text = this.GLOBAL.TIME == 0 ?
                               "Click anywhere to begin" :
                               "Click anywhere to continue";
		this.pauseImage.alpha = 1;
		this.GLOBAL.DIRTY = true;
	}
}

window.Info = createjs.promote(Info, "Container");
