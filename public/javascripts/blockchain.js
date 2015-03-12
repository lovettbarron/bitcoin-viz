var 
columnLeft = 0, 
columnTop = 0,
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

var svg;

txnConn.onopen = function (ev) {
    var req = {type: "new-transaction", block_chain: "bitcoin"};
    txnConn.send(JSON.stringify(req));
  };

  txnConn.onmessage = function (ev) {
    var x = JSON.parse(ev.data);
    console.dir(x);
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
  .attr("dy", "1em")
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
  .attr("dy", "1em")
  .attr("class", "smallType")
  .text("A 10 bitcoin confirmed transaction");

  svg = d3.select(".viz").append("svg")
  .attr("width", $(window).width())
  .attr("height", 10000);

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
  svg.selectAll("rect")
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
  .enter()
  .append("rect")
  .attr("width", function(d, i) {
    return getWidthFromSatoshis(d.payload.transaction.amount);
  })
  .attr("height", blockHeight)
  .attr("x", function(d, i) {
    var width = getWidthFromSatoshis(d.payload.transaction.amount);
    var newColumnLeft = columnLeft + horzSpace + width;
    var value;
    if (newColumnLeft > $(window).width()) {
      value = 0;
      columnLeft = horzSpace + width;
      columnTop += blockHeight + vertSpace;
    } else {
      value = columnLeft;
      columnLeft = newColumnLeft;
    }
    return value;
  })
  .attr("y", function(d, i) {
    return columnTop;
  })
  .attr("fill", enterColor)
  .transition()
  .duration(750)
  .attr("fill", regularColor);
};

var update = _.throttle(function(txn) {
  txn.pushedAt = new Date();
  var listIdx = txns.push(txn);
  hashToTxnIndex[txn.payload.transaction.hash] = listIdx - 1; 
  draw(txns);
}, 100);


