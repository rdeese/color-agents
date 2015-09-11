/*
* Slider
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

(function() {
	
	/**
	 * Simple slider control for EaselJS examples.
	 **/
	function Slider(min, max, width, height, bgText, hue) {
		this.Container_constructor();
		this.color = chroma.hcl(hue, GLOBAL.CHROMA, GLOBAL.LIGHTNESS);
		this.textColor = chroma("#FFFFFF");
		this.bgColor = this.color.brighten(1);

		this._bg = new createjs.Shape();
		this._minText = new createjs.Text(min.toString(), "bold 24px Arial", this.textColor.hex());
		this._maxText = new createjs.Text(max.toString(), "bold 24px Arial", this.textColor.hex());
		this._bgText = new createjs.Text(bgText, "bold 24px Arial", this.textColor.hex());
		this._nub = new createjs.Shape();
		this.addChild(this._bg, this._minText, this._maxText, this._bgText, this._nub);
		
	// public properties:
		this.min = this.value = min||0;
		this.max = max||100;
		
		this.width = width||100;
		this.height = height||20;
		
		this.cursor = "pointer";
		this.on("mousedown", this._handleInput, this);
		this.on("pressmove", this._handleInput, this);
		this.on("tick", this.update, this);
		this._drawSlider();
	}
	var p = createjs.extend(Slider, createjs.Container);
	
// public methods:
	p.isVisible = function() { return true; };

	p.setEnabled = function (enabled) {
		if (enabled) {
			this.mouseEnabled = true;
			this.alpha = 1;
		} else {
			this.mouseEnabled = false;
			this.alpha = 0.5;
		}
	}

	p.update = function (e) {
		var x = (this.width-this.height) * Math.max(0,Math.min(1,(this.value-this.min) / (this.max-this.min)));
		if (x != this._nub.x) {
			this.dispatchEvent("change");
			this._nub.x = x;
		}
	}

// private methods:
	p._drawSlider = function () {
		var g = this._bg.graphics;
		g.clear();
		g.beginFill(this.bgColor.hex()).drawRoundRect(0,0,this.width,this.height, 20);
		g = this._nub.graphics;
		g.clear();
		g.beginFill(this.color.hex()).drawRoundRect(0,0,this.height, this.height, 20);
		this._minText.textAlign = "center";
		this._minText.x = this.height/2;
		this._minText.y = this.height/2-12;
		this._maxText.textAlign = "center";
		this._maxText.x = this.width-this.height/2;
		this._maxText.y = this.height/2-12;
		this._bgText.textAlign = "center";
		this._bgText.x = this.width/2;
		this._bgText.y = this.height/2-12;
	}

	p._handleInput = function(evt) {
		var val = (evt.localX-this.height/2)/(this.width-this.height)*(this.max-this.min)+this.min;
		val = Math.max(this.min, Math.min(this.max, val));
		if (val == this.value) { return; }
		this.userVal = val;
		this.value = val;
		this.dispatchEvent("change");
	};

	
	window.Slider = createjs.promote(Slider, "Container");
}());
