(function(window) {
  'use strict';
  var App = window.App || {};
  let Plot1DataModel = (function() {

    /**From the csv file, task is to return the data object*/
    function prepareData(csvData,stacksSupperpose,stackClever){
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
      if(!stackClever){
        return{
          categories:categories,
          maxScore:maxScore,
          values:arrayData,
          smallestDate:smallestDate,
          biggestDate:biggestDate,
        }
      }else{
        //we must compute the critical time stamps where any 2 lines might intersect
        let criticalIndexes = getCriticalIndexes(arrayData.slice())

        return{
          categories:categories,
          maxScore:maxScore,
          values:arrayData,
          smallestDate:smallestDate,
          biggestDate:biggestDate,
          criticalIndexes:criticalIndexes,
        }

      }
    }

    function getCriticalIndexes(values){
      //the idea here is to get the indexes of the data for the one two charts intersect
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
      let orderBeforeChanges = []
      let previousOrder = valuesSorted[0].map(x=>{return x[1]})
      for(let i = 1; i < valuesSorted.length; i++){
        let actualOrder = valuesSorted[i].map(x=>{return x[1]})

        if(!arraysEqual(actualOrder,previousOrder)){
          indexesBeforeChanges.push(i-1)
          orderBeforeChanges.push(previousOrder)
        }

        previousOrder = actualOrder
      }//end of for loop
      // console.log(orderBeforeChanges)
      // console.log(indexesBeforeChanges)
      return{
        indexesBeforeChanges:indexesBeforeChanges,
        orderBeforeChanges:orderBeforeChanges
      }
    }



    function computeTimeStampsBreaks(charts,data,xScale,dateDisplayedInterval){
      let stepWidth = 10
      let result = getPotentialTimeStampsBreaksWithOrders(charts,data,xScale,stepWidth,dateDisplayedInterval)
      let potentialBreaks = result.timeStamps
      let realStepWidth = result.realStepWidth

      //console.log(potentialBreaks)
      let timeStamps = []

      getChartOrderNearTimeStamp(charts, potentialBreaks[2][1][0],realStepWidth)

      //

      /*let stepWidth = timeIntervalBetweenDates/nbOfSep
      let timeStamps = []
      indicesOfEqualities.forEach(z=>{
      timeStamps.push(data.values[z].date.getTime())
    })
    indexesBeforeChanges.forEach(z=>{

    for (var i = 1; i < nbOfSep ; i++){
    let baseTemp = data.values[z].date.getTime()
    timeStamps.push(baseTemp + i * stepWidth)
  }
})
timeStamps = timeStamps.sort((a,b)=>{
return a-b
});
return timeStamps*/

potentialBreaks.forEach(pb=>{
  pb[1].forEach(pbb=>{
    timeStamps.push(pbb)
  })
})
return timeStamps
}

function getPotentialTimeStampsBreaksWithOrders(charts,data,xScale,stepWidth, dateDisplayedInterval){
  //how much pixels separate two values on screen for the actual scale
  let pixelIntervalBetweenDates = xScale(data.values[1].date) - xScale(data.values[0].date)
  let timeIntervalBetweenDates = data.values[1].date.getTime() - data.values[0].date.getTime()
  let nbOfInterval = Math.ceil(pixelIntervalBetweenDates/stepWidth)

  let realStepWidth = timeIntervalBetweenDates/nbOfInterval
  let timeStamps = []

  //very cool, but we now must filter the timestamps that are out of the screen for performance issues
  const smallestTimeStamp = dateDisplayedInterval[0].getTime()
  const largestTimeStamp = dateDisplayedInterval[1].getTime()

  data.criticalIndexes.indexesBeforeChanges.forEach((z,index)=>{
    let orderBeforeChanges = data.criticalIndexes.orderBeforeChanges[index]
    let localTimeStamps = []
    for (var i = 1; i < nbOfInterval ; i++){
      let baseTemp = data.values[z].date.getTime()
      let newTimeStamp = baseTemp + i * realStepWidth
      if(newTimeStamp >= smallestTimeStamp && newTimeStamp <= largestTimeStamp){
        localTimeStamps.push(newTimeStamp)
      }
    }
    if (localTimeStamps.length>0){
      timeStamps.push([orderBeforeChanges,localTimeStamps])
    }
  })
  timeStamps = timeStamps.sort((a,b)=>{
    return a-b
  });

  return {
    realStepWidth:pixelIntervalBetweenDates/nbOfInterval,
    timeStamps:timeStamps,
  }
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}


function getChartOrderNearTimeStamp(charts, timeStamp, delta_x){
  /*charts.forEach(chart=>{
  console.log(chart.path.getTotalLength())

})
console.log(charts[2].path.getPointAtLength(0))
console.log(timeStamp)
let chart0 = charts[0]*/
console.log(getPointAtX(900,20,0,charts[2].path.getTotalLength(),charts[2].path))
}

function getPointAtX(x,delta,minX,maxX, path){
  let middle = (maxX+minX)/2
  let middlePoint = path.getPointAtLength(middle)
  var i = 0
  while (Math.abs(x-middlePoint.x)>=delta/2 && i < 100) {

    if(middlePoint.x < x){
      minX = middle
    }else{
      maxX = middle
    }
    middle = (minX + maxX)/2
    middlePoint = path.getPointAtLength(middle)
    i++
  }
  return middlePoint
}

/*function getChartOrder(atTimeStamp){
let heightDelta = 1/1000
let paths = []
for(var i = 0; i < data.categories.length; i++){
let pathIdentifier = "path_nb_"+i
let path = document.getElementById(pathIdentifier);
paths.push(path)
}
let p = paths[0]

}*/




return {
  prepareData:prepareData,
  computeTimeStampsBreaks:computeTimeStampsBreaks,
}
})();
App.Plot1DataModel = Plot1DataModel;
window.App = App;
})(window);
