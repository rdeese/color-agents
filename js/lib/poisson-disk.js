// All credit for this implementation goes to Mike Bostock:
// http://bl.ocks.org/mbostock/19168c663618b7f07158
var poissonDiscSampler = function (width, height, radius, edge) {
	var k = 30, // maximum number of samples before rejection
			radius2 = radius * radius,
			boundRadius = height/2-edge;
			R = 3 * radius2,
			cellSize = radius * Math.SQRT1_2,
			gridWidth = Math.ceil(width / cellSize),
			gridHeight = Math.ceil(height / cellSize),
			grid = new Array(gridWidth * gridHeight),
			queue = [],
			queueSize = 0,
			sampleSize = 0;

	return function() {
		if (!sampleSize) return sample((0.5+0.1*(Math.random()-0.5)) * width,
																	 (0.5+0.1*(Math.random()-0.5)) * height);

		// Pick a random existing sample and remove it from the queue.
		while (queueSize) {
			var i = Math.random() * queueSize | 0,
					s = queue[i];
			
			// Make a new candidate between [radius, 2 * radius] from the existing sample.
			for (var j = 0; j < k; ++j) {
				var a = 2 * Math.PI * Math.random(),
						r = Math.sqrt(Math.random() * R + radius2),
						x = s[0] + r * Math.cos(a),
						y = s[1] + r * Math.sin(a);
				
				// Reject candidates that are outside the allowed extent,
				// or closer than 2 * radius to any existing sample.
				// CIRCLE
				//var dist = Math.pow(x-(0.5*width), 2)+Math.pow(y-0.5*height, 2); 
				//if (boundRadius*boundRadius > dist &&
				//		far(x, y)) return sample(x, y);
				// SQUARE
				if (edge <= x && x < width-edge &&
						edge <= y && y < height-edge &&
						far(x, y)) return sample(x, y);
			}
			
			queue[i] = queue[--queueSize];
			queue.length = queueSize;
		}
	};
	
	function far(x, y) {
		var i = x / cellSize | 0,
				j = y / cellSize | 0,
				i0 = Math.max(i - 2, 0),
				j0 = Math.max(j - 2, 0),
				i1 = Math.min(i + 3, gridWidth),
				j1 = Math.min(j + 3, gridHeight);
		
		for (j = j0; j < j1; ++j) {
			var o = j * gridWidth;
			for (i = i0; i < i1; ++i) {
				if (s = grid[o + i]) {
					var s,
							dx = s[0] - x,
							dy = s[1] - y;
					if (dx * dx + dy * dy < radius2) return false;
				}
			}
		}
		
		return true;
	}
	
	function sample(x, y) {
		var s = [x, y];
		queue.push(s);
		grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
		++sampleSize;
		++queueSize;
		return s;
	}
}
