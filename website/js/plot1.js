(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1 = (function() {

    const chartDiv = document.getElementById("plot1-container");

    const margin = {
        top: 10,
        right: 40,
        bottom: 150,
        left: 60
      },
      width = chartDiv.clientWidth * 0.95,
      height = chartDiv.clientHeight * 0.5,
      contextHeight = 50,
      contextWidth = width;


    const svg = d3.select("#plot1-container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", (height + margin.top + margin.bottom));

    d3.csv("/data/plot1data.csv",function(data) {
      console.log(data[0]);
    });
    console.log("hello")


    function log(truc){
      console.log(truc)
    }


    return {
      //  playVideo:showVideo,
    }
  })();
  App.Plot1 = Plot1;
  window.App = App;
})(window);
