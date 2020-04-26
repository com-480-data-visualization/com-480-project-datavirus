(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1 = (function() {

    const model = App.Plot1DataModel
    const UI = App.Plot1UI

    var heavyComputationTimer = null

    //the charts that will be displayed
    let charts = [];

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
UI.renderCharts(charts)
      return

        // Add the chart to the HTML page
        /*chart.chartContainer = stackedArea.append("g")
        .attr('class', "chartContainer")

        //add the area


        //and add the upper path
        charts.forEach(chart=>{
          // Add the chart to the HTML page
          chart.chartContainer.append("path")
          .data([chart.data.values])
          .attr("class", "upperPath")
          .attr('id', "upperPath_"+chart.id)
          .attr("d", chart.upperPath)
          chart.upperPathElem = document.getElementById("path_nb_"+chart.id)
          })

        addPartsOfChart()




        //now create the clipped path so no chart will be outside of the box
        svg.append("clipPath")
        .attr("id", "stackedArea-clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", stackedAreaMargin.height)
        .attr("width", stackedAreaMargin.width)

        stackedArea.attr("clip-path", "url(#stackedArea-clip)")*/
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
        console.log("brushed")
        return
        xScale.domain(b);

        for (var i = 0; i < charts.length; i++) {
          charts[i].showOnly(b);
        }
        console.log(charts.length)

        addPartsOfChart()
      }

      function heavyCompute(){
        console.log("1")
        let orderTimeStamps = model.computeTimeStampsBreaks(charts, data, xScale,[data.smallestDate, data.biggestDate])
        let leftTimeBorder = data.smallestDate.getTime()
        let frameContainer = stackedArea.append("g")
        .attr('class', "chartFrames")

console.log("2")
        orderTimeStamps.forEach((el,i)=>{

          let order = el[0]
          let rightTimeBorder = el[1]



          frameContainer.append("clipPath")
          .attr("id", "clip_for_frame_"+i)
          .append("rect")
          .attr("x", xScale(leftTimeBorder)-2)
          .attr("y", 0)
          .attr("height", stackedAreaMargin.height)
          .attr("width", stackedAreaMargin.width)

          order.forEach(chartId=>{
            let newIncompleteChart = UI.createChart({
              data: data,
              id: chartId,
              stacksSupperpose:stacksSupperpose,
              xScale:xScale,
              yScale:yScale,
            })

            //console.log(newIncompleteChart)


            //add the area
            frameContainer.append("path")
            .data([newIncompleteChart.data.values])
            .attr("class", "partOfchart")
            .attr("d", newIncompleteChart.area)
            .attr("fill", colorForIndex(newIncompleteChart.id))
            .attr("clip-path", "url(#clip_for_frame_"+i+")")

          })
          leftTimeBorder = rightTimeBorder
        })
console.log("3")
      }


      function addPartsOfChart(){
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
      }

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
