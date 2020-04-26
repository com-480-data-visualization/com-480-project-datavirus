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
      let orderAfterChanges = []

      let startingOrder = valuesSorted[0].map(x=>{return x[1]})
      let previousOrder = startingOrder
      for(let i = 1; i < valuesSorted.length; i++){
        let actualOrder = valuesSorted[i].map(x=>{return x[1]})

        if(!arraysEqual(actualOrder,previousOrder)){
          indexesBeforeChanges.push(i-1)
          orderBeforeChanges.push(previousOrder)
          orderAfterChanges.push(actualOrder)
        }

        previousOrder = actualOrder
      }//end of for loop
      // console.log(orderBeforeChanges)
      // console.log(indexesBeforeChanges)
      return{
        indexesBeforeChanges:indexesBeforeChanges,
        orderBeforeChanges:orderBeforeChanges,
        orderAfterChanges:orderAfterChanges,
        startingOrder:startingOrder,
      }
    }



    function computeTimeStampsBreaks(charts,data,xScale,dateDisplayedInterval){

      let stepWidth = 10
      //how much pixels separate two values on screen for the actual scale
      let pixelIntervalBetweenDates = xScale(data.values[1].date) - xScale(data.values[0].date)
      let timeIntervalBetweenDates = data.values[1].date.getTime() - data.values[0].date.getTime()
      let nbOfInterval = Math.ceil(pixelIntervalBetweenDates/stepWidth)

      let realStepWidth = timeIntervalBetweenDates/nbOfInterval
      let timeStamps = []

      const smallestTimeStamp = dateDisplayedInterval[0].getTime()
      const largestTimeStamp = dateDisplayedInterval[1].getTime()

      /*
      Initialise "actual order" with starting order
      Initialise orders-until list (order, until, oder, until, order , until,...)
      afterMinDate = true
      beforeMaxDate = false

      FOR all time break indices:
        expectedFinalOrder = break order after
        FOR all timeStamps t while expectedFinalOrder!=actualOrder:
          update afterMinDate
          update beforeMaxDate
          if t inside the interval:
            compute order at t
            if order != actualOrder:
              add actualOrder+t to orders-until
              actualOrder = orders
        ENDFOR
        if actualOrder != expectedFinalOrder and beforeMaxDate:
          if afterMinDate:
            //we missed something!
            add last timeStamp with actualOrder to the list
        actualOrder = expectedFinalOrder
        ENDFOR

        if orders-until list is empty:
          add actualOrder max date to the list

        if last time stamp in list smaller than max date:
          add actualOrder max date to the list
      */



      let orderBeforeChanges = data.criticalIndexes.startingOrder

      data.criticalIndexes.indexesBeforeChanges.forEach((z,index)=>{
        orderBeforeChanges = data.criticalIndexes.orderBeforeChanges[index]
        let orderAfterChanges = data.criticalIndexes.orderAfterChanges[index]

        let localTimeStamps = []

        for (var i = 1; i < nbOfInterval ; i++){
          let baseTemp = data.values[z].date.getTime()
          let newTimeStamp = baseTemp + i * realStepWidth
          if(newTimeStamp>=smallestTimeStamp){
            stillBefore = false
          }

          if(newTimeStamp >= smallestTimeStamp && newTimeStamp <= largestTimeStamp){
            localTimeStamps.push(newTimeStamp)
          }
        }

        if (localTimeStamps.length>0){
          timeStamps.push([orderBeforeChanges,localTimeStamps])
          lastIndexTreated = z
        }
      })
      timeStamps = timeStamps.sort((a,b)=>{
        return a-b
      });










      /*l

      console.log(data)
      //pixelIntervalBetweenDates/nbOfInterval,

      let result = getPotentialTimeStampsBreaks(charts,data,xScale,stepWidth,dateDisplayedInterval)
      console.log(result)
      let potentialBreaks = result.timeStamps
      let realStepWidth = result.realStepWidth

      let orderTimeStamp = []

      let previousOrder = null*/

      /*potentialBreaks.forEach((pB,index)=>{
      let actualOrder = pB[0]
      console.log(actualOrder)
    })*/





    //todoAdd last here



    //getChartOrderNearTimeStamp(charts, potentialBreaks[2][1][0],realStepWidth, xScale)
    /*console.log(charts[2].upperPath.getTotalLength())
    console.log(getPointAtX(1200,2,0,charts[2].upperPath.getTotalLength(),charts[2].path))

    console.log(charts[2].path.getPointAtLength(charts[2].path.getTotalLength()-1))
    */
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
/*
potentialBreaks.forEach(pb=>{
  pb[1].forEach(pbb=>{
    timeStamps.push(pbb)
  })
})
return timeStamps*/
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


function getChartOrderNearTimeStamp(charts, timeStamp, delta_x,xScale){
  /*charts.forEach(chart=>{
  console.log(chart.path.getTotalLength())

})
console.log(charts[2].path.getPointAtLength(0))
console.log(timeStamp)
let chart0 = charts[0]*/

//console.log(xScale(data.biggestDate))



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


return {
  prepareData:prepareData,
  computeTimeStampsBreaks:computeTimeStampsBreaks,
}
})();
App.Plot1DataModel = Plot1DataModel;
window.App = App;
})(window);
