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
    let maxYScore = null
    let displayedXInterval = null

    let stacksSupperpose = true
    let stackClever = false
    let adapativeYScale = true


    let data = null
    //define the position of the rect that will contain the stacked graphs

    //load the csv file and call addElementsToStackedArea(),createSlider() when done
    d3.csv("/data/video_count/count_month.csv",function(d) {
      data = model.prepareData(d)
      maxYScore = stacksSupperpose ? data.maxScoreAtTimeStamp: data.maxSingleScore
      displayedXInterval = [data.smallestDate, data.biggestDate]
      UI.setData({
        data:data,
        maxYscore:maxYScore,
        onBrush: userBrushed,
      })
      UI.prepareElements()
      addElementsToStackedArea(data)
    });


    document.addEventListener("keypress", function(e){
      const char = String.fromCharCode(e.charCode);
      if(char == 's'){
        stacksSupperpose = !stacksSupperpose
        maxYScore = stacksSupperpose ? data.maxScoreAtTimeStamp: data.maxSingleScore
        UI.setData({
          data:data,
          maxYscore:maxYScore,
          onBrush: userBrushed,
        })
        UI.drawYAxis()
        addElementsToStackedArea(data)
        if(adapativeYScale){
          adaptYScale(displayedXInterval)
        }
      }
      if(char == 'y'){
        adapativeYScale = !adapativeYScale
        if(adapativeYScale){
          adaptYScale(displayedXInterval)
        }
      }

    });


    function addElementsToStackedArea(data) {
      //draw the complete charts
      charts = []
      for (let i = 0; i < data.categories.length; i++) {
        charts.push(UI.createChart({
          data: data,
          id: i,
          stacksSupperpose:stacksSupperpose,
        }));
      }

      upperLines = []
      for (let i = 0; i < data.categories.length; i++) {
        upperLines.push(UI.createUpperLine({
          data: data,
          id: i,
          stacksSupperpose:stacksSupperpose,
        }));
      }
      UI.removeCharts()
      UI.removeLines()
      UI.removePartsOfChart()

      if(stacksSupperpose){
        UI.renderCharts(charts,true)
      }else{
        UI.renderCharts(charts,false)
        //UI.renderUpperLines(upperLines)
      }


      /*if(data.criticalIndexes == undefined){

    }else{
    UI.renderCharts(charts)
    UI.renderUpperLines(upperLines)
    heavyCompute()
    UI.renderUpperLines(upperLines)
  }*/
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

function adaptYScale(forInterval){
  if(adapativeYScale){
    var bounds = model.getMaxValuesBetween(data,forInterval[0],forInterval[1])
    var maxBound = stacksSupperpose ? bounds.maxScoreAtTimeStamp : bounds.maxSingleScore
    UI.setData({
      data:data,
      maxYscore:maxBound,
      onBrush: userBrushed,
    })
    UI.drawYAxis()

    for (var i = 0; i < charts.length; i++) {
      charts[i].rescaleY(maxBound);
    }
  }

}


function userBrushed(b){
  displayedXInterval = b
  UI.getXscale().domain(b)
  adaptYScale(b)



  for (var i = 0; i < charts.length; i++) {
    charts[i].showOnly(b);
  }

  return
  for (var i = 0; i < upperLines.length; i++) {
    upperLines[i].showOnly(b);
  }

  UI.removePartsOfChart()
  window.clearInterval(heavyComputationTimer)
  if(stackClever && !stacksSupperpose){
    UI.removeLines()
    heavyComputationTimer = window.setTimeout(function(){
      console.log("do calculuuus")
      heavyCompute()
      console.log("render now")
      UI.renderUpperLines(upperLines)
    }, 2000);
  }

  //addPartsOfChart()
}

function heavyCompute(){
  /*let worker = new Worker('js/worker.js');
  let message = {
  upperLines:upperLines,
  data:data,
  xScale: UI.getXscale(),
  timeInterval:[data.smallestDate, data.biggestDate]
}
worker.postMessage("window.App")

worker.onmessage = function(e) {
console.log('Message received from worker' + e);
}*/

/**/
/*let orderTimeStamps = model.computeTimeStampsBreaks(upperLines, data, UI.getXscale(),[data.smallestDate, data.biggestDate])
UI.addPartsOfChart(data.smallestDate.getTime(),orderTimeStamps,stacksSupperpose,data)
*/
(function(){
  let orderTimeStamps = model.computeTimeStampsBreaks(upperLines, data, UI.getXscale(),[data.smallestDate, data.biggestDate])
  UI.addPartsOfChart(data.smallestDate.getTime(),orderTimeStamps,stacksSupperpose,data)
})()


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

function overTitle(id){
  console.log("Mouse over title " + data.categories[id])
}

function mouseLeftTitle(id){
  console.log("Mouse left title " + data.categories[id])
}



return {
  overTitle:overTitle,
  mouseLeftTitle:mouseLeftTitle,
  //  playVideo:showVideo,
}
})();
App.Plot1 = Plot1;
window.App = App;
})(window);
