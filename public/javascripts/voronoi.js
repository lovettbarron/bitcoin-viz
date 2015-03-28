var xy = [], nodes = [];
var svg, path, voronoi, force, polygon;
var width = 960,
    height = 500;

var tick = function() {
  // _.each(xy,function(d,i) {
  // 	// xy[i][0] += .1;
  // 	// xy[i][1] += .1;
  // })
  svg.selectAll("circle")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

var parseToXY = function(data) {
	_.each(transactions,function(d,i) {
		if(!_.findWhere(xy,{"id":d.hash})) {
			var size = getTransactionAmount(d.hash)
			xy.push(
				//  [
				// 	Math.random()*960,
				// 	Math.random()*500,
				// 	d.hash
				// ]
				{
					x: Math.random()*960,
					y: Math.random()*500,
					id: d.hash,
					size: -20// getTransactionAmount(!_.isUndefined(size) ? size : -10 )
				}
			)
		}
	})
}

var GetXY = function(hash) {
	var xy = _.findWhere(xy,{"id":hash})
	return !_.isUndefined ? {x: x, y: y} : {x: 0, y: 0};
}

var draw = function(data) {

	voronoi = d3.geom.voronoi()
	    .clipExtent([[0, 0], [width, height]]);
	
	force = d3.layout.force()
	    .charge(function(d){
	    	var amt = getTransactionAmount(d.id);
	    	return -20
	    })
		// .charge(-20)
	    .size([width, height])
	    .nodes(xy)
	    .on("tick", tick)
	    .start();

	path = svg.append("g").selectAll("path");
}

var polygon = function(d) {
	console.log(d)
  return "M" + d.join("L") + "Z";
}

var redraw = function() {

	if(transactions.length != xy.length) parseToXY(blocks[0].transaction_hashes);

	svg.selectAll("circle")
	    .data(GetXY)
	  .enter().append("circle")
	    // .attr("transform", function(d) { return "translate(" + d[0] + "," + d[1] + ")"; })
	    .attr("r", 1.5)
	  .transition()
		.ease(Math.sqrt)
		.attr("r", 4.5);

	var mapToVoro = _.map(xy,function(d) { return [d.x,d.y] });
	path = path
	  .data(
	  	voronoi(mapToVoro), 
	  	polygon
	  	);

	path.exit().remove();
	path.enter().append("path")
	  .attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
	  .attr("d", polygon);

	path.order();
	force.start();
}




var setup = function() {
	svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    // .on("mousemove", function() { vertices[0] = d3.mouse(this); redraw(); });

	draw();

	var interval = setInterval(function() {
		force.start();
		redraw();
	}, 300);
}

$(document).ready(function(){
	setup();

})