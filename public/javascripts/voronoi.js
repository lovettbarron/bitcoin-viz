var xy = [];
var bucketSvg,bucketPath, bucketVoronoi, force, polygon;
var svg, path, voronoi;
var bucketWidth = 960,
    bucketHeight = 500;
var blockWidth = 960,
	blockHeight = 50;
var info, blockSet;
var mapToVoro, voroed;

var blockSvgs = [], blockPath = [], blockTrans = [];

var testBlocks = ["0000000000000000070ea877d0b45f31147575842562b1e09f6a1bd6e46f09ed","0000000000000000060577e744223eea22cd45597ca55b1e981ce19874be4f7b","000000000000000001a40ab7df60551364c33e4bade591dc946de26e23569418","00000000000000000580799b80ab02200454c02701023076208d2942a45197e9","00000000000000001641d325610619de2c3b1d7d4c04d7e2b88975faa99bd26a"]
///////////////////////////////////////////////////////////
///////////  Data or Time oriented Functions	  /////////
///////////////////////////////////////////////////////////

var getWidthFromSatoshis = function(satoshis, min, max) {
  var maxWidth = !_.isUndefined(max) ? max : blockWidth/3;
  var minWidth = !_.isUndefined(min) ? min : 10;
  var w = (satoshis / 1e8) * 10;
  w = (w > maxWidth)? maxWidth : w;
  w = (w < minWidth)? minWidth : w;
  return w;
}

var parseToXY = function(data, width, height) {
	// Add new unconfirmed to the bucket
	_.each(data,function(d,i) {
		if(!_.findWhere(xy,{"id":d.hash})) {
			var size = getTransactionAmount(d.hash)
			xy.push(
				{
					x: Math.random()*width,
					y: Math.random()*height,
					id: d.hash,
					size: size
				}
			)
		}
	})
}

var pruneXy = function(newBlockHash) {
	console.log("Pruning xy", xy.length)
	
	var block = _.findWhere(blocks,{"hash":newBlockHash})
	
	if(_.isUndefined(block)){
		console.log("Couldn't find block",newBlockHash)
		return
	}
	_.each(block.transaction_hashes,function(d,i){
		var check = _.findWhere(xy,{"id":d});
		check = _.isUndefined(check) ? false : check;
		// console.log("Trying " + d, check)
		if(check){
			var index = xy.indexOf(check);
			if(index!=-1) {
				console.log("removing " + d + " at " + index)
				xy.splice(index,1)
			}
		}
	})
	console.log("new length post prune", xy.length)
}

var GetXY = function(hash) {
	var xy = _.findWhere(xy,{"id":hash})
	return !_.isUndefined ? {x: x, y: y} : {x: 0, y: 0};
}

var polygon = function(d) {
  if(d.length < 1 || _.isUndefined(d)) return
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

	if(transactions.length != xy.length) parseToXY(unconfirmedTrans, bucketWidth, bucketHeight);

	var focus = bucketSvg.selectAll("circle")
	    .data(xy)

	focus.enter().append("circle")
	    .attr("r", function(d) { return getWidthFromSatoshis(d.size,5,20)})
	    .attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
    focus.exit().remove();
	 //  .transition()
		// .ease(Math.sqrt)
		// .attr("r", 4.5);

	// mapToVoro = _.map(xy,function(d) { return [d.x,d.y] });
	// _.each(mapToVoro, function(d,i){
	// 	if(_.isNaN(d[0]) || _.isNaN(d[1])) {
	// 		console.log("NAN DETECTED")
	// 		mapToVoro.splice(i,1)
	// 	}
	// 	if(_.isUndefined(d[0]) || _.isUndefined(d[1])) {
	// 		console.log("UNDEFINED DETECTED")
	// 		mapToVoro.splice(i,1)
	// 	}
	// })

	// voroed = bucketVoronoi(mapToVoro);


	// There's a bug here with the data being fed in. Not sure of the source.
	// Suspect an element of the bucketPath array is undefined, prob __data__ 
	// try {
	// bucketPath = bucketPath
	//   .data(
	//   	voroed,
	//   	function(d) {
	//   		// console.log(d)
	//   		return polygon(d);	
	// 	  	} 
	//   	)
	// } catch(e) {
	// 	console.log("xy len",xy.length)
	// 	console.log("Error in data struct")//, e.stack))
	// 	console.log("Trying to reset selection")
	// 	// Reselecting
	// 	// bucketPath = bucketSvg.append("g").selectAll("path");
	// 	// Filtering through selection and removing elements without valid data.
	// 	bucketPath.filter(function(d,i){
	// 		if(_.isUndefined(d)) d.remove()
	// 	})
	// }

	// bucketPath.exit().remove();

	// bucketPath.enter().append("path")
	//   .attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
	//   .attr("d", polygon);

	// bucketPath.order();
	force.start();
}

var setupBucket = function() {
	bucketSvg = d3.select(".bucket").append("svg")
	    .attr("width", bucketWidth)
	    .attr("height", bucketHeight)
	    // .on("mousemove", function() { vertices[0] = d3.mouse(this); redraw(); });

	drawBucket();

	var interval = setInterval(function() {
		force.start();
		redraw();
	}, 60);
}

var tick = function() {
  bucketSvg.selectAll("circle")
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}


