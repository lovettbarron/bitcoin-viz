var 
horzSpace = 4, 
vertSpace = 4,
blockHeight = 25,
pixelsPerBtc = 10,
maxWidth = $(window).width() - 20,
minWidth = 1,
opacityDecayRate = 120000, // millis per opacity. 
closeIntroDelay = 15000;

var enterColor = "#FFFDF3";
var regularColor = "#D816AB";

var txnConn = new WebSocket("wss://ws.chain.com/v2/notifications");
var blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");
var txns = [];
var hashToTxnIndex = {};

var vizSvg;

txnConn.onopen = function (ev) {
    var req = {type: "new-transaction", block_chain: "bitcoin"};
    txnConn.send(JSON.stringify(req));
  };

  txnConn.onmessage = function (ev) {
    var x = JSON.parse(ev.data);
    // console.dir(x);
    if (x.payload.transaction) {
      update(x);
    }
  };

  txnConn.onclose = function (ev) {
    console.log("txnConn closed");
    txnConn = new WebSocket("wss://ws.chain.com/v2/notifications");
  };

  blockConn.onopen = function (ev) {
    var req = {type: "new-block", block_chain: "bitcoin"};
    blockConn.send(JSON.stringify(req));
  };

  blockConn.onmessage = function (ev) {
    var x = JSON.parse(ev.data);
    console.dir(x);
    if (x.payload.block) {
      updateBlock(x);
    }
  };

  blockConn.onclose = function (ev) {
    console.log("blockConn closed");
    blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");
  };



var bodyLoaded = function() {
  console.log("loaded");

  $("#intro-text").animate({ opacity: 1.0}, 3000);

  /* you can see what is going on in the engine with console.log(window.engine) */
  window.engine = new GSS(document);



  d3.select("#unconfirmed-key")
  .append("svg").attr("height", blockHeight).attr("width", 500)
  .append("rect")
  .attr("class", "unconfirmed")
  .attr("fill-opacity", 0)
  .attr("x", 0).attr("y", 0)
  .attr("width", pixelsPerBtc*10).attr("height", blockHeight);

  d3.select("#unconfirmed-key").select("svg")
  .append("text")
  .attr("x", pixelsPerBtc*10 + 8)
  .attr("y", 0)
  .attr("dy", "1.2em")
  .attr("class", "smallType")
  .text("A 10 bitcoin transaction");

  d3.select("#confirmed-key")
    .append("svg").attr("height", blockHeight).attr("width", 500)
    .append("rect")
    .attr("class", "confirmed")
    .attr("x", 0).attr("y", 0)
    .attr("width", pixelsPerBtc*10).attr("height", blockHeight);

  d3.select("#confirmed-key").select("svg")
  .append("text")
  .attr("x", pixelsPerBtc*10 + 8)
  .attr("y", 0)
  .attr("dy", "1.2em")
  .attr("class", "smallType")
  .text("A 10 bitcoin confirmed transaction");

  vizSvg = d3.select(".viz").append("svg")
  .attr("width", $(window).width())
  .attr("height", $(window).height());

  d3.select("body")
  .on("click", function() {
   console.log("clicked");
   if ($("#intro-text").css("opacity") > 0) {
     $("#intro-text").animate({ opacity: 0}, 1000);
     $("#intro-cover").animate({ opacity: 0}, 1000);
   } else {
     $("#intro-text").animate({ opacity: 1.0}, 1000);
     $("#intro-cover").animate({ opacity: 0.5}, 1000);
   }
  });

  d3.select("body")
  .on("tap", function() {
   console.log("clicked");
   if ($("#intro-text").css("opacity") > 0) {
     $("#intro-text").animate({ opacity: 0}, 1000);
     $("#intro-cover").animate({ opacity: 0}, 1000);
   } else {
     $("#intro-text").animate({ opacity: 1.0}, 1000);
     $("#intro-cover").animate({ opacity: 0.5}, 1000);
   }
  });

  setTimeout(function() {
    $("#intro-text").animate({ opacity: 0}, 1000);
    $("#intro-cover").animate({ opacity: 0}, 1000);
  }, closeIntroDelay);
};

var updateBlock = function(block) {
  var confirmedTxns = block.payload.block.transaction_hashes;
  _.each(confirmedTxns, function(confirmedTxnHash) {
    console.dir("updating " + confirmedTxnHash)
    var idx = hashToTxnIndex[confirmedTxnHash];
    if (idx) {
      txns[idx].payload.transaction.confirmations = 1;
    }
  });
};

var getWidthFromSatoshis = function(satoshis) {
  var w = (satoshis / 1e8) * pixelsPerBtc;
  w = (w > maxWidth)? maxWidth : w;
  w = (w < minWidth)? minWidth : w;
  return w;
}

var draw = function(data) {
  var layoutXYList = getRectXYListFromData(data, $(window).width(), $(window).height, blockHeight, horzSpace, vertSpace);
  var vizSvgHeight = $(".viz").find("svg").height();
  if (_.last(layoutXYList).y > vizSvgHeight) {
    $(".viz").find("svg").height(vizSvgHeight + $(window).height());
  }

  vizSvg.selectAll("rect")
  .data(data)
  .attr("class", function(d) {
    if (d.payload.transaction.confirmations > 0) {
      return "confirmed";
    } else {
      return "unconfirmed";
    }
  })
  .attr("fill-opacity", function(d, i) {
    if (d.payload.transaction.confirmations > 0) {
      return 1;
    }  else {
      var timeDiff = (new Date()) - d.pushedAt;
      var opacity = 1 - (timeDiff / opacityDecayRate);
      opacity = (opacity < 0)? 0 : opacity;
      return opacity;
    }
  })
  .attr("x", function(d, i) {
    return layoutXYList[i].x;
  })
  .attr("y", function(d, i) {
    return layoutXYList[i].y;
  })
  .enter()
  .append("rect")
  // setting x and y for new items is same as x and y for existing, but we dont' update columnLeft or columnTop
  .attr("x", function(d, i) {
    return layoutXYList[i].x;
  })
  .attr("y", function(d, i) {
    return layoutXYList[i].y;
  })
  .attr("width", function(d, i) {
    return getWidthFromSatoshis(d.payload.transaction.amount);
  })
  .attr("height", blockHeight)
  .attr("fill", enterColor)
  .transition()
  .duration(750)
  .attr("fill", regularColor);
};

// given the data set of transactions, returns list of objects with computed x and y properties
var getRectXYListFromData = function(txns, screenWidth, screenHeight, rectHeight, horzSpace, vertSpace) {
  var left = 0;
  var top = 0;
  var list = [];

  // a bit ugly since map refers to state outside the iteree function
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

var update = _.throttle(function(txn) {
  txn.pushedAt = new Date();
  var listIdx = txns.push(txn);
  hashToTxnIndex[txn.payload.transaction.hash] = listIdx - 1; 
  draw(txns);
}, 100);


