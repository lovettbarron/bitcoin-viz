var xy = [];

var parseToXY = function(data) {
	// var array = []
	// if(!_.isEmpty(xy)) {
	// 	array = _.map(xy,function(num,key){
	// 		console.log(num)
	// 		return num[2]
	// 	})
	// }

	// console.log("array",array)

	_.each(transactions,function(d,i) {
		console.log(d.hash)
		if(!_.findWhere(xy,{"2":d.hash})) {
			xy.push(
				 [
					Math.random()*960,
					Math.random()*500,
					d.hash
				]
			)
		}
	})
}

var GetXY = function(hash) {
	var xy = _.findWhere(xy,{"id":hash})
	return !_.isUndefined ? {x: x, y: y} : {x: 0, y: 0};
}

var draw = function(data) {

	parseToXY(data);

	var width = 960,
	    height = 500;

	var voronoi = d3.geom.voronoi()
	    .clipExtent([[0, 0], [width, height]]);

	var svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .on("mousemove", function() { xy[0] = d3.mouse(this); redraw(); });

	var path = svg.append("g").selectAll("path");

	svg.selectAll("circle")
	    .data(xy.slice(1))
	  .enter().append("circle")
	    .attr("transform", function(d) { return "translate(" + d[0] + "," + d[1] + ")"; })
	    .attr("r", 1.5);

	redraw();

	function redraw() {
	  path = path
	      .data(voronoi(xy), polygon);

	  path.exit().remove();

	  path.enter().append("path")
	      .attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
	      .attr("d", polygon);

	  path.order();
	}

	function polygon(d) {
	  return "M" + d.join("L") + "Z";
	}
}




var setup = function() {
	draw();
}

$(document).ready(function(){
	setup();
})