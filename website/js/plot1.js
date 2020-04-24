(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1 = (function() {

    //get the size of our container
    const svgWidth = document.getElementById("plot1-container").clientWidth
    const svgHeight = document.getElementById("plot1-container").clientHeight

    //the charts that will be displayed
    let charts = [];
    let xAxis = null
    let stacksSupperpose = false

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

    //load the csv file and call createPlot(),createSlider() when done
    d3.csv("/data/plot1data2.csv",function(data) {
      let preparedData = prepareData(data)
      createPlot(preparedData)
      createSlider(preparedData.smallestDate, preparedData.biggestDate)
      getIndexes(preparedData)
    });

    function createPlot(data) {
      //adding the g element in the svg that will contain the stacked areas
      let stackedArea = svg.append("g")
      .attr("class", "stackedArea")
      .attr("transform", "translate(" + stackedAreaMargin.left + "," + stackedAreaMargin.top + ")")
      //drawing the 4 border lines
      //top
      stackedArea.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", stackedAreaMargin.width) .attr("y2", 0).attr("class", "stackedAreaBorder");
      //bottom
      stackedArea.append("line") .attr("x1", 0) .attr("y1", stackedAreaMargin.height).attr("x2", stackedAreaMargin.width) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");
      //left
      stackedArea.append("line") .attr("x1", 0) .attr("y1", 0).attr("x2", 0) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");
      //right
      stackedArea.append("line") .attr("x1", stackedAreaMargin.width) .attr("y1", 0).attr("x2", stackedAreaMargin.width) .attr("y2", stackedAreaMargin.height).attr("class", "stackedAreaBorder");

      //now create the clipped path
      svg.append("clipPath")
    .attr("id", "stackedArea-clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("height", stackedAreaMargin.height)
    .attr("width", stackedAreaMargin.width)



      for (let i = 0; i < data.categories.length; i++) {
      charts.push(new Chart({
      data: data,
      id: i,
      svg: svg,
      margin: stackedAreaMargin,
      isLastElem:i==data.categories.length-1
    }));
  }
  //drawing the bottom time indicator
  //TODO

}//end of create plot function




/*Create the slider box*/
function createSlider(startDate, endDate) {
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


function onClick() {
  console.log("clicked")
}
  //Display some text "Click and drag above to zoom / pan the data" on screen
  /*context.append("text")
  .attr("class", "instructions")
  .attr("transform", "translate(0," + (contextHeight + 20) + ")")
  .text('Click and drag above to zoom / pan the data');*/

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




    for (var i = 0; i < charts.length; i++) {
      charts[i].showOnly(b);
    }
  }
}//end of createSlider


class Chart {
  constructor(options) {
    this.data = options.data;
    this.id = options.id;
    this.svg = options.svg;
    this.margin = options.margin;

    // Associate xScale with time
    this.xScale = d3.scaleTime()
    .range([0, this.margin.width])
    .domain([this.data.smallestDate, this.data.biggestDate]);
    // Bound yScale using maxDataPoint
    this.yScale = d3.scaleLinear()
    .range([this.margin.height,0])
    .domain([0, this.data.maxScore]);
    let xS = this.xScale;
    let yS = this.yScale;



    let localName = this.data.categories[this.id]
    let localId = this.id
    /*
    Create the chart.
    Here we use 'curveLinear' interpolation.
    Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.
    */
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
        /*let values = d.values.slice()
        //console.log(values)
        let actualValue  = d.values[this.id]
        values.sort(function(a, b){return a - b})
        let indexToLookAt = values.indexOf(actualValue)-1;
        console.log(indexToLookAt)
        let bottom = 0
        if(indexToLookAt>=0){
          bottom = values[indexToLookAt]
        }
        return yS(bottom)*/
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

      //return yS(d.values[localId]);

    }.bind(this))
    //.curve(d3.curveMonotoneX);
    .curve(d3.curveLinear);
  //  Play with the other ones: 'curveBasis', 'curveCardinal', 'curveStepBefore'.

    //console.log(this.area)



    // Add the chart to the HTML page
    this.chartContainer = svg.append("g")
    .attr('class', localName.toLowerCase())
    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.chartContainer.append("path")
    .data([this.data.values])
    .attr("class", "chart")
    .attr("d", this.area)
    .attr("clip-path", "url(#stackedArea-clip)")
    .attr("fill", colorForIndex(localId))
    .on("mousemove", function(d,i) {
      let coordinateX= d3.mouse(this)[0];
      //let dateSelected = xS(coordinateX)
      let dateSelected =xS.invert(coordinateX)
      onHover(localId, dateSelected)
    })//.bind(this))



    // the draw the horizontal axis
    if (this.id == this.data.categories.length-1) {
      this.xAxis = d3.axisBottom(xS)

      this.chartContainer.append("g")
      .attr("class", "xAxis")
      .attr("transform", "translate(0,"+this.margin.height+")")
      .call(this.xAxis);
   }


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
  this.chartContainer.select("path").data([this.data.values]).attr("d", this.area);
  if (this.id == this.data.categories.length-1) {
  this.chartContainer.select(".xAxis").call(this.xAxis);
  }




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
    let localMax = stacksSupperpose ? values.reduce((a,b) => a + b, 0) : values.reduce((a,b) => a > b ? a:b, 0)

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

function getIndexes(data){
  let values = data.values.slice()
  let valuesSorted = values.map(vs =>{
    let array = vs.values
    let arrayExtended = array.map((value, index)=>{
      return [value, index]
    })
    return arrayExtended.sort((b,a)=>{
      return a[0]-b[0]
    })
  })
  let indexesBeforeChanges = []
  let indicesOfEqualities = []
  let previousOrder = valuesSorted[0].map(x=>{return x[1]})
  for(let i = 1; i < valuesSorted.length; i++){
    let actualValues = valuesSorted[i].map(x=>{return x[0]})
    let actualOrder = valuesSorted[i].map(x=>{return x[1]})
    if(findDuplicates(actualValues).length > 0){
      indicesOfEqualities.push(i)
    }else{
      if(!arraysEqual(actualOrder,previousOrder)){
        indexesBeforeChanges.push(i-1)
      }
    }
    previousOrder = actualOrder
  }//end of for loop
  console.log(indicesOfEqualities)
  console.log(indexesBeforeChanges)

}

function findDuplicates(arr){
  let sorted_arr = arr.slice().sort((a,b)=>{
    return a-b
  });
  let results = [];
  for (let i = 0; i < sorted_arr.length - 1; i++) {
    if (sorted_arr[i + 1] == sorted_arr[i]) {
      results.push(sorted_arr[i]);
    }
  }
  return results;
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

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
