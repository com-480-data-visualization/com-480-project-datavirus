(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1 = (function() {

    const model = App.Plot1DataModel
    const UI = App.Plot1UI

    //get the size of our container
    const svgWidth = document.getElementById("plot1-container").clientWidth
    const svgHeight = document.getElementById("plot1-container").clientHeight

    //the charts that will be displayed
    let charts = [];
    let xAxis = null
    let xScale = null
    let yScale = null
    let stacksSupperpose = false
    let stackClever = true
    let data = null
    //define the position of the rect that will contain the stacked graphs
    const stackedAreaMargin = {
      top: 30,
      left: 50,
      width: svgWidth*0.9,
      height: 350
    }

    const sliderBoxPreferences = {
      height:60,
      sliderWidth:0.9,
      tickHeight:10,
      displayNiceAxis:false,
      selectedRectHeight:50,
      minBrushableNumberOfDay:365*2,//cannot zoom more than over one year
    }

    //add the svg element inside the container
    const svg = d3.select("#plot1-container").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

    const stackedArea = svg.append("g")
    .attr("class", "stackedArea")
    .attr("transform", "translate(" + stackedAreaMargin.left + "," + stackedAreaMargin.top + ")")


    //load the csv file and call createPlot(),createSlider() when done
    d3.csv("/data/plot1data2.csv",function(d) {
      let data = model.prepareData(d, stacksSupperpose, stackClever)
      UI.createSlider(svg,svgWidth,svgHeight,stackedAreaMargin,sliderBoxPreferences,data.smallestDate, data.biggestDate,userBrushed)
      createPlot(data)
    });

    function createPlot(data) {
      //compute the xscale
      xScale = d3.scaleTime()
      .range([0, stackedAreaMargin.width])
      .domain([data.smallestDate, data.biggestDate]);
      //and yScale using maxDataPoint
      yScale = d3.scaleLinear()
      .range([stackedAreaMargin.height,0])
      .domain([0, data.maxScore]);
      //draw the complete charts
      for (let i = 0; i < data.categories.length; i++) {
        charts.push(UI.createChart({
          data: data,
          id: i,
          stacksSupperpose:stacksSupperpose,
          xScale:xScale,
          yScale:yScale,
        }));
      }
      charts.forEach(chart=>{
        // Add the chart to the HTML page

        chart.chartContainer = stackedArea.append("g")
        .attr('id', "chart_nb_"+chart.id)


        chart.chartContainer.append("path")
        .data([chart.data.values])
        .attr("class", "chart")
        .attr('id', "path_nb_"+chart.id)
        .attr("d", chart.area)
        .attr("fill", colorForIndex(chart.id))
        .on("mousemove", function(d,i) {
          let coordinateX= d3.mouse(this)[0];
          //let dateSelected = xS(coordinateX)
          let dateSelected =xScale.invert(coordinateX)
          onHover(chart.id, dateSelected)  })
      })

      console.log(charts)

      if(data.timeStamps != undefined){
        addLines(data.timeStamps)
      }
      //getChartOrder(data.timeStamps[0])





      //draw the xAxis
      xAxis = d3.axisBottom(xScale)
      svg.append("g")
      .attr("class", "xAxis")
      .attr("transform", "translate("+stackedAreaMargin.left
      +","+(stackedAreaMargin.height + stackedAreaMargin.top)+")")
      .call(xAxis)

      //finally draw the 4 border lines
      //top
      stackedArea.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", stackedAreaMargin.width) .attr("y2", 0).attr("class", "stackedAreaBorder");
      //bottom
      stackedArea.append("line") .attr("x1", 0) .attr("y1", stackedAreaMargin.height).attr("x2", stackedAreaMargin.width) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");
      //left
      stackedArea.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", 0) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");
      //right
      stackedArea.append("line") .attr("x1", stackedAreaMargin.width) .attr("y1", 0).attr("x2", stackedAreaMargin.width) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");

      //now create the clipped path so no chart will be outside of the box
      svg.append("clipPath")
      .attr("id", "stackedArea-clip")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", stackedAreaMargin.height)
      .attr("width", stackedAreaMargin.width)

      stackedArea.attr("clip-path", "url(#stackedArea-clip)")
    }//end of create plot function






    function userBrushed(b){
      xScale.domain(b);
      for (var i = 0; i < charts.length; i++) {
        charts[i].showOnly(b);
      }
      svg.select(".xAxis").call(xAxis);
    }




  function addLines(timestamps) {
    let previousContainer = stackedArea.select(".linesContainer")
    previousContainer.remove()
    let linesContainer = stackedArea.append("g")
    .attr("class", "linesContainer")

    timestamps.forEach(t=>{
      let y = 0;
      let Y = stackedAreaMargin.height
      let x = xScale(new Date(t))
      linesContainer.append("line").attr("x1", x).attr("y1", y).attr("x2", x) .attr("y2", Y).attr("class", "verticalLines")
    })
  }

  /*Chart.prototype.showOnly = function(b) {
    this.chartContainer.select("path").data([this.data.values]).attr("d", this.area);
  }*/

  /**/





  function onHover(elmx, date){
    //console.log("over In elem "+ elmx + " for the date " + date)
  }

  function colorForIndex(index){
    var colors = ["#52304b","#2b4a30","#a70ee8","#e30eb8","#734f37","#fcf803", "#fc0303","#03fc07","#00fff7"]
    return colors[index%colors.length]
  }

  return {
    //  playVideo:showVideo,
  }
})();
App.Plot1 = Plot1;
window.App = App;
})(window);
