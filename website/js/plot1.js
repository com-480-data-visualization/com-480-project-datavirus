(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1 = (function() {

    const model = App.Plot1DataModel
    const UI = App.Plot1UI

    var heavyComputationTimer = null

    //the charts that will be displayed
    let charts = [];
    let upperLines = [];

    let stacksSupperpose = false
    let stackClever = true

    let data = null
    //define the position of the rect that will contain the stacked graphs

    //load the csv file and call createPlot(),createSlider() when done
    d3.csv("/data/plot1data2.csv",function(d) {
      data = model.prepareData(d, stacksSupperpose, stackClever)
      UI.setData({
        smallestDate: data.smallestDate,
        biggestDate:data.biggestDate,
        maxYscore: data.maxScore,
        onBrush: userBrushed,
      })
      UI.prepareElements()
      createPlot(data)
    });

    function createPlot(data) {

      //draw the complete charts
      for (let i = 0; i < data.categories.length; i++) {
        charts.push(UI.createChart({
          data: data,
          id: i,
          stacksSupperpose:stacksSupperpose,
        }));
      }

      for (let i = 0; i < data.categories.length; i++) {
        upperLines.push(UI.createUpperLine({
          data: data,
          id: i,
          stacksSupperpose:stacksSupperpose,
        }));
      }

      UI.renderCharts(charts)
      UI.renderUpperLines(upperLines)

      heavyCompute()

  }//end of create plot function


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


  function userBrushed(b){
    UI.getXscale().domain(b)
    for (var i = 0; i < charts.length; i++) {
      charts[i].showOnly(b);
    }

    for (var i = 0; i < upperLines.length; i++) {
      upperLines[i].showOnly(b);
    }
    //addPartsOfChart()
  }

  function heavyCompute(){
    let orderTimeStamps = model.computeTimeStampsBreaks(upperLines, data, UI.getXscale(),[data.smallestDate, data.biggestDate])

    UI.addPartsOfChart(data.smallestDate.getTime(),orderTimeStamps,stacksSupperpose,data)
  }


  /*function addPartsOfChart(){
    window.clearInterval(heavyComputationTimer);

    if(data.criticalIndexes != undefined){

      //  console.log(leftTimeBorder)

      stackedArea.select(".chartFrames").remove()
      heavyComputationTimer = window.setTimeout(function(){
        console.log("do calculuuus")
        heavyCompute()
      }, 1000);

      //heavyComputationTimer = window.setInterval(heavyCompute, 1000);

      //pour supprimer l'action qui se répète


    }
  }*/

  function onHover(elmx, date){
    //console.log("over In elem "+ elmx + " for the date " + date)
  }



  return {
    //  playVideo:showVideo,
  }
})();
App.Plot1 = Plot1;
window.App = App;
})(window);
