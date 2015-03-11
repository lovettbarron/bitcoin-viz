console.log("hello!");

var 
columnLeft = 0, 
columnTop = 0,
horzSpace = 6, 
vertSpace = 10,
blockHeight = 18,
pixelsPerBtc = 10,
maxWidth = $(window).width() - 20,
minWidth = 1,
opacityDecayRate = 120000; // millis per opacity. 

var enterColor = "#FFFDF3";
var regularColor = "#D816AB";

var txnConn = new WebSocket("wss://ws.chain.com/v2/notifications");
var txns = [];
var hashToTxnIndex = {};

txnConn.onopen = function (ev) {
  var req = {type: "new-transaction", block_chain: "bitcoin"};
  txnConn.send(JSON.stringify(req));
};

txnConn.onmessage = function (ev) {
  var x = JSON.parse(ev.data);
  if (x.payload.transaction) {
    // console.dir(x);
    update(x);
  }
};

txnConn.onclose = function (ev) {
  txnConn = new WebSocket("wss://ws.chain.com/v2/notifications");
};

var blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");


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
  blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");
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

svg = d3.select("body").append("svg")
            .attr("width", $(window).width())
            .attr("height", 10000);

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

var _update = function(txn) {
  txn.pushedAt = new Date();
  var listIdx = txns.push(txn);
  hashToTxnIndex[txn.payload.transaction.hash] = listIdx - 1; 
  draw(txns);
};
var update = _.throttle(_update, 100); 
