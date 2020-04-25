(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1UI = (function() {

    let curveType = d3.curveLinear


    /*Create the slider box with the brush*/
    function createSlider(svg,svgWidth,svgHeight,stackedAreaMargin,sliderBoxPreferences,startDate, endDate,userBrushed) {
      let sliderWidth = sliderBoxPreferences.sliderWidth * svgWidth
      let niceAxis = sliderBoxPreferences.displayNiceAxis
      let tickHeight = sliderBoxPreferences.tickHeight
      let contextHeight = sliderBoxPreferences.height
      let selectedRectHeight = sliderBoxPreferences.selectedRectHeight

      //1)First we add the context and we draw a horizontal line so we see it well
      let context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + 0 + "," + (svgHeight - sliderBoxPreferences.height) + ")")

      //drawing the separation line
      context.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", svgWidth) .attr("y2", 0).attr("class", "separationLine");

      // Create a domain
      var contextXScale = d3.scaleTime()
      .range([0, sliderWidth])//length of the slider
      .domain([startDate, endDate])
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
      context.append("g")
      .attr("transform", "translate("+(svgWidth -sliderWidth)/2+","+contextHeight/2+")")
      .call(contextAxis)

      //move the ticks to position them in the middle of the horizontal line
      context.selectAll(".tick line")
      .attr("transform", "translate(0,-"+tickHeight/2+")");

      //moves the text accordingly
      context.selectAll(".tick text")
      .attr("transform", "translate(0,-"+tickHeight/2+")");

      if(!niceAxis){
        //then draw line at end of axis
        const outerTickSize = tickHeight * 1.5
        const yTop = (contextHeight - outerTickSize)/2
        const yBottom = (contextHeight + outerTickSize)/2
        const xLeft = (svgWidth -sliderWidth)/2
        const xRight = xLeft + sliderWidth
        context.append("line") .attr("x1", xLeft) .attr("y1", yTop).attr("x2", xLeft) .attr("y2", yBottom).attr("class", "outerTick")
        context.append("line") .attr("x1", xRight) .attr("y1", yTop).attr("x2", xRight) .attr("y2", yBottom).attr("class", "outerTick")
      }

      //Now we do the brush
      const minYBrushable = (contextHeight-selectedRectHeight)/2
      const maxYBrushable = (contextHeight+selectedRectHeight)/2
      const minXBrushable = contextXScale(startDate) + (svgWidth -sliderWidth)/2
      const maxXBrushable = contextXScale(endDate) + (svgWidth -sliderWidth)/2
      var brush = d3.brushX()
      .extent([
        //sets the brushable part
        //idea use this to avoid selecting outside the range when nice axis is displayed
        [minXBrushable, minYBrushable],
        [maxXBrushable, maxYBrushable]
      ])
      .on("brush", onBrush)

      //The selection rectangle
      context.append("g")
      .attr("class", "xbrush")
      .call(brush)
      .selectAll("rect")
      .attr("rx",5)

      let elem = context.select(".xbrush").select(".overlay").on("click",function(){
        var b = [startDate,endDate]
        userBrushed(b)
      })

      // Brush handler. Get time-range from a brush and pass it to the charts.
      function onBrush() {

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
            if(upperDate>endDate.getTime()){
              let timeToShift = upperDate-endDate.getTime();
              upperDate -= timeToShift;
              lowerDate -= timeToShift;
            }else if (lowerDate<startDate.getTime()){
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

          let brushSelected = context.select(".xbrush")
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
        userBrushed(b)
      }
    }//end of createSlider



    class Chart {
      constructor(options) {
        this.data = options.data;
        this.id = options.id;
        const xScale = options.xScale
        const yScale = options.yScale
        const stacksSupperpose = options.stacksSupperpose

        let localName = this.data.categories[this.id]
        let localId = this.id
        /*
        Create the chart.
        Here we use 'curveLinear' interpolation.
        Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.
        */
        this.area = d3.area()
        .x(function(d) {
          return xScale(d.date);
        })
        .y0(function(d) {
          if(stacksSupperpose){
            let values = d.values.slice(0, localId)
            let previousSum = values.reduce((a,b) => a + b, 0)
            return yScale(previousSum)
          }else{
          return yScale(0)
        }

      }.bind(this))
      .y1(function(d) {
        if(stacksSupperpose){
          let values = d.values.slice(0, localId+1)
          let previousSum = values.reduce((a,b) => a + b, 0)
          return yScale(previousSum)
        }else{
          return yScale(d.values[this.id])
        }
      }.bind(this))
      //.curve(d3.curveMonotoneX)
      .curve(curveType)

      this.upperPath = d3.line()
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
    .curve(curveType)
      //  Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.

      this.showOnly = function(){
        this.chartContainer.select(".chart").data([this.data.values]).attr("d", this.area);
        this.chartContainer.select(".upperPath").data([this.data.values]).attr("d", this.upperPath);
        //this.chartContainer.select(".upperPath").remove()
        /*this.chartContainer.append("path")
        .data([this.data.values])
        .attr("class", "upperPath")
        .attr('id', "upperPath_"+this.id)
        .attr("d", this.upperPath)*/
      }
    }//end of constructor

  }

  function createChart(options){
    return new Chart(options)
  }





  return {
      createSlider:createSlider,
      createChart: createChart,
  }
})();
App.Plot1UI = Plot1UI;
window.App = App;
})(window);
