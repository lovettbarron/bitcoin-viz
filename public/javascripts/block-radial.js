var
horzSpace = 4, // space between rectangles
newRectangleExtraHorzSpace = 5, // extra space for new rectanges.
vertSpace = 4,
rectangleHeight = 25, 
pixelsPerBtc = 10, // rectangle width in pixels per bitcoin value in the transaction
minWidth = 1,
opacityDecayRate = 120000, // millis per opacity unit. How we translate how old a transaction is to how opaque the rectangle fill is.
closeIntroDelay = 15000; // delay before hiding the intro text.

var enterColor = "#FFFDF3";
var regularColor = "#D816AB";

var txnConn = new WebSocket("wss://ws.chain.com/v2/notifications");
var blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");
var txns = [];
var hashToTxnIndex = {};

var vizSvg;

// set up the websocket to chain's api and ask for callbacks for new-transaction
txnConn.onopen = function (ev) {
  var req = {type: "new-transaction", block_chain: "bitcoin"};
  txnConn.send(JSON.stringify(req));
};

// message handler
txnConn.onmessage = function (ev) {
  var x = JSON.parse(ev.data);
  // console.dir(x);
  if (x.payload.transaction) {
    update(x);
  }
};

// if the connection gets closed reopen it
txnConn.onclose = function (ev) {
  console.log("txnConn closed");
  txnConn = new WebSocket("wss://ws.chain.com/v2/notifications");
};

// open another socket to receive updates when there's a new block. It might be possible to do this with a single
// websocket.
blockConn.onopen = function (ev) {
  var req = {type: "new-block", block_chain: "bitcoin"};
  blockConn.send(JSON.stringify(req));
};

blockConn.onmessage = function (ev) {
  var x = JSON.parse(ev.data);
  if (x.payload.block) {
    updateBlock(x);
  }
};

blockConn.onclose = function (ev) {
  console.log("blockConn closed");
  blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");
};

// initialize a bunch of stuff once document is ready
$(document).ready(function() {

  // create the svg canvas where we'll draw the visualization
  vizSvg = d3.select("#viz-canvas").append("svg")
  .attr("width", $(window).width())
  .attr("height", $(window).height());

  // call draw if window is resized
  $(window).on("resize", _.debounce(function() {
    vizSvg.attr("width", $(window).width());
    draw(txns);
  }, 500));
});

/* called when we get a new confirmed block chain block from chain. Gets transaction hashes for all
transactions in the block. Many of these transactions we'll have already seen when we got chain's transaction
event. We find any transactions we've already seen using the hashToTxnIndex dictionary, and set those transactions to
have confirmations = 1, meaning they're now included in a blockchain block. This will make them be drawn as green outlines instead of pink.
*/
var updateBlock = function(block) {
  var confirmedTxns = block.payload.block.transaction_hashes;
  var timestamp = new Date.now();
  _.each(confirmedTxns, function(confirmedTxnHash) {
    var idx = hashToTxnIndex[confirmedTxnHash];
    if (idx) {
      txns[idx].payload.transaction.confirmations = 1;
      txns[idx].payload.transaction.confirmationTimestamp = timestamp;
    }
  });
};

// convert value of transaction in satoshis to pixel width.
var getWidthFromSatoshis = function(satoshis) {
  var maxWidth = $(window).width();
  var w = (satoshis / 1e8) * pixelsPerBtc;
  w = (w > maxWidth)? maxWidth : w;
  w = (w < minWidth)? minWidth : w;
  return w;
}

