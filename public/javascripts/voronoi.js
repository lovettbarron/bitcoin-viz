var xy = [], nodes = [];
var svg, path, voronoi, force, polygon;
var bucketWidth = 960,
    bucketHeight = 500;
var blockWidth = 960,
	blockHeight = 50;

var blockSvgs = [];

var testBlocks = ["0000000000000000070ea877d0b45f31147575842562b1e09f6a1bd6e46f09ed","0000000000000000060577e744223eea22cd45597ca55b1e981ce19874be4f7b","000000000000000001a40ab7df60551364c33e4bade591dc946de26e23569418","00000000000000000580799b80ab02200454c02701023076208d2942a45197e9","00000000000000001641d325610619de2c3b1d7d4c04d7e2b88975faa99bd26a"]


var getWidthFromSatoshis = function(satoshis) {
  var maxWidth = 350;
  var minWidth = 10;
  var w = (satoshis / 1e8) * 10;
  w = (w > maxWidth)? maxWidth : w;
  w = (w < minWidth)? minWidth : w;
  return w;
}

var tick = function() {
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
					size: getTransactionAmount(size)
				}
			)
		}
	})
}

var GetXY = function(hash) {
	var xy = _.findWhere(xy,{"id":hash})
	return !_.isUndefined ? {x: x, y: y} : {x: 0, y: 0};
}

var draw = function(data, target) {
	voronoi = d3.geom.voronoi()
	    .clipExtent([[0, 0], [width, height]]);
	
	force = d3.layout.force()
	    .charge(function(d){
	    	var amt = getTransactionAmount(d.id);
	    	return -getWidthFromSatoshis(amt)
	    })
		// .charge(-20)
	    .size([width, height])
	    .nodes(xy)
	    .on("tick", tick)
	    .start();

	path = svg.append("g").selectAll("path");
}

var polygon = function(d) {
	// console.log(d)
  if(d.length < 1) return
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
	// There's a bug here with the data being fed in. Not sure of the source.
	path = path
	  .data(
	  	voronoi(mapToVoro), 
	  	polygon
	  	);

	path.exit().remove();
	path.enter().append("path")
	  .attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
	  .attr("d", polygon)
	  .on('hover', function(d){
	  	console.log("hovering")
	  });

	path.order();
	force.start();
}


var renderSingleBlock = function(blockHash) {



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
	}, 120);
}

$(document).ready(function(){
	setup();
	for(var i=0;i<testBlocks.length;i++) {
		renderSingleBlock(testBlocks[i]);
	}

})