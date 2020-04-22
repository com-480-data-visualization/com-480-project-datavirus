(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1 = (function() {

    //our container
    const containerDIV = document.getElementById("plot1-container");
    const svgWidth = containerDIV.clientWidth
    const svgHeight = containerDIV.clientHeight

    //define the position of the rect that will contain the stacked graphs
    const chartAreaMargin = {
      top: 30,
      left: 10,
      width: svgWidth*0.8,
      height: 500
    }


    //add the svg element inside the container
    const svg = d3.select("#plot1-container").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

    //load the csv file and call createPlot() when done
    d3.csv("/data/plot1data.csv",function(data) {
      createPlot(prepareData(data))
      /*data is a 2D array in the one each line represent the values for a certain time*/
    });


    function createPlot(data) {
      let charts = [];
      for (let i = 0; i < 1; i++) {
        charts.push(new Chart({
          data: data,
          id: i,
          svg: svg,
          margin: chartAreaMargin,
        }));

      }//end of create plot function


      //-----------------------CREATION OF THE TIME SLIDER----------------------------
      const contextHeight = 60
      const sliderWidth = containerDIV.clientWidth * 0.9
      const tickHeight = 10
      const niceAxis = false
      const selectedRectHeight = 50


      //1)First we add the context and we draw a horizontal line so we see it well
      let context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + 0 + "," + (svgHeight - contextHeight) + ")")
      //drawing the line
      context.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", svgWidth) .attr("y2", 0).attr("class", "separationLine");

      //2) Now will add the slider
      var startDate = new Date(2005,7,14)
      var endDate = new Date(2019,11,20)

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
      .attr("class", "x axis top")
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
      .on("brush", onBrush);

      //The selection rectangle
      context.append("g")
      .attr("class", "xbrush")
      .call(brush)
      .selectAll("rect")
      .attr("rx",5)

      //Display some text "Click and drag above to zoom / pan the data" on screen
      /*context.append("text")
      .attr("class", "instructions")
      .attr("transform", "translate(0," + (contextHeight + 20) + ")")
      .text('Click and drag above to zoom / pan the data');*/

      // Brush handler. Get time-range from a brush and pass it to the charts.
      function onBrush() {
        //d3.event.selection looks like [622,698] for example
        //b is then an array of 2 dates: [from, to]
        var b = d3.event.selection === null ? contextXScale.domain() : d3.event.selection.map(contextXScale.invert);
        for (var i = 0; i < categoriesCount; i++) {
          charts[i].showOnly(b);
        }
      }
    }

    class Chart {
      constructor(options) {
        this.data = options.data;
        this.id = options.id;
        this.svg = options.svg;
        this.margin = options.margin;

        console.log(this.data)
        console.log(this.id)
        console.log(this.svg)
        console.log(this.margin)

        // Associate xScale with time
        this.xScale = d3.scaleTime()
        .range([0, this.margin.width])
        .domain([this.data.smallestDate, this.data.biggestDate]);
        // Bound yScale using maxDataPoint
        this.yScale = d3.scaleLinear()
        .range([0, this.margin.height])
        .domain([0, this.data.maxScore]);
        let xS = this.xScale;
        let yS = this.yScale;

        console.log(xS(new Date(2019,0,1)))
        console.log(yS(50))

        let localName = this.data.categories[this.id]
        let localId = this.id
        console.log(localName)
        /*
        Create the chart.
        Here we use 'curveLinear' interpolation.
        Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.
        */
        this.area = d3.area()
        .x(function(d) {
          return xS(d.date);
        })
        .y0(this.margin.height)
        .y1(function(d) {
          return yS(d.values[localId]);
        })
        .curve(d3.curveLinear);

        console.log(this.area)



        // Add the chart to the HTML page
        this.chartContainer = svg.append("g")
        .attr('class', localName.toLowerCase())
        .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top) + ")");

        this.chartContainer.append("path")
        .data([this.data.values])
        .attr("class", "chart")
        .attr("clip-path", "url(#clip-" + this.id + ")")
        .attr("d", this.area);

        this.xAxisTop = d3.axisBottom(this.xScale);
        this.xAxisBottom = d3.axisTop(this.xScale);
        // show only the top axis
        /*if (this.id == 0) {
        this.chartContainer.append("g")
        .attr("class", "x axis top")
        .attr("transform", "translate(0,0)")
        .call(this.xAxisTop);
      }*/

      // show only the bottom axis
      /*if (this.showBottomAxis) {
      this.chartContainer.append("g")
      .attr("class", "x axis bottom")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxisBottom);
    }*/

    //this.yAxis = d3.axisLeft(this.yScale).ticks(5);

    //the y axis on the left
    /*this.chartContainer.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(-15,0)")
    .call(this.yAxis);

    //the name of the countries
    /*this.chartContainer.append("text")
    .attr("class", "country-title")
    .attr("transform", "translate(15,40)")
    .text(this.name);*/

  }//end of constructor
}

Chart.prototype.showOnly = function(b) {
  this.xScale.domain(b);
  this.chartContainer.select("path").data([this.chartData]).attr("d", this.area);
  this.chartContainer.select(".x.axis.top").call(this.xAxisTop);
  this.chartContainer.select(".x.axis.bottom").call(this.xAxisBottom);
}

/**/
function prepareData(csvData){
  //getting all the categories
  let categories = []
  for (let prop in csvData[0]) {
    if (csvData[0].hasOwnProperty(prop)) {
      if (prop != 'Year') {
        categories.push(prop);
      }
    }
  };

  let maxScore =  Number.MIN_VALUE;

  //mapping each line to an array
  let arrayData = csvData.map(d => {
    //for each date:
    let values = []
    for (let prop in d) {
      //for each category:
      if (d.hasOwnProperty(prop) && prop != 'Year') {
        values.push(parseFloat(d[prop]))
      }
    }
    /* Convert "Year" column to Date format to benefit
    from built-in D3 mechanisms for handling dates. */
    let date = new Date(d.Year, 0, 1);
    let localMax = values.reduce((a,b) => a + b, 0)
    if(localMax>maxScore){
      maxScore = localMax
    }
    return {
      date : date,
      values : values
    }
  });

  let smallestDate = arrayData[0].date;
  let biggestDate = arrayData[arrayData.length - 1].date;

  return{
    categories:categories,
    maxScore:maxScore,
    values:arrayData,
    smallestDate:smallestDate,
    biggestDate:biggestDate,
  }


}

return {
  //  playVideo:showVideo,
}
})();
App.Plot1 = Plot1;
window.App = App;
})(window);