// draw transactions
var draw = function(data) {

  // get xy coordinates of the rectangle we want to draw for each transaction.
  var layoutXYList = getRectXYListFromData(data, $(window).width(), $(window).height(), rectangleHeight, horzSpace, vertSpace);
  var vizSvgHeight = $("#viz-canvas").find("svg").height();

  // if the y coordinate of the last transaction is greater than window canvas height, make the canvas bigger.
  if (_.last(layoutXYList).y > vizSvgHeight) {
    $("#viz-canvas").find("svg").height(vizSvgHeight + $(window).height());
  }


  // var confirmedBlock = svg.selectAll("g")
  // 	.data(function(d) {
  // 		_.each(d.)
  // 	})
  // 	.enter()
  // 	.attr("class",function() {

  // 	})

var getAngle = function(increment, size, padding) {
	var ticks = _.isUndefined(padding) ? 360 : padding;
	var degrees = 90 - (increment * (360 / ticks));
	var radians = (degrees / 360) * 2 * Math.PI;
	return radians;
}

// var translateAngleToCenter = function(x,y) {

// }

var radius = 300;


vizSvg.selectAll("line")
	.data(data)
	.enter()
	.append("line")
	.attr("x1", function(d,i) {
		return Math.cos(getAngle(i))*radius;
	})
	.attr("y1", function(d,i) {
		return Math.sin(getAngle(i))*radius;
		// getAngle(getWidthFromSatoshis(d.payload.transaction.amount))
	})
	.attr("x2", function(d,i) {
		return Math.cos(getAngle(i))*(radius+getWidthFromSatoshis(d.payload.transaction.amount));
	})
	.attr("y2", function(d,i) {
		return Math.sin(getAngle(i))*(radius+getWidthFromSatoshis(d.payload.transaction.amount));
	})
	.attr("stroke","red")
	;





  // // we use d3 to draw
  // vizSvg.selectAll("line")
  // .data(data)
  // .attr("class", function(d) {
  //   // set display class based on whether transaction was confirmed or not
  //   if (d.payload.transaction.confirmations > 0) {
  //     return "confirmed";
  //   } else {
  //     return "unconfirmed";
  //   }
  // })

  // /* for confirmed transactions, we draw rectangles with no fill. For unconfirmed transactions, we have a fill opacity that goes
  // down as the transaction gets older.
  // */
  // .attr("fill-opacity", function(d, i) {
  //   if (d.payload.transaction.confirmations > 0) {
  //     return 1;
  //   }  else {
  //     var timeDiff = (new Date()) - d.pushedAt;
  //     var opacity = 1 - (timeDiff / opacityDecayRate);
  //     opacity = (opacity < 0)? 0 : opacity;
  //     return opacity;
  //   }
  // })
  // .attr("y", function(d, i) {
  //   return layoutXYList[i].x;
  // })
  // .attr("x", function(d, i) {
  //   return layoutXYList[i].y;
  // })
  // .attr("width", function(d, i) {
  //   return getWidthFromSatoshis(d.payload.transaction.amount);
  // })
  // .enter()
  // .append("rect")
  // // properties of the rectangle for a just added transaction.
  // .attr("y", function(d, i) {
  //   return layoutXYList[i].x + newRectangleExtraHorzSpace;
  // })
  // .attr("x", function(d, i) {
  //   return layoutXYList[i].y;
  // })
  // .attr("width", function(d, i) {
  //   return getWidthFromSatoshis(d.payload.transaction.amount);
  // })
  // .attr("height", rectangleHeight)

  // // new rectangles start as a bright white color and fade to pink.
  // .attr("fill", enterColor)
  // .transition()
  // .duration(750)
  // .attr("x", function(d, i) {
  //   return layoutXYList[i].x;
  // })
  // .attr("fill", regularColor);

};

/* Given the data set of transactions, returns list of objects with computed x and y properties. We lay rectangles out left to right
top to bottom on the screen. If a transaction is too wide to fit on the current row, we start a new row below.
*/
var getRectXYListFromData = function(txns, screenWidth, screenHeight, rectHeight, horzSpace, vertSpace) {
  var left = 0;
  var top = 0;
  var list = [];

  for (var i = 0; i < txns.length; i++) {
    var object = {};
    var width = getWidthFromSatoshis(txns[i].payload.transaction.amount);
    var newLeft = left + horzSpace + width;
    var x;

    if (newLeft > screenWidth) {
      x = 0;
      left = horzSpace + width;
      top += rectHeight + vertSpace;
    } else {
      x = left;
      left = newLeft;
    }
    object.x = x;
    object.y = top;
    list[i] = object;
  };

  return list;
};

/* Handles new transactions coming over the websocket. Using underscore's throttle because sometimes would see many transactions at once and this was causing problems.
Throttle ensures that a funciton is only called at most once per x milliseconds (here 100).
*/
var update = _.throttle(function(txn) {

  // record when we saw the transaction so we can set rectangle opacity by transaction age.
  txn.pushedAt = new Date();
  var listIdx = txns.push(txn);

  // keep a dictionary of all transactions we've seen keyed by the transaction's own hash value. When we receive a block update, 
  // we'll use this dictionary to look up transactions we know about, and mark them so they display a different color, meaning they've now been included in a block.
  hashToTxnIndex[txn.payload.transaction.hash] = listIdx - 1; 
  draw(txns);
}, 100);


