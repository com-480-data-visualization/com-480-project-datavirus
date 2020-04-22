(function(window) {
  'use strict';

  var App = window.App || {};
  let Plot1 = (function() {

    //our container
    const containerDIV = document.getElementById("plot1-container");
    const svgWidth = containerDIV.clientWidth
    const svgHeight = containerDIV.clientHeight




      const contextWidth = svgWidth;


    const svg = d3.select("#plot1-container").append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    d3.csv("/data/plot1data.csv",function(data) {
      console.log("Just logged the data for the plot 1");
      createPlot(data)
    });


    function createPlot(data) {
      let countries = [];
      let charts = [];
      let maxDataPoint = 0;
      let minDataPoint = 100; // the init value just have to be big enough to be less than the highest temperature

      // Get countries
      for (let prop in data[0]) {
        if (data[0].hasOwnProperty(prop)) {
          if (prop != 'Year') {
            countries.push(prop);
          }
        }
      };

      let countriesCount = countries.length;
      let startYear = data[0].Year;
      let endYear = data[data.length - 1].Year;
      let chartHeight = svgHeight * (1 / countriesCount);
      //so it seems a chart is a bit a lign...

      // Get max and min temperature bounds for Y-scale.
      data.map(d => {
        for (let prop in d) {
          if (d.hasOwnProperty(prop) && prop != 'Year') {
            d[prop] = parseFloat(d[prop]);

            if (d[prop] > maxDataPoint) {
              maxDataPoint = d[prop];
            }

            if (d[prop] < minDataPoint) {
              minDataPoint = d[prop];
            }
          }
        }

        /* Convert "Year" column to Date format to benefit
        from built-in D3 mechanisms for handling dates. */
        d.Year = new Date(d.Year, 0, 1);
      });

      const margin = {
        top: 10,
        right: 40,
        bottom: 150,
        left: 60
      }

      for (let i = 0; i < countriesCount-3; i++) {
        charts.push(new Chart({
          data: data.slice(),
          id: i,
          name: countries[i],
          width: svgWidth,
          height: svgHeight * (1 / countriesCount),
          maxDataPoint: maxDataPoint,
          minDataPoint: minDataPoint,
          svg: svg,
          margin: margin,
          showBottomAxis: (i == countries.length - 1)
        }));

      }


      //-----------------------CREATION OF THE TIME SLIDER----------------------------
      const contextHeight = 120
      const sliderWidth = containerDIV.clientWidth * 0.9
      const tickHeight = 10
      const niceAxis = false
      const selectedRectHeight = 50



      //1)First we add the context and we draw a horizontal line so we see it well
      let context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + 0 + "," + (svgHeight - contextHeight) + ")")
      context.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", svgWidth) .attr("y2", 0);

      //2) Now will add the slider
      var startDate = new Date(2005,7,14)
      var endDate = new Date(2019,8,20)

      // Create a context for a brush
      var contextXScale = d3.scaleTime()
      .range([0, sliderWidth])//length of the slider
      .domain([startDate, endDate])
      if(niceAxis){
        contextXScale = contextXScale.nice()
      }


      // a function thag geneates a bunch of SVG elements.
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

      console.log(contextXScale.invert(0))
      console.log(contextXScale(contextXScale.invert(9)))
      console.log(contextXScale)

      //The selection rectangle
      context.append("g")
      .attr("class", "xbrush")
      .call(brush)
      /*
      .selectAll("rect")
      .attr("y", 0)
      .attr("height", contextHeight);*/

      //Display some text "Click and drag above to zoom / pan the data" on screen
      /*context.append("text")
      .attr("class", "instructions")
      .attr("transform", "translate(0," + (contextHeight + 20) + ")")
      .text('Click and drag above to zoom / pan the data');*/

      // Brush handler. Get time-range from a brush and pass it to the charts.
      function onBrush() {
        console.log("onbrush")
        //d3.event.selection looks like [622,698] for example
        var b = d3.event.selection === null ? contextXScale.domain() : d3.event.selection.map(contextXScale.invert);
        console.log(d3.event.selection.map(contextXScale.invert))
        for (var i = 0; i < countriesCount-3; i++) {
          charts[i].showOnly(b);
        }
      }
    }

    class MyStackedGraph{
      constructor(options) {

      }

    }

    class Chart {
      constructor(options) {
        this.chartData = options.data;
        this.width = options.width;
        this.height = options.height;
        this.maxDataPoint = options.maxDataPoint;
        this.minDataPoint = options.minDataPoint;
        this.svg = options.svg;
        this.id = options.id;
        this.name = options.name;
        this.margin = options.margin;
        this.showBottomAxis = options.showBottomAxis;

        let localName = this.name;

        // Associate xScale with time
        this.xScale = d3.scaleTime()
        .range([0, this.width])
        .domain(d3.extent(this.chartData.map(function(d) {
          return d.Year;
        })));

        // Bound yScale using minDataPoint and maxDataPoint
        this.yScale = d3.scaleLinear()
        .range([this.height, 0])
        .domain([this.minDataPoint, this.maxDataPoint]);
        let xS = this.xScale;
        let yS = this.yScale;

        //console.log(d3.scaleTime().domain())

        /*
        Create the chart.
        Here we use 'curveLinear' interpolation.
        Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.
        */
        this.area = d3.area()
        .x(function(d) {
          return xS(d.Year);
        })
        .y0(this.height)
        .y1(function(d) {
          return yS(d[localName]);
        })
        .curve(d3.curveLinear);

        // Add the chart to the HTML page
        this.chartContainer = svg.append("g")
        .attr('class', this.name.toLowerCase())
        .attr("transform", "translate(" + this.margin.left + "," + (this.margin.top + (this.height * this.id) + (10 * this.id)) + ")");

        this.chartContainer.append("path")
        .data([this.chartData])
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

        this.yAxis = d3.axisLeft(this.yScale).ticks(5);

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

      }
    }

    Chart.prototype.showOnly = function(b) {
      this.xScale.domain(b);
      this.chartContainer.select("path").data([this.chartData]).attr("d", this.area);
      this.chartContainer.select(".x.axis.top").call(this.xAxisTop);
      this.chartContainer.select(".x.axis.bottom").call(this.xAxisBottom);
    }

    return {
      //  playVideo:showVideo,
    }
  })();
  App.Plot1 = Plot1;
  window.App = App;
})(window);
