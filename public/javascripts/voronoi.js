var xy = [], nodes = [];
var bucketSvg,bucketPath, bucketVoronoi, force, polygon;
var svg, path, voronoi;
var bucketWidth = 960,
    bucketHeight = 500;
var blockWidth = 960,
	blockHeight = 50;

var blockSvgs = [], blockPath = [];

var testBlocks = ["0000000000000000070ea877d0b45f31147575842562b1e09f6a1bd6e46f09ed","0000000000000000060577e744223eea22cd45597ca55b1e981ce19874be4f7b","000000000000000001a40ab7df60551364c33e4bade591dc946de26e23569418","00000000000000000580799b80ab02200454c02701023076208d2942a45197e9","00000000000000001641d325610619de2c3b1d7d4c04d7e2b88975faa99bd26a"]


var getWidthFromSatoshis = function(satoshis, max, min) {
  var maxWidth = !_.isUndefined(max) ? max : blockWidth/3;
  var minWidth = !_.isUndefined(min) ? min : 10;
  var w = (satoshis / 1e8) * 10;
  w = (w > maxWidth)? maxWidth : w;
  w = (w < minWidth)? minWidth : w;
  return w;
}

var tick = function() {
  bucketSvg.selectAll("circle")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

var parseToXY = function(data) {
	// Add new unconfirmed to the bucket
	_.each(data,function(d,i) {
		if(!_.findWhere(xy,{"id":d.hash})) {
			var size = getTransactionAmount(d.hash)
			xy.push(
				{
					x: Math.random()*bucketWidth,
					y: Math.random()*bucketHeight,
					id: d.hash,
					size: getTransactionAmount(size)
				}
			)
		}
	})
}

var pruneXy = function(newBlock) {
	console.log("Pruning xy")
	_.each(newBlock.transaction_hashes,function(d,i){
		if(_.findWhere(xy,{"id":d.hash})){
			var index = xy.indexOf(_.findWhere(xy,{"id":d.hash}));
			if(index!=-1) {
				xy = xy.splice(index)
			}
		}
	})
}

var GetXY = function(hash) {
	var xy = _.findWhere(xy,{"id":hash})
	return !_.isUndefined ? {x: x, y: y} : {x: 0, y: 0};
}

var polygon = function(d) {
	// console.log(d)
  if(d.length < 1) return
  return "M" + d.join("L") + "Z";
}


///////////////////////////////////////////////////////////
/////////// Rendering the "bucket" of unconfirmed /////////
///////////////////////////////////////////////////////////
var drawBucket = function() {
	bucketVoronoi = d3.geom.voronoi()
	    .clipExtent([[0, 0], [bucketWidth, bucketHeight]]);
	
	force = d3.layout.force()
	    .charge(function(d){
	    	var amt = getTransactionAmount(d.id);
	    	return -getWidthFromSatoshis(amt)
	    })
		// .charge(-20)
	    .size([bucketWidth, bucketHeight])
	    .nodes(xy)
	    .on("tick", tick)
	    .start();

	bucketPath = bucketSvg.append("g").selectAll("path");
}


var redraw = function() {

	var unconfirmedTrans = _.where(transactions,{confirmations:0})

	if(transactions.length != xy.length) parseToXY(unconfirmedTrans);

	bucketSvg.selectAll("circle")
	    .data(GetXY)
	  .enter().append("circle")
	    .attr("r", 1.5)
	  .transition()
		.ease(Math.sqrt)
		.attr("r", 4.5);

	var mapToVoro = _.map(xy,function(d) { return [d.x,d.y] });
	// There's a bug here with the data being fed in. Not sure of the source.
	bucketPath = bucketPath
	  .data(
	  	bucketVoronoi(mapToVoro), 
	  	polygon
	  	);

	bucketPath.exit().remove();
	bucketPath.enter().append("path")
	  .attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
	  .attr("d", polygon);

	bucketPath.order();
	force.start();
}

var setupBucket = function() {
	bucketSvg = d3.select("body").append("svg")
	    .attr("width", bucketWidth)
	    .attr("height", bucketHeight)
	    // .on("mousemove", function() { vertices[0] = d3.mouse(this); redraw(); });

	drawBucket();

	var interval = setInterval(function() {
		force.start();
		redraw();
	}, 120);
}

///////////////////////////////////////////////////////////
/////////// Rendering block re: single hash ///////////////
///////////////////////////////////////////////////////////
	// xy values are kept in memory to animate
	// but since block transactions don't change
	// we find the x/y values ones, and then clear those arrays

var renderSingleBlock = function(blockHash) {
	var newBlock = d3.select("body").append("svg")
		.attr("id",blockHash)
		.attr("class","block")
	    .attr("width", blockWidth)
	    .attr("height", blockHeight)

	// This is an engine, should work for all blocks as they're drawn	
	voronoi = _.isUndefined(voronoi) ? d3.geom.voronoi()
	    .clipExtent([[0, 0], [blockWidth, blockHeight]]) : voronoi;

	path = d3.selectAll("svg")
		.select("id",blockHash)
		.append("g")
		.selectAll("path");
}

var findXyReSatoshis = function(blockHash) {
	var orderedTransactions = [];
	var hashVals = [];
	var BlockTrans = [];

	getWidthFromSatoshis(val, 0.1, 1.0)



	return orderedTransactions
}



///////////////////////////////////////////////////////////
/////////// Rendering bock re: single hash ////////////////
///////////////////////////////////////////////////////////


$(document).ready(function(){
	setupBucket	();
	for(var i=0;i<testBlocks.length;i++) {
		FetchBlock(testBlocks[i]);
		renderSingleBlock(testBlocks[i]);
	}


	document.addEventListener("new-block", function(e) {
		pruneXy(e.detail)
	});

	document.addEventListener("block-populated", function(e) {
		console.log("Populated ", e.detail)
	});

	document.addEventListener("new-trans", function(e) {
	  // console.log("new-trans-event",e.detail);
	});
})