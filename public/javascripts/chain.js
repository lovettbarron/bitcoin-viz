var blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");
var txnConn = new WebSocket("wss://ws.chain.com/v2/notifications");
var blocks = [], transactions = [];
var chain = 'https://api.chain.com/v2/bitcoin/' 
var key = "010e57f20c6bd49cb01703706ff9bfc7";

////////// Events /////////
// Create the event
// var newBlock = new CustomEvent("new-block",{ "detail": block.hash });
// var blockPopulated = new CustomEvent("block-populated",{ "detail": block.hash });
// var newTrans = new CustomEvent("new-trans",{ "detail": trans.hash });



///////////////////////////////////////////////////////////
///////////////////////   API Methods   ///////////////////
///////////////////////////////////////////////////////////
var GetBlockLevelTransactions = function(block) {
	console.log("got block",block)
	var hashes = block.transaction_hashes;
	var request_hashes = [];
	var iter=0, count=0;

	_.each(hashes, function(d,i) {
		if(count==0) request_hashes[iter] = "";
		request_hashes[iter] += count==0 ? d : "," + d
		count++;
		if(count>=1) { iter+=1; count = 0 }
	})

	// console.log("r",request_hashes)

	var iter = 0;
	var query = setInterval(function() {
		FetchTransactions(request_hashes[iter]);
		if(iter>=request_hashes.length-1) { 
			var blockPopulated = new CustomEvent("block-populated",{ "detail": block.hash });
			document.dispatchEvent(blockPopulated);
			clearInterval(query) 
		}
		iter++;
	},10)

	blocks.push(block)
	var newBlock = new CustomEvent("new-block",{ "detail": block.hash });
	document.dispatchEvent(newBlock);
}

var FetchTransactions = function(blockhash) {
	var fullURL = chain + "transactions/" + blockhash
	$.ajax({
		url: fullURL,
		data: {'api-key-id': key},
		type: 'GET',
		success: function(data) {
        	transactions.push(data);
		}
	})
		
}

var FetchBlock = function(blockhash) {
	var fullURL = chain + "blocks/" + blockhash
	$.ajax({
		url: fullURL,
		data: {'api-key-id': key},
		type: 'GET',
		success: function(data) {
			blocks.push(data);
        	GetBlockLevelTransactions(data)
		}
	})		
}

///////////////////////////////////////////////////////////
/////////////////   Connect block   ///////////////////////
///////////////////////////////////////////////////////////
// On Open
blockConn.onopen = function (ev) {
  var req = {type: "new-block", block_chain: "bitcoin"};
  blockConn.send(JSON.stringify(req));
  GetBlockLevelTransactions(testBlock);
  blocks[0] = testBlock;
};

// On Message
blockConn.onmessage = function (ev) {
  var x = JSON.parse(ev.data);
  if(x.payload.type !== "heartbeat") GetBlockLevelTransactions(x)
};

// On Close
blockConn.onclose = function (ev) {
  console.log("blockConn closed");
  blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");
};

///////////////////////////////////////////////////////////
/////////////////   Connect NewTrans   ///////////////////////
///////////////////////////////////////////////////////////
// On Open
txnConn.onopen = function (ev) {
  var req = {type: "new-transaction", block_chain: "bitcoin"};
  txnConn.send(JSON.stringify(req));
};

// On Message
txnConn.onmessage = function (ev) {
  var x = JSON.parse(ev.data);
  // console.log("Trans msg",x)
  if(x.payload.type == "new-transaction") {
  	transactions.push(x.payload.transaction)
	var newTrans = new CustomEvent("new-trans", { "detail": x.payload.transaction.hash });
  	document.dispatchEvent(newTrans);
  } else if (x.payload.type == "new-block") {
  	// blocks.push(x.payload.block)
  	// GetBlockLevelTransactions(x.payload.block);
  }



  // if(x.payload.type !== "heartbeat") 
};

// On Close
txnConn.onclose = function (ev) {
  console.log("blockConn closed");
  blockConn = new WebSocket("wss://ws.chain.com/v2/notifications");
};

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
// Get Vals
var getTransactionAmount = function(hash) {
	var amount;
	var t = _.findWhere(transactions,{"hash":hash})
	return _.isUndefined(t) ? 0 : t.amount;//*.0000001
}

var getBlockTransactions = function(hash) {
	return _.findWhere(blocks,{"hash":hash})
}