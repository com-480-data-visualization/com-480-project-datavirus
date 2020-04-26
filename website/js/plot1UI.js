(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1UI = (function() {
    const svgWidth = document.getElementById("plot1_container").clientWidth
    const svgHeight = document.getElementById("plot1_container").clientHeight


    //-------------SOME UI PARAMTER TO TUNE-------------
    let curveType = d3.curveMonotoneX
    //'curveLinear','curveBasis', 'curveCardinal', 'curveStepBefore',...
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
      minBrushableNumberOfDay:365*2,//cannot zoom more than over 2 years
    }


    //------------------------------------------------
    let svg = null
    let stackedArea = null
    let stackedAreaBorderLines = null
    let timeIntervalSelected = null

    //the revelant data needed
    let smallestDate = null
    let biggestDate = null
    let maxYscore = null
    let onBrush = null

    function setData(data){
      smallestDate = data.smallestDate
      biggestDate = data.biggestDate
      maxYscore = data.maxYscore
      onBrush = function(){
        drawXAxis()
        data.onBrush(timeIntervalSelected)
      }
    }


    function prepareSVGElement(){
      //delete the previous svg element
      d3.select("#plot1_container").select("svg").remove()

      //create a new svg element
      svg = d3.select("#plot1_container").append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

      svg.append("clipPath")
      .attr("id", "clipForStackedArea")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", stackedAreaMargin.height)
      .attr("width", stackedAreaMargin.width)

      //add a container for the stacked area
      stackedArea = svg.append("g")
      .attr("class", "stackedArea")
      .attr("transform", "translate(" + stackedAreaMargin.left + "," + stackedAreaMargin.top + ")")
      .attr("clip-path", "url(#clipForStackedArea)")

      //add a container for the lines that will delimit the stacked area
      stackedAreaBorderLines = svg.append("g")
      .attr("class", "stackedAreaBorderLines")
      .attr("transform", "translate(" + stackedAreaMargin.left + "," + stackedAreaMargin.top + ")")

      //file the stackedAreaBorderLines with the 4 lines:
      //top
      stackedAreaBorderLines.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", stackedAreaMargin.width) .attr("y2", 0).attr("class", "stackedAreaBorder");
      //bottom
      stackedAreaBorderLines.append("line") .attr("x1", 0) .attr("y1", stackedAreaMargin.height).attr("x2", stackedAreaMargin.width) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");
      //left
      stackedAreaBorderLines.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", 0) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");
      //right
      stackedAreaBorderLines.append("line") .attr("x1", stackedAreaMargin.width) .attr("y1", 0).attr("x2", stackedAreaMargin.width) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");

    }

    /*Create the slider box with the brush*/
    function createSlider() {
      timeIntervalSelected = [smallestDate, biggestDate]

      let sliderWidth = sliderBoxPreferences.sliderWidth * svgWidth
      let niceAxis = sliderBoxPreferences.displayNiceAxis
      let tickHeight = sliderBoxPreferences.tickHeight
      let contextHeight = sliderBoxPreferences.height
      let selectedRectHeight = sliderBoxPreferences.selectedRectHeight

      //1)First we add the context and we draw a horizontal line so we see it well
      let silderBox = svg.append("g")
      .attr("class", "sliderBox")
      .attr("transform", "translate(" + 0 + "," + (svgHeight - sliderBoxPreferences.height) + ")")

      //drawing the separation line
      silderBox.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", svgWidth) .attr("y2", 0).attr("class", "topLine");
      // Create a domain
      var contextXScale = d3.scaleTime()
      .range([0, sliderWidth])//length of the slider
      .domain([smallestDate, biggestDate])
      if(niceAxis){
        contextXScale = contextXScale.nice()
      }

      // a function thag generates a bunch of SVG elements.
      var contextAxis = d3.axisBottom(contextXScale)
      .tickPadding(5)//height of the date on the axis
      .tickSizeInner(tickHeight)
      .tickSizeOuter(0)
      //.tickFormat(d3.timeFormat('%Y'))
      //.tickValues([2006, 2008, 2010,2012, 2014, 2016, 2018])
      //.tickArguments([29])
      //.ticks(30)
      .ticks(15, d3.timeFormat('%Y'))
      //.tickFormat(x => /[AEIOUY]/.test(x) ? x : "")

      //append the axis to the svg element
      silderBox.append("g")
      .attr("transform", "translate("+(svgWidth -sliderWidth)/2+","+contextHeight/2+")")
      .call(contextAxis)

      //move the ticks to position them in the middle of the horizontal line
      silderBox.selectAll(".tick line")
      .attr("transform", "translate(0,-"+tickHeight/2+")");

      //moves the text accordingly
      silderBox.selectAll(".tick text")
      .attr("transform", "translate(0,-"+tickHeight/2+")");

      if(!niceAxis){
        //then draw line at end of axis
        const outerTickSize = tickHeight * 1.5
        const yTop = (contextHeight - outerTickSize)/2
        const yBottom = (contextHeight + outerTickSize)/2
        const xLeft = (svgWidth -sliderWidth)/2
        const xRight = xLeft + sliderWidth
        silderBox.append("line") .attr("x1", xLeft) .attr("y1", yTop).attr("x2", xLeft) .attr("y2", yBottom).attr("class", "outerTick")
        silderBox.append("line") .attr("x1", xRight) .attr("y1", yTop).attr("x2", xRight) .attr("y2", yBottom).attr("class", "outerTick")
      }

      //Now we do the brush
      const minYBrushable = (contextHeight-selectedRectHeight)/2
      const maxYBrushable = (contextHeight+selectedRectHeight)/2
      const minXBrushable = contextXScale(smallestDate) + (svgWidth -sliderWidth)/2
      const maxXBrushable = contextXScale(biggestDate) + (svgWidth -sliderWidth)/2
      var brush = d3.brushX()
      .extent([
        //sets the brushable part
        //idea use this to avoid selecting outside the range when nice axis is displayed
        [minXBrushable, minYBrushable],
        [maxXBrushable, maxYBrushable]
      ])
      .on("brush", cleanBrushInterval)

      //The selection rectangle
      silderBox.append("g")
      .attr("class", "xbrush")
      .call(brush)
      .selectAll("rect")
      .attr("rx",5)

      let elem = silderBox.select(".xbrush").select(".overlay").on("click",function(){
        timeIntervalSelected = [smallestDate,biggestDate]
        onBrush(timeIntervalSelected)
      })

      // Brush handler. Get time-range from a brush and pass it to the charts.
      function cleanBrushInterval() {

        //d3.event.selection looks like [622,698] for example
        //b is then an array of 2 dates: [from, to]
        var b = d3.event.selection === null ? contextXScale.domain() : d3.event.selection.map(x=>{
          return contextXScale.invert(x-(svgWidth -sliderWidth)/2)
        });

        //first we make sure that we cannot zoom too much
        if(sliderBoxPreferences.minBrushableNumberOfDay>0){
          //in case we have a limit
          let differenceInTime = b[1].getTime() - b[0].getTime();
          let  differenceInDays = differenceInTime / (1000 * 3600 * 24);
          if(differenceInDays<sliderBoxPreferences.minBrushableNumberOfDay){
            //in case the brush does not respect the limit
            let middleTime = (b[1].getTime() + b[0].getTime())/2;
            let timeToAdd = sliderBoxPreferences.minBrushableNumberOfDay*1000 * 3600 * 24/2
            let upperDate = middleTime + timeToAdd;
            let lowerDate = middleTime - timeToAdd;
            if(upperDate>biggestDate.getTime()){
              let timeToShift = upperDate-endDate.getTime();
              upperDate -= timeToShift;
              lowerDate -= timeToShift;
            }else if (lowerDate<smallestDate.getTime()){
              let timeToShift = startDate.getTime()-lowerDate;
              upperDate += timeToShift;
              lowerDate += timeToShift;
            }
            let small_date = new Date(lowerDate)
            let big_date = new Date(upperDate)
            b = [small_date,big_date]
          }
          let small_date = b[0]
          let big_date = b[1]
          //now we should adapt the brush!!

          let brushSelected = silderBox.select(".xbrush")
          let selection = brushSelected.select(".selection")
          let leftSlider = brushSelected.select(".handle--w")
          let rightSlider = brushSelected.select(".handle--e")

          let widthForBrush = contextXScale(big_date)-contextXScale(small_date)
          let leftSliderWidth = leftSlider.attr("width")
          let xForLeft = contextXScale(small_date) + (svgWidth -sliderWidth - leftSliderWidth)/2
          let xForRight = xForLeft + widthForBrush

          selection.attr("width",widthForBrush)
          selection.style("x", (xForLeft+leftSliderWidth/2))
          leftSlider.style("x", xForLeft)
          rightSlider.style("x", xForRight)

        }
        timeIntervalSelected = b
        onBrush(timeIntervalSelected)
      }
    }//end of createSlider




    class Chart {
      constructor(options) {
        this.data = options.data;
        this.id = options.id;
        this.xScale = getXscale()
        const stacksSupperpose = options.stacksSupperpose

        let localName = this.data.categories[this.id]
        let localId = this.id
        let xS = this.xScale
        let yS= getYscale()

        this.area = d3.area()
        .x(function(d) {

          return xS(d.date);
        })
        .y0(function(d) {
          if(stacksSupperpose){
            let values = d.values.slice(0, localId)
            let previousSum = values.reduce((a,b) => a + b, 0)

            return yS(previousSum)
          }else{
            return yS(0)
          }

        }.bind(this))
        .y1(function(d) {
          if(stacksSupperpose){
            let values = d.values.slice(0, localId+1)
            let previousSum = values.reduce((a,b) => a + b, 0)
            return yS(previousSum)
          }else{
            return yS(d.values[this.id])
          }
        }.bind(this))
        .curve(curveType)

        /*this.upperPath = d3.line()
        .x(function(d) {
          return xScale(d.date);
        })
        .y(function(d) {
          if(stacksSupperpose){
            let values = d.values.slice(0, localId+1)
            let previousSum = values.reduce((a,b) => a + b, 0)
            return yScale(previousSum)
          }else{
            return yScale(d.values[this.id])
          }
        }.bind(this))
        //.curve(d3.curveMonotoneX)
        .curve(curveType)*/
        //  Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.

        this.showOnly = function(b){
          console.log(b)
          console.log(timeIntervalSelected)
          console.log(this)
          this.xScale.domain(b);
          this.path.data([this.data.values]).attr("d", this.area);
          //this.chartContainer.select("path").data([this.data.values]).attr("d", this.area);
          //console.log(this)
          //d3.select("#chart_nb_"+this.id).data([this.data.values]).attr("d", this.area);
          /*this.xScale.domain(timeIntervalSelected)
          console.log(  this.chartContainer.select(".chart"))
          this.chartContainer.select(".chart").data([this.data.values]).attr("d", this.area);*/
          //this.chartContainer.select(".upperPath").data([this.data.values]).attr("d", this.upperPath);
        }
      }//end of constructor

    }

    function createChart(options){
      return new Chart(options)
    }



    function getXscale(){
      return d3.scaleTime()
      .range([0, stackedAreaMargin.width])
      .domain(timeIntervalSelected);
    }

    function getYscale(){
      return d3.scaleLinear()
      .range([stackedAreaMargin.height,0])
      .domain([0, maxYscore]);
    }

    function drawXAxis(){
      //remove the previous axis
      svg.select(".xAxis").remove()
      //and recreate the new axis
      let xAxis = d3.axisBottom(getXscale())
      svg.append("g")
      .attr("class", "xAxis")
      .attr("transform", "translate("+stackedAreaMargin.left
      +","+(stackedAreaMargin.height + stackedAreaMargin.top)+")")
      .call(xAxis)
    }


    function renderCharts(charts){
      stackedArea.select(".chartsContainer").remove()
      let chartsContainer = stackedArea.append("g")
      .attr("class", "chartsContainer")

      charts.forEach(chart=>{




         chart.path = chartsContainer.append("path")
        .data([chart.data.values])
        .attr("class", "chart")
        .attr('id', "chart_nb_"+chart.id)
        .attr("d", chart.area)
        .attr("fill", colorForIndex(chart.id))
        /*.on("mousemove", function(d,i) {
          let coordinateX= d3.mouse(this)[0];
          let dateSelected =xScale.invert(coordinateX)
          onHover(chart.id, dateSelected)})*/


      })
    }

    function colorForIndex(index){
      var colors = ["#52304b","#2b4a30","#a70ee8","#e30eb8","#734f37","#fcf803", "#fc0303","#03fc07","#00fff7"]
      return colors[index%colors.length]
    }





    return {
      setData:setData,
      prepareElements:function(){
        prepareSVGElement()
        createSlider()
        drawXAxis()
      },
      getXscale:getXscale,
      getYscale:getYscale,
      createChart: createChart,
      renderCharts:renderCharts,
    }
  })();
  App.Plot1UI = Plot1UI;
  window.App = App;
})(window);