///////////////////////////////////////////////////////////
/////////// Rendering block re: single hash ///////////////
///////////////////////////////////////////////////////////
	// xy values are kept in memory to animate
	// but since block transactions don't change
	// we find the x/y values ones, and then clear those arrays

var setupSorting = function() {
	d3.select('.blocks').on("click",resortBlocks)
}

var resortBlocks = function() {
	console.log("resort")
    d3.select(".blocks").selectAll("svg").sort(function(a, b) {
			return d3.descending(a.height,b.height);
	    })
		.transition().duration(500)
		.style("top",function(d,i){
			 return 60 + ((i*60)) + "px";
		})
}

var setupBlocks = function() {
	blockSet = d3.select(".blocks")

	// This is an engine, should work for all blocks as they're drawn	
	voronoi = _.isUndefined(voronoi) ? d3.geom.voronoi()
	    .clipExtent([[0, 0], [blockWidth, blockHeight]]) : voronoi;
}

var refreshBlocks = function() {

	blockSet.selectAll("svg")
		.data(blocks)
	.enter()
		.append("svg")
		.attr("id",function(d) { return "height" + getBlockHeight(d.hash)})
		.attr("class", "block")
	    .attr("width", blockWidth)
	    .attr("height", 0)
	    .style("left", function(){
	    	return window.innerWidth/2 - blockWidth/2
	    })
	    .transition()
	    .duration(500)
	    .attr("height", blockHeight)

	blockSet.selectAll("svg")
		.data(blocks)
		.enter()
		.append("text")
	    .text(function(d) { getBlockHeight(d.hash) } )

	// resortBlocks();
}

var drawCompletedBlock = function(blockHash) {
	var svg = d3.selectAll('svg').filter(function(d){
		if(this.id == "height"+getBlockHeight(blockHash)) return this
	})

	var t = _.where(transactions,{"block_hash":blockHash})
	var coords = parseForBlock(t,blockWidth,blockHeight,blockHash)

	svg.selectAll("circle")
	    .data(coords)
	  .enter().append("circle")
	    .attr("r", 4.5)
	    .attr("cx",function(d){
	    	return 0
	    })
	    .attr("cy", function(d){
	    	return d.y
	    })
		.attr("class", function(d, i) { return "q" + (i % 9) + "-9"; })
		.transition()
		    .duration(function(){
		    	return 500 + (Math.random()*200)
		    })
	    .attr("cx",function(d){
	    	return d.x
	    })
		// .on("mouseover",mouseOverTransaction)
		// .on("mouseout",mouseOutTransaction)
}

var findRatioViaSatoshis = function(transaction_hash) {
	var val = getTransactionAmount(transaction_hash);
	return getWidthFromSatoshis(val, 0.1, 1.0)
}

var parseForBlock = function(data, width, height, blockhash) {
	var arr = [];
	var bd = _.findWhere(blockTrans,{"id":blockhash});
	if(_.isUndefined(bd)) return
	var ratio = blockWidth / bd.expect
	_.each(data,function(d,i) {
		var size = getTransactionAmount(d.hash)
		arr.push(
			{
				x: i*ratio,//*findRatioViaSatoshis(d.hash),
				y: Math.random()*height,
				id: d.hash,
				size: getTransactionAmount(size)
			}
		)
	})
	return arr
}

var checkForUpdatedTransactionsArray = function() {
	_.each(blockTrans, function(d,i) {
		if(d.count !== d.expect) {
			var t = _.where(transactions,{"block_hash":d.id})
			d.count = t.length;
			drawCompletedBlock(d.id)
		}
	})
}



///////////////////////////////////////////////////////////
///////////		 Interactive components		 //////////////
///////////////////////////////////////////////////////////

var setupInfoBox = function() {
	info = d3.select(".hover")
}

var mouseOverTransaction = function(d){
	console.log("mouse",d)
	info.transition()        
		.duration(200)
		.style("opacity", .9);  

}

var mouseOutTransaction = function(d){
	info.transition()        
		.duration(300)      
		.style("opacity", 0);   
}

var windowResize = function(d) {
	blockSet.selectAll("svg").data(blocks)
		.style("left", function(){
	    	return window.innerWidth/2 - blockWidth/2
	    })
}

///////////////////////////////////////////////////////////
/////////// Rendering bock re: single hash ////////////////
///////////////////////////////////////////////////////////


$(document).ready(function(){
	setupBucket();
	setupBlocks();
	setupInfoBox();
	setupSorting();
	for(var i=0;i<testBlocks.length;i++) {
		FetchBlock(testBlocks[i]);
	}

	var updateBlocks = setInterval(function(){
		checkForUpdatedTransactionsArray();
		refreshBlocks();
	},300)

	document.addEventListener("new-block", function(e) {
		pruneXy(e.detail)
	    var block = getBlock(e.detail)
	    if(_.findWhere(blockTrans,{"id":e.detail})) return
			blockTrans.push({
			id: e.detail,
			count: 0,
			expect: block.transaction_hashes.length
		})
	});

	document.addEventListener("block-populated", function(e) {
		console.log("Populated ", e.detail)
		drawCompletedBlock(e.detail);
	});

	document.addEventListener("new-trans", function(e) {
	  // console.log("new-trans-event",e.detail);
	});
})