/// Visual
var getAngle = function(increment, padding) {
	var ticks = _.isUndefined(padding) ? 360 : padding;
	var degrees = 90 - (increment * (360 / ticks));
	var radians = (degrees / 360) * 2 * Math.PI;
	return radians;
}

// convert value of transaction in satoshis to pixel width.
var getWidthFromSatoshis = function(satoshis) {
  var maxWidth = $(window).width()/2;
  var minWidth = 10;
  var w = (satoshis / 1e8) * 10;
  w = (w > maxWidth)? maxWidth : w;
  w = (w < minWidth)? minWidth : w;
  return w;
}

var radius = 100;

var draw = function(data) {
var vizSvg;
vizSvg = d3.select("#viz-canvas").append("svg")
  .attr("width", $(window).width()/3)
  .attr("height", $(window).height()/3)
  var vizSvgHeight = $("#viz-canvas").find("svg").height();

vizSvg.selectAll("line")
	.data(data)
	.enter()
	.append("line")
	.attr("x1", function(d,i) {
		console.log(d)
		return Math.cos(getAngle(i,data.length))*radius;
	})
	.attr("y1", function(d,i) {
		return Math.sin(getAngle(i,data.length))*radius;
		// getAngle(getWidthFromSatoshis(d.payload.transaction.amount))
	})
	.attr("x2", function(d,i) {
		return Math.cos(getAngle(i,data.length))*(radius+getWidthFromSatoshis(getTransactionAmount(d)));
	})
	.attr("y2", function(d,i) {
		return Math.sin(getAngle(i,data.length))*(radius+getWidthFromSatoshis(getTransactionAmount(d)));
	})
	.attr("stroke","red")
	.attr('transform','translate(' + $(window).width()/6 + ',' + $(window).height()/6 + ')' )
 
  vizSvg.on("hover",function(t) {

 	t.selectAll("line")
 	.transition()
	.attr("x2", function(d,i) {
		return Math.cos(getAngle(i,data.length))*(radius+getWidthFromSatoshis(getTransactionAmount(d)));
	})
	.attr("y2", function(d,i) {
		return Math.sin(getAngle(i,data.length))*(radius+getWidthFromSatoshis(getTransactionAmount(d)));
	})
 })



}

