function Info (bounds, corner) {
	this.Container_constructor();
	this.target = null;

	this.bg = new createjs.Shape();
	this.bg.x = 0;
	this.bg.y = 0;
	this.addChild(this.bg);

	this.ageLabel = new createjs.Text("Age: --", "bold 18px Arial", "#000");
	this.ageLabel.x = 10;
	this.ageLabel.y = 10;
	this.addChild(this.ageLabel);

	this.genotypeLabel = new createjs.Text("Genotype: -- | --", "bold 18px Arial", "#000");
	this.genotypeLabel.x = 10;
	this.genotypeLabel.y = 50;
	this.addChild(this.genotypeLabel);
	
	this.phenotypeLabel = new createjs.Text("Phenotype:", "bold 18px Arial", "#000");
	this.phenotypeLabel.x = 10;
	this.phenotypeLabel.y = 90;
	this.addChild(this.phenotypeLabel);
	
	this.phenotypeCircle = new createjs.Shape();
	this.phenotypeCircle.x = 125;
	this.phenotypeCircle.y = 100;
	this.addChild(this.phenotypeCircle);

	this.x = 10;
	this.y = 10;
	this.alpha = 0;
}

var infoPrototype = createjs.extend(Info, createjs.Container);

infoPrototype.setTarget = function (target) {
	this.target = target;
	this.drawInfo();
}

infoPrototype.drawInfo = function () {
	if (this.target) {
		this.alpha = 0.8;
		this.bg.graphics.beginFill("#FFFFFF").drawRoundRect(0,0,200,120,10);
		this.genotypeLabel.text = "Genotype: " + ~~this.target.genome[0][0] +
															" | " + ~~this.target.genome[1][0];
		this.phenotypeCircle.graphics.beginFill(this.target.color.hex())
																 .drawCircle(0, 0, 10);
	} else {
		this.alpha = 0;
	}
}

infoPrototype.update = function () {
	if (this.target) {
		this.ageLabel.text = "Age: " + this.target.age;
	}
}
	
window.Info = createjs.promote(Info, "Container");
